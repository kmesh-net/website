---
sidebar_position: 1
title: Overview
---

# Headlamp Kmesh Plugin

The **Kmesh Plugin for Headlamp** brings native Kmesh eBPF service mesh visibility directly into the [Headlamp](https://headlamp.dev/) Kubernetes dashboard. It is the first public release (`kmesh-0.1.0-alpha`) of the plugin, published in the [headlamp-k8s/plugins](https://github.com/headlamp-k8s/plugins/releases/tag/kmesh-0.1.0-alpha) repository.

Kmesh is a high-performance, sidecar-free Layer-4/Layer-7 service mesh data plane built on eBPF. It intercepts traffic at the kernel socket layer via `sockops` and `tc` BPF hooks, without requiring sidecar containers. Headlamp is an open-source, extensible Kubernetes dashboard with a plugin architecture that lets projects like Kmesh add their own sidebar navigation, routes, resource models, and views.

## Demo

https://github.com/user-attachments/assets/669a2ec7-d0d7-4bc9-a4e3-598282ffa73c

## Core Capabilities

### Waypoint Management (Gateway API)

Discovers Kubernetes `Gateway` resources filtered by `gatewayClassName: kmesh-waypoint` and presents a searchable list view with per-waypoint status badges and container image. Opens a split-right detail drawer showing live Kubernetes status conditions (`Accepted`, `Programmed`, `Ready`), so L7 waypoint proxy health is always visible without terminal access. Visual enrollment indicators highlight which waypoints are actively enrolled in the mesh at a glance.

![Waypoint list view](https://github.com/user-attachments/assets/759c2cef-df20-4eb2-8011-d7b18dbf4ccd)

### Daemon Health Dashboard

Queries `kmesh-daemon` DaemonSet pod readiness across all nodes and displays a compact health summary (total vs. ready count), so operators can immediately identify nodes where BPF program attachment has failed, the daemon has not yet scheduled, or image pull issues are occurring.

![Daemon health dashboard](https://github.com/user-attachments/assets/3a7acc41-8091-4983-876b-6cbac7972ab8)

### xDS Configuration Viewer

Proxies HTTP requests through the Headlamp backend into running Kmesh pods to fetch live ADS (Aggregate Discovery Service) dumps, parsing and rendering Clusters, Listeners, and Routes in separate searchable tabs — replacing the need for manual `kubectl exec curl localhost:15200/debug/config_dump/kernel-native` workflows.

![xDS config dump viewer](https://github.com/user-attachments/assets/0b1858af-2a98-4ed6-a8ec-401f2c7c89c5)

### eBPF Telemetry Panel

Surfaces BPF telemetry counters from kernel-instrumented traffic hooks (`sockops`, `tc`) in a refreshable panel, giving platform teams a real-time window into mesh-managed connection throughput, packet counters, TCP hop latency distribution, and traffic spikes during canary deployments — without deploying additional exporters.

![eBPF telemetry panel](https://github.com/user-attachments/assets/9e357d28-6a23-4cab-b489-a1e9b86528b8)

### Authorization Policy Viewer

Renders active Kmesh L4 authorization rules as a human-readable table mapping source workloads, destination workloads, and port allow/deny actions — translating low-level eBPF match criteria into an auditable policy view for zero-trust security teams.

### eBPF Map Viewer

For deployments running in dual-engine (workload) mode, provides a real-time tabbed view into the kernel's internal BPF state without dropping into shell sessions:

- **Backends** — pod IPs known to the kernel with their waypoint associations.
- **Frontends** — the kernel's full IP routing table (every VIP or pod IP → upstream ID).
- **Services** — services with LB policy, port mappings, and endpoint counts.
- **Endpoints** — per-priority backend assignment revealing locality-aware LB buckets (Priority 0 = same node/zone, Priority 6 = cross-network).
- **Workload Policies** — active authz policy IDs applied per workload at the kernel level.

All five tabs share a single HTTP round-trip via the daemon proxy deduplication layer.

### KmeshNodeInfo IPsec Visualization

Provides list and detail views for `KmeshNodeInfo` custom resources, exposing per-node IPsec security state and daemon synchronization status. Helps network administrators verify that secure inter-node tunneling is correctly established across all worker nodes participating in the mesh.

![KmeshNodeInfo IPsec visualization](https://github.com/user-attachments/assets/abee05d9-8cd3-4ea4-8f69-9aa13936eac8)

### Enrollment Indicators

Extends the built-in Headlamp Namespace detail page with a **Kmesh Enrollment** section, making it immediately clear whether a namespace and its workloads are enrolled in the mesh — without requiring separate label inspection. Waypoints also display visual status badges directly in the list view, surfacing enrollment and health state at a glance.

![Enrollment indicators](https://github.com/user-attachments/assets/0052ccaf-726d-4c38-83d2-989601292fdf)

## Requirements

- Headlamp Desktop or an in-cluster Headlamp installation
- Node.js v20.11.1 or later (for building from source)
- A Kubernetes cluster reachable from Headlamp
- Kmesh installed in kernel-native or dual-engine mode
- Linux kernel 5.10+ with eBPF support
- Kubernetes permissions for `get`, `list`, and `watch` on Kmesh resources

## Development Details

The plugin implements extension APIs from `@kinvolk/headlamp-plugin` for route registration, sidebar entries, and detail view sections. All daemon communication is securely proxied through the Headlamp backend, avoiding direct browser-to-pod access. The project uses Vitest for unit testing and follows standard Headlamp packaging conventions.

## Feedback & Support

- **Bug Reports** — Open an issue on the [headlamp-k8s/plugins](https://github.com/headlamp-k8s/plugins) repository.
- **Feature Requests** — Start a discussion thread on the repository.
- **Contributions** — Pull requests are welcome; see the repository's contribution guidelines.

Released under the Apache 2.0 License.
