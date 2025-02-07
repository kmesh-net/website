---
draft: false
linktitle: Installation Troubleshooting
menu:
  docs:
    parent: setup
    weight: 5
title: Installation Troubleshooting Guide
toc: true
type: docs
description: >
  Comprehensive troubleshooting guide for common Kmesh installation and runtime issues.
---

## Common Installation Issues

### Port Conflicts
When deploying Kmesh, you might encounter port conflicts, particularly with port 15006 which is used by default.

| Error Code | Description | Impact | Solution |
|------------|-------------|---------|----------|
| ERR_PORT_IN_USE | Port 15006 already in use | Prevents Kmesh startup | Change port or free existing port |
| MISSING_DEP | Missing libbpf dependency | BPF features unavailable | Install libbpf ≥0.8 |
| CNI_CONFLICT | CNI plugin conflicts | Network setup fails | Verify CNI configuration |

## Detailed Solutions

### Port Conflict Resolution
If you encounter `ERR_PORT_IN_USE`, follow these steps:

1. **Diagnose the Conflict**:
   ```
   # Check what's using port 15006
   sudo lsof -i :15006
   
   # For systemd services
   sudo ss -lptn 'sport = :15006'
   ```

2. **Resolution Options**:
   
   a. Change Kmesh Port:
   ```
   # kmesh-config.yaml
   apiVersion: kmesh.net/v1
   kind: KmeshConfig
   metadata:
     name: kmesh-config
     namespace: kmesh-system
   spec:
     port: 15007
     logLevel: info
     enableMetrics: true
   ```

   b. Free Existing Port:
   ```
   # Identify and stop conflicting process
   sudo fuser -k 15006/tcp
   ```

### Dependency Management

#### libbpf Installation
Required for BPF functionality:

```
# Ubuntu/Debian systems
sudo apt-get update
sudo apt-get install -y \
    libbpf-dev \
    linux-headers-$(uname -r)

# Verify installation
dpkg -l | grep libbpf

# CentOS/RHEL systems
sudo yum install -y libbpf-devel kernel-devel
```

## Runtime Verification

### System Requirements Check
```
# Kernel version check
uname -r  # Should be ≥ 5.10.0 for full features

# BPF verification
sudo bpftool prog list

# Resource limits
ulimit -n  # Should be ≥ 65535
```

### Pod Management
Verify Kmesh integration:

```
# Check pod annotations
kubectl get pod <pod-name> -o jsonpath='{.metadata.annotations}' | jq

# Enable Kmesh management
kubectl label namespace default istio.io/dataplane-mode=Kmesh --overwrite

# Verify Kmesh status
kubectl -n kmesh-system get pods -l app=kmesh
```

### Logging and Debugging

#### Enhanced Logging
```
# Enable debug logging
kmeshctl accesslog <kmesh-pod-name> --set default:debug

# Monitor BPF events (kernel ≥ 5.10.0)
kubectl exec -n kmesh-system <kmesh-pod> -- kmesh-daemon log --set bpf:debug

# Collect all logs
kubectl logs -n kmesh-system -l app=kmesh --all-containers --tail=1000 > kmesh-debug.log
```

## Clean-up Procedures

### Complete Uninstallation
Remove Kmesh and its configurations:

```
# Using Helm
helm uninstall kmesh -n kmesh-system

# Using kubectl
kubectl delete namespace kmesh-system
kubectl delete -f kmesh-config.yaml

# Clean CNI configurations
sudo rm -f /etc/cni/net.d/kmesh-cni*
```

### Configuration Reset
Reset to default settings:

```
# Remove namespace labels
kubectl label namespace default istio.io/dataplane-mode-

# Reset CNI
kubectl -n kmesh-system delete pod -l app=kmesh-cni
```

## Health Verification

### System Health Check
```
# Component status
kubectl get componentstatuses

# Event monitoring
kubectl get events -n kmesh-system --sort-by='.lastTimestamp'

# Resource usage
kubectl top pod -n kmesh-system
```

## Additional Resources

- [Kmesh Architecture Guide](https://kmesh.net/en/docs/architecture/)
- [Performance Tuning](https://kmesh.net/en/docs/performance/)
- [Community Support](https://kmesh.net/en/docs/community/)

For more complex issues, please refer to our [GitHub Issues](https://github.com/kmesh-net/kmesh/issues) or join our community channels.