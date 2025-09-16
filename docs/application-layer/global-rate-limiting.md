--- 
title: Global Rate Limiting
sidebar_position: 12
---

This document provides a step-by-step guide on how to test the global rate limiting functionality of kmesh. It covers deploying the necessary components, configuring traffic rules with an external rate limiting service, and observing the rate limiting behavior across multiple proxy instances.

## Step 1. Deploy Kmesh and istiod (>=1.24)

Please read [Quick Start](https://kmesh.net/docs/setup/quick-start) to complete the deployment of kmesh.

## Step 2. Deploy sleep and httpbin

We will deploy `httpbin` as the backend service for receiving requests and `sleep` as the client for sending requests.

``` sh
kubectl apply -f samples/sleep/sleep.yaml
kubectl apply -f samples/httpbin/httpbin.yaml
```

## Step 3. Deploy Redis for global rate limiting

Global rate limiting requires an external service to coordinate rate limits across multiple proxy instances. We'll use Redis for this purpose.

```sh
kubectl apply -f -<<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: default
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
EOF
```

## Step 4. Deploy rate limiting service

Deploy the Envoy rate limiting service that will communicate with Redis to enforce global rate limits.

```sh
kubectl apply -f -<<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ratelimit-config
  namespace: default
data:
  config.yaml: |
    domain: httpbin-ratelimit
    descriptors:
      - key: header_match
        value: Service[httpbin.default]-User[none]-Id[3100861967]
        rate_limit:
          unit: second
          requests_per_unit: 1
      - key: header_match
        value: Service[httpbin.default]-User[none]-Id[4123289408]
        rate_limit:
          unit: second
          requests_per_unit: 3
      - key: generic_key
        value: default
        rate_limit:
          unit: second
          requests_per_unit: 10
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ratelimit
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ratelimit
  template:
    metadata:
      labels:
        app: ratelimit
    spec:
      containers:
      - name: ratelimit
        image: envoyproxy/ratelimit:master
        command: ["/bin/ratelimit"]
        env:
        - name: LOG_LEVEL
          value: debug
        - name: REDIS_SOCKET_TYPE
          value: tcp
        - name: REDIS_URL
          value: redis:6379
        - name: USE_STATSD
          value: "false"
        - name: RUNTIME_ROOT
          value: /data
        - name: RUNTIME_SUBDIRECTORY
          value: ratelimit
        ports:
        - containerPort: 8080
        - containerPort: 8081
        - containerPort: 6070
        volumeMounts:
        - name: config-volume
          mountPath: /data/ratelimit/config/config.yaml
          subPath: config.yaml
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: ratelimit-config
---
apiVersion: v1
kind: Service
metadata:
  name: ratelimit
  namespace: default
spec:
  selector:
    app: ratelimit
  ports:
  - name: http
    port: 8080
    targetPort: 8080
  - name: grpc
    port: 8081
    targetPort: 8081
  - name: debug
    port: 6070
    targetPort: 6070
EOF
```

## Step 5. Deploy waypoint for httpbin

First, if you haven't installed the Kubernetes Gateway API CRDs, run the following command to install.

``` sh
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

Next, create a dedicated Waypoint proxy for the `httpbin` service and label the service to direct its traffic through this Waypoint.

```sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest

kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

## Step 6. Deploy envoyFilter

This `EnvoyFilter` resource injects a global rate-limiting filter into the `httpbin` service's Waypoint proxy. The filter is configured with the following rules:

- A request with the header `quota: low` will be limited to **1 request per second** globally.
- A request with the header `quota: medium` will be limited to **3 requests per second** globally.
- Other requests will be subject to a default limit of **10 requests per second** globally.

The `workloadSelector` ensures that this filter is applied only to the `httpbin-waypoint` proxy.

```sh
kubectl apply -f -<<EOF
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: httpbin.global-ratelimit
  namespace: default
spec:
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
      proxy:
        proxyVersion: ^1.*
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.ratelimit
        typed_config:
          '@type': type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
          domain: httpbin-ratelimit
          failure_mode_deny: true
          rate_limit_service:
            grpc_service:
              envoy_grpc:
                cluster_name: rate_limit_cluster
            transport_api_version: V3
  - applyTo: CLUSTER
    match:
      context: SIDECAR_INBOUND
      proxy:
        proxyVersion: ^1.*
    patch:
      operation: ADD
      value:
        name: rate_limit_cluster
        type: STRICT_DNS
        connect_timeout: 10s
        lb_policy: ROUND_ROBIN
        http2_protocol_options: {}
        load_assignment:
          cluster_name: rate_limit_cluster
          endpoints:
          - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: ratelimit.default.svc.cluster.local
                    port_value: 8081
  - applyTo: HTTP_ROUTE
    match:
      proxy:
        proxyVersion: ^1.*
      routeConfiguration:
        vhost:
          name: inbound|http|8000
          route:
            name: default
    patch:
      operation: MERGE
      value:
        route:
          rate_limits:
          - actions:
            - header_value_match:
                descriptor_value: Service[httpbin.default]-User[none]-Id[3100861967]
                headers:
                - name: quota
                  exact_match: low
          - actions:
            - header_value_match:
                descriptor_value: Service[httpbin.default]-User[none]-Id[4123289408]
                headers:
                - name: quota
                  exact_match: medium
          - actions:
            - generic_key:
                descriptor_value: default
  workloadSelector:
    labels:
      gateway.networking.k8s.io/gateway-name: httpbin-waypoint
EOF
```

## Step 7. View the envoy filter configuration in waypoint through istioctl

To verify the configuration, first get the name of the Waypoint pod, then use `istioctl` to inspect its configuration.

```sh
export WAYPOINT_POD=$(kubectl get pod -l gateway.networking.k8s.io/gateway-name=httpbin-waypoint -o jsonpath='{.items[0].metadata.name}')
istioctl proxy-config all $WAYPOINT_POD -ojson | grep ratelimit -A 20
```

## Step 8. Find the following results, which means the configuration has been sent to waypoint

```sh
        "envoy.filters.http.ratelimit": {
            "@type": "type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit",
            "domain": "httpbin-ratelimit",
            "failure_mode_deny": true,
            "rate_limit_service": {
             "grpc_service": {
              "envoy_grpc": {
               "cluster_name": "rate_limit_cluster"
              }
             },
             "transport_api_version": "V3"
            }
        }
```

## Step 9. Access httpbin through sleep to see if the global rate limit is working

Now, let's send requests from the `sleep` pod to the `httpbin` service to test the global rate limit rules.

First, get the name of the `sleep` pod:

```sh
export SLEEP_POD=$(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}')
```

### Test Case 1: "medium" quota

The rule for `quota: medium` allows 3 requests per second globally. Rapid successive requests beyond this limit should be rate-limited.

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
```

Expected behavior: The first 3 requests should succeed, and the fourth request should be rate-limited and return an HTTP 429 status code.

### Test Case 2: "low" quota

The rule for `quota: low` allows only 1 request per second globally. The second request within the same second should be rate-limited.

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
```

Expected behavior: The first request should succeed, and the second request should be rate-limited and return an HTTP 429 status code.

### Test Case 3: Default quota

Without any quota header, requests are subject to the default limit of 10 requests per second globally.

```sh
for i in {1..12}; do kubectl exec -it $SLEEP_POD -- curl http://httpbin:8000/headers; done
```

Expected behavior: The first 10 requests should succeed, and the 11th and 12th requests should be rate-limited.

## Step 10. Verify rate limiting service logs

You can check the rate limiting service logs to see the rate limiting decisions being made:

```sh
export RATELIMIT_POD=$(kubectl get pod -l app=ratelimit -o jsonpath='{.items[0].metadata.name}')
kubectl logs $RATELIMIT_POD -f
```

The logs will show rate limiting decisions and Redis interactions, providing visibility into the global rate limiting behavior.

## Key Differences from Local Rate Limiting

1. **Shared State**: Global rate limiting uses Redis to maintain shared state across all proxy instances, ensuring consistent rate limiting behavior regardless of which proxy handles the request.

2. **External Service**: Requires deployment of a separate rate limiting service (ratelimit) that communicates with the data store.

3. **Network Dependency**: Rate limiting decisions depend on network calls to the external service, which may introduce latency but provides consistency.

4. **Scalability**: Better suited for distributed environments where multiple proxy instances need to coordinate rate limiting decisions.

5. **Configuration**: Uses `envoy.filters.http.ratelimit` filter instead of `envoy.filters.http.local_ratelimit`, and requires additional cluster configuration for the rate limiting service.
