---
sidebar_position: 5
title: Try Service Entry
---

A Service Entry enables you to add entries to Istio's internal service registry so that services in the mesh can access and route to these manually specified services. This guide shows you how to configure external service access using Service Entry.

## Preparation

1. **Make default namespace managed by Kmesh**
2. **Deploy Httpbin as sample application and Sleep as curl client**
3. **Install waypoint for default namespace**

   _The above steps could refer to [Install Waypoint | Kmesh](/docs/application-layer/install_waypoint.md#preparation)_

## Deploy Sample Applications

We need to deploy Httpbin as the target service and Sleep as the client:

```bash
kubectl apply -f ./samples/httpbin/httpbin.yaml
kubectl apply -f ./samples/sleep/sleep.yaml
```

Check the deployment status:

```bash
kubectl get pods
```

You should see httpbin and sleep running:

```bash
NAME                       READY   STATUS    RESTARTS   AGE
httpbin-6f4464f6c5-h9x2p   1/1     Running   0          30s
sleep-9454cc476-86vgb      1/1     Running   0          5m
```

## Configure Service Entry and Routing Rules

Now we will create a Service Entry to define an external service and configure a VirtualService to route traffic to the internal service.

Apply the following configuration:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-fake-svc
  namespace: default
spec:
  exportTo:
    - "*"
  hosts:
    - kmesh-fake.com
  ports:
    - name: http
      number: 80
      protocol: HTTP
  addresses:
    - 240.240.0.1
  resolution: DNS
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: fake-service-route
  namespace: default
spec:
  hosts:
  - kmesh-fake.com
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: httpbin.default.svc.cluster.local
        port:
          number: 8000
EOF
```

## Understanding the Configuration

This configuration creates:

1. **ServiceEntry**: Defines an external service named `kmesh-fake.com` using IP address `240.240.0.1`
2. **VirtualService**: Redirects traffic accessing `kmesh-fake.com` to the cluster-internal `httpbin` service

## Test Service Entry Configuration

1. **Test access to the virtual external service**:

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/headers
   ```

   You should see a response from the httpbin service:

   ```json
   {
     "headers": {
       "Accept": "*/*",
       "Host": "kmesh-fake.com",
       "User-Agent": "curl/8.16.0"
     }
   }
   ```

2. **Verify request header information**:

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/get
   ```

   The output should show the request was successfully routed to the httpbin service:

   ```json
   {
     "args": {},
     "headers": {
       "Accept": "*/*",
       "Host": "kmesh-fake.com",
       "User-Agent": "curl/8.16.0"
     },
     "origin": "10.244.1.6",
     "url": "http://kmesh-fake.com/get"
   }
   ```

3. **Test different HTTP endpoints**:

   Test successful status code:

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/status/200
   ```

   Test specific status code and display the return code:

   ```bash
   kubectl exec deploy/sleep -- curl -s -o /dev/null -w "%{http_code}\n" http://kmesh-fake.com/status/418
   ```

   The second command should return the HTTP status code:

   ```txt
   418
   ```

4. **Check response headers**:

   ```bash
   kubectl exec deploy/sleep -- curl -IsS http://kmesh-fake.com/headers
   ```

   You should see response headers containing envoy and routing information:

   ```txt
   HTTP/1.1 200 OK
   server: envoy
   date: Sat, 20 Sep 2025 07:51:51 GMT
   content-type: application/json
   content-length: 78
   access-control-allow-origin: *
   access-control-allow-credentials: true
   x-envoy-upstream-service-time: 1
   x-envoy-decorator-operation: httpbin.default.svc.cluster.local:8000/*
   ```

## Understanding What Happened

When you make a request to `kmesh-fake.com`:

1. **Service Entry** tells Istio this is a valid service destination
2. **VirtualService** redirects requests to that host to the cluster-internal `httpbin` service
3. Kmesh handles this routing rule, forwarding traffic to the correct destination

This demonstrates how to use Service Entry to:

- Define external services
- Redirect traffic to internal services
- Control outbound traffic routing

## Advanced Use Cases

### Configure Real External Services

You can also configure access to real external services. For example:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-httpbin
spec:
  hosts:
  - httpbin.org
  ports:
  - number: 80
    name: http
    protocol: HTTP
  - number: 443
    name: https
    protocol: HTTPS
  resolution: DNS
EOF
```

Test external service access:

```bash
kubectl exec deploy/sleep -- curl -s http://httpbin.org/headers
```

## Cleanup

Delete the created Service Entry and VirtualService:

```bash
kubectl delete serviceentry external-fake-svc
kubectl delete virtualservice fake-service-route
kubectl delete serviceentry external-httpbin
```

If you're not planning to explore any follow-up tasks, refer to the [Install Waypoint/Cleanup](/docs/application-layer/install_waypoint.md#cleanup) instructions to remove the waypoint and shut down the application.
