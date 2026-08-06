---
title: Kmesh V1.1.0 正式发布！
authors:
  - Kmesh
slug: kmesh-1.1-release
date: 2025-05-23
sidebar_position: 1
---

我们很高兴地宣布发布 Kmesh v1.1.0，这是过去三个月全球社区共同努力实现的里程碑。特别感谢 LXF Project 的贡献者，他们的奉献对于推动此次发布至关重要。

在 v1.0.0 的基础上，本次发布对 Kmesh 的架构、可观测性和生态系统集成进行了重大增强。Kmesh 官方网站经过了全面重新设计，提供了直观的界面和简化的文档，以增强用户和开发者的体验。在底层，我们重构了 DNS 模块并添加了长连接指标，从而为更多流量模式提供更深入的洞察。

在内核原生（Kernel-Native）模式下，我们减少了侵入性的内核修改。此外，我们使用全局变量替换 BPF 配置映射（config map）以简化底层复杂性。与 Istio 1.25 的兼容性已通过严格验证，确保证与最新 Istio 版本的无缝互操作性。值得注意的是，长期存在的 TestKmeshRestart E2E 测试用例不稳定性问题已通过长期调查和底层 BPF 程序的重构得到解决，标志着运行时可靠性的飞跃。

## 主要特性

### 网站改版

Kmesh 官方网站经历了彻底的重新设计，提供了直观的用户体验、改进的文档、重新组织的内容层次结构和简化的导航。在解决上一版本的反馈时，我们专注于可以增强用户体验的关键领域。最初的界面存在一些可用性挑战，偶尔会导致导航困难。我们的博客模块尤其需要关注，因为其内容组织和视觉层次结构影响了内容的发现和可读性。从工程角度来看，我们认识到通过更好的组件组织和更系统的样式方法来改进代码结构的机会，因为现有的实现在维护上已变得复杂。

为了解决这些问题，我们转向了使用 Docusaurus 的 React，这是一个对开发者更友好的现代文档框架。这使我们能够创建模块化组件，通过复用性消除冗余代码。Docusaurus 提供了专门为文档和博客设计的内置导航系统，以及版本控制文档功能。我们实现了英语和中文文档的多语言支持，添加了高级搜索功能，并完全重新组织了内容结构。结果是极大地改善了体验，使 Kmesh 网站对所有用户更易访问且更有价值。

### 长连接指标

在此发布之前，Kmesh 在 TCP 连接终止和建立期间提供访问日志，其中包含有关连接的详细信息，例如发送字节数、接收字节数、丢包数、RTT 和重传数。Kmesh 还提供特定于工作负载和服务的指标，例如 Pod 打开和关闭的总连接数、发送和接收的字节数、丢包数、最小 RTT。这些指标仅在连接关闭后更新。

在此版本中，我们实现了 TCP 长连接的访问日志和指标，开发了一种持续监控和报告机制，可在长生存期 TCP 连接的整个生命周期内捕获详细的实时数据。访问日志定期报告信息，例如报告时间、连接建立时间、发送字节数、接收字节数、丢包数、RTT、重传数和状态。发送和接收的字节数、丢包数、重传数等指标也会针对长连接定期报告。

### DNS 重构

当前的 DNS 流程包括 CDS 刷新流程。因此，DNS 与内核原生模式深度耦合，无法在双引擎模式下使用。

![image](images/dns1.jpg)

在 1.1 版本中，我们重构了 Kmesh 的 DNS 模块。数据在 Dns 中循环通过刷新队列的结构不再是包含 cds 的结构，而是一个域，因此 Dns 模块不再关心 Kmesh 模式，只提供要解析的主机名。

![image](./images/dns2.jpg)

### BPF 配置映射优化

Kmesh 取消了专用的 kmesh_config_map BPF 映射，该映射以前存储全局运行时配置，例如 BPF 日志级别和监控开关。这些设置现在通过全局变量进行管理。利用全局变量简化了 BPF 配置管理，提高了运行时效率和可维护性。

### 优化内核原生模式以减少对内核的侵入性修改

内核原生模式需要大量的侵入性内核重构来实现基于 HTTP 的流量控制。其中一些修改可能对内核产生重大影响，这使得内核原生模式难以在实际生产环境中部署和使用。
为了解决这个问题，我们同步修改了内核原生模式下的内核以及涉及的 ko 和 eBPF。通过此版本的优化，在内核 5.10 中，内核修改限制为四个，在内核 6.6 中，内核修改减少到仅一个。这最后一个也将尽可能消除，目标是最终在原生版本 6.6 及以上的内核上运行内核原生模式。

![image](./images/bpf.jpg)

### 适配 Istio 1.25

Kmesh 已验证与 Istio 1.25 的兼容性，并在 CI 中添加了相应的 E2E 测试。Kmesh 社区在 CI 中维护三个 Istio 版本的验证，因此 Istio 1.22 的 E2E 测试已从 CI 中移除。

## 关键错误修复

**kmeshctl install waypoint error ([#1287](https://github.com/kmesh-net/kmesh/issues/1287))**

_根本原因分析：_

_在构建 waypoint 镜像时移除了版本号前多余的 v。_

**TestKmeshRestart flaky ([#1192](https://github.com/kmesh-net/kmesh/issues/1192))**

_根本原因分析：_

_这个问题实际上与 Kmesh 重启无关，在非重启场景下也可能产生。_

_根本原因是不适合使用 [sk](https://github.com/kmesh-net/kmesh/blob/main/bpf/kmesh/workload/cgroup_sock.c#L64) 作为映射 [map_of_orig_dst](https://github.com/kmesh-net/kmesh/blob/main/bpf/kmesh/workload/cgroup_sock.c#L80) 的键，因为它是被重用的，映射的值会被错误地覆盖，导致元数据在应该被编码到发送给 waypoint 的连接中时没有被编码，从而导致此问题中的重置错误。_

**TestServiceEntrySelectsWorkloadEntry flaky ([#1352](https://github.com/kmesh-net/kmesh/issues/1352))**

_根本原因分析：_

_在此测试用例之前，有一个测试 `TestServiceEntryInlinedWorkloadEntry` 会生成两个工作负载对象，例如 `Kubernetes/networking.istio.io/ServiceEntry/echo-1-21618/test-se-v4/10.244.1.103` 和 `ServiceEntry/echo-1-21618/test-se-v6/10.244.1.103`。_

_在当前用例中，WorkloadEntry 会生成工作负载对象 `Kubernetes/networking.istio.io/WorkloadEntry/echo-1-21618/test-we`。_

_如果测试用例运行得足够快，前两个工作负载对象的移除操作将与后一个对象的创建操作聚合在一起。_

_Kmesh 会先处理新对象，然后再移除旧资源，[参考](https://github.com/kmesh-net/kmesh/blob/main/pkg/controller/workload/workload_processor.go#L841)。_

_这三个对象的 IP 地址相同，最终会导致在 Kmesh 工作负载缓存中找不到 IP 地址，从而导致认证失败和连接超时。_

## 致谢

Kmesh v1.1.0 包含来自 14 位贡献者的 118 次提交。我们要向所有贡献者表示衷心的感谢：

|                |                  |              |             |
| -------------- | ---------------- | ------------ | ----------- |
| @hzxuzhonghu   | @LiZhenCheng9527 | @YaoZengzeng | @silenceper |
| @weli-l        | @sancppp         | @Kuromesi    | @yp969803   |
| @lec-bit       | @ravjot07        | @jayesh9747  | @harish2773 |
| @Dhiren-Mhatre | @Murdock9803     |              |             |

我们一直以开放中立的态度发展 Kmesh，并继续打造 Sidecarless 服务网格行业的标杆解决方案，服务千行百业，推动服务网格健康有序发展。Kmesh 正处于快速发展阶段，诚邀有志之士加入我们！

## 参考链接

- [Kmesh Release v1.1.0](https://github.com/kmesh-net/kmesh/releases/tag/v1.1.0)
- [Kmesh GitHub](https://github.com/kmesh-net/kmesh)
- [Kmesh Website](https://kmesh.net/)
