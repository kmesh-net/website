---
date: 2023-07-07
draft: false
lastmod: 2023-07-07
linktitle: Roadmap
menu:
  docs:
    parent: welcome
    weight: 2
title: Roadmap
toc: true
type: docs
---
| feature domain                | feature                                | 2022 | 2023.H1 | 2023.H2 | 2024.H1 | 2024.H2 |
| ----------------------------- | -------------------------------------- | :--: | :-----: | :-----: | :-----: | :-----: |
| Traffic Management            | sidecarless mesh                       |  ✓   |         |         |         |         |
|                               | sockmap                                |      |         |    ✓    |         |         |
|                               | Programmable governance based on ebpf  |  ✓   |         |         |         |         |
|                               | http1.1 protocol                       |      |    ✓    |         |         |         |
|                               | http2 protocol                         |      |         |         |    ✓    |         |
|                               | grpc protocol                          |      |         |         |         |    ✓    |
|                               | quic protocol                          |      |         |         |         |         |
|                               | tcp protocol                           |      |         |    ✓    |         |         |
|                               | Retry                                  |      |         |         |    ✓    |         |
|                               | Routing                                |      |    ✓    |         |         |         |
|                               | Load balancing                         |      |    ✓    |         |         |         |
|                               | Fault injection                        |      |         |         |         |    ✓    |
|                               | Gray release                           |      |    ✓    |         |         |         |
| Service security              | SSL-based two-way authentication       |      |         |         |    ✓    |         |
|                               | L7 authorization                       |      |         |         |         |    ✓    |
|                               | Cgroup-level isolation                 |      |         |         |         |    ✓    |
| Traffic monitoring            | Governance indicator monitoring        |      |         |    ✓    |         |         |
|                               | End-to-end observability               |      |         |         |         |    ✓    |
| Programmable                  | ebpf sdk                               |      |         |    ✓    |         |         |
|                               | Plug-in expansion capability           |      |         |         |         |         |
| Ecosystem collaboration       | Data plane collaboration (envoy, etc.) |      |         |         |    ✓    |         |
| Operating environment support | container                              |      |    ✓    |         |         |         |