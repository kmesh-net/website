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

This task shows you how to configure circuit breakers in KMesh using Fortio for load testing.

### Before you begin

- Install KMesh
  Please refer [quickstart](https://kmesh.net/en/docs/setup/quickstart/) and change into ads mode


### Deploy the test applications

1. Create the test service:
```yaml
# sample-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-service
  template:
    metadata:
      labels:
        app: test-service
    spec:
      containers:
      - name: test-service
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: test-service
spec:
  selector:
    app: test-service
  ports:
  - port: 80
```

2. Deploy Fortio load tester:
```yaml
# fortio.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fortio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fortio
  template:
    metadata:
      labels:
        app: fortio
    spec:
      containers:
      - name: fortio
        image: fortio/fortio
        ports:
        - containerPort: 8080
```

### Configure circuit breaker

Apply the circuit breaker configuration:
```yaml
# circuit-breaker.yaml
apiVersion: kmesh.net/v1alpha1
kind: CircuitBreaker
metadata:
  name: test-circuit-breaker
spec:
  service: test-service
  rules:
    - priority: HIGH
      maxConnections: 10
      maxPendingRequests: 5
      maxRequests: 20
      maxRetries: 3
```

Apply the configurations:
```bash
kubectl apply -f sample-app.yaml
kubectl apply -f fortio.yaml
kubectl apply -f circuit-breaker.yaml
```



### Monitor circuit breaker behavior

Monitor metrics:
```bash
# View Fortio metrics
kubectl logs deploy/fortio

# Check service status
kubectl get pods -w
```

### Testing Scenarios

#### 4.1 Basic Load Test
```bash
# Normal load
kubectl exec -it deploy/fortio -- \
fortio load -c 1 -qps 10 -t 30s http://test-service
```

#### 4.2 Circuit Breaker Test
```bash
# Heavy load to trigger circuit breaker
kubectl exec -it deploy/fortio -- \
fortio load -c 5 -qps 100 -t 30s http://test-service

# Verify circuit breaker status
kubectl get destinationrule test-circuit-breaker -o yaml

# Simulate service failure
kubectl scale deployment test-service --replicas=0
```
#### 4.3 Recovery Test
```bash
# Restore service
kubectl scale deployment test-service --replicas=1

# Test recovery
kubectl exec -it deploy/fortio -- \
fortio load -c 2 -qps 20 -t 30s http://test-service
```

### Analyzing Results

#### 6.1 Fortio Results
```bash
# View test results
kubectl logs deploy/fortio

# Get detailed metrics
kubectl exec -it deploy/fortio -- /usr/bin/fortio report
```

#### 6.2 System Metrics
```bash
# Check pod status
kubectl get pods -w

# View circuit breaker configuration
kubectl get destinationrule test-circuit-breaker -o yaml
```

### Understanding what happened

The circuit breaker configuration:
- Limits concurrent HTTP requests
- Ejects hosts after 3 consecutive errors
- Keeps circuit open for 30 seconds
- Monitors service health every 5 seconds

When the service is overloaded:
1. Circuit breaker trips after threshold breach
2. Subsequent requests are blocked
3. Service recovers after baseEjectionTime
4. Normal traffic flow resumes

### Clean up

Remove test components:
```bash
kubectl delete -f sample-app.yaml
kubectl delete -f fortio.yaml
kubectl delete -f circuit-breaker.yaml
```

### Troubleshooting

If you encounter issues:
1. Check pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

2. Check circuit breaker configuration:
```bash
kubectl get destinationrule
kubectl describe destinationrule test-circuit-breaker
```

3. View application logs:
```bash
kubectl logs deploy/test-service
kubectl logs deploy/fortio
```