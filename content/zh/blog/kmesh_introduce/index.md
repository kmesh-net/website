---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Kmesh: 高性能服务网格数据面"
subtitle: ""
summary: "基于ebpf + 可编程内核实现的sidecarless服务网格，服务转发时延降低60%+"
authors: [Kmesh Admin]
tags: [intruduce]
categories: [Gerneral]
date: 2023-07-08T10:05:09+08:00
lastmod: 2023-07-08T10:05:09+08:00
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
# 高性能服务网格数据面Kmesh

Kmesh是基于可编程内核实现的高性能服务网格数据面Kmesh。本文从服务网格讲起，带您一起了解Kmesh的前世今生。

# 什么是服务网格

服务网格是2016年由开发Linkerd软件的buoyant公司提出，Willian Morgan（Linkerd 的CEO）给出了`Service Mesh`的最初定义：

> A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It’s responsible for the reliable delivery of requests through the complex topology of services that comprise a modern, cloud native application. In practice, the service mesh is typically implemented as an array of lightweight network proxies that are deployed alongside application code, without the application needing to be aware.

翻译过来，可简单描述为：服务网格（service mesh）是处理服务间通信的基础设施层。通过网络代理阵列的形式，为现代云原生应用提供透明、可靠的网络通信。

服务网格本质是解决微服务间如何更好通信的问题，通过负载均衡、灰度路由、熔断限流等治理规则，合理编排流量，实现最大化的集群服务能力，是服务治理演进的产物；

我们将服务治理的演进过程分为三代，并将其简单对比；从演进过程可以看出：服务治理能力逐步从业务中解耦，下沉到基础设施；

![image](images/servicemesh-evolution.png)
服务网格作为处理服务间通信的基础设施层，有效弥补了k8s在微服务治理方面的短板，作为云原生下一代技术，已成为云上基础设施的关键部件。

作为近年来的风口技术方向，业界诞生了很多服务网格软件，如：Linkerd、Istio、Consul Connect、Kuma等；他们在软件架构上大同小异，以Istio为例（最受欢迎的服务网格项目之一），展示服务网格的基本架构：
![image](images/istio-arch.png)

以k8s集群为例，Pod实例创建时，服务网格软件在Pod中透明的创建一个Proxy容器（也称sidecar，Istio中默认的sidecar软件是Envoy）；Pod通信的基本流程如下：

* 流量通过iptables规则透明劫持到Pod内的代理组件；
* 代理组件根据请求完成流量治理逻辑（如：熔断、路由、负载均衡等），找到要通信的对端服务实例，并转发消息；
* 对端Pod内的代理组件劫持外部流量，并做基本的流量治理逻辑（如：限流等），再将流量转发给Pod；
* Pod处理完成后，响应报文按原路径返回到请求Pod；

# 服务网格数据面的问题挑战

由上文可知，服务网格通过在数据面引入代理层，实现对应用透明的服务治理。然而，这么做不是毫无代价的，引入的代理层势必会造成服务通信的时延上升，性能下降。

以Isito官网提供的数据为例，集群规模下，微服务间数据面单跳通信时延增加2.65ms；要知道微服务集群下，一次外部访问，在集群内部往往会经过多次微服务间的调用，网格带来的时延开销是很大的；随着服务网格被越来越多应用，代理架构引入的额外时延开销已成为服务网格面临的关键问题。

![image](images/istio-performance.png)

为此，我们测试了http服务L7负载均衡的场景，对网格数据面的通信做了性能打点，耗时占比如下：

![image](images/istio-perf-analysis.png)

从网格流量的细化分析看，微服务互通，从原来1次建链变成3次建链，从原来2次进出协议栈，变成6次进出协议栈；耗时主要集中在多次的数据拷贝、建链通信、上下文调度切换等，真正做流量治理的开销占比却不大。

那么问题来了，能否在保持网格对应用透明治理的前提下，降低网格的时延开销。

# 高性能服务网格数据面Kmesh

基于以上性能分析，我们针对网格数据面性能做了两阶段的优化；

## Sockmap：基于sockmap加速网格数据面

sockmap是linux在4.14引入的一个ebpf特性，可实现node内socket间数据流的重定向，而无需经过复杂的内核协议栈，优化链路上socket间的数据转发性能；

针对服务网格的场景，Pod内业务容器与本地代理组件之间默认走了完整的内核协议栈，这段开销完全可以通过sockmap来优化；如下图所示：

![image](images/sockmap.png)

sockmap加速的基本步骤：

* 建链流程中挂载ebpf程序（ebpf prog type：BPF_PROG_TYPE_SOCK_OPS），拦截所有的TCP建链动作；

  * BPF_SOCK_OPS_ACTIVE_ESTABLISHED_CB状态添加client侧sockmap记录；
  * BPF_SOCK_OPS_PASSIVE_ESTABLISHED_CB状态添加server侧sockmap记录；

  将通信双方正反两端的socket信息存储到sockmap表中；

* sendmsg流程中挂载ebpf程序（ebpf prog type：BPF_PROG_TYPE_SK_MSG），拦截发送消息的动作；

  * 根据当前socket信息查找sockmap表，关联找到对端的socket信息，将流量直接重定向到对端socket的接收队列；

基于sockmap加速服务网格数据面，实测60长链接场景下，服务访问的平均时延相比原生网格降低了10%~15%。

![image](images/sockmap-performance.png)

sockmap是当前比较常见的优化服务网格数据面的方案，但从效果看降低15%的通信延时并没有真正解决网格时延性能差的问题；

## Offload：基于可编程内核，将流量治理下沉OS

根据上文的性能打点可知，网格引入的额外开销中，真正完成流量治理工作的开销占比并不高，大部分耗时都浪费在了把流量引到代理组件上；那么，流量治理能不能不要经过这个代理组件，随着流量收发的路径随路完成呢？网络通信天然要经过内核协议栈，如果协议栈具备流量治理的能力，是不是就可以解决这个问题了。

Kmesh就是我们提出的高性能服务网格数据面，基于可编程内核，将流量治理下沉到OS，网格数据面不再经过代理组件，服务互通从3跳变成1跳，真正随路完成治理工作；微服务互通的流量路径如下所示：

![image](images/istio-kmesh-datapath-compare.png)

Kmesh的软件架构：

![image](images/kmesh-performance.png)
Kmesh的主要部件包括：

* kmesh-controller：
  kmesh管理程序，负责Kmesh生命周期管理、XDS协议对接、观测运维等功能；
* kmesh-api：
  kmesh对外提供的api接口层，主要包括：xds转换后的编排API、观测运维通道等；
* kmesh-runtime：
  kernel中实现的支持L3~L7流量编排的运行时；
* kmesh-orchestration：
  基于ebpf实现L3~L7流量编排，如路由、灰度、负载均衡等；
* kmesh-probe：
  观测运维探针，提供端到端观测能力；

我们部署了Istio网格环境，通过使用不同的网格数据面软件（Envoy/Kmesh），针对http服务L7负载均衡的场景，对网格数据面性能做了对比测试（测试工具：fortio）：

![image](images/istio-kmesh-datapath-compare.png)

可以看到，基于Kmesh，网格内服务互通性能相比Istio原生数据面（Envoy）有5倍提升，同时我们也测试了非网格下，基于k8s的服务互通性能，与Kmesh的性能数据几乎相当，进一步佐证了Kmesh数据面时延性能。（测试场景为实验室环境下的L7负载均衡，真实治理场景下的性能效果不会这么理想，初步评估会比Istio提升2~3倍）

# 总结

服务网格作为云原生的下一代技术，为应用提供透明服务治理的同时，因其代理架构引入额外时延开销，已成为网格应用推广的关键；Kmesh从OS视角，提出了一种基于可编程内核的服务网格数据面，通过将流量治理能力下沉OS，大幅提升网格数据面性能，为网格数据面的发展提供了一种全新思路。

# refrence

[https://linkerd.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one](https://linkerd.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one)

[https://istio.io/latest/docs/ops/deployment/architecture](https://istio.io/latest/docs/ops/deployment/architecture)

[https://istio.io/v1.16/docs/ops/deployment/performance-and-scalability/#performance-summary-for-istio-hahahugoshortcode-s0-hbhb](https://istio.io/v1.16/docs/ops/deployment/performance-and-scalability/#performance-summary-for-istio-hahahugoshortcode-s0-hbhb)



