---
draft: false
linktitle: Quick Start
menu:
  docs:
    parent: setup
    weight: 2
title: Quick Start
toc: true
type: docs
description: >
  This guide lets you quickly install Kmesh.

---
This guide lets you quickly install Kmesh.

## Preparation

Kmesh needs to run on a Kubernetes cluster. Kubernetes 1.26+ are currently supported. We recommend using [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) to quickly provide a Kubernetes cluster (We provide a [document](https://kmesh.net/en/docs/setup/develop_with_kind/) for developing and deploying Kmesh using kind). Of course, you can also use [minikube](https://minikube.sigs.k8s.io/docs/) and other ways to create Kubernetes clusters.
Currently, Kmesh makes use of [istio](https://istio.io/) as its control plane. Before installing Kmesh, please install the Istio control plane. We recommend installing istio ambient mode because Kmesh `dual-engine` mode need it. For details, see [ambient mode istio](https://istio.io/latest/docs/ops/ambient/getting-started/).

You can view the results of istio installation using the following command:

```console
kubectl get po -n istio-system 
NAME                      READY   STATUS    RESTARTS   AGE
istio-cni-node-xbc85      1/1     Running   0          18h
istiod-5659cfbd55-9s92d   1/1     Running   0          18h
ztunnel-4jlvv             1/1     Running   0          18h
```

Note: To use waypoint you need to install the Kubernetes Gateway API CRDs, which don’t come installed by default on most Kubernetes clusters:

```console
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

## Install Kmesh

We offer several ways to install Kmesh

- 1. Install from Helm
  
```console
helm install kmesh ./deploy/helm -n kmesh-system --create-namespace
```

- Alternatively install from Yaml
  
```console
kubectl create namespace kmesh-system
kubectl apply -f ./deploy/yaml/
```

You can confirm the status of Kmesh with the following command:

```console
kubectl get pod -n kmesh-system
NAME          READY   STATUS    RESTARTS   AGE
kmesh-v2frk   1/1     Running   0          18h
```

View the running status of Kmesh service:

```console
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

## Deploy the Sample Applications

Kmesh can manage pods in a namespace with a label `istio.io/dataplane-mode=Kmesh`, and meanwhile the pod should have no `istio.io/dataplane-mode=none` label.

```console
# Enable Kmesh for the specified namespace
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

Apply the following configuration to deploy sleep and httpbin:

```console
kubectl apply -f ./samples/httpbin/httpbin.yaml

kubectl apply -f ./samples/sleep/sleep.yaml
```

Check the applications status:

```console
kubectl get pod 
NAME                                      READY   STATUS    RESTARTS   AGE
httpbin-65975d4c6f-96kgw                  1/1     Running   0          3h38m
sleep-7656cf8794-8tp9n                    1/1     Running   0          3h38m
```

You can confirm if a pod is managed by Kmesh by looking at the pod's annotation.

```console
kubectl describe po httpbin-65975d4c6f-96kgw | grep Annotations

Annotations:      kmesh.net/redirection: enabled
```

## Test Service Access

After the applications have been manage by Kmesh, we can test that they can still communicate successfully.

```console
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

```console
kubectl label namespace default istio.io/dataplane-mode-
kubectl delete pod httpbin-65975d4c6f-96kgw sleep-7656cf8794-8tp9n
kubectl describe pod httpbin-65975d4c6f-h2r99 | grep Annotations

Annotations:      <none>
```

Delete Kmesh:

- If you installed Kmesh using helm

```console
helm uninstall kmesh -n kmesh-system
kubectl delete ns kmesh-system
```

- If you installed Kmesh using yaml:

```console
kubectl delete -f ./deploy/yaml/
```

To remove the sleep and httpbin applications:

```console
kubectl delete -f samples/httpbin/httpbin.yaml
kubeclt delete -f samples/sleep/sleep.yaml
```

If you installed the Gateway API CRDs, remove them:

```console
kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl delete -f -
```
