---
draft: false
linktitle:  Circuit Breaker
menu:
  docs:
    parent: user guide
    weight: 22
title: Use Circuit Breaker 
toc: true
type: docs
---

### Preparation

1. Ensure KMesh is installed in your Kubernetes cluster (see [Quick Start Guide](https://kmesh.net/en/docs/setup/quickstart/))

2. Deploy a sample microservice application

3. Verify the default namespace is managed by KMesh

### Circuit Breaker Configuration

##### Deploy a Sample Application

Let's use a simple microservice setup to demonstrate circuit breaking:

```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sample-service
  template:
    metadata:
      labels:
        app: sample-service
    spec:
      containers:
      - name: service
        image: your-service-image
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: sample-service
spec:
  selector:
    app: sample-service
  ports:
  - port: 80
    targetPort: 8080
EOF
```

##### Apply Circuit Breaker Configuration

Configure circuit breaker to limit connections and requests:

```bash
kubectl apply -f - <<EOF
apiVersion: kmesh.net/v1alpha1
kind: CircuitBreaker
metadata:
  name: sample-service-circuit-breaker
spec:
  service: sample-service
  rules:
    - priority: HIGH
      maxConnections: 100
      maxPendingRequests: 50
      maxRequests: 200
      maxRetries: 3
EOF
```

### Verify Circuit Breaker Functionality

Use a load testing tool to simulate traffic and observe circuit breaker behavior:

```bash
# Install hey load testing tool
go install github.com/rakyll/hey@latest

# Generate load
hey -n 1000 -c 50 http://sample-service/endpoint
```

### Monitoring Circuit Breaker Metrics

Check circuit breaker metrics and logs:

```bash
# View KMesh circuit breaker logs
kubectl logs -n kmesh -l app=kmesh circuit-breaker

# Get circuit breaker statistics
kmesh get circuit-breaker-stats sample-service
```

### Understanding the Circuit Breaker Mechanism

When the circuit breaker is activated:
- New connections are rejected
- Existing connections are maintained
- Service is protected from overload

### Circuit Breaker Configuration Options

| Parameter           | Description                          | Default    |
|--------------------|--------------------------------------|------------|
| priority           | Request routing priority             | DEFAULT    |
| maxConnections     | Maximum concurrent connections       | Unlimited  |
| maxPendingRequests | Maximum pending requests in queue    | Unlimited  |
| maxRequests        | Maximum concurrent requests          | Unlimited  |
| maxRetries         | Maximum retry attempts               | Unlimited  |

### Technical Implementation Details

##### Data Structures

Circuit Breaker configuration in Protocol Buffers:

```protobuf
message CircuitBreakers {
  RoutingPriority priority = 1;
  uint32 max_connections = 2;
  uint32 max_pending_requests = 3;
  uint32 max_requests = 4;
  uint32 max_retries = 5;
  uint32 max_connection_pools = 7;
}
```

Connection Tracking Structure:

```c
struct cluster_stats {
    __u32 active_connections;
};

struct cluster_stats_key {
    __u64 netns_cookie;
    __u32 cluster_id;
};
```

##### Connection Management Workflow

Connection Binding Logic:

```c
static inline int on_cluster_sock_bind(
    ctx_buff_t *ctx, 
    const Cluster__Cluster *cluster
) {
    // Check if connection limits are exceeded
    if (stats->active_connections >= cbs->max_connections) {
        // Reject connection
        return -1;
    }
    // Bind socket to cluster
    return 0;
}
```

### Advanced Configuration Example

```yaml
apiVersion: kmesh.net/v1alpha1
kind: CircuitBreaker
metadata:
  name: complex-service-circuit-breaker
spec:
  services:
    - name: service-a
      rules:
        - priority: HIGH
          maxConnections: 50
    - name: service-b
      rules:
        - priority: MEDIUM
          maxConnections: 100
```

### Troubleshooting

##### Common Issues
- Unexpected connection rejections
- High error rates
- Performance degradation

##### Debugging Steps

```bash
# Check circuit breaker configuration
kubectl describe circuitbreaker sample-service-circuit-breaker

# View detailed logs
kubectl logs -n kmesh -l app=kmesh circuit-breaker -c circuit-breaker

# Check cluster status
kmesh get clusters
```

### Best Practices

1. Start with conservative limits
2. Gradually adjust based on service performance
3. Monitor circuit breaker metrics
4. Use priority-based configurations

### Performance Considerations

- Kernel-native implementation
- Minimal overhead
- Lock-free atomic updates
- eBPF map-based tracking

### Cleanup

Remove the circuit breaker and sample application:

```bash
kubectl delete circuitbreaker sample-service-circuit-breaker
kubectl delete deployment sample-service
kubectl delete service sample-service
```

### Limitations

- Currently focuses on TCP connections
- Kernel version dependencies
- Per-cluster granularity

### Sample Code Snippet

```go
// Circuit Breaker Configuration Example
circuitBreaker := &CircuitBreakers{
    Priority:           RoutingPriority_HIGH,
    MaxConnections:     100,
    MaxPendingRequests: 50,
    MaxRequests:        200,
    MaxRetries:         3,
}
```