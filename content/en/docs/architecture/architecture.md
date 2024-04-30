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

![image](/docs/architecture/kmesh-arch.svg)
The software architecture of Kmesh consists of the following components:

- Kmesh-daemon: The management program responsible for Kmesh lifecycle management, XDS protocol integration, observability, and other functions.
- Ebpf orchestiation: The traffic orchestration implemented based on eBPF, including routing, canary deployments, load balancing, and more.
- waypoint: Modify istio's waypoint to adapt to Kmesh protocols, responsible for L7 traffic governance.
