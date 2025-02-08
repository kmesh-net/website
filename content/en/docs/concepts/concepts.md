---
draft: false
linktitle: Kmesh Concepts
menu:
  docs:
    parent: "concepts"
    weight: 5
title: Kmesh Concepts
toc: true
type: docs
---


## **Kmesh: Basic Terms and Concepts**

### **What is Kmesh?**
Kmesh is a high-performance, sidecarless service mesh data plane that leverages eBPF (Extended Berkeley Packet Filter) and programmable kernel technologies. It offloads traffic management to the operating system, reducing latency, resource overhead, and complexity in cloud-native environments.

---

### **Core Features of Kmesh**
1. **Kernel-Level Traffic Management**:
   - Traffic governance is performed directly in the OS kernel using eBPF, bypassing traditional user-mode proxies.
   - Eliminates the need for sidecars, reducing latency and resource consumption.

2. **Sidecarless Architecture**:
   - Unlike traditional service meshes (e.g., Istio with Envoy), Kmesh operates without deploying sidecar proxies alongside application containers.
   - Reduces service communication from three hops to one hop.

3. **eBPF-Based Orchestration**:
   - Enables L3-L7 traffic orchestration, including routing, load balancing, and gray release.
   - Provides secure traffic management at the kernel level.

4. **Observability**:
   - Offers end-to-end observability through the `kmesh-probe` component.
   - Metrics and access logs are generated directly from kernel-level data.

5. **Cloud-Native Integration**:
   - Seamlessly integrates with existing cloud-native infrastructures like Kubernetes, Istio, and Prometheus.

---

### **Key Components of Kmesh**
1. **kmesh-controller**:
   - Manages the lifecycle of Kmesh.
   - Handles xDS protocol integration and observability.

2. **kmesh-api**:
   - Provides APIs for orchestration and monitoring.

3. **kmesh-runtime**:
   - Implements traffic orchestration in the kernel for L3-L7 layers.

4. **kmesh-orchestration**:
   - Handles advanced traffic management features like canary deployments and load balancing.

5. **kmesh-probe**:
   - Collects observability data for metrics and logs.

---

### **Advantages of Kmesh**
1. **Performance Optimization**:
   - Reduces forwarding latency compared to traditional service meshes.
   - Improves service startup performance.

2. **Resource Efficiency**:
   - Lowers CPU and memory usage by eliminating sidecars.
   - Reduces service mesh data plane overhead.

3. **Simplified Operations**:
   - Streamlines deployment with fewer components to manage.
   - Decouples application lifecycle from proxy lifecycle.

4. **Enhanced Security**:
   - Uses cgroup-level orchestration isolation for secure traffic management.

---

### **Metrics and Observability**
Kmesh provides detailed metrics at both workload and service levels:

#### Workload Metrics:
| Metric Name                                   | Description                                                |
|-----------------------------------------------|------------------------------------------------------------|
| `kmesh_tcp_workload_connections_opened_total` | Total TCP connections opened to a workload                |
| `kmesh_tcp_workload_connections_closed_total` | Total TCP connections closed to a workload                |
| `kmesh_tcp_workload_received_bytes_total`     | Total bytes received by a workload over TCP connections    |
| `kmesh_tcp_workload_sent_bytes_total`         | Total bytes sent by a workload over TCP connections        |

#### Service Metrics:
| Metric Name                             | Description                                                |
|-----------------------------------------|------------------------------------------------------------|
| `kmesh_tcp_connections_opened_total`    | Total TCP connections opened to a service                 |
| `kmesh_tcp_connections_closed_total`    | Total TCP connections closed to a service                 |
| `kmesh_tcp_received_bytes_total`        | Total bytes received by a service over TCP connections     |
| `kmesh_tcp_sent_bytes_total`            | Total bytes sent by a service over TCP connections         |

Access logs are generated with details such as source/destination addresses, workloads, namespaces, traffic direction, bytes sent/received, and connection duration.

---



