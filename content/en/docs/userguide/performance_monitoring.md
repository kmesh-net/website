---
draft: false
linktitle: Use Grafana to visualize kmesh perofrmance monitoring
menu:
  docs:
    parent: user guide
    weight: 19
title: Use Grafana to visualize kmesh perofrmance monitoring
toc: true
type: docs

---

### Preparation

1. Make default namespace managed by Kmesh

2. Deploy bookinfo as sample application and sleep as curl client

3. Install namespace granularity waypoint for default namespace

*The above steps could refer to [Install Waypoint | Kmesh](https://kmesh.net/en/docs/userguide/install_waypoint/#preparation)*

4. Deploy prometheus and garafana:

```bash
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/prometheus.yaml
[root@ ~]# kubectl apply -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/grafana.yaml
```
### Generate some continuous traffic between applications in the mesh

```bash
[root@ ~]# kubectl exec deploy/sleep -- sh -c "while true; do curl -s http://productpage:9080/productpage | grep reviews-v.-; sleep 1; done"
```
### Use grafana to visualize kmesh performance monitoring

1. Use the port-forward command to forward traffic to grafana:

```bash
[root@ ~]# kubectl port-forward --address 0.0.0.0 svc/grafana 3000:3000 -n kmesh-system
Forwarding from 0.0.0.0:3000 -> 3000
```

2. View the dashboard from browser

Visit `Dashboards>Kmesh>Kmesh performance monitoring`:

<div align="center">
<img src="/docs/userguide/kmesh_deamon_monitoring.jpg" width="1400" />
<img src="/docs/userguide/kmesh_map_and_operation_monitoring.jpg" width="1400" />
</div>

### Cleanup

1. Remove prometheus and grafana:

```bash
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/prometheus.yaml
[root@ ~]# kubectl delete -f https://raw.githubusercontent.com/kmesh-net/kmesh/main/samples/addons/grafana.yaml
```