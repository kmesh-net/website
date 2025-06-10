---
draft: false
linktitle: Circuit Breaker
menu:
  docs:
    parent: user guide
    weight: 22
title: Circuit Breaker
toc: true
type: docs
---


This guide demonstrates how to configure circuit breakers in KMesh using Fortio for load testing. Circuit breakers help prevent system overload by limiting the number of concurrent connections and requests.

Circuit breaking is an important pattern for creating resilient microservice applications. Circuit breaking allows you to write applications that limit the impact of failures, latency spikes, and other undesirable effects of network peculiarities.

## Before you begin

- Install KMesh
  Please refer to [quickstart](https://kmesh.net/en/docs/setup/quickstart/) and change into ads mode
- Ensure proper RBAC permissions are configured for KMesh and Istio CNI
- Make sure the following RBAC permissions are set up for Istio CNI:
  ```bash
  kubectl create clusterrolebinding istio-cni-cluster-admin --clusterrole=cluster-admin --serviceaccount=istio-system:istio-cni
  ```

## Deploy the test applications

1. Create the test service:
```yaml
# sample-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpbin-demo
  labels:
    app: httpbin-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpbin-demo
  template:
    metadata:
      labels:
        app: httpbin-demo
    spec:
      containers:
      - name: httpbin
        image: kennethreitz/httpbin
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
          limits:
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: httpbin-demo
spec:
  selector:
    app: httpbin-demo
  ports:
  - port: 8000
    targetPort: 80
```

2. Deploy Fortio load tester:
```yaml
# fortio.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fortio-demo
  labels:
    app: fortio-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fortio-demo
  template:
    metadata:
      labels:
        app: fortio-demo
    spec:
      containers:
      - name: fortio
        image: fortio/fortio
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: fortio-demo
spec:
  selector:
    app: fortio-demo
  ports:
  - port: 8080
    targetPort: 8080
```

3. Enable Istio sidecar injection in the default namespace:
```bash
kubectl label namespace default istio-injection=enabled --overwrite
```

4. Apply the test service and Fortio deployment:
```bash
kubectl apply -f sample-app.yaml
kubectl apply -f fortio.yaml
```

5. Verify the pods are running with Istio sidecars (should show 2/2 READY):
```bash
kubectl get pods
```

You should see output similar to:
```
NAME                            READY   STATUS    RESTARTS   AGE
fortio-demo-57459944b-kk8c9     2/2     Running   0          72s
httpbin-demo-54bcd57df4-hxqhn   2/2     Running   0          6s
```

## Configure circuit breaker

Apply the circuit breaker configuration:
```yaml
# circuit-breaker.yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: httpbin-demo-cb
spec:
  host: httpbin-demo
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 1
      http:
        http1MaxPendingRequests: 1
        maxRequestsPerConnection: 1
    outlierDetection:
      consecutive5xxErrors: 1
      interval: 1s
      baseEjectionTime: 3s
```

Apply the configuration:
```bash
kubectl apply -f circuit-breaker.yaml
```

Verify the destination rule was created correctly:
```bash
kubectl get destinationrule httpbin-demo-cb -o yaml
```

You should see output similar to:
```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"networking.istio.io/v1alpha3","kind":"DestinationRule","metadata":{"annotations":{},"name":"httpbin-demo-cb","namespace":"default"},"spec":{"host":"httpbin-demo","trafficPolicy":{"connectionPool":{"http":{"http1MaxPendingRequests":1,"maxRequestsPerConnection":1},"tcp":{"maxConnections":1}},"outlierDetection":{"baseEjectionTime":"3s","consecutive5xxErrors":1,"interval":"1s"}}}}
  creationTimestamp: "2025-06-07T05:36:02Z"
  generation: 1
  name: httpbin-demo-cb
  namespace: default
spec:
  host: httpbin-demo
  trafficPolicy:
    connectionPool:
      http:
        http1MaxPendingRequests: 1
        maxRequestsPerConnection: 1
      tcp:
        maxConnections: 1
    outlierDetection:
      baseEjectionTime: 3s
      consecutive5xxErrors: 1
      interval: 1s
```

## Testing the circuit breaker

### Testing without circuit breaker

Before applying the circuit breaker configuration, test the service to establish a baseline:

```bash
# Run Fortio test without circuit breaker
kubectl exec -it $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) \
  -c fortio -- fortio load -c 20 -qps 0 -n 50 -loglevel Warning http://httpbin-demo:8000/get
```

You should see output similar to:
```
Fortio 1.69.5 running at 0 queries per second, 12->12 procs, for 50 calls: http://httpbin-demo:8000/get
Starting at max qps with 20 thread(s) [gomax 12] for exactly 50 calls (2 per thread + 10)
Ended after 410.534881ms : 50 calls. qps=121.79
Aggregated Function Time : count 50 avg 0.10586926 +/- 0.0945 min 0.002373603 max 0.29407083 sum 5.29346301
# target 50% 0.0825
# target 75% 0.188333
# target 90% 0.25
# target 99% 0.289664
# target 99.9% 0.29363
Error cases : no data
Sockets used: 20 (for perfect keepalive, would be 20)
IP addresses distribution:
10.96.233.225:8000: 20
Code 200 : 50 (100.0 %)
Response Header Sizes : count 50 avg 231.22 +/- 0.7291 min 230 max 232 sum 11561
Response Body/Total Sizes : count 50 avg 666.22 +/- 0.7291 min 665 max 667 sum 33311
All done 50 calls (plus 0 warmup) 105.869 ms avg, 121.8 qps
```

Note that all requests succeeded with HTTP 200 responses (100%).

### Testing with circuit breaker

Now apply the circuit breaker configuration and run the test again:

```bash
# Apply circuit breaker
kubectl apply -f circuit-breaker.yaml

# Run Fortio test with circuit breaker
kubectl exec -it $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) \
  -c fortio -- fortio load -c 20 -qps 0 -n 50 -loglevel Warning http://httpbin-demo:8000/get
```

You should see output similar to:
```
Fortio 1.69.5 running at 0 queries per second, 12->12 procs, for 50 calls: http://httpbin-demo:8000/get
Starting at max qps with 20 thread(s) [gomax 12] for exactly 50 calls (2 per thread + 10)
05:36:14.160 r109 [WRN] http_client.go:1151> Non ok http code, code=503, status="HTTP/1.1 503", thread=19, run=0
05:36:14.161 r104 [WRN] http_client.go:1151> Non ok http code, code=503, status="HTTP/1.1 503", thread=14, run=0
05:36:14.161 r103 [WRN] http_client.go:1151> Non ok http code, code=503, status="HTTP/1.1 503", thread=13, run=0
[... additional 503 errors ...]
Ended after 130.402762ms : 50 calls. qps=383.43
Aggregated Function Time : count 50 avg 0.0098692549 +/- 0.008579 min 0.0019963 max 0.06503079 sum 0.493462746
# target 50% 0.00863636
# target 75% 0.010375
# target 90% 0.014
# target 99% 0.0625155
# target 99.9% 0.0647794
Error cases : count 38 avg 0.0085026058 +/- 0.002762 min 0.0019963 max 0.016457559 sum 0.32309902
Sockets used: 42 (for perfect keepalive, would be 20)
IP addresses distribution:
10.96.233.225:8000: 42
Code 200 : 12 (24.0 %)
Code 503 : 38 (76.0 %)
Response Header Sizes : count 50 avg 55.26 +/- 98.34 min 0 max 231 sum 2763
Response Body/Total Sizes : count 50 avg 342.82 +/- 181.2 min 241 max 666 sum 17141
All done 50 calls (plus 0 warmup) 9.869 ms avg, 383.4 qps
```

Now you can see the circuit breaker in action:
- Only 24% of requests succeeded with HTTP 200 responses
- 76% of requests failed with HTTP 503 responses
- The circuit breaker effectively rejected excess connections

### Examining circuit breaker metrics

You can examine the circuit breaker metrics using the Istio proxy stats. The exact format of these metrics may vary based on your Istio version:

```bash
kubectl exec $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) -c istio-proxy -- pilot-agent request GET stats | grep httpbin
```

You should see output that includes metrics related to the httpbin service. Look for entries with response codes and UO (Upstream Overflow) flags:

```
istiocustom.istio_requests_total.reporter.source.source_workload.fortio-demo.source_canonical_service.fortio-demo.source_canonical_revision.latest.source_workload_namespace.default.source_principal.spiffe://cluster.local/ns/default/sa/default.source_app.fortio-demo.source_version.source_cluster.Kubernetes.destination_workload.httpbin-demo.destination_workload_namespace.default.destination_principal.spiffe://cluster.local/ns/default/sa/default.destination_app.httpbin-demo.destination_version.latest.destination_service.httpbin-demo.default.svc.cluster.local.destination_canonical_service.httpbin-demo.destination_canonical_revision.latest.destination_service_name.httpbin-demo.destination_service_namespace.default.destination_cluster.Kubernetes.request_protocol.http.response_code.200.grpc_response_status.response_flags.-.connection_security_policy.unknown: 12
istiocustom.istio_requests_total.reporter.source.source_workload.fortio-demo.source_canonical_service.fortio-demo.source_canonical_revision.latest.source_workload_namespace.default.source_principal.unknown.source_app.fortio-demo.source_version.source_cluster.Kubernetes.destination_workload.unknown.destination_workload_namespace.unknown.destination_principal.unknown.destination_app.unknown.destination_version.unknown.destination_service.httpbin-demo.default.svc.cluster.local.destination_canonical_service.unknown.destination_canonical_revision.latest.destination_service_name.httpbin-demo.destination_service_namespace.default.destination_cluster.unknown.request_protocol.http.response_code.503.grpc_response_status.response_flags.UO.connection_security_policy.unknown: 38
```

The metrics with `response_code.200` (12 requests) and `response_code.503` with `response_flags.UO` (38 requests) indicate the circuit breaker was active and rejecting excess connections.

### Recovery Test

You can also test how the service recovers after the circuit breaker has been triggered:

```bash
# First scale down the service
kubectl scale deployment httpbin-demo --replicas=0

# Wait for the pods to terminate
kubectl get pods -w

# Scale back up
kubectl scale deployment httpbin-demo --replicas=1

# Wait for the pod to be ready
kubectl get pods -w
```

Output:
```
NAME                            READY   STATUS    RESTARTS   AGE
fortio-demo-57459944b-kk8c9     2/2     Running   0          72s
httpbin-demo-54bcd57df4-hxqhn   2/2     Running   0          6s
```

Now test the recovery:
```bash
kubectl exec -it $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) \
  -c fortio -- fortio load -c 5 -qps 10 -n 50 -loglevel Warning http://httpbin-demo:8000/get
```

Output:
```
Fortio 1.69.5 running at 10 queries per second, 12->12 procs, for 50 calls: http://httpbin-demo:8000/get
Starting at 10 qps with 5 thread(s) [gomax 12] : exactly 50, 10 calls each (total 50 + 0)
05:37:00.310 r73 [WRN] http_client.go:1151> Non ok http code, code=503, status="HTTP/1.1 503", thread=2, run=0
05:37:00.310 r74 [WRN] http_client.go:1151> Non ok http code, code=503, status="HTTP/1.1 503", thread=3, run=0
[... additional 503 errors ...]
Ended after 5.005712006s : 50 calls. qps=9.9886
Aggregated Function Time : count 50 avg 0.0033452977 +/- 0.002729 min 0.0008948 max 0.012139084 sum 0.167264886
Error cases : count 36 avg 0.002066844 +/- 0.001362 min 0.0008948 max 0.008110165 sum 0.074406385
Sockets used: 37 (for perfect keepalive, would be 5)
IP addresses distribution:
10.96.233.225:8000: 37
Code 200 : 14 (28.0 %)
Code 503 : 36 (72.0 %)
Response Header Sizes : count 50 avg 64.4 +/- 103.3 min 0 max 230 sum 3220
Response Body/Total Sizes : count 50 avg 360.4 +/- 190 min 241 max 665 sum 18020
All done 50 calls (plus 0 warmup) 3.345 ms avg, 10.0 qps
```

After recovery, the circuit breaker is still active with approximately 28% success rate.

## Monitoring circuit breaker behavior

### Monitor metrics

You can monitor the behavior of your circuit breaker using various tools:

```bash
# View Fortio logs
kubectl logs $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) -c fortio
```

Example output:
```
{"ts":1749274539.796037,"level":"info","r":1,"file":"updater.go","line":50,"msg":"Configmap flag value watching on /etc/fortio"}
{"ts":1749274539.796072,"level":"crit","r":1,"file":"scli.go","line":83,"msg":"Unable to watch config/flag changes in /etc/fortio: dflag: error initializing fsnotify watcher"}
{"ts":1749274539.796122,"level":"info","r":1,"file":"scli.go","line":122,"msg":"Starting","command":"Φορτίο","version":"1.69.5 h1:h+42fJ1HF61Jj+WgPmC+C2wPtM5Ct8JLHSLDyEgGID4= go1.23.9 amd64 linux","go-max-procs":12}
{"ts":1749274539.796936,"level":"info","r":1,"msg":"Fortio 1.69.5 tcp-echo server listening on tcp [::]:8078"}
```

### Analyzing Results

#### Fortio Results

Fortio provides detailed metrics about the test run:

```bash
# View detailed metrics from the last test
kubectl exec -it $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name}) \
  -c fortio -- /usr/bin/fortio report
```

#### System Metrics

Monitor the system during testing:

```bash
# Check pod status
kubectl get pods -w

# View circuit breaker configuration
kubectl get destinationrule httpbin-demo-cb -o yaml
```

## Understanding what happened

The circuit breaker configuration:
- Limits concurrent HTTP connections to 1 (`maxConnections: 1`)
- Limits pending HTTP requests to 1 (`http1MaxPendingRequests: 1`)
- Limits requests per connection to 1 (`maxRequestsPerConnection: 1`)
- Configures outlier detection to eject hosts after 1 consecutive error

When the service is overloaded:
1. Circuit breaker trips when connection thresholds are exceeded
2. Subsequent requests are rejected with HTTP 503 errors
3. The service continues to handle requests within its configured capacity
4. Only a small percentage of requests succeed (20-28% in our tests)
5. After the `baseEjectionTime` (3s), the circuit will attempt to close and allow traffic again

Our test results clearly show the circuit breaker in action:
- Without circuit breaker: 100% success rate (all HTTP 200)
- With circuit breaker: ~24% success rate (24% HTTP 200, 76% HTTP 503)
- After recovery test: ~28% success rate (28% HTTP 200, 72% HTTP 503)

## Clean up

Remove test components:
```bash
kubectl delete -f circuit-breaker.yaml
kubectl delete -f sample-app.yaml
kubectl delete -f fortio.yaml
```

## Troubleshooting

If you encounter issues:

1. Check pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

2. Verify Istio sidecar injection:
```bash
# Pods should show 2/2 READY if sidecar is properly injected
kubectl get pods
```

3. Check circuit breaker configuration:
```bash
kubectl get destinationrule
kubectl describe destinationrule httpbin-demo-cb
```

4. Check for CNI issues:
```bash
kubectl get pods -n istio-system
kubectl logs -n istio-system $(kubectl get pod -n istio-system -l app=istio-cni-node -o jsonpath='{.items[0].metadata.name}')
```

5. Ensure proper RBAC permissions:
```bash
kubectl create clusterrolebinding istio-cni-cluster-admin --clusterrole=cluster-admin --serviceaccount=istio-system:istio-cni
```

6. Check file descriptor limits in Istio CNI pods:
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-cni-config
  namespace: istio-system
data:
  cni_network_config: |-
    {
      "cniVersion": "0.3.1",
      "type": "istio-cni",
      "log_level": "info",
      "kubernetes": {
        "kubeconfig": "__KUBECONFIG_FILEPATH__",
        "cni_bin_dir": "/opt/cni/bin",
        "exclude_namespaces": [ "istio-system" ]
      }
    }
EOF
```

7. View application logs:
```bash
kubectl logs deploy/httpbin-demo
kubectl logs $(kubectl get pod -l app=fortio-demo -o jsonpath={.items[0].metadata.name})
```z