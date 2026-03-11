---
title: Quick Start
description: This guide lets you quickly install Kmesh.
sidebar_position: 1
---

# Quick Start Guide

This guide lets you quickly install Kmesh.

## Prerequisites

Before installing Kmesh, ensure your environment meets the following requirements:

| Requirement | Version | Notes                 |
| ----------- | ------- | --------------------- |
| Kubernetes  | 1.26+   | Tested on 1.26-1.29   |
| Istio       | 1.22+   | Tested on 1.22-1.25 (ambient mode required) |
| Helm        | 3.0+    | For helm installation |
| Memory      | 4GB+    | Recommended minimum   |
| CPU         | 2 cores | Recommended minimum   |
| Kernel      | 5.10+   | For eBPF support      |

## Preparation

Kmesh needs to run on a Kubernetes cluster. Kubernetes 1.26+ are currently supported. We recommend using [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) to quickly provide a Kubernetes cluster (We provide a [document](develop-with-kind/) for developing and deploying Kmesh using kind). Of course, you can also use [minikube](https://minikube.sigs.k8s.io/docs/) and other ways to create Kubernetes clusters.

Currently, Kmesh makes use of [istio](https://istio.io/) as its control plane. Before installing Kmesh, please install the Istio control plane. We recommend installing istio ambient mode because Kmesh `dual-engine` mode need it. For details, see [ambient mode istio](https://istio.io/latest/docs/ops/ambient/getting-started/).

You can view the results of istio installation using the following command:

```shell
kubectl get po -n istio-system
NAME                      READY   STATUS    RESTARTS   AGE
istio-cni-node-xbc85      1/1     Running   0          18h
istiod-5659cfbd55-9s92d   1/1     Running   0          18h
ztunnel-4jlvv             1/1     Running   0          18h
```

> **Note**: To use waypoint you need to install the Kubernetes Gateway API CRDs, which don't come installed by default on most Kubernetes clusters:

```shell
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

### Only install Istiod

Installing ambient mode istio by above steps will install additional istio components.

The process of installing only `istiod` as the control plane for Kmesh is provided next.

#### Install Istio CRDs

```shell
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
```

To install the chart with the release name `istio-base`:

```shell
kubectl create namespace istio-system
helm install istio-base istio/base -n istio-system
```

#### Install Istiod

To install the chart with the release name `istiod`:

```shell
helm install istiod istio/istiod --namespace istio-system --version 1.24.0 --set pilot.env.PILOT_ENABLE_AMBIENT=true
```

> **Important:** Must set `pilot.env.PILOT_ENABLE_AMBIENT=true`. otherwise Kmesh will not be able to establish grpc links with istiod! If you want to use the Waypoint feature, you should use the istio version 1.23 ~ 1.25.

After installing istiod, it's time to install Kubernetes Gateway API CRDs.

```shell
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

## Install Kmesh

We offer several ways to install Kmesh:

### Option 1: Install from OCI Registry (Recommended)

You can install Kmesh directly from the GitHub Container Registry without cloning the repository:

```shell
helm install kmesh oci://ghcr.io/kmesh-net/kmesh-helm --version x.y.z -n kmesh-system --create-namespace
```

- Replace `x.y.z` with your desired version from [kmesh-helm packages](https://github.com/orgs/kmesh-net/packages/container/package/kmesh-helm):
  - For stable releases, use a version like `v1.1.0`.
  - For pre-releases, use a version like `v1.1.0-alpha`.
  - Omit the `--version` flag to install the latest version (not recommended for production).

### Option 2: Install from Helm

```shell
helm install kmesh ./deploy/charts/kmesh-helm -n kmesh-system --create-namespace
```

### Option 3: Install from Helm Chart Archive

```shell
helm install kmesh ./kmesh-helm-<version>.tgz -n kmesh-system --create-namespace
```

- Download the `kmesh-helm-<version>.tgz` archive from [GitHub Releases](https://github.com/kmesh-net/kmesh/releases). Replace `<version>` in the command above with the version you downloaded (e.g., `v1.1.0`).

### Option 4: Install from Yaml

```shell
kubectl create namespace kmesh-system
kubectl apply -f ./deploy/yaml/
```

You can confirm the status of Kmesh with the following command:

```shell
kubectl get pod -n kmesh-system
NAME          READY   STATUS    RESTARTS   AGE
kmesh-v2frk   1/1     Running   0          18h
```

View the running status of Kmesh service:

```log
time="2024-04-25T13:17:40Z" level=info msg="bpf Start successful" subsys=manager
time="2024-04-25T13:17:40Z" level=info msg="controller Start successful" subsys=manager
time="2024-04-25T13:17:40Z" level=info msg="dump StartServer successful" subsys=manager
time="2024-04-25T13:17:40Z" level=info msg="start write CNI config\n" subsys="cni installer"
time="2024-04-25T13:17:40Z" level=info msg="kmesh cni use chained\n" subsys="cni installer"
time="2024-04-25T13:17:41Z" level=info msg="Copied /usr/bin/kmesh-cni to /opt/cni/bin." subsys="cni installer"
time="2024-04-25T13:17:41Z" level=info msg="kubeconfig either does not exist or is out of date, writing a new one" subsys="cni installer"
time="2024-04-25T13:17:41Z" level=info msg="wrote kubeconfig file /etc/cni/net.d/kmesh-cni-kubeconfig" subsys="cni installer"
time="2024-04-25T13:17:41Z" level=info msg="cni config file: /etc/cni/net.d/10-kindnet.conflist" subsys="cni installer"
time="2024-04-25T13:17:41Z" level=info msg="command Start cni successful" subsys=manager
```

## Verify Installation

After installing Kmesh, verify all components are functioning correctly:

### 1. Verify Core Components

Check Kmesh pod status:

```shell
kubectl get pod -n kmesh-system
NAME          READY   STATUS    RESTARTS   AGE
kmesh-v2frk   1/1     Running   0          18h
```

Check Istio components:

```shell
kubectl get pods -n istio-system
NAME                      READY   STATUS    RESTARTS   AGE
istiod-5659cfbd55-9s92d   1/1     Running   0          18h
```

### 2. Verify Pod Integration

Deploy a test pod and verify Kmesh annotation:

```shell
kubectl describe po <pod-name> | grep Annotations
Annotations:      kmesh.net/redirection: enabled
```

### 3. Verify Service Connectivity

Test service access using the sleep pod:

```shell
kubectl exec sleep-7656cf8794-xjndm -c sleep -- curl -IsS "http://httpbin:8000/status/200"
```

Expected response should show HTTP 200 OK status.

### 4. Verify Kmesh Service Logs

Check for successful initialization messages:

```shell
kubectl logs -n kmesh-system $(kubectl get pods -n kmesh-system -o jsonpath='{.items.metadata.name}')
```

Look for these key messages:

- "bpf Start successful"
- "controller Start successful"
- "dump StartServer successful"
- "command Start cni successful"

### 5. Verify CNI Configuration

Check CNI binary installation:

```shell
ls -l /opt/cni/bin/kmesh-cni
```

Verify CNI configuration:

```shell
cat /etc/cni/net.d/kmesh-cni-kubeconfig
```

## Change Kmesh Start Mode

Kmesh supports two start up modes: `dual-engine` and `kernel-native`.

The specific mode to be used is defined in deploy/charts/kmesh-helm/values.yaml, and we can modify the startup parameters in that file.

```yaml
......
    containers:
      kmeshDaemonArgs: "--mode=dual-engine --enable-bypass=false"
......
```

We can use the following command to make the modification:

```shell
sed -i 's/--mode=dual-engine/--mode=kernel-native/' deploy/charts/kmesh-helm/values.yaml
```

## Deploy the Sample Applications

Kmesh can manage pods in a namespace with a label `istio.io/dataplane-mode=Kmesh`, and meanwhile the pod should have no `istio.io/dataplane-mode=none` label.

```shell
# Enable Kmesh for the specified namespace
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

Apply the following configuration to deploy sleep and httpbin:

```shell
kubectl apply -f ./samples/httpbin/httpbin.yaml

kubectl apply -f ./samples/sleep/sleep.yaml
```

Check the applications status:

```shell
kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
httpbin-65975d4c6f-96kgw                  1/1     Running   0          3h38m
sleep-7656cf8794-8tp9n                    1/1     Running   0          3h38m
```

You can confirm if a pod is managed by Kmesh by looking at the pod's annotation.

```shell
kubectl describe po httpbin-65975d4c6f-96kgw | grep Annotations

Annotations:      kmesh.net/redirection: enabled
```

## Test Service Access

After the applications have been manage by Kmesh, we can test that they can still communicate successfully.

```shell
kubectl exec sleep-7656cf8794-xjndm -c sleep -- curl -IsS "http://httpbin:8000/status/200"

HTTP/1.1 200 OK
Server: gunicorn/19.9.0
Date: Sun, 28 Apr 2024 07:31:51 GMT
Connection: keep-alive
Content-Type: text/html; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Content-Length: 0
```

Note: 10.244.0.21 is the IP of httpbin

## Clean Up

If you don't want to use Kmesh to manage the application anymore, you can remove the labels from the namespace.

```shell
kubectl label namespace default istio.io/dataplane-mode-
kubectl delete pod httpbin-65975d4c6f-96kgw sleep-7656cf8794-8tp9n
kubectl describe pod httpbin-65975d4c6f-h2r99 | grep Annotations

Annotations:      <none>
```

### Delete Kmesh

If you installed Kmesh using any of the Helm options above:

```shell
helm uninstall kmesh -n kmesh-system
kubectl delete ns kmesh-system
```

If you installed Kmesh using yaml:

```shell
kubectl delete -f ./deploy/yaml/
```

To remove the sleep and httpbin applications:

```shell
kubectl delete -f samples/httpbin/httpbin.yaml
kubectl delete -f samples/sleep/sleep.yaml
```

If you installed the Gateway API CRDs, remove them:

```shell
kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl delete -f -
```

# Kmesh Installation Guide for macOS

This guide provides comprehensive instructions for installing and developing Kmesh on macOS systems, including both Intel and Apple Silicon Macs.

## Why This Guide Exists

Kmesh is a high-performance service mesh data plane that relies on eBPF and Linux kernel features. Since macOS doesn't natively support these technologies, macOS users need to run Kmesh in a Linux environment using virtualization or containerization.

## Prerequisites

### System Requirements

- **macOS**: 10.15+ (Intel) or 11.0+ (Apple Silicon)
- **Memory**: 16GB RAM recommended (8GB minimum)
- **Storage**: 64GB available disk space
- **Hardware**: Intel Mac or Apple Silicon (M1/M2/M3/M4)

### Required Software

- **Homebrew** (package manager)
- **UTM** (recommended for Apple Silicon) or **VMware Fusion/Parallels** (Intel)
- **Docker Desktop** (alternative approach)

## Installation Methods

### Method 1: UTM Virtual Machine (Recommended for Apple Silicon)

UTM provides excellent ARM64 Linux virtualization on Apple Silicon Macs with near-native performance.

#### Step 1: Install UTM

```bash

# Install via Homebrew
brew install --cask utm

# Or download directly from https://mac.getutm.app/
```

#### Step 2: Download Ubuntu Server

```bash

# For Apple Silicon (ARM64)
curl -LO https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04-live-server-arm64.iso

# For Intel Macs (x86_64)
curl -LO https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04-live-server-amd64.iso
```

#### Step 3: Create Virtual Machine

1. **Open UTM** and click "Create a New Virtual Machine"
2. **Select Type**:
   - Apple Silicon: Choose **"Virtualize"**
   - Intel Mac: Choose **"Emulate"**
3. **Choose OS**: Select **"Linux"**
4. **Select ISO**: Browse to your downloaded Ubuntu ISO
5. **Configure Resources**:

   ```bash

   Memory: 8GB minimum (16GB recommended)
   CPU Cores: 4-6 cores
   Storage: 64GB (SSD recommended)
   Network: Shared Network
   ```

6. **Enable Hardware Acceleration** (Apple Silicon only)

#### Step 4: Install Ubuntu

1. **Boot the VM** and follow Ubuntu Server installation
2. **Installation Options**:
   - Choose **"Ubuntu Server (minimized)"** to save space
   - Enable **SSH server** during installation
   - Create a user with sudo privileges
   - Skip snap packages for faster installation

3. **Post-Installation Setup**:

  ```bash

   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install essential packages
   sudo apt install -y curl wget vim git htop
   ```

#### Step 5: Install Development Dependencies

```bash
# Install build tools
sudo apt install -y \
    build-essential \
    clang \
    llvm \
    libelf-dev \
    libbpf-dev \
    pkg-config \
    protobuf-compiler \
    libprotobuf-c-dev \
    linux-headers-$(uname -r)

# Install Docker
sudo apt install -y docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes

# Install Go 1.22+
wget https://go.dev/dl/go1.22.0.linux-arm64.tar.gz  # ARM64
# wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz  # Intel

sudo tar -C /usr/local -xzf go1.22.0.linux-*.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
docker --version
```

### Method 2: Docker Desktop (Intel and Apple Silicon)

Docker Desktop provides a consistent containerized development environment across platforms.

#### Step 1: Install Docker Desktop

```bash
# Install via Homebrew
brew install --cask docker

# Or download from https://www.docker.com/products/docker-desktop/
```

#### Step 2: Configure Docker

1. **Start Docker Desktop**
2. **Increase Resources** in Settings:

  ```bash
   Memory: 8GB minimum
   CPU: 4+ cores
   Disk: 64GB
   ```

3. **Enable Kubernetes** (optional, for testing)

#### Step 3: Clone and Build Kmesh

```bash
# Clone repository
git clone https://github.com/kmesh-net/kmesh.git
cd kmesh

# Pull appropriate build image
# For Apple Silicon
docker pull ghcr.io/kmesh-net/kmesh-build-arm:latest

# For Intel Mac
docker pull ghcr.io/kmesh-net/kmesh-build-x86:latest

# Build Kmesh using Docker
make build

# Verify build artifacts
ls out/arm64/  # or out/amd64/ for Intel
```

## Building Kmesh

### Option 1: Build in VM (UTM Method)

```bash
# Inside your Ubuntu VM
git clone https://github.com/kmesh-net/kmesh.git
cd kmesh

# Generate BPF objects
cd bpf/kmesh/bpf2go
go generate ./...
cd ../../..

# Build Kmesh
make build

# Build artifacts location
ls out/arm64/  # or out/amd64/
```

### Option 2: Build with Docker

```bash
# From macOS terminal, in Kmesh directory
make build

# For custom build options
make build BUILD_OPTS="--mode=kernel-native"

# Build Docker image
make docker
```

## Running Tests

### Unit Tests

```bash
# Using Docker (recommended)
./hack/run-ut.sh --docker

# Or inside VM
./hack/run-ut.sh --local

# Run specific tests
go test ./pkg/... -v
```

### BPF Unit Tests

```bash
# Inside VM only (requires kernel headers)
make -C test/bpf_ut run
```

### Integration Tests

```bash
# Requires Kubernetes cluster
go test ./test/e2e/... -v
```

## Setting Up Kubernetes

### Option 1: kind (Kubernetes in Docker)

```bash
# Install kind (inside VM or with Docker Desktop)
# For ARM64
[ $(uname -m) = aarch64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-arm64
# For x86_64  
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64

chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --config=deploy/kind/kind.yaml
```

### Option 2: minikube

```bash
# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-arm64  # ARM64
# curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64  # x86_64

sudo install minikube-linux-* /usr/local/bin/minikube

# Start cluster
minikube start --driver=docker --memory=8192 --cpus=4
```

## Troubleshooting

### Common Build Issues

#### Missing BPF Object Files

```bash
# Error: pattern *.o: no matching files found
cd bpf/kmesh/bpf2go
go generate ./...

# For all BPF programs
find bpf -name "*.go" -path "*/bpf2go/*" -exec dirname {} \; | sort -u | xargs -I {} sh -c 'cd {} && go generate'
```

#### Go Version Issues

```bash
# Error: invalid go version '1.23.0'
# Edit go.mod and change "go 1.23.0" to "go 1.23"
sed -i 's/go 1\.23\.0/go 1.23/' go.mod
```

#### Docker Permission Issues

```bash
# Error: permission denied while connecting to docker socket
sudo usermod -aG docker $USER
# Then logout and login again, or:
newgrp docker
```

#### Missing Dependencies

```bash
# Install missing headers
sudo apt install -y linux-headers-$(uname -r)

# For missing protobuf
sudo apt install -y protobuf-compiler libprotobuf-c-dev

# For missing libelf
sudo apt install -y libelf-dev
```

### Performance Issues

#### Slow VM Performance

```bash
# For UTM on Apple Silicon
# 1. Ensure "Use Apple Virtualization" is enabled
# 2. Allocate maximum CPU cores
# 3. Use QCOW2 format with SSD option
# 4. Enable hardware acceleration

# Check VM resource usage
htop
iostat -x 1
```

#### Slow Docker Builds

```bash
# Increase Docker Desktop resources
# Settings > Resources > Advanced
# Memory: 8GB+, CPU: 4+ cores

# Use build cache
docker system prune -a --volumes  # Clean up first
make build  # Should be faster on subsequent runs
```

### Networking Issues

#### VM Network Connectivity

```bash
# Test connectivity
ping google.com
curl -I https://github.com

# Fix DNS issues
sudo systemctl restart systemd-resolved
```

#### Docker Network Issues

```bash
# Reset Docker network
docker network prune
docker system restart
```

## Development Workflow

### Recommended Setup

1. **Code Editor**: Use VS Code on macOS with Remote-SSH extension
2. **File Synchronization**: Set up shared folders between macOS and VM
3. **Terminal Access**: Use SSH for command-line access to VM

### SSH Setup for VM

```bash
# Get VM IP address (inside VM)
hostname -I

# From macOS terminal
ssh username@<vm-ip>

# Set up SSH key for passwordless access
ssh-copy-id username@<vm-ip>
```

### VS Code Remote Development

```bash
# Install Remote-SSH extension in VS Code
# Connect to VM using Command Palette:
# "Remote-SSH: Connect to Host..."
# Enter: username@<vm-ip>
```

## Advanced Configuration

### Custom Kernel Configuration

If you need specific kernel features:

```bash
# Check current kernel config
cat /boot/config-$(uname -r) | grep -i bpf

# Install kernel with BPF features (usually enabled by default in Ubuntu)
sudo apt install -y linux-generic-hwe-22.04
```

### Cross-Compilation

```bash
# Build for different architectures
export GOARCH=arm64
export GOOS=linux
make build

# Reset to default
unset GOARCH GOOS
```

## Best Practices

### Resource Management

- **UTM VMs**: Allocate 50-70% of available RAM
- **Docker**: Limit resource usage to prevent macOS slowdown
- **Storage**: Use SSD-backed storage for better performance

### Development Efficiency

- **Use tmux/screen**: For persistent terminal sessions
- **Enable SSH keys**: For passwordless VM access  
- **Set up aliases**: For common commands
- **Use Docker volumes**: For persistent data

### Security Considerations

- **Keep VM updated**: Regular security updates
- **Use SSH keys**: Instead of passwords
- **Firewall configuration**: Limit VM network exposure
- **Backup important data**: Regular backups of development work

## Migration from Other Platforms

### From Linux Native Development

- VMs provide near-native Linux experience
- All existing scripts and workflows work unchanged
- Performance overhead is minimal on Apple Silicon

### From Windows WSL

- UTM provides better integration than WSL equivalents
- Full Linux kernel access for eBPF development
- More reliable networking and file system performance

## Community Resources

- **Kmesh GitHub**: https://github.com/kmesh-net/kmesh
- **Documentation**: https://kmesh.net/docs/
- **UTM Support**: https://mac.getutm.app/support/
- **Docker Desktop Docs**: https://docs.docker.com/desktop/mac/

## Contributing

When contributing to Kmesh from macOS:

1. **Test thoroughly**: Verify changes work in Linux environment
2. **Follow conventions**: Use Linux-style paths and commands in documentation
3. **Cross-platform awareness**: Consider impact on other platforms
4. **Documentation updates**: Update relevant guides when adding features

---

**Next Steps**: Once your development environment is set up, proceed to the main [Quick Start Guide](../setup/quick-start.md) to install Kmesh in your Kubernetes cluster.

```bash

This comprehensive guide covers everything a macOS user needs to successfully develop with Kmesh, from initial setup through advanced configuration and troubleshooting.
```
