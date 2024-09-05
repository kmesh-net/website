---
draft: false
linktitle: Install Waypoint
menu:
  docs:
    parent: user guide
    weight: 3
title: Install Waypoint
toc: true
type: docs

---

To try capabilities of Kmesh L7, this is the basic doc to install waypoint.

### Preparation

1. Install Kmesh:

Please refer [quickstart](https://kmesh.net/en/docs/setup/quickstart/)

2. Deploy sample application:

Using Kmesh manage default namespace

```bash
[root@ ~]# kubectl label namespace default istio.io/dataplane-mode=Kmesh
[root@ ~]# kubectl get namespace -L istio.io/dataplane-mode
NAME                 STATUS   AGE   DATAPLANE-MODE
default              Active   13d   Kmesh
istio-system         Active   13d   
kmesh-system         Active   27h   
kube-node-lease      Active   13d   
kube-public          Active   13d   
kube-system          Active   13d   
local-path-storage   Active   13d   
```

3. Deploy bookinfo:

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
```

4. Deploy sleep as curl client:

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/sleep/sleep.yaml
[root@ ~]# kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
details-v1-5f4d584748-bz42z      1/1     Running   0          72s
productpage-v1-564d4686f-2rjqc   1/1     Running   0          72s
ratings-v1-686ccfb5d8-dnzkf      1/1     Running   0          72s
reviews-v1-86896b7648-fqm4z      1/1     Running   0          72s
reviews-v2-b7dcd98fb-nn42q       1/1     Running   0          72s
reviews-v3-5c5cc7b6d-q4r5h       1/1     Running   0          72s
sleep-9454cc476-86vgb            1/1     Running   0          62s
```

5. Test boofinfo works as expected:

```bash
[root@ ~]# kubectl exec deploy/sleep -- curl -s http://productpage:9080/ | grep -o "<title>.*</title>"
<title>Simple Bookstore App</title>
```

### Install waypoint:

Waypoints can be used at three granularities: namespace, service and pod. Also you could install multiple waypoints with different granularities under the same namespace.

#### Install waypoint in service granularity:

Deploy a waypoint for service `reviews`, so any traffic to that service will be mediated by that waypoint proxy

***NOTE: There are breaking changes in waypoint capture mode between istio 1.22 and istio 1.21, so the following commands need to be run on at least istio 1.22.***

```bash
[root@ ~]# istioctl x waypoint apply -n default --name reviews-svc-waypoint
```

Label the `reviews` service to use the `reviews-svc-waypoint` waypoint:

```bash
[root@ ~]# kubectl label service reviews istio.io/use-waypoint=reviews-svc-waypoint
```

You can use `kubectl get pods` to see all the pods except waypoint are ready. **Then replace the waypoint image with the Kmesh customized image.** Based on istio-proxy, Kmesh adds an customized listener filter called [Kmesh_tlv](https://github.com/kmesh-net/waypoint/tree/master/source/extensions/filters/listener/kmesh_tlv), which will parse the custom TLV protocol encoded by Kmesh and obtain the target address and metadata to connect L4 and L7.

```bash
[root@ ~]# kubectl get gateways.gateway.networking.k8s.io
NAME                      CLASS            ADDRESS        PROGRAMMED   AGE
reviews-svc-waypoint      istio-waypoint   10.96.198.98   True         30m
```

**image replacement**: Add annotation "sidecar.istio.io/proxyImage: ghcr.io/kmesh-net/waypoint:latest" to the `reviews-svc-waypoint` gateway.

```bash
[root@ ~]# kubectl annotate gateway reviews-svc-waypoint sidecar.istio.io/proxyImage=ghcr.io/kmesh-net/waypoint:latest
```

Then gateway pod will restart. Now Kmesh is L7 enabled!

```bash
[root@ ~]# kubectl get pods
NAME                                      READY   STATUS    RESTARTS   AGE
details-v1-cdd874bc9-xcdnj                1/1     Running   0          30m
productpage-v1-5bb9985d4d-z8cws           1/1     Running   0          30m
ratings-v1-6484d64bbc-pkv6h               1/1     Running   0          30m
reviews-svc-waypoint-8cb4bdbf-9d5mj       1/1     Running   0          30m
reviews-v1-598f9b58fc-2rw7r               1/1     Running   0          30m
reviews-v2-5979c6fc9c-72bst               1/1     Running   0          30m
reviews-v3-7bbb5b9cf7-952d8               1/1     Running   0          30m
sleep-5577c64d7c-n7rxp                    1/1     Running   0          30m
```


#### Install waypoint in namespace granularity:

```bash
[root@ ~]#  istioctl x waypoint apply -n default --name default-ns-waypoint
waypoint default/default-ns-waypoint applied

[root@ ~]#  kubectl label namespace default istio.io/use-waypoint=default-ns-waypoint
namespace/default labeled
```

***NOTE: Also need to replace the original image of waypoint with the Kmesh customized image.***

```bash
[root@ ~]# kubectl annotate gateway default-ns-waypoint sidecar.istio.io/proxyImage=ghcr.io/kmesh-net/waypoint:latest
```

Then any requests from any pods using the Kmesh, to any service running in `default` namespace, will be routed through that waypoint for L7 processing and policy enforcement.

#### Install waypoint in pod granularity:

```bash
[root@ ~]# istioctl x waypoint apply -n default --name reviews-v2-pod-waypoint --for workload
waypoint default/reviews-v2-pod-waypoint applied
# Label the `reviews-v2` pod to use `reviews-v2-pod-waypoint` waypoint.
[root@ ~]# kubectl label pod -l version=v2,app=reviews istio.io/use-waypoint=reviews-v2-pod-waypoint
pod/reviews-v2-5b667bcbf8-spnnh labeled
```

***NOTE: Also need to replace the original image of waypoint with the Kmesh customized image.***

```bash
[root@ ~]# kubectl annotate gateway reviews-v2-pod-waypoint sidecar.istio.io/proxyImage=ghcr.io/kmesh-net/waypoint:latest
```

Now any requests from pods in the Kmesh to the `reviews-v2` pod IP will be routed through `reviews-v2-pod-waypoint` waypoint for L7 processing and policy enforcement.

### Cleanup

If you are **not** planning to explore any follow-on tasks, go on with the cleanup steps

1. Remove waypoint:

#### Remove waypoint in service granularity
```bash
[root@ ~]# istioctl x waypoint delete reviews-svc-waypoint
[root@ ~]# kubectl label service reviews istio.io/use-waypoint-
```
#### Remove waypoint in namespace granularity

```bash
[root@ ~]# istioctl x waypoint delete default-ns-waypoint
[root@ ~]# kubectl label namespace default istio.io/use-waypoint-
```

#### Remove waypoint in pod granularity

```bash
[root@ ~]# istioctl x waypoint delete reviews-v2-pod-waypoint
[root@ ~]# kubectl label pod -l version=v2,app=reviews istio.io/use-waypoint-
```

2. Remove sample applications:

```bash
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/sleep/sleep.yaml
```

3. Remove default namespace from Kmesh:

```bash
[root@ ~]# kubectl label namespace default istio.io/dataplane-mode-
```