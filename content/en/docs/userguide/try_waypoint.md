---
draft: false
linktitle: Try Waypoint
menu:
  docs:
    parent: user guide
    weight: 2
title: Try Waypoint
toc: true
type: docs

---

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
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samplesbookinfo/platform/kube/bookinfo.yaml
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

6. Deploy waypoint:

Deploy a waypoint for service account `bookinfo-reviews`, so any traffic to service `reviews` will be mediated by that waypoint proxy

```bash
[root@ ~]# istioctl x waypoint apply --service-account bookinfo-reviews
[root@ ~]# kubectl get pods
NAME                                               READY   STATUS    RESTARTS   AGE
bookinfo-reviews-istio-waypoint-5d544b6d54-v5tc9   1/1     Running   0          4s
details-v1-5f4d584748-bz42z                        1/1     Running   0          4m35s
productpage-v1-564d4686f-2rjqc                     1/1     Running   0          4m35s
ratings-v1-686ccfb5d8-dnzkf                        1/1     Running   0          4m35s
reviews-v1-86896b7648-fqm4z                        1/1     Running   0          4m35s
reviews-v2-b7dcd98fb-nn42q                         1/1     Running   0          4m35s
reviews-v3-5c5cc7b6d-q4r5h                         1/1     Running   0          4m35s
sleep-9454cc476-86vgb                              1/1     Running   0          4m25s
```
  
Replace the waypoint image with the Kmesh customized image. Based on istio-proxy, Kmesh adds an customized listener filter called [Kmesh_tlv](https://github.com/kmesh-net/waypoint/tree/master/source/extensions/filters/listener/kmesh_tlv), which will parse the custom TLV protocol encoded by Kmesh and obtain the target address and metadata to connect L4 and L7.

```bash
[root@ ~]# kubectl get gateways.gateway.networking.k8s.io
NAME               CLASS            ADDRESS         PROGRAMMED   AGE
bookinfo-reviews   istio-waypoint   10.96.207.125   True         8m36s
```

Add annotation "sidecar.istio.io/proxyImage: ghcr.io/kmesh-net/waypoint-{arch}:v0.3.0" to the `bookinfo-reviews` gateway, convert `{arch}` to the architecture of the host, current optional values are `x86` and `arm`. Then gateway pod will restart. Now Kmesh is L7 enabled!

### Apply weight-based routing

Configure traffic routing to send 90% of requests to `reviews` v1 and 10% to `reviews` v2

```bash
[root@ ~]# kubectl apply -f -<<EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  trafficPolicy:
    loadBalancer:
      simple: RANDOM
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: v3
    labels:
      version: v3
EOF
```

Confirm that roughly 90% of the traffic go to `reviews` v1

```bash
[root@ ~]# kubectl exec deploy/sleep -- sh -c "for i in \$(seq 1 100); do curl -s http:productpage:9080/productpage | grep reviews-v.-; done"
```

### Understanding what happend

Because `default` namespace has been managed by Kmesh and we have deployed a waypoint proxy for service account `bookinfo-reviews`, so all traffic sent to service `reviews` will be forwarded to waypoint by Kmesh. Waypoint will send 90% of requests to `reviews` v1 and 10% to `reviews` v2 according to the route rules we set.

### Cleanup

1. Remove the application route rules:

```bash
[root@ ~]# kubectl delete virtualservice reviews
[root@ ~]# kubectl delete destinationrules reviews
```

2. Remove waypoint:

```bash
[root@ ~]# istioctl x waypoint delete --service-account bookinfo-reviews
```

3. Remove sample applications:

```bash
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/sleep/sleep.yaml
```
