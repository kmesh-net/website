---
draft: false
linktitle: Use Grafana to visualize service metrics
menu:
  docs:
    parent: user guide
    weight: 2
title: Use Grafana to visualize service metrics
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
```
 
3. Deploy bookinfo and sleep as curl client:

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/bookinfo/platform/kube/bookinfo.yaml
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

4. Deploy prometheus and garafana:

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/prometheus.yaml
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/grafana.yaml
```

5. Deploy waypoint at namespace granularity:

```bash
[root@ ~]# istioctl x waypoint apply -n default --enroll-namespace
waypoint default/waypoint applied
namespace default labeled with "istio.io/use-waypoint: waypoint"
[root@ ~]# kubectl annotate gateway waypoint sidecar.istio.io/proxyImage=ghcr.io/kmesh-net/waypoint:latest
```

### Generate some continuous traffic between applications in the mesh

```bash
[root@ ~]# kubectl exec deploy/sleep -- sh -c "while true; do curl -s http://productpage:9080/productpage | grep reviews-v.-; done"
```

### Use grafana to visualize service metrics

1. Use the port-forward command to forward traffic to grafana:

```bash
[root@ ~]# kubectl port-forward --address 0.0.0.0 svc/grafana 3000:3000 -n kmesh-system
Forwarding from 0.0.0.0:3000 -> 3000
```

2. View the dashboard from browser

Visit `Dashboards>Kmesh>Kmesh Service Dashboard`:

<div align="center">
<img src="/docs/userguide/pics/grafana.png" width="1400" />
</div>
