---
draft: false
linktitle: Use Rate Limiting
menu:
  docs:
    parent: user guide
    weight: 23
title: Rate Limiting
toc: true
type: docs
---

## Overview

Rate limiting is a critical mechanism for controlling traffic flow and preventing service overload. KMesh provides a robust, kernel-native rate limiting solution using the token bucket algorithm.

#### Key Features
- Kernel-native implementation
- Token bucket rate limiting
- Configurable token refill strategies
- Low-overhead traffic control

#### Preparation

1. Ensure KMesh is installed in your Kubernetes cluster (see [Quick Start Guide](https://kmesh.net/en/docs/setup/quickstart/))

2. Deploy a sample microservice application

3. Verify the default namespace is managed by KMesh
4. 

## Technical Architecture

#### Token Bucket Algorithm

KMesh implements rate limiting using a token bucket algorithm with three primary parameters:
- `max_tokens`: Maximum token bucket capacity
- `tokens_per_fill`: Tokens added during each refill
- `fill_interval`: Time between token refills

#### Implementation Details

```protobuf
message TokenBucket {
  int64 max_tokens = 1;        // Maximum tokens in bucket
  int64 tokens_per_fill = 2;   // Tokens added per interval
  int64 fill_interval = 3;     // Refill interval in nanoseconds
}
```

#### Internal Data Structures

```c
struct ratelimit_key {
    union {
        struct {
            __u64 netns;  /* Network namespace */
            __u32 ipv4;   /* Destination IPv4 address */
            __u32 port;   /* Destination port */
            __u32 family; /* Address family */
        } sk_skb;
    } key;
};

struct ratelimit_value {
    __u64 last_topup; /* Timestamp of last token refill */
    __u64 tokens;     /* Current number of available tokens */
};
```

## Configuration Examples

#### Basic Rate Limit Configuration

```yaml
apiVersion: kmesh.net/v1alpha1
kind: RateLimit
metadata:
  name: example-rate-limit
spec:
  service: sample-service
  rules:
    - maxTokens: 100
      tokensPerFill: 10
      fillInterval: 1000000000  # 1 second in nanoseconds
```

#### Advanced Configuration

```yaml
apiVersion: kmesh.net/v1alpha1
kind: RateLimit
metadata:
  name: complex-rate-limit
spec:
  services:
    - name: user-service
      rules:
        - maxTokens: 50
          tokensPerFill: 5
          fillInterval: 500000000  # 0.5 seconds
    - name: payment-service
      rules:
        - maxTokens: 20
          tokensPerFill: 2
          fillInterval: 1000000000  # 1 second
```

## Rate Limiting Algorithm

#### Token Bucket Mechanism

```c
static inline int rate_limit__check_and_take(
    struct ratelimit_key *key, 
    const struct ratelimit_settings *settings
) {
    // Check and consume tokens
    if (value->tokens == 0) {
        return -1;  // Rate limit exceeded
    }

    // Consume one token
    __sync_fetch_and_add(&value->tokens, -1);
    return 0;
}
```

## Use Cases

1. **Prevent Service Overload**
   - Limit requests to prevent resource exhaustion
   - Protect backend services from sudden traffic spikes

2. **DDoS Mitigation**
   - Control incoming request rate
   - Reduce impact of potential attacks

3. **Resource Management**
   - Allocate fair resource usage across services
   - Implement tiered service levels

## Monitoring and Metrics

#### Tracking Rate Limit Events

```go
type RateLimitMetrics struct {
    TotalRequests     int64
    RateLimitedRequests int64
    AvailableTokens   int64
}
```

#### Logging Rate Limit Violations

```bash
# View rate limit logs
kubectl logs -n kmesh -l app=kmesh rate-limiter

# Check rate limit statistics
kmesh get ratelimit-stats
```

## Troubleshooting

#### Diagnostic Commands

```bash
# Check rate limit configuration
kubectl describe ratelimit

# Verify KMesh rate limit status
kmesh diagnose rate-limit
```

#### Common Troubleshooting Scenarios

1. **Requests Being Rejected**
   - Verify token bucket configuration
   - Check service load patterns
   - Adjust `maxTokens` and `tokensPerFill`

2. **Performance Issues**
   - Monitor token consumption
   - Analyze fill interval
   - Optimize rate limit parameters

## Performance Considerations

- Kernel-native implementation
- Minimal overhead
- Lock-free atomic updates
- eBPF map-based tracking

#### Performance Metrics

```go
type PerformanceMetrics struct {
    CPUOverhead       float64
    MemoryConsumption int64
    Latency           time.Duration
}
```

## Best Practices

1. Start with conservative limits
2. Monitor and adjust dynamically
3. Use priority-based configurations
4. Consider service-specific requirements
5. Implement gradual rate limit increases

## Limitations

- Currently focuses on TCP connections
- Kernel version dependencies
- Per-service granularity
- Limited to IPv4 addresses

#### Cleanup

Remove the rate limit and sample application:

```bash
kubectl delete ratelimit example-rate-limit
kubectl delete deployment example-rate-limit
kubectl delete service example-rate-limit
```


## Code Examples

#### Go Implementation

```go
type RateLimitConfig struct {
    Service        string
    MaxTokens      int64
    TokensPerFill  int64
    FillInterval   time.Duration
}

func applyRateLimit(config RateLimitConfig) {
    // Rate limit implementation
}
```

#### eBPF Rate Limit Snippet

```c
struct ratelimit_settings {
    __u64 max_tokens;
    __u64 tokens_per_fill;
    __u64 fill_interval;
};
```

## Additional Resources

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Kernel-Native Networking](https://www.kernel.org/doc/html/latest/networking/index.html)