---
title: Kmeshctl Usage
sidebar_position: 1
---

## Installation

### 1. From Release Binaries

Pre-built binaries are available on our [releases page](https://github.com/kmesh-net/kmesh/releases).

```bash
# For AMD64 / x86_64
[ $(uname -m) = x86_64 ] && curl -Lo ./kmeshctl https://github.com/kmesh-net/kmesh/releases/download/v1.0.0/kmeshctl-linux-amd64
# For ARM64
[ $(uname -m) = aarch64 ] && curl -Lo ./kmeshctl https://github.com/kmesh-net/kmesh/releases/download/v1.0.0/kmeshctl-linux-arm64
chmod +x ./kmeshctl
sudo mv ./kmeshctl /usr/local/bin/kmeshctl
```

### 2. From Source

Kmeshctl is still in rapid development. If you want to try the latest features, you can directly build and install it from source.

```bash
# Clone source code from github
git clone https://github.com/kmesh-net/kmesh.git

# Build and install kmeshctl
cd kmesh/
make kmeshctl
chmod +x ./kmeshctl
sudo mv ./kmeshctl /usr/local/bin/kmeshctl
```

## Commands Reference

### kmeshctl accesslog

Enable or disable Kmesh's accesslog

```bash
kmeshctl accesslog [flags]
```

**Examples**
```bash
# Enable Kmesh's accesslog:
kmeshctl accesslog <kmesh-daemon-pod> enable

# Disable Kmesh's accesslog:
kmeshctl accesslog <kmesh-daemon-pod> disable
```

**Options**
```
  -h, --help   help for accesslog
```

---

### kmeshctl dump

Dump config of kernel-native or dual-engine mode

```bash
kmeshctl dump [flags]
```

**Examples**
```bash
# Kernel Native mode:
kmeshctl dump <kmesh-daemon-pod> kernel-native
	  
# Dual Engine mode:
kmeshctl dump <kmesh-daemon-pod> dual-engine
```

**Options**
```
  -h, --help   help for dump
```

---

### kmeshctl log

Get or set kmesh-daemon's logger level

```bash
kmeshctl log [flags]
```

**Examples**
```bash
# Set default logger's level as "debug":
kmeshctl log <kmesh-daemon-pod> --set default:debug

# Get all loggers' name
kmeshctl log <kmesh-daemon-pod>
	  
# Get default logger's level:
kmeshctl log <kmesh-daemon-pod> default
```

**Options**
```
  -h, --help         help for log
      --set string   Set the logger level (e.g., default:debug)
```

---

### kmeshctl waypoint

A group of commands used to manage waypoint configuration

```bash
kmeshctl waypoint [flags]
```

**Examples**
```bash
# Apply a waypoint to the current namespace
kmeshctl waypoint apply

# Generate a waypoint as yaml
kmeshctl waypoint generate --namespace default

# List all waypoints in a specific namespace
kmeshctl waypoint list --namespace default
```

#### 1. kmeshctl waypoint apply

Apply a waypoint configuration to the cluster

```bash
kmeshctl waypoint apply [flags]
```

**Examples**
```bash
# Apply a waypoint to the current namespace
kmeshctl waypoint apply

# Apply a waypoint to a specific namespace and wait for it to be ready
kmeshctl waypoint apply --namespace default --wait

# Apply a waypoint to a specific pod
kmesh waypoint apply -n default --name reviews-v2-pod-waypoint --for workload
```

**Options**
```
      --enroll-namespace   If set, the namespace will be labeled with the waypoint name
      --for string         Specify the traffic type [all none service workload] for the waypoint
  -h, --help               help for apply
      --overwrite          Overwrite the existing Waypoint used by the namespace
  -r, --revision string    The revision to label the waypoint with
  -w, --wait               Wait for the waypoint to be ready
```

**Options inherited from parent commands**
```
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

#### 2. kmeshctl waypoint delete

Delete a waypoint configuration from the cluster

```bash
kmeshctl waypoint delete [flags]
```

**Examples**
```bash
# Delete a waypoint from the default namespace
kmeshctl waypoint delete

# Delete a waypoint by name, which can obtain from kmeshctl waypoint list
kmeshctl waypoint delete waypoint-name --namespace default

# Delete several waypoints by name
kmeshctl waypoint delete waypoint-name1 waypoint-name2 --namespace default

# Delete all waypoints in a specific namespace
kmeshctl waypoint delete --all --namespace default
```

**Options**
```
      --all    Delete all waypoints in the namespace
  -h, --help   help for delete
```

**Options inherited from parent commands**
```
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

#### 3. kmeshctl waypoint generate

Generate a waypoint configuration as YAML

```bash
kmeshctl waypoint generate [flags]
```

**Examples**
```bash
# Generate a waypoint as yaml
kmeshctl waypoint generate --namespace default

# Generate a waypoint that can process traffic for service in default namespace
kmeshctl waypoint generate --for service -n default
```

**Options**
```
      --for string        Specify the traffic type [all none service workload] for the waypoint
  -h, --help              help for generate
  -r, --revision string   The revision to label the waypoint with
```

**Options inherited from parent commands**
```
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

#### 4. kmeshctl waypoint list

List managed waypoint configurations in the cluster

```bash
kmeshctl waypoint list [flags]
```

**Examples**
```bash
# List all waypoints in a specific namespace
kmeshctl waypoint list --namespace default

# List all waypoints in the cluster
kmeshctl waypoint list -A
```

**Options**
```
  -A, --all-namespaces   List all waypoints in all namespaces
  -h, --help             help for list
```

**Options inherited from parent commands**
```
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

#### 5. kmeshctl waypoint status

Show the status of waypoints for the namespace provided or default namespace if none is provided

```bash
kmeshctl waypoint status [flags]
```

**Examples**
```bash
# Show the status of the waypoint in the default namespace
kmeshctl waypoint status

# Show the status of the waypoint in a specific namespace
kmeshctl waypoint status --namespace default
```

**Options**
```
  -h, --help   help for status
```

**Options inherited from parent commands**
```
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

---

### kmeshctl version

Prints out build version info

```bash
kmeshctl version [flags]
```

**Examples**
```bash
# Show version of kmeshctl
kmeshctl version

# Show version info of a specific Kmesh daemon
kmeshctl version <kmesh-daemon-pod>
```

---

### kmeshctl authz

Manage xdp authz eBPF program for Kmesh's authz offloading

#### 1. kmeshctl authz disable

```bash
kmeshctl authz disable [podNames...] [flags]
```

**Examples**
```bash
kmeshctl authz disable
kmeshctl authz disable pod1 pod2
```

**Options**
```
  -h, --help   help for disable
```

#### 2. kmeshctl authz enable

```bash
kmeshctl authz enable [podNames...] [flags]
```

**Examples**
```bash
kmeshctl authz enable
kmeshctl authz enable pod1 pod2
```

**Options**
```
  -h, --help   help for enable
```

#### 3. kmeshctl authz status

```bash
kmeshctl authz status [podNames...] [flags]
```

**Examples**
```bash
kmeshctl authz status
kmeshctl authz status pod1 pod2
```

**Options**
```
  -h, --help   help for status
```