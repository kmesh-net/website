---
title: Quick Start
description: This guide lets you quickly install Kmesh.
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quick Start Guide

This guide lets you quickly install Kmesh.

## Prerequisites

Before installing Kmesh, ensure your environment meets the following requirements:

| Requirement | Version | Notes                                       |
| ----------- | ------- | ------------------------------------------- |
| Kubernetes  | 1.26+   | Tested on 1.26-1.29                         |
| Istio       | 1.22+   | Tested on 1.22-1.25 (ambient mode required) |
| Helm        | 3.0+    | For helm installation                       |
| Memory      | 4GB+    | Recommended minimum                         |
| CPU         | 2 cores | Recommended minimum                         |
| Kernel      | 5.10+   | For eBPF support                            |

## Preparation

### 1. Kubernetes Cluster Preparation

Kmesh requires a Kubernetes cluster (v1.26+). Choose one of the following methods to prepare your cluster:

<Tabs groupId="cluster-type">
<TabItem value="kind" label="kind (Recommended)" default>

We recommend using [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) for quick local development and testing. See our [Developing with kind](develop-with-kind/) guide for detailed Kmesh deployment instructions.

</TabItem>
<TabItem value="minikube" label="minikube">

You can use [minikube](https://minikube.sigs.k8s.io/docs/) to create your local Kubernetes cluster. Ensure you configure sufficient CPU (2+ cores) and Memory (4GB+).

</TabItem>
<TabItem value="existing" label="Existing Cluster">

If you are using an existing managed or bare-metal Kubernetes cluster, ensure your kernel version is 5.10+ for eBPF support.

</TabItem>
</Tabs>

### 2. Istio Control Plane Installation

Kmesh utilizes [Istio](https://istio.io/) as its control plane. Choose your preferred Istio installation method:

<Tabs groupId="istio-install">
<TabItem value="ambient" label="Istio Ambient Mode (Recommended)" default>

We recommend installing Istio in ambient mode, as Kmesh's `dual-engine` mode requires it. For complete details, see the [Istio Ambient Mode Getting Started Guide](https://istio.io/latest/docs/ops/ambient/getting-started/).

Verify your Istio installation using the following command:

```shell
kubectl get po -n istio-system
NAME                      READY   STATUS    RESTARTS   AGE
istio-cni-node-xbc85      1/1     Running   0          18h
istiod-5659cfbd55-9s92d   1/1     Running   0          18h
ztunnel-4jlvv             1/1     Running   0          18h
```

> **Note**: To use Waypoints, you need to install the Kubernetes Gateway API CRDs, which do not come installed by default on most Kubernetes clusters:

```shell
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

</TabItem>
<TabItem value="istiod" label="Istiod Only (Minimal)">

Installing ambient mode via the standard steps installs additional components like `ztunnel`. If you prefer a minimal installation with only `istiod` as the control plane for Kmesh:

**1. Install Istio CRDs**

```shell
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
kubectl create namespace istio-system
helm install istio-base istio/base -n istio-system
```

**2. Install Istiod**

```shell
helm install istiod istio/istiod --namespace istio-system --version 1.24.0 --set pilot.env.PILOT_ENABLE_AMBIENT=true
```

> **Important:** You must set `pilot.env.PILOT_ENABLE_AMBIENT=true`, otherwise Kmesh will not be able to establish gRPC connections with Istiod. If you plan to use the Waypoint feature, ensure you use Istio version 1.23 ~ 1.25.

**3. Install Gateway API CRDs**

```shell
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

</TabItem>
</Tabs>

## Install Kmesh

We offer several ways to install Kmesh. Select the method that best fits your environment:

<Tabs groupId="install-method">
<TabItem value="oci" label="OCI Registry (Recommended)" default>

You can install Kmesh directly from the GitHub Container Registry without cloning the repository:

```shell
helm install kmesh oci://ghcr.io/kmesh-net/kmesh-helm --version x.y.z -n kmesh-system --create-namespace
```

- Replace `x.y.z` with your desired version from [kmesh-helm packages](https://github.com/orgs/kmesh-net/packages/container/package/kmesh-helm):
  - For stable releases, use a version like `v1.1.0`.
  - For pre-releases, use a version like `v1.1.0-alpha`.
  - Omit the `--version` flag to install the latest version (not recommended for production).

</TabItem>
<TabItem value="helm" label="Local Helm Chart">

If you have cloned the Kmesh repository locally:

```shell
helm install kmesh ./deploy/charts/kmesh-helm -n kmesh-system --create-namespace
```

</TabItem>
<TabItem value="archive" label="Helm Chart Archive">

Download the `kmesh-helm-<version>.tgz` archive from [GitHub Releases](https://github.com/kmesh-net/kmesh/releases). Replace `<version>` in the command below with the version you downloaded (e.g., `v1.1.0`):

```shell
helm install kmesh ./kmesh-helm-<version>.tgz -n kmesh-system --create-namespace
```

</TabItem>
<TabItem value="yaml" label="YAML Manifests">

If you prefer using standard Kubernetes manifests directly from a local clone:

```shell
kubectl create namespace kmesh-system
kubectl apply -f ./deploy/yaml/
```

</TabItem>
</Tabs>

## Verify Installation

After installing Kmesh, verify that all components are functioning correctly by checking the core components, pod integration, logs, and CNI configuration:

<Tabs groupId="verify-steps">
<TabItem value="core" label="1. Core Components" default>

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

</TabItem>
<TabItem value="integration" label="2. Pod Integration">

Deploy a test pod and verify the Kmesh redirection annotation:

```shell
kubectl describe po <pod-name> | grep Annotations
Annotations:      kmesh.net/redirection: enabled
```

</TabItem>
<TabItem value="logs" label="3. Service Logs">

Check for successful initialization messages in the Kmesh daemon logs:

```shell
kubectl logs -n kmesh-system $(kubectl get pods -n kmesh-system -o jsonpath='{.items[0].metadata.name}')
```

Look for these key startup messages:

- `bpf Start successful`
- `controller Start successful`
- `dump StartServer successful`
- `command Start cni successful`

</TabItem>
<TabItem value="cni" label="4. CNI Configuration">

Check the CNI binary installation:

```shell
ls -l /opt/cni/bin/kmesh-cni
```

Verify the CNI kubeconfig:

```shell
cat /etc/cni/net.d/kmesh-cni-kubeconfig
```

</TabItem>
</Tabs>

## Change Kmesh Start Mode

Kmesh supports two startup modes: `dual-engine` and `kernel-native`.

The specific mode to be used is defined in `deploy/charts/kmesh-helm/values.yaml`, and we can modify the startup parameters in that file:

```yaml
# ......
containers:
  kmeshDaemonArgs: "--mode=dual-engine --enable-bypass=false"
# ......
```

We can use the following command to make the modification:

```shell
sed -i 's/--mode=dual-engine/--mode=kernel-native/' deploy/charts/kmesh-helm/values.yaml
```

## Deploy the Sample Applications

Kmesh manages pods in namespaces labeled with `istio.io/dataplane-mode=Kmesh`, provided the pod does not have the `istio.io/dataplane-mode=none` label.

```shell
# Enable Kmesh for the specified namespace
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

Apply the following configuration to deploy sample `sleep` and `httpbin` applications:

```shell
kubectl apply -f ./samples/httpbin/httpbin.yaml
kubectl apply -f ./samples/sleep/sleep.yaml
```

Check the status of the applications:

```shell
kubectl get pod
NAME                                      READY   STATUS    RESTARTS   AGE
httpbin-65975d4c6f-96kgw                  1/1     Running   0          3h38m
sleep-7656cf8794-8tp9n                    1/1     Running   0          3h38m
```

You can confirm if a pod is managed by Kmesh by checking the pod's annotations:

```shell
kubectl describe po -l app=httpbin | grep Annotations
Annotations:      kmesh.net/redirection: enabled
```

## Test Service Access

After the applications are managed by Kmesh, test that they can communicate successfully:

```shell
kubectl exec $(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}') -c sleep -- curl -IsS "http://httpbin:8000/status/200"
HTTP/1.1 200 OK
Server: gunicorn/19.9.0
Date: Sun, 28 Apr 2024 07:31:51 GMT
Connection: keep-alive
Content-Type: text/html; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Content-Length: 0
```

> **Note**: `10.244.0.21` is the example IP of the `httpbin` pod.

## Clean Up

If you no longer wish to use Kmesh to manage applications in the namespace, you can remove the label and recreate the pods:

```shell
kubectl label namespace default istio.io/dataplane-mode-
kubectl delete pod -l app=httpbin
kubectl delete pod -l app=sleep
kubectl describe pod -l app=httpbin | grep Annotations
Annotations:      <none>
```

### Delete Kmesh

Select the uninstallation method corresponding to how you installed Kmesh:

<Tabs groupId="install-method">
<TabItem value="oci" label="OCI Registry" default>

If you installed Kmesh from the OCI registry:

```shell
helm uninstall kmesh -n kmesh-system
kubectl delete ns kmesh-system
```

</TabItem>
<TabItem value="helm" label="Local Helm Chart">

If you installed Kmesh using the local Helm chart:

```shell
helm uninstall kmesh -n kmesh-system
kubectl delete ns kmesh-system
```

</TabItem>
<TabItem value="archive" label="Helm Chart Archive">

If you installed Kmesh using the Helm chart archive:

```shell
helm uninstall kmesh -n kmesh-system
kubectl delete ns kmesh-system
```

</TabItem>
<TabItem value="yaml" label="YAML Manifests">

If you installed Kmesh using YAML manifests:

```shell
kubectl delete -f ./deploy/yaml/
```

</TabItem>
</Tabs>

To remove the sample `sleep` and `httpbin` applications:

```shell
kubectl delete -f samples/httpbin/httpbin.yaml
kubectl delete -f samples/sleep/sleep.yaml
```

If you installed the Gateway API CRDs, remove them:

```shell
kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl delete -f -
```
