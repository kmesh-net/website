---
draft: false
linktitle: L7 Traffic Management
menu:
  docs:
    parent: user guide
    weight: 1
title: L7 Traffic Management
toc: true
type: docs

---
### L7 Traffic Management

- Deploy the sample application
  - Add default namespace to Kmesh

    ```
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
 
  - Deploy bookinfo

    ```
    [root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
    ```

  - Deploy sleep as curl client

    ```
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

  - Test boofinfo works as expected

    ```
    [root@ ~]# kubectl exec deploy/sleep -- curl -s http://productpage:9080/ | grep -o "<title>.*</title>"
    <title>Simple Bookstore App</title>
    ```

- Kmesh L7

  - Deploy a waypoint for service account `bookinfo-reviews`, so any traffic to service `reviews` will be mediated by that waypoint proxy

    ```
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
  
  - Replace the waypoint image with the Kmesh customized image. Based on istio-proxy, Kmesh adds an customized listener filter called [kmesh_tlv](https://github.com/kmesh-net/waypoint/tree/master/source/extensions/filters/listener/kmesh_tlv) to connect L4 and L7.

    ```
    [root@ ~]# kubectl get gateways.gateway.networking.k8s.io
    NAME               CLASS            ADDRESS         PROGRAMMED   AGE
    bookinfo-reviews   istio-waypoint   10.96.207.125   True         8m36s
    ```

    Add annotation "sidecar.istio.io/proxyImage: ghcr.io/kmesh-net/waypoint-{arch}:v0.3.0" to the `bookinfo-reviews` gateway, convert `{arch}` to the architecture of the host, current optional values are `x86` and `arm`. Then gateway pod will restart. Now kmesh is L7 enabled!

  - Configure traffic routing to send 90% of requests to `reviews` v1 and 10% to `reviews` v2

    ```
    [root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/networking/virtual-service-reviews-90-10.yaml
    [root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/networking/destination-rule-reviews.yaml
    ```

  - Confirm that roughly 90% of the traffic go to `reviews` v1

    ```
    [root@ ~]# kubectl exec deploy/sleep -- sh -c "for i in \$(seq 1 100); do curl -s http:productpage:9080/productpage | grep reviews-v.-; done"
    ```
