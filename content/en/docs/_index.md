---
title: "Documentation"
date: 2023-07-07
draft: false
lastmod: 2023-04-23
menu:
  docs:
    parent: welcome
    weight: 1
toc: true
type: docs
---

# Kmesh: High-Performance and Low Overhead Service Mesh Data Plane

Kmesh leverages eBPF and programmable kernels to offload traffic management to the OS, accelerating service mesh performance. Compared to traditional service meshes, it offers advantages such as low latency, being sidecarless, and low resource consumption.

## Why Kmesh?

- **Superior Performance**: Reduces service mesh latency through kernel-level optimizations
- **Resource Efficiency**: Minimizes overhead by implementing service governance at the OS layer
- **Simplified Operations**: Streamlines service mesh management with kernel-integrated traffic routing
- **Cloud Native Integration**: Seamlessly works with existing cloud-native infrastructure

## Core Benefits

| Benefit | Description |
|---------|-------------|
| Latency Reduction | Direct kernel path routing reduces service-to-service communication overhead |
| Resource Optimization | Lower CPU and memory usage through OS-layer implementation |
| Simplified Architecture | Fewer hops in service access paths improve overall performance |

In the following docs, we will explain:

- The [architecture](architecture/architecture) and highlights advantages of Kmesh.
- The [quick start](setup/quickstart) of Kmesh.
- The [performance](performance/performance) of Kmesh.
- The [community](community/contribute) of Kmesh.
