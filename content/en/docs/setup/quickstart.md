---
draft: false
linktitle: Quick Start
menu:
  docs:
    parent: setup
    weight: 5
title: Quick Start
toc: true
type: docs
description: >
  This guide lets you quickly install Kmesh.

---
This guide lets you quickly install Kmesh.

## Preparation

Kmesh needs to run on a Kubernetes cluster. Kubernetes 1.26, 1.27, 1.28 are currently supported. We recommend using [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) to quickly build a Kubernetes cluster. Of course, you can also use minikube and other ways to create Kubernetes clusters.

Currently, Kmesh connects to the Istio control plane. Before starting Kmesh, install the Istio control plane software. For details, see [istio install guide](https://istio.io/latest/docs/setup/getting-started/#install).

If you want to try out the Kmesh L7 feature as it requires waypoint, you need to install the [ambient mode istio](https://istio.io/latest/docs/ops/ambient/getting-started/).

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

The complete Kmesh capability depends on the OS enhancement. Check whether the execution environment is in the [OS list](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_support.md) supported by Kmesh. For other OS environments, see [Kmesh Compilation and Building](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_compile.md).You can also try the [kmesh image in compatibility mode](https://github.com/kmesh-net/kmesh/blob/main/build/docker/README.md) in other OS environments.For information on various Kmesh images, please refer to the [detailed document](https://github.com/kmesh-net/kmesh/blob/main/build/docker/README.md).

## Install Kmesh

We offer several ways to install kmesh

- Install from Helm
  
```console
helm install kmesh ./deploy/helm -n kmesh-system --create-namespace
```

- Install from Yaml
  
```console
# cd ./deploy/yaml/
kubectl apply -f kmesh.yaml
kubectl apply -f clusterrole.yaml
kubectl apply -f clusterrolebinding.yaml
kubectl apply -f serviceaccount.yaml
kubectl apply -f l7-envoyfilter.yaml
```

You can confirm the status of kmesh with the following command:

```console
kubectl get pod -n kmesh-system
NAME          READY   STATUS    RESTARTS   AGE
kmesh-v2frk   1/1     Running   0          18h
```

View the running status of kmesh service:

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

Similar to istio, kmesh can be used to manage applications in a namespace by adding a label to that namespace.

```console
# Enable Kmesh for the specified namespace
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

Apply the following configuration to create sample applications:

```console
kubectl apply -f -<<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sleep
---
apiVersion: v1
kind: Service
metadata:
  name: sleep
  labels:
    app: sleep
    service: sleep
spec:
  ports:
  - port: 80
    name: http
  selector:
    app: sleep
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sleep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sleep
  template:
    metadata:
      labels:
        app: sleep
    spec:
      terminationGracePeriodSeconds: 0
      serviceAccountName: sleep
      containers:
      - name: sleep
        image: curlimages/curl
        command: ["/bin/sleep", "infinity"]
        imagePullPolicy: IfNotPresent
        volumeMounts:
        - mountPath: /etc/sleep/tls
          name: secret-volume
      volumes:
      - name: secret-volume
        secret:
          secretName: sleep-secret
          optional: true
EOF
```

```console
kubectl apply -f -<<
apiVersion: v1
kind: ServiceAccount
metadata:
  name: httpbin
---
apiVersion: v1
kind: Service
metadata:
  name: httpbin
  labels:
    app: httpbin
    service: httpbin
spec:
  ports:
  - name: http
    port: 8000
    targetPort: 80
  selector:
    app: httpbin
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpbin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpbin
      version: v1
  template:
    metadata:
      labels:
        app: httpbin
        version: v1
    spec:
      serviceAccountName: httpbin
      containers:
      - image: docker.io/kong/httpbin
        imagePullPolicy: IfNotPresent
        name: httpbin
        ports:
        - containerPort: 80
EOF
```

Check sample applications status:

```console
kubectl get pod 
NAME                                      READY   STATUS    RESTARTS   AGE
httpbin-65975d4c6f-96kgw                  1/1     Running   0          3h38m
sleep-7656cf8794-8tp9n                    1/1     Running   0          3h38m
```

You can determine if a pod is managed by kmesh by looking at the pod's annotation.

```console
kubectl describe po httpbin-65975d4c6f-96kgw
Name:             httpbin-65975d4c6f-96kgw
Namespace:        default
Priority:         0
Service Account:  httpbin
Node:             kmesh-control-plane/172.18.0.2
Start Time:       Fri, 26 Apr 2024 11:54:03 +0800
Labels:           app=httpbin
                  pod-template-hash=65975d4c6f
                  version=v1
Annotations:      kmesh.net/redirection: enabled
Status:           Running
IP:               10.244.0.21
IPs:
  IP:           10.244.0.21
Controlled By:  ReplicaSet/httpbin-65975d4c6f
```

## Test Sample Applications

After the applications have been manage by kmesh, we need to test that they are still working properly.

```console
k exec deploy/sleep -- curl -s 10.244.0.21 | grep -o "<title>.*</title>"
<title>httpbin.org</title>
```

Note: 10.244.0.21 is the IP of httpbin

## Clean Up

If you don't want to use kmesh to govern the application anymore, you can delete the labels on the namespace and restart the pod.

```console
kubectl label namespace default istio.io/dataplane-mode-
kubectl delete po httpbin-65975d4c6f-96kgw sleep-7656cf8794-8tp9n
kubectl describe po httpbin-65975d4c6f-h2r99

Name:             httpbin-65975d4c6f-h2r99
Namespace:        default
Priority:         0
Service Account:  httpbin
Node:             kmesh-control-plane/172.18.0.2
Start Time:       Fri, 26 Apr 2024 15:49:38 +0800
Labels:           app=httpbin
                  pod-template-hash=65975d4c6f
                  version=v1
Annotations:      <none>
Status:           Running
IP:               10.244.0.28
```

Delete kmesh:

```console
kubectl delete daemonset -n kmesh-system kmesh
kubectl delete ns kmesh-system
```

To remove the sleep and notsleep applications:

```console
kubectl delete svc httpbin sleep
kubectl delete deploy httpbin sleep
kubectl delete serviceaccount httpbin sleep
```
If you installed the Gateway API CRDs, remove them:

```console
kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl delete -f -
```
