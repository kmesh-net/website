---
sidebar_position: 5
title: Try Service Entry
---

Service Entry allows you to add external services to Istio's internal service registry, enabling services in the mesh to access and route to these manually specified services. This guide shows you how to configure external service access using Service Entry.

## Preparation

Before getting started, ensure you have completed the following steps:

1. **Make default namespace managed by Kmesh**
2. **Deploy Httpbin as sample application and Sleep as curl client**
3. **Install waypoint for default namespace**

   _For detailed instructions on the above steps, refer to [Install Waypoint | Kmesh](/docs/application-layer/install_waypoint.md#preparation)_

## Verify Environment Setup

Confirm that the httpbin and sleep applications are running properly:

```bash
kubectl get pods
```

You should see both services in Running state:

```bash
NAME                       READY   STATUS    RESTARTS   AGE
httpbin-6f4464f6c5-h9x2p   1/1     Running   0          30s
sleep-9454cc476-86vgb      1/1     Running   0          5m
```

## Configure Service Entry

We will create a Service Entry to define a virtual external service that actually routes traffic to the httpbin service inside the cluster:

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
  endpoints:
    - address: httpbin.default.svc.cluster.local
      ports:
        http: 8000
  resolution: DNS
EOF
```

This configuration means:

- `hosts`: Defines the virtual hostname `kmesh-fake.com`
- `ports`: Specifies the port and protocol the service listens on
- `endpoints`: The actual backend service address (pointing to the httpbin service in the cluster)
- `resolution`: DNS resolution type

## Test Service Entry Configuration

After configuring the Service Entry, we can verify that it works correctly through the following tests:

### 1. Basic Connectivity Test

Test access to the virtual external service:

```bash
kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/headers
```

You should see a response from the httpbin service, notice that the Host header has changed to our defined virtual hostname:

```json
{
  "headers": {
    "Accept": "*/*",
    "Host": "kmesh-fake.com",
    "User-Agent": "curl/8.16.0"
  }
}
```

### 2. Detailed Request Information Verification

Get complete request information:

```bash
kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/get
```

The output shows the request was successfully routed to the httpbin service:

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

### 3. HTTP Status Code Test

Test different HTTP status code responses:

```bash
# Test normal status code
kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/status/200

# Test specific status code and display the return code
kubectl exec deploy/sleep -- curl -s -o /dev/null -w "%{http_code}\n" http://kmesh-fake.com/status/418
```

The second command should return the HTTP status code:

```txt
418
```

### 4. Response Header Check

Check complete response header information:

```bash
kubectl exec deploy/sleep -- curl -IsS http://kmesh-fake.com/headers
```

You should see response headers containing Envoy proxy and routing information:

```txt
HTTP/1.1 200 OK
server: envoy
date: Wed, 08 Oct 2025 07:51:51 GMT
content-type: application/json
content-length: 78
access-control-allow-origin: *
access-control-allow-credentials: true
x-envoy-upstream-service-time: 1
x-envoy-decorator-operation: httpbin.default.svc.cluster.local:8000/*
```

## Advanced Use Case: Configure Real External Services

In addition to mapping virtual hostnames to cluster-internal services as demonstrated above, you can also configure access to real external services.

### Create External Service Configuration

Create a Service Entry to access the real external httpbin.org service:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-httpbin-org
  namespace: default
spec:
  hosts:
    - httpbin.org
  ports:
    - number: 80
      name: http
      protocol: HTTP
  resolution: DNS
EOF
```

This configuration allows services within the mesh to directly access the external httpbin.org.

### Test External Service Access

Test access to the real external service:

```bash
kubectl exec deploy/sleep -- curl -s http://httpbin.org/headers
```

You should see a response from the real httpbin.org service:

```json
{
  "headers": {
    "Accept": "*/*",
    "Host": "httpbin.org",
    "User-Agent": "curl/8.16.0"
  }
}
```

## Cleanup

After completing the tests, delete the created Service Entry resources:

```bash
kubectl delete serviceentry external-fake-svc -n default
kubectl delete serviceentry external-httpbin-org -n default
```

If you're not planning to continue with subsequent experiments, refer to the [Install Waypoint/Cleanup](/docs/application-layer/install_waypoint.md#cleanup) section for instructions on removing the waypoint and cleaning up applications.

## Summary

Through this guide, you learned how to:

1. Use Service Entry to add external services to the Istio service mesh
2. Configure virtual hostname mapping to cluster-internal services
3. Configure access to real external services
4. Verify and test the effectiveness of Service Entry configurations

Service Entry is an important tool for managing external service access in Istio, providing visibility and control over external dependencies.
