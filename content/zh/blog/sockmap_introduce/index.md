---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "ebpf提升ServiceMesh服务体验的探索"
subtitle: ""
summary: "基于sockmap实现服务网格数据面转发时延降低15%"
authors: [Kmesh Admin]
tags: [intruduce]
categories: [Gerneral]
date: 2023-07-01T09:47:24+08:00
lastmod: 2023-07-01T09:47:24+08:00
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
## 服务网格的前世今生

早期的微服务架构上存在着服务发现、负载均衡、授权认证等各种各样的难题与挑战。起初微服务践行者们大多自己实现这么一套分布式通信系统来应对这些挑战，但这无疑造成了业务功能的冗余，解决此问题的方法就是将共有的分布式系统通信代码提取出来设计成一套框架，以框架库的方式供程序调用。但这个看似完美的方法却存在着几个致命的弱点:

- 框架大部分对业务来说是侵入式修改，需要开发者学习如何使用框架
- 框架无法做到跨语言使用
- 处理复杂项目框架库版本的依赖兼容问题非常棘手，框架库的升级经常导致业务的被迫升级。

随着微服务架构的发展，以 Linkeerd/Envoy/NginxMesh 为代表的 sidecar 代理模式应运而生，这就是第一代的 serviceMesh。它作为一个基础设施层，与业务进程完全解耦，和业务一起部署，接管业务件之间的通信，将网络数据收发单独抽象出一层，在这层集中处理了服务发现、负载均衡、授权认证等分布式系统所需要的功能，实现网络拓扑中请求的可靠传输，较为完美的解决了微服务框架库中的问题。

![Image 1](images/1.png)

但在软件开发领域没有万能的银弹。ServiceMesh 带来了这么多便利的同时，也不可避免的存在着一些问题。传统方式下，客户端到服务端的消息仅需进出一次内核协议栈即可完成消息传递，但在 sidecar 模式中，一般选择使用内核的 iptables 能力劫持业务流量，这就造成了业务数据需要多次进出内核协议栈，导致业务时延增大，吞吐量变低。

![Image 2](images/2.png)

openEuler 21.03 版本下进行 sidecar（envoy）模式基准测试发现，with-envoy 与 non-envoy 模式下，时延有大幅增加

![Image 3](images/3.png)

## 利用 ebpf 能力加速 ServiceMesh 

有没有什么方法可以在享受 ServiceMesh 提供便利服务的基础上同时降低并消除网络时延带来的影响呢？在这里就不得不说下 ebpf 技术，ebpf 是在 kernel 中的一项革命性技术，旨在提供不修改内核代码或加载内核模块的基础上更加安全有效的扩展内核的能力。使用 ebpf 能力短接内核网络协议栈来降低网络时延，提升 ServiceMesh 的使用体验，这是目前业界通用的做法。

![Image 4](images/4.png)

为了实现短接内核网络协议栈的目标，我们需要使用到 ebpf 提供的两种能力，分别是：sockops 与 socket redirection，openEuler 使用的 kernel 版本为 5.10，已经支持了 ebpf 的这两种能力。

- sockops 提供了在 tcp socket 创建连接时将 socket 使用 key(一般是四元组)标识后保存在 sockmap 数据结构中的能力
- socket redirection 在传输 tcp 数据时支持使用 key 去 sockmap 中引用 socket，命中后可直接将数据转发到此 socket 中
- 对于未在 sockmap 中找到的 socket，正常将数据包通过内核网络协议栈发送出去

将这些能力结合在一起，就可以在不经过内核网络协议栈的前提下直接将数据包转发到对应的 socket 上，完成数据的一次传输，降低在内核网络协议栈上的时间消耗。

![Image 5](images/5.png)

在 tcp socket 建立连接的过程中，实际上有两次连接建立的过程，我们通常称之为正向连接与反向连接。因正反向连接在建连过程中均需要通过 iptables 信息来获取实际的 ip 地址与端口号，openEuler 在 iptables 的工作原理上新增 helper 函数，将获取对端信息的能力下沉到内核中，可以在 ebpf 函数中主动获取到 iptables 转换过的地址。这样我们可以建立一个辅助 map 用于存放正反向连接的对应关系并在 socket redirection 转发时先从辅助 map 中寻找到对端的连接信息，成功找到对端的连接信息后再进行 socket 转发动作。原理如下图

![Image 6](images/6.png)

通过 sockops 能力的加速，我们在 openEuler21.03 上实测的结果如下：

- 测试环境：openEuler-21.03 / 5.10.0-4.17.0.28.oe1.x86_64
- 组网：fortio-envoy-envoy:80-fortio_server:80
- qps 提升约为 18%，平均时延提升 15%

![Image 7](images/7.png)



## 下一步的工作：彻底消除 ServiceMesh 性能损耗

尽管ServiceMesh的sockmap实现了显著的加速，但与不使用ServiceMesh相比，仍有相当大的差距。这主要是由于网格代理架构引入了大量的延迟开销。要完全消除服务网格引入的性能影响，在体系结构级别进行优化至关重要。

Kmesh正在积极探索数据平面架构层面的新方法来应对这一挑战，业界也在这方面做出了许多努力。在后续的文章中，我们将提供对这些计划和优化措施做详细的解读。