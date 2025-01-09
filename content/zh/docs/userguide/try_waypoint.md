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

如果想使用Kmesh双引擎模式的七层治理功能，请参考本文档安装waypoint。

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

Waypoint可以在三个粒度级别使用：命名空间、服务和Pod。您还可以在一个命名空间内以不同粒度安装多个waypoint。 以下是我们将学习如何为不同粒度部署不同waypoint的方法。我们可以使用`kmeshctl waypoint`子命令生成waypoint。

要配置命名空间、服务或Pod waypoint，请添加带有waypoint名称的`istio.io/use-waypoint`标签。 我们还可以使用`--image`指定自定义的waypoint镜像，默认情况下，这个镜像为ghcr.io/kmesh-net/waypoint:{VERSION}。

- 为特定服务配置waypoint:

    为服务reviews部署waypoint reviews-svc-waypoint，这样任何由Kmesh管理的客户端访问reviews的流量都会通过waypoint代理进行处理。

    ```bash
    [root@ ~]# kmeshctl waypoint apply --for service -n default --name=reviews-svc-waypoint

    waypoint default/reviews-svc-waypoint applied
    ```

    为服务打上标签，使用刚创建的waypoint

    ```bash
    [root@ ~]# $ kubectl label service reviews istio.io/use-waypoint=reviews-svc-waypoint

    service/reviews labeled
    ```
    Waypoint 运行后, Kmesh 七层治理就绪!

    ```bash
    [root@ ~]# kubectl get pods
    NAME                                      READY   STATUS    RESTARTS   AGE
    details-v1-cdd874bc9-xcdnj                1/1     Running   0          30m
    productpage-v1-5bb9985d4d-z8cws           1/1     Running   0          30m
    ratings-v1-6484d64bbc-pkv6h               1/1     Running   0          30m
    reviews-svc-waypoint-8cb4bdbf-9d5mj       1/1     Running   0          30m
    reviews-v1-598f9b58fc-2rw7r               1/1     Running   0          30m
    reviews-v2-5979c6fc9c-72bst               1/1     Running   0          30m
    reviews-v3-7bbb5b9cf7-952d8               1/1     Running   0          30m
    sleep-5577c64d7c-n7rxp                    1/1     Running   0          30m
    ```
- 为特定命名空间配置waypoint:

    为default命名空间部署一个名为waypoint的航路点。通过指定`--enroll-namespace`，该命名空间将被打上标签`istio.io/use-waypoint=waypoint`。
    ```bash
    [root@ ~]# kmeshctl waypoint apply -n default --enroll-namespace

    waypoint default/default-ns-waypoint applied
    ```

- 为特定pod配置waypoint:

    为reviews-v2-5979c6fc9c-72bst Pod部署一个名为reviews-v2-pod-waypoint的航路点。

    ```bash
    [root@ ~]# kmeshctl waypoint apply -n default --name reviews-v2-pod-waypoint --for workload
    waypoint default/reviews-v2-pod-waypoint applied
    # Label the `reviews-v2` pod to use `reviews-v2-pod-waypoint` waypoint.
    [root@ ~]# kubectl label pod reviews-v2-5979c6fc9c-72bst istio.io/use-waypoint=reviews-v2-pod-waypoint
    pod/reviews-v2-5b667bcbf8-spnnh labeled
    ```

### 应用基于权重的路由

配置流量路由，将90%的请求发往`reviews v1`并且将其余的10%发往`reviews v2`：

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

确认大概90%的流量发往了`reviews v1`

```bash
[root@ ~]# kubectl exec deploy/sleep -- sh -c "for i in \$(seq 1 100); do curl -s http://productpage:9080/productpage | grep reviews-v.-; done"
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v2-64776cb9bd-grnd2</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        ...
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v2-64776cb9bd-grnd2</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v1-57c85f47fb-n9llm</u>
        <u>reviews-v2-64776cb9bd-grnd2</u> 
```

### 理解原理

由于`default`命名空间已经被Kmesh接管并且我们已经为service account `bookinfo-reviews`部署了waypoint，因此所有发往service `reviews`的流量都会被Kmesh转发给waypoint。Waypoint则会根据我们设置的路由规则将90%的流量发往`reviews v1`并且将其余的10%流量发往`reviews v2`。

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
