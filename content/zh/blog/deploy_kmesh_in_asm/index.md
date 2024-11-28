---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "使用 Kmesh 作为阿里云服务网格 ASM Sidecarless 模式数据面"
subtitle: ""
summary: "使用 Kmesh 作为阿里云服务网格 ASM Sidecarless 模式数据面"
authors: [Kuromesi]
tags: [introduce]
categories: [General]
date: 2024-11-27T11:33:00+08:00
lastmod: 2024-11-27T11:33:00+08:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---
# 使用 Kmesh 作为阿里云服务网格 ASM Sidecarless 模式数据面
## 概述
阿里云服务网格 ASM 支持 Sidecar 模式和 Sidecarless 模式。Sidecar 模式，即在每个服务实例旁运行一个代理，是当前最主流、稳定的方案，但这种架构引入了显著的延迟和资源开销。为了解决 Sidecar 模式所带来的延迟和资源消耗，近些年出现了不同的 Sidecarless 模式方案，例如 Istio Ambient，Istio Ambient 通过在每个节点部署 ztunnel，对节点上运行的 Pod 进行四层流量代理，并引入了 waypoint 对七层流量进行代理。虽然 Sidecarless 模式能够降低延迟和资源消耗，但其稳定性以及功能的完善程度仍有待提升。

阿里云服务网格 ASM 当前支持不同的 Sidecarless 模式，例如 Istio Ambient 模式，ACMG 模式以及 Kmesh 等。Kmesh （具体参考 [https://kmesh.net/](https://kmesh.net/) ）是一款基于 ebpf + 可编程内核实现的高性能服务网格数据面软件。通过将流量治理下沉到内核，实现网格内服务通信无需经过代理软件，大大缩减了流量转发路径，有效提升了服务访问的转发性能。

### Kmesh 简介
Kmesh 的双引擎模式（dual-engine）模式使用 eBPF 在内核空间拦截流量，部署 Waypoint Proxy 来处理复杂的 L7 流量管理，从而将 L4 和 L7 的治理在内核空间（eBPF）和用户空间（Waypoint）之间分离。相比 Istio 的 Ambient Mesh，延迟减少了 30%。相较于内核原生模式，双引擎模式无需对内核进行增强，具有更广泛的适用性。

![双引擎模式](images/dual-engine-mode.png)

当前阿里云服务网格ASM支持使用 Kmesh 双引擎模式作为服务网格的数据面之一， 从而实现更加高效的服务治理。 具体来说, 可以使用 ASM 作为控制面，并在 ACK Kubernetes 集群中部署 Kmesh 作为数据面。

## 在阿里云 ACK 集群中部署 Kmesh 并连接 ASM 控制面
### 使用前提
参考阿里云服务网格ASM的官方文档, 创建一个ASM集群实例与ACK Kubernetes 集群, 并将ACK Kubernetes集群添加到ASM集群实例中进行管理。具体操作步骤, 可以参考文档： [添加集群到ASM实例](https://help.aliyun.com/zh/asm/getting-started/add-a-cluster-to-an-asm-instance-1?spm=a2c4g.11186623.help-menu-147365.d_1_2.436356ccEXYKBU)。

### 安装 Kmesh
执行以下命令，将 Kmesh 项目下载到本地。

```shell
git clone https://github.com/kmesh-net/kmesh.git && cd kmesh
```

#### 查看 ASM 控制面 Service 信息
下载完成后，您首先需要执行以下命令，查看当前 ASM 控制面在集群中的 Service 名称，以配置 Kmesh 与 ASM 控制面的连接。

```shell
kubectl get svc -n istio-system | grep istiod

# istiod-1-22-6   ClusterIP   None   <none>   15012/TCP   2d
```

#### 使用 kubectl 安装 Kmesh
您可以使用 kubectl 或者 helm 在ACK Kubernetes集群中安装 Kmesh，但在安装前，请为 Kmesh DaemonSet 添加ClusterId和xdsAddress环境变量，用于 Kmesh 和 ASM 控制面认证与连接。ClusterId为您部署 Kmesh 的 ACK Kubernetes集群 Id，xdsAddress为 ASM 控制面的 Service 信息。

```yaml
# 您可以在以下路径找到该资源定义：
# helm: deploy/charts/kmesh-helm/templates/daemonset.yaml
# kubectl: deploy/yaml/kmesh.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kmesh
  labels:
    app: kmesh
  namespace: kmesh-system
spec:
    spec:
      containers:
        - env:
            # 修改 xdsAddress 为 ASM 控制面 Service
            - name: XDS_ADDRESS
              value: "istiod-1-22-6.istio-system.svc:15012"
            # 添加阿里云 ACK 集群 id
            - name: CLUSTER_ID
              value: "cluster-id"
    ...
```

修改完成后，您可以执行以下命令安装 Kmesh。

```shell
# kubectl
kubectl apply -f deploy/yaml

# helm
helm install kmesh deploy/charts/kmesh-helm -n kmesh-system --create-namespace
```

### 检查 Kmesh 服务状态
安装完毕后，执行以下命令查看 Kmesh 服务启动状态。

```shell
kubectl get pods -A | grep kmesh

# kmesh-system   kmesh-l5z2j   1/1   Running   0    117m
```

执行以下命令查看 Kmesh 服务运行状态。

```shell
kubectl logs -f -n kmesh-system kmesh-l5z2j

# time="2024-02-19T10:16:52Z" level=info msg="service node sidecar~192.168.11.53~kmesh-system.kmesh-system~kmesh-system.svc.cluster.local connect to discovery address istiod.istio-system.svc:15012" subsys=controller/envoy
# time="2024-02-19T10:16:52Z" level=info msg="options InitDaemonConfig successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="bpf Start successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="controller Start successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="command StartServer successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="start write CNI config\n" subsys="cni installer"
# time="2024-02-19T10:16:53Z" level=info msg="kmesh cni use chained\n" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="Copied /usr/bin/kmesh-cni to /opt/cni/bin." subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="kubeconfig either does not exist or is out of date, writing a new one" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="wrote kubeconfig file /etc/cni/net.d/kmesh-cni-kubeconfig" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="command Start cni successful" subsys=manager
```

您可以通过执行以下命令来对指定命名空间启用 Kmesh。

```shell
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

## 流量调度示例
### 部署示例应用和流量调度规则

在为 default 命名空间启用 Kmesh 后，执行以下命令安装示例应用。

```shell
kubectl apply -f samples/fortio/fortio-route.yaml
kubectl apply -f samples/fortio/netutils.yaml
```

执行以下命令查看实例应用运行状态。

```shell
kubectl get pod 
# NAME                         READY   STATUS    RESTARTS   AGE
# fortio-v1-596b55cb8b-sfktr   1/1     Running   0          57m
# fortio-v2-76997f99f4-qjsmd   1/1     Running   0          57m
# netutils-575f5c569-lr98z     1/1     Running   0          67m

kubectl describe pod netutils-575f5c569-lr98z | grep Annotations
# Annotations:      kmesh.net/redirection: enabled
```

当您看到应用 Pod 具有 `kmesh.net/redirection: enabled` 时，代表 Kmesh 转发已经对该 Pod 启用。

执行以下命令查看当前定义的流量调度规则，可以看出，此时定义了 90% 的流量流向 v1 版本的 fortio，10% 的流量流向 v2 版本的 fortio。

```shell
kubectl get virtualservices -o yaml

# apiVersion: v1
# items:
# - apiVersion: networking.istio.io/v1beta1
#   kind: VirtualService
#   metadata:
#     annotations:
#       kubectl.kubernetes.io/last-applied-configuration: |
#         {"apiVersion":"networking.istio.io/v1alpha3","kind":"VirtualService","metadata":{"annotations":{},"name":"fortio","namespace":"default"},"spec":{"hosts":["fortio"],"http":[{"route":[{"destination":{"host":"fortio","subset":"v1"},"weight":90},{"destination":{"host":"fortio","subset":"v2"},"weight":10}]}]}}
#     creationTimestamp: "2024-07-09T09:00:36Z"
#     generation: 1
#     name: fortio
#     namespace: default
#     resourceVersion: "11166"
#     uid: 0a07f283-ac26-4d86-b3bd-ce6aa07dc628
#   spec:
#     hosts:
#     - fortio
#     http:
#     - route:
#       - destination:
#           host: fortio
#           subset: v1
#         weight: 90
#       - destination:
#           host: fortio
#           subset: v2
#         weight: 10
# kind: List
# metadata:
#   resourceVersion: ""
```

### 发起测试流量
您可以通过执行以下命令发起测试流量，您应该可以看到，此时只有大约 10% 的流量流向 v2 版本的 fortio。

```shell
for i in {1..20}; do kubectl exec -it $(kubectl get pod | grep netutils | awk '{print $1}') -- curl -v $(kubectl get svc -owide | grep fortio | awk '{print $3}'):80 | grep "Server:"; done

# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 2
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 2
# < Server: 1
# < Server: 1
```