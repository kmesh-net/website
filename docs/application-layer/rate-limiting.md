---
title: Rate Limiting
sidebar_position: 9
---

# Rate Limiting

Rate limiting is a critical feature for managing traffic flow and preventing service overload. Kmesh supports local rate limiting in Kernel-Native mode, allowing you to control connection rates without relying on external services.

## Overview

Rate limiting in Kmesh uses the token bucket algorithm to control the rate of connections to your services. This feature is particularly useful for:

- Protecting services from connection floods
- Managing burst traffic
- Ensuring fair resource allocation
- Preventing denial-of-service attacks

## How It Works

Kmesh implements local rate limiting directly in the data plane using eBPF. When a new connection is initiated, Kmesh:

1. Checks if the local rate limit filter is configured for the listener
2. Retrieves the token bucket configuration
3. Determines if tokens are available for the connection
4. Either allows the connection (consuming a token) or rejects it

The token bucket algorithm works as follows:

- A bucket holds tokens up to a maximum capacity (`max_tokens`)
- Tokens are replenished at a fixed rate (`tokens_per_fill` tokens every `fill_interval`)
- Each new connection consumes one token
- If no tokens are available, the connection is rejected

<!-- ![Token Bucket Algorithm](./images/token-bucket-diagram.md) -->

## Configuration

To enable rate limiting in Kmesh, you need to configure an EnvoyFilter that adds the `local_ratelimit` filter to your service's listener.

### Configuration Parameters

The `token_bucket` section contains the key parameters for rate limiting:

- `max_tokens`: Maximum number of tokens the bucket can hold (burst capacity)
- `tokens_per_fill`: Number of tokens added to the bucket per fill interval
- `fill_interval`: Time interval for replenishing tokens (e.g., "60s" for 60 seconds)

### Rate Limiting for Regular Services

For regular services, rate limiting is applied on the inbound interface. This means that each service instance independently applies its own rate limit to incoming connections.

### Rate Limiting for External Services

For external services, rate limiting is applied on the outbound interface. This means that connections to external services are rate limited at the source before they leave the mesh. This is particularly useful for controlling traffic to services outside your mesh.

## Example Configurations

### Example 1: Rate Limiting for Regular Services

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: filter-local-ratelimit-svc
  namespace: istio-system
spec:
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.tcp_proxy
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.network.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.local_ratelimit.v3.LocalRateLimit
            stat_prefix: local_rate_limit
            token_bucket:
              max_tokens: 4
              tokens_per_fill: 4
              fill_interval: 60s
```

In this example, the configuration allows a maximum of 4 new connections per minute, with a burst capacity of 4 connections.

### Example 2: Rate Limiting for External Services

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: external-service-ratelimit
  namespace: default
spec:
  workloadSelector:
    labels:
      app: client-app
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        context: SIDECAR_OUTBOUND
        listener:
          portNumber: 443
          filterChain:
            filter:
              name: envoy.filters.network.tcp_proxy
              subFilter:
                name: envoy.filters.network.rbac
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.network.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.local_ratelimit.v3.LocalRateLimit
            stat_prefix: external_rate_limit
            token_bucket:
              max_tokens: 10
              tokens_per_fill: 10
              fill_interval: 60s
```

This example limits outbound connections to an external service to 10 connections per minute.

## Testing Rate Limiting

You can use tools like `fortio` or `wrk` to generate connection load and test your rate limiting configuration.

### Testing Steps

1. Deploy an application with rate limiting configured:

```bash
# Apply the example configuration from the examples directory
kubectl apply -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/website/docs/application-layer/examples/rate-limit-example.yaml
```

2. Generate traffic that exceeds your rate limit:

```bash
fortio load -c 10 -qps 20 -t 60s http://<service-ip>:<port>/
```

3. Observe the rate limiting behavior in the service logs:

```bash
kubectl logs -f <pod-name> | grep "rate limit"
```

You should see some connections being rejected once the rate limit is reached.

## Monitoring Rate Limiting

Kmesh provides metrics for monitoring rate limiting behavior:

- Number of connections allowed
- Number of connections rejected due to rate limiting
- Current token bucket levels

You can view these metrics through the Kmesh monitoring interface or export them to your monitoring system.

## Best Practices

1. **Start with conservative limits**: Begin with lower limits and gradually increase them based on observed behavior.

2. **Consider burst patterns**: Set `max_tokens` appropriately to handle expected burst traffic.

3. **Monitor and adjust**: Regularly review rate limiting metrics and adjust settings as needed.

4. **Layer rate limiting**: Consider applying rate limits at multiple levels (e.g., per client, per service) for more granular control.

5. **Test under load**: Validate your rate limiting configuration under realistic load conditions.

## Troubleshooting

If rate limiting is not working as expected:

1. **Verify configuration**: Ensure your EnvoyFilter is correctly configured and applied:

   ```bash
   kubectl get envoyfilter
   kubectl describe envoyfilter <name>
   ```

2. **Check Kmesh build**: Verify that your Kmesh build includes rate limiting support (built with `feature_ratelimit` tag).

3. **Examine logs**: Look for rate limiting related logs in the Kmesh logs:

   ```bash
   kubectl logs -f <kmesh-pod> | grep "rate limit"
   ```

4. **Check connections**: Use tools like `netstat` or `ss` to verify connection states and counts.

5. **Validate token bucket settings**: Ensure your `max_tokens`, `tokens_per_fill`, and `fill_interval` values are appropriate for your use case.

## Conclusion

Rate limiting in Kmesh provides an efficient way to protect your services from excessive traffic directly at the kernel level. By properly configuring rate limits, you can ensure service stability and availability even under high load conditions.
