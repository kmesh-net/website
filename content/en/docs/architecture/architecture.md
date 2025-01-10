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

- Kmesh-daemon: The daemon responsible for eBPF Orchestration lifecycle management, xDS protocol integration, observability, and other functions.
- eBPF Orchestration: The traffic orchestration implemented with eBPF, including dynamic routing, canary deployments, load balancing, etc.
- Waypoint: Based on istio's waypoint to adapt to Kmesh protocols, responsible for L7 traffic management.
