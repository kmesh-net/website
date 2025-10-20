# IPSec & Offload Authorization E2E Test Guide

This document provides a step-by-step guide for executing the IPSec and Offload Authorization E2E tests for Kmesh. These tests ensure the reliability, security, and functionality of the IPSec feature and the Offload Authorization mechanisms.

## Prerequisites

Before running the tests, ensure the following:

- **Kubernetes Cluster**: A two-node Kubernetes cluster with Kmesh installed.
- **Tools**: `kubectl`, `tcpdump`, and `kmeshctl`.
- **Applications**: `httpbin` and `sleep` applications deployed in the cluster.

## IPSec E2E Tests

### 1. Basic Connectivity Test

This test verifies the establishment of IPSec tunnels and the correctness of encrypted communication.

#### Steps

1. Deploy the `httpbin` and `sleep` applications on different nodes:

   ```bash
   kubectl apply -f httpbin.yaml
   kubectl apply -f sleep.yaml
   ```

2. Verify connectivity between the applications:

   ```bash
   kubectl exec <sleep-pod> -- curl http://<httpbin-service>
   ```

3. Check IPSec state and policy rules:

   ```bash
   ip xfrm state show
   ip xfrm policy show
   ```

4. Verify encryption using `tcpdump`:

   ```bash
   tcpdump -i any esp
   ```

### 2. Key Rotation Test

This test ensures the reliability of the PSK update mechanism and validates service continuity during key changes.

#### Steps

1. Record the initial SPI and pre-shared key:

   ```bash
   ip xfrm state show
   kubectl get secret
   ```

2. Send continuous traffic between the applications:

   ```bash
   kubectl exec <sleep-pod> -- curl http://<httpbin-service> -s -o /dev/null -w "%{http_code}\n"
   ```

3. Update the pre-shared key:

   ```bash
   kmeshctl secret create --key=<new-key>
   ```

4. Verify that the SPI and key are updated in the xfrm rules:

   ```bash
   ip xfrm state show
   ```

5. Ensure communication continuity and encryption status.

## Offload Authorization E2E Tests

### 1. IP Authorization Test

This test verifies that traffic is allowed or denied based on source IP.

#### Example Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ip-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        ipBlocks:
        - "192.168.1.1"
```

#### Steps

1. Apply the policy:

   ```bash
   kubectl apply -f ip-allow-policy.yaml
   ```

2. Test connectivity:

   ```bash
   kubectl exec <sleep-pod> -- curl http://<httpbin-service>
   ```

### 2. Port Authorization Test

This test verifies that traffic is allowed or denied based on destination ports.

#### Example Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: port-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        ports: ["80"]
```

#### Steps

1. Apply the policy:

   ```bash
   kubectl apply -f port-allow-policy.yaml
   ```

2. Test connectivity:

   ```bash
   kubectl exec <sleep-pod> -- curl http://<httpbin-service>
   ```

### 3. Header Authorization Test

This test verifies that traffic is allowed or denied based on HTTP headers.

#### Example Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: header-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - when:
    - key: request.headers["x-api-key"]
      values: ["secret-token"]
```

#### Steps

1. Apply the policy:

   ```bash
   kubectl apply -f header-allow-policy.yaml
   ```

2. Test connectivity:

   ```bash
   kubectl exec <sleep-pod> -- curl -H "x-api-key: secret-token" http://<httpbin-service>
   ```

### 4. Namespace Authorization Test

This test verifies that traffic is allowed or denied based on the source namespace.

#### Example Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: namespace-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["test-ns2"]
```

#### Steps

1. Apply the policy:

   ```bash
   kubectl apply -f namespace-allow-policy.yaml
   ```

2. Test connectivity:

   ```bash
   kubectl exec <sleep-pod> -- curl http://<httpbin-service>
   ```

### 5. Host Authorization Test

This test verifies that traffic is allowed or denied based on the destination host.

#### Example Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: host-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        hosts: ["example.com"]
```

#### Steps

1. Apply the policy:

   ```bash
   kubectl apply -f host-allow-policy.yaml
   ```

2. Test connectivity:

   ```bash
   kubectl exec <sleep-pod> -- curl http://example.com
   ```

## Cleanup

After completing the tests, clean up the resources:

```bash
kubectl delete -f httpbin.yaml
kubectl delete -f sleep.yaml
kubectl delete authorizationpolicy --all -n test-ns1
```
