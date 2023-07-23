---
draft: false
linktitle: Kmesh架构
menu:
  docs:
    parent: architecture
    weight: 1
title: Kmesh架构
toc: true
type: docs

---

![image](images/kmesh-arch.png)
Kmesh的主要部件包括：

- kmesh-controller：kmesh管理程序，负责Kmesh生命周期管理、XDS协议对接、观测运维等功能；

- kmesh-api：kmesh对外提供的api接口层，主要包括：xds转换后的编排API、观测运维通道等；

- kmesh-runtime：kernel中实现的支持L3~L7流量编排的运行时；

- kmesh-orchestration：基于ebpf实现L3~L7流量编排，如路由、灰度、负载均衡等；

- kmesh-probe：观测运维探针，提供端到端观测能力；