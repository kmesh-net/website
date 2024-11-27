---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Using Kmesh as the Data Plane for Alibaba Cloud Service Mesh (ASM) Sidecarless Mode"
subtitle: ""
summary: "Using Kmesh as the Data Plane for Alibaba Cloud Service Mesh (ASM) Sidecarless Mode"
authors: [Kuromesi]
tags: [introduce]
categories: [General]
date: 2024-11-27T11:33:00+08:00
lastmod: 2024-07-01T11:33:00+08:00
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
# Using Kmesh as the Data Plane for Alibaba Cloud Service Mesh (ASM) Sidecarless Mode
## Overview
Alibaba Cloud Service Mesh (ASM) supports both Sidecar and Sidecarless modes. The Sidecar mode, where a proxy runs alongside each service instance, is currently the most selected and stable solution. However, this architecture introduces latency and resource overhead. To address the latency and resource consumption inherent in the Sidecar mode, various Sidecarless mode solutions have emerged in recent years, such as Istio Ambient. Istio Ambient deploys a ztunnel on each node to perform layer-4 traffic proxying for the Pods running on the node and deploy waypoints for layer-7 traffic proxying. While the Sidecarless mode can reduce latency and resource consumption, its stability and completeness in functionality still require improvement.

ASM currently supports different Sidecarless modes, such as Istio Ambient mode, ACMG mode, and Kmesh, among others. Kmesh (for more details, refer to [https://kmesh.net/](https://kmesh.net/)) is a high-performance service mesh data plane software implemented based on eBPF and programmable kernel. By offloading traffic management to the kernel, Kmesh allows service communication within the mesh to occur without passing through proxy software, significantly reducing the traffic forwarding path and effectively enhancing the forwarding performance of service access.

### Introduction to Kmesh 
Kmesh's dual-engine mode uses eBPF to intercept traffic in kernel space and deploys a Waypoint Proxy to handle complex L7 traffic management, thus separating L4 and L7 governance between kernel space (eBPF) and user space (Waypoint). Compared to Istio's Ambient Mesh, it reduces latency by 30%. Compared to the kernel-native mode, the dual-engine mode does not require kernel enhancements, offering broader applicability.

![Dual-Engine Mode](images/dual-engine-mode.png)

Currently, ASM supports using Kmesh's dual-engine mode as one of the data planes for the service mesh, enabling more efficient service management. Specifically, ASM can be used as the control plane, while Kmesh can be deployed as the data plane within an Alibaba Cloud Container Service for Kubernetes (ACK) cluster.

## Deploy Kmesh in ACK and Connect to ASM
### Prerequisites
Create an ASM cluster and add the ACK cluster to the ASM cluster for management. For detailed steps, you can refer to the documentation: [Add a cluster to an ASM instance](https://www.alibabacloud.com/help/en/asm/getting-started/add-a-cluster-to-an-asm-instance-1?spm=a2c63.l28256.help-menu-search-147365.d_0).

### Install Kmesh
Run the following command to clone the Kmesh project into your local machine.

```shell
git clone https://github.com/kmesh-net/kmesh.git && cd kmesh
```

#### Check Services of ASM Control Plane
After the Kmesh is downloaded, you need to execute the following command first to check the Service name of the current ASM control plane in the cluster, in order to configure the connection between Kmesh and the ASM control plane.

```shell
kubectl get svc -n istio-system | grep istiod

# istiod-1-22-6   ClusterIP   None   <none>   15012/TCP   2d
```

#### Install Kmesh with Kubectl
You can use kubectl to install Kmesh in the ACK Kubernetes cluster. However, before installation, please add the `ClusterId` and `xdsAddress` environment variables to the Kmesh DaemonSet. These are used for the authentication and connection between Kmesh and the ASM control plane. The ClusterId is the ID of the ACK cluster where Kmesh is deployed, and the xdsAddress is the Service of the ASM control plane.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kmesh
  labels:
    app: kmesh
  namespace: kmesh-system
spec:
    spec:
      containers:
        - env:
          # ASM Control Plane Service
          - name: XDS_ADDRESS
            value: "istiod-1-22-6.istio-system.svc:15012"
          # add ACK cluster id
          - name: CLUSTER_ID
            value: "cluster-id"
    ...
```

After modifying the Kmesh DaemonSet environment variables in the following command, execute it to deploy Kmesh.

```shell
kubectl apply -f -<<EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kmesh
  labels:
    app: kmesh
  namespace: kmesh-system
spec:
  selector:
    matchLabels:
      app: kmesh
  template:
    metadata:
      labels:
        app: kmesh
      annotations:
        prometheus.io/path: "status/metric"
        prometheus.io/port: "15020"
        prometheus.io/scrape: "true"
    spec:
      tolerations:
        - effect: NoSchedule
          operator: Exists
        - key: CriticalAddonsOnly
          operator: Exists
        - effect: NoExecute
          operator: Exists
      volumes:
        # use cgroup requires
        - name: mnt
          hostPath:
            path: /mnt
        # for eBPF program into the host machine
        - name: sys-fs-bpf
          hostPath:
            path: /sys/fs/bpf
        # required for compiling and building ko
        - name: lib-modules
          hostPath:
            path: /lib/modules
        # k8s default cni conflist path
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        # k8s default cni path
        - name: kmesh-cni-install-path
          hostPath:
            path: /opt/cni/bin
        - name: host-procfs
          hostPath:
            path: /proc
            type: Directory
        - name: istiod-ca-cert
          configMap:
            defaultMode: 420
            name: istio-ca-root-cert
        - name: istio-token
          projected:
            defaultMode: 420
            sources:
              - serviceAccountToken:
                  audience: istio-ca
                  expirationSeconds: 43200
                  path: istio-token
        # ASM Control Plane Service
        - name: XDS_ADDRESS
          value: "istiod-1-22-6.istio-system.svc:15012"
        # add ACK cluster id
        - name: CLUSTER_ID
          value: "cluster-id"
      containers:
        - name: kmesh
          image: registry-cn-hangzhou.ack.aliyuncs.com/ack-demo/kmesh:latest
          imagePullPolicy: IfNotPresent
          command: ["/bin/sh", "-c"]
          args:
            [
              "./start_kmesh.sh --mode=dual-engine --enable-bypass=false --enable-bpf-log=true",
            ]
          securityContext:
            privileged: true
            capabilities:
              add: ["all"]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: INSTANCE_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: XDS_ADDRESS
              value: "istiod.istio-system.svc:15012"
            - name: SERVICE_ACCOUNT
              valueFrom:
                fieldRef:
                  fieldPath: spec.serviceAccountName
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          volumeMounts:
            - name: mnt
              mountPath: /mnt
              readOnly: false
            - name: sys-fs-bpf
              mountPath: /sys/fs/bpf
              readOnly: false
            - name: lib-modules
              mountPath: /lib/modules
              readOnly: false
            # k8s default cni conflist path
            - name: cni
              mountPath: /etc/cni/net.d
              readOnly: false
            # k8s default cni path
            - name: kmesh-cni-install-path
              mountPath: /opt/cni/bin
              readOnly: false
            - mountPath: /host/proc
              name: host-procfs
              readOnly: true
            - name: istiod-ca-cert
              mountPath: /var/run/secrets/istio
            - name: istio-token
              mountPath: /var/run/secrets/tokens
          resources:
            limits:
              # image online-compile needs 800Mi, or only 200Mi
              memory: "800Mi"
              cpu: "1"
      priorityClassName: system-node-critical
      serviceAccountName: kmesh
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kmesh
  labels:
    app: kmesh
rules:
- apiGroups: [""]
  resources: ["pods","services","namespaces"]
  verbs: ["get", "update", "patch", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["daemonsets"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kmesh
  labels:
    app: kmesh
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kmesh
subjects:
- kind: ServiceAccount
  name: kmesh
  namespace: kmesh-system
---
apiVersion: v1
kind: Namespace
metadata:
  name: kmesh-system
---
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-listener-filter
  namespace: istio-system
  labels:
    asm-system: 'true'
    provider: asm
spec:
  workloadSelector:
    labels:
      gateway.istio.io/managed: istio.io-mesh-controller
  configPatches:
  - applyTo: LISTENER
    match:
      proxy:
        proxyVersion: .*
    patch:
      operation: ADD
      value:
        name: kmesh-listener
        address:
          socket_address:
            protocol: TCP
            address: 0.0.0.0
            port_value: 15019
        additional_addresses:
        - address:
            socket_address:
              protocol: TCP
              address: "::"
              port_value: 15019
        default_filter_chain:
          filters:
          - name: envoy.filters.network.tcp_proxy
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.tcp_proxy.v3.TcpProxy
              stat_prefix: kmesh
              cluster: main_internal
        filter_chains:
        - filter_chain_match:
            application_protocols:
            - "http/1.1"
            - "h2c"
          filters:
          - name: envoy.filters.network.http_connection_manager
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
              stat_prefix: kmesh
              route_config:
                name: default
                virtual_hosts:
                - name: default
                  domains:
                  - '*'
                  routes:
                  - match:
                      prefix: "/"
                    route:
                      cluster: main_internal
              http_filters:
              - name: waypoint_downstream_peer_metadata
                typed_config:
                  "@type": type.googleapis.com/udpa.type.v1.TypedStruct
                  type_url: type.googleapis.com/io.istio.http.peer_metadata.Config
                  value:
                    downstream_discovery:
                    - workload_discovery: {}
                    shared_with_upstream: true
              - name: envoy.filters.http.router
                typed_config:
                  "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
        listener_filters:
        - name: "envoy.listener.kmesh_tlv"
          typed_config:
            "@type": "type.googleapis.com/udpa.type.v1.TypedStruct"
            "type_url": "type.googleapis.com/envoy.listener.kmesh_tlv.config.KmeshTlv"
        - name: "envoy.filters.listener.http_inspector"
          typed_config:
            "@type": "type.googleapis.com/envoy.extensions.filters.listener.http_inspector.v3.HttpInspector"
---
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: skip-tunneling
  namespace: istio-system
  labels:
    asm-system: 'true'
    provider: asm
spec:
  workloadSelector:
    labels:
      gateway.istio.io/managed: istio.io-mesh-controller
  configPatches:
  - applyTo: NETWORK_FILTER
    match:
      proxy:
        proxyVersion: .*
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.tcp_proxy
    patch:
      operation: REPLACE
      value:
        name: envoy.filters.network.tcp_proxy
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.tcp_proxy.v3.TcpProxy
          stat_prefix: kmesh_original_dst_cluster
          cluster: kmesh_original_dst_cluster
---
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-original-dst-cluster
  namespace: istio-system
  labels:
    asm-system: 'true'
    provider: asm
spec:
  workloadSelector:
    labels:
      gateway.istio.io/managed: istio.io-mesh-controller
  configPatches:
  - applyTo: CLUSTER
    match:
      proxy:
        proxyVersion: .*
      context: SIDECAR_INBOUND
    patch:
      operation: ADD
      value:
        name: "kmesh_original_dst_cluster"
        type: ORIGINAL_DST
        connect_timeout: 2s
        lb_policy: CLUSTER_PROVIDED
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kmesh
  namespace: kmesh-system
EOF
```

### Check Kmesh Startup Status
After the installation is done, run the following command to check the Kmesh startup status.

```shell
kubectl get pods -A | grep kmesh

# kmesh-system   kmesh-l5z2j   1/1   Running   0    117m
```

Run the following command to check Kmesh running status.

```shell
kubectl logs -f -n kmesh-system kmesh-l5z2j

# time="2024-02-19T10:16:52Z" level=info msg="service node sidecar~192.168.11.53~kmesh-system.kmesh-system~kmesh-system.svc.cluster.local connect to discovery address istiod.istio-system.svc:15012" subsys=controller/envoy
# time="2024-02-19T10:16:52Z" level=info msg="options InitDaemonConfig successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="bpf Start successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="controller Start successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="command StartServer successful" subsys=manager
# time="2024-02-19T10:16:53Z" level=info msg="start write CNI config\n" subsys="cni installer"
# time="2024-02-19T10:16:53Z" level=info msg="kmesh cni use chained\n" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="Copied /usr/bin/kmesh-cni to /opt/cni/bin." subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="kubeconfig either does not exist or is out of date, writing a new one" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="wrote kubeconfig file /etc/cni/net.d/kmesh-cni-kubeconfig" subsys="cni installer"
# time="2024-02-19T10:16:54Z" level=info msg="command Start cni successful" subsys=manager
```

You can enable Kmesh for a specific namespace by executing the following command.

```shell
kubectl label namespace default istio.io/dataplane-mode=Kmesh
```

## Traffic Shifting Demo
### Deploy Demo App and Traffic Shifting Rules

After enabling Kmesh for the default namespace, run the following command to install the sample application.

```shell
kubectl apply -f samples/fortio/fortio-route.yaml
kubectl apply -f samples/fortio/netutils.yaml
```

Run the following command to check the running status of the sample application.

```shell
kubectl get pod 
# NAME                         READY   STATUS    RESTARTS   AGE
# fortio-v1-596b55cb8b-sfktr   1/1     Running   0          57m
# fortio-v2-76997f99f4-qjsmd   1/1     Running   0          57m
# netutils-575f5c569-lr98z     1/1     Running   0          67m

kubectl describe pod netutils-575f5c569-lr98z | grep Annotations
# Annotations:      kmesh.net/redirection: enabled
```

Label `kmesh.net/redirection: enabled` of the pod indicates that Kmesh forwarding has been enabled for that Pod.

Run the following command to view the currently defined traffic routing rules. It can be seen that 90% of the traffic is directed to version v1 of fortio, and 10% of the traffic is directed to version v2 of fortio.

```shell
kubectl get virtualservices -o yaml

# apiVersion: v1
# items:
# - apiVersion: networking.istio.io/v1beta1
#   kind: VirtualService
#   metadata:
#     annotations:
#       kubectl.kubernetes.io/last-applied-configuration: |
#         {"apiVersion":"networking.istio.io/v1alpha3","kind":"VirtualService","metadata":{"annotations":{},"name":"fortio","namespace":"default"},"spec":{"hosts":["fortio"],"http":[{"route":[{"destination":{"host":"fortio","subset":"v1"},"weight":90},{"destination":{"host":"fortio","subset":"v2"},"weight":10}]}]}}
#     creationTimestamp: "2024-07-09T09:00:36Z"
#     generation: 1
#     name: fortio
#     namespace: default
#     resourceVersion: "11166"
#     uid: 0a07f283-ac26-4d86-b3bd-ce6aa07dc628
#   spec:
#     hosts:
#     - fortio
#     http:
#     - route:
#       - destination:
#           host: fortio
#           subset: v1
#         weight: 90
#       - destination:
#           host: fortio
#           subset: v2
#         weight: 10
# kind: List
# metadata:
#   resourceVersion: ""
```

### Start Test Traffic
You can start test traffic by executing the following command. You should see that only about 10% of the traffic is directed to version v2 of fortio.

```shell
for i in {1..20}; do kubectl exec -it $(kubectl get pod | grep netutils | awk '{print $1}') -- curl -v $(kubectl get svc -owide | grep fortio | awk '{print $3}'):80 | grep "Server:"; done

# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 2
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 1
# < Server: 2
# < Server: 1
# < Server: 1
```