---
draft: false
linktitle: Kmesh Architecture
menu:
  docs:
    parent: architecture
    weight: 5
title: Kmesh Architecture
toc: true
type: docs

---

![image](images/kmesh-arch.png)
The software architecture of Kmesh consists of the following components:

- kmesh-controller: The management program responsible for Kmesh lifecycle management, XDS protocol integration, observability, and other functions.
- kmesh-api: The API interface layer provided by Kmesh, including the orchestrated API transformed from XDS and observability channels.
- kmesh-runtime: The runtime implemented in the kernel that supports L3-L7 traffic orchestration.
- kmesh-orchestration: The L3-L7 traffic orchestration implemented based on eBPF, including routing, canary deployments, load balancing, and more.
- kmesh-probe: The observability probe that provides end-to-end observability capabilities.