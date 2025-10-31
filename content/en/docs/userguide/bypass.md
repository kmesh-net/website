---
draft: false
linktitle: Use Bypass Feature in Kmesh
menu:
  docs:
    parent: user guide
    weight: 21
title: Use Bypass Feature in Kmesh
toc: true
type: docs
---

## **Overview**

The bypass feature in Kmesh allows you to temporarily remove mesh service from the traffic path for troubleshooting purposes. This is particularly useful when you need to determine whether communication issues are caused by the mesh service or the application itself.

## **Use Cases**

###### 1. Troubleshooting Service Communication
- Identify whether issues are caused by mesh service or application logic
- Test direct communication between services without mesh interference
- Debug network connectivity issues

##### 2. Traffic Path Verification
- Verify service behavior with and without mesh involvement
- Validate application communication patterns
- Test service-to-service direct connectivity

## **Prerequisites**

Before using the bypass feature, ensure you have:

- A running Kubernetes cluster
- Kmesh installed and configured (see [Quick Start Guide](https://kmesh.net/en/docs/setup/quickstart/))
- Pods with sidecar injection enabled
- Administrative access to the cluster

## **Enabling Bypass**

##### 1. Enable Bypass Controller

The bypass controller must be enabled in your Kmesh configuration:

```yaml
--enable-bypass=true
```

##### 2. Label Pods for Bypass

To enable bypass for specific pods:

```bash
kubectl label pod <pod_name> kmesh.net/bypass=enabled
```

## **How It Works**

##### Traffic Flow Changes

##### 1. Normal Flow (Without Bypass)
```
Service A → Sidecar → Sidecar → Service B
```

##### 2. Bypass Enabled Flow
```
Service A → Service B (Direct communication)
```

##### Implementation Details

The bypass feature implements traffic control through:

1. **Label Monitoring**:
   ```go
   const (
       ByPassLabel = "kmesh.net/bypass"
       ByPassValue = "enabled"
   )
   ```

2. **IPTables Rules**:
   ```bash
   iptables -t nat -I OUTPUT -m bpf --object-pinned /sys/fs/bpf/bypass -j RETURN
   iptables -t nat -I PREROUTING -m bpf --object-pinned /sys/fs/bpf/bypass -j RETURN
   ```

## **Verification**

##### 1. Check Bypass Status

```bash
# Check if pod has bypass label
kubectl get pod <pod_name> --show-labels
```

##### 2. Verify Traffic Flow

```bash
# Check iptables rules in pod
kubectl exec <pod_name> -- iptables -t nat -L
```

##### 3. Verify Bypass Configuration

```bash
# Check bypass controller status
kubectl get pods -n kmesh-system | grep bypass-controller
```

## **Limitations and Considerations**

##### 1. Single Pod Scope
- Bypass affects only the labeled pod
- Does not affect the entire traffic path

##### 2. Message Format
- Before enabling bypass:
  - Configure mesh service for plaintext messages
  - Prevent encryption/decryption issues

##### 3. Traffic Direction
- Current: Affects both inbound and outbound traffic
- Future: Will support directional bypass

## **Troubleshooting**

##### Common Issues and Solutions

1. **Bypass Not Working**
   ```bash
   # Verify label
   kubectl get pod <pod_name> --show-labels | grep kmesh.net/bypass

   # Check sidecar
   kubectl describe pod <pod_name> | grep sidecar
   ```

2. **Communication Issues**
   ```bash
   # Check iptables
   kubectl exec <pod_name> -- iptables -t nat -L

   # Verify network namespace
   kubectl exec <pod_name> -- ip netns list
   ```

## **Cleanup**

##### Remove Bypass Configuration

```bash
# Remove bypass label
kubectl label pod <pod_name> kmesh.net/bypass-

# Verify removal
kubectl get pod <pod_name> --show-labels
```