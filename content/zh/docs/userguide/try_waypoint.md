---
draft: false
linktitle: Waypoint尝鲜
menu:
  docs:
    parent: userguide
    weight: 2
title: Waypoint尝鲜
toc: true
type: docs

---

### 准备

1. 部署Kmesh：

请参考[快速开始](https://kmesh.net/zh/docs/quickstart/)

2. 部署示例应用：

使用Kmesh接管default命名空间

```bash
[root@ ~]# kubectl label namespace default istio.io/dataplane-mode=Kmesh
[root@ ~]# kubectl get namespace -L istio.io/dataplane-mode
NAME                 STATUS   AGE   DATAPLANE-MODE
default              Active   13d   Kmesh
istio-system         Active   13d   
kmesh-system         Active   27h   
kube-node-lease      Active   13d   
kube-public          Active   13d   
kube-system          Active   13d   
local-path-storage   Active   13d   
```
 
3. 部署bookinfo：

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
```

4. 部署sleep作为curl client：

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/sleep/sleep.yaml
[root@ ~]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
details-v1-5f4d584748-bz42z      1/1     Running   0          72s
productpage-v1-564d4686f-2rjqc   1/1     Running   0          72s
ratings-v1-686ccfb5d8-dnzkf      1/1     Running   0          72s
reviews-v1-86896b7648-fqm4z      1/1     Running   0          72s
reviews-v2-b7dcd98fb-nn42q       1/1     Running   0          72s
reviews-v3-5c5cc7b6d-q4r5h       1/1     Running   0          72s
sleep-9454cc476-86vgb            1/1     Running   0          62s
```

5. 测试boofinfo按预期运行：

```bash
[root@ ~]# kubectl exec deploy/sleep -- curl -s http://productpage:9080/ | grep -o "<title>.*</title>"
<title>Simple Bookstore App</title>
```

6. 部署waypoint：

为service account `bookinfo-reviews` 部署一个waypoint，这样所有发往service `reviews` 的流量都将被这个waypoint proxy接管

```bash
[root@ ~]# istioctl x waypoint apply --service-account bookinfo-reviews
[root@ ~]# kubectl get pods
NAME                                               READY   STATUS    RESTARTS   AGE
bookinfo-reviews-istio-waypoint-5d544b6d54-v5tc9   1/1     Running   0          4s
details-v1-5f4d584748-bz42z                        1/1     Running   0          4m35s
productpage-v1-564d4686f-2rjqc                     1/1     Running   0          4m35s
ratings-v1-686ccfb5d8-dnzkf                        1/1     Running   0          4m35s
reviews-v1-86896b7648-fqm4z                        1/1     Running   0          4m35s
reviews-v2-b7dcd98fb-nn42q                         1/1     Running   0          4m35s
reviews-v3-5c5cc7b6d-q4r5h                         1/1     Running   0          4m35s
sleep-9454cc476-86vgb                              1/1     Running   0          4m25s
```

用Kmesh自定义的镜像替换waypoint的原生镜像。基于istio-proxy，Kmesh增加了一个名为[Kmesh_tlv](https://github.com/kmesh-net/waypoint/tree/master/source/extensions/filters/listener/kmesh_tlv)的自定义listener filter，它会解析Kmesh编码的自定义TLV协议，从中获取目标地址以及元数据，从而能够连接L4和L7

```bash
[root@ ~]# kubectl get gateways.gateway.networking.k8s.io
NAME               CLASS            ADDRESS         PROGRAMMED   AGE
bookinfo-reviews   istio-waypoint   10.96.207.125   True         8m36s
```

在`bookinfo-reviews` gateway的annotations当中添加sidecar.istio.io/proxyImage: ghcr.io/kmesh-net/waypoint-{arch}:v0.3.0，将{arch}转换为所在宿主机的架构，当前可选的取值为x86和arm。在gateway pod重启之后，Kmesh就具备L7能力了！

### 应用基于权重的路由

配置流量路由，将90%的请求发往`reviews` v1并且将其余的10%发往`reviews` v2

```bash
[root@ ~]# kubectl apply -f -<<EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  trafficPolicy:
    loadBalancer:
      simple: RANDOM
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: v3
    labels:
      version: v3
EOF
```

确认大概90%的流量发往了`reviews` v1

```bash
[root@ ~]# kubectl exec deploy/sleep -- sh -c "for i in \$(seq 1 100); do curl -s http:productpage:9080/productpage | grep reviews-v.-; done"
```

### 理解原理

由于`default`命名空间已经被Kmesh接管并且我们已经为service account `bookinfo-reviews`部署了waypoint，因此所有发往service `reviews`的流量都会被Kmesh转发给waypoint。Waypoint则会根据我们设置的路由规则将90%的流量发往`reviews` v1并且将其余的10%流量发往`reviews` v2。

### 清理

1. 移除应用路由规则:

```bash
[root@ ~]# kubectl delete virtualservice reviews
[root@ ~]# kubectl delete destinationrules reviews
```

2. 移除waypoint：

```bash
[root@ ~]# istioctl x waypoint delete --service-account bookinfo-reviews
```

3. 移除示例应用：

```bash
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/sleep/sleep.yaml
```
