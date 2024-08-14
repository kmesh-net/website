---
draft: false
linktitle: Try Request Routing
menu:
  docs:
    parent: user guide
    weight: 5
title: Try Request Routing
toc: true
type: docs


---

### Preparation

- install Kmesh, refer [install-kmesh|Quick Start | Kmesh](https://kmesh.net/en/docs/setup/quickstart/#install-kmesh)

Refer [Install Waypoint | Kmesh](https://kmesh.net/en/docs/userguide/install_waypoint/#preparation) in following steps

- Deploy sample application
- Deploy bookinfo
- Deploy sleep as curl client
- Install service granulairty waypoint

### Apply version1 routing

1. Run the following command to create the route rules:

```bash
kubectl apply -f -<<EOF
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
      weight: 100
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
You have configured all the `reviews` service to route to the `reviews-v1` version.

2. Confirm that all the traffic go to `reviews-v1`

```bash
kubectl exec deploy/sleep -- sh -c "for i in \$(seq 1 100); do curl -s http://productpage:9080/productpage | grep reviews-v.-; done"
```

3. If successful, the output should look like the following:

```bash
<u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
        ...
        <u>reviews-v1-598f9b58fc-jc25r</u>
        <u>reviews-v1-598f9b58fc-jc25r</u>
```

### Apply user-identity-based

Next, you will change the route configuration so that all traffic from a specific user is routed to a specific service version. In this case, all traffic from a user named Jason will be routed to the service `reviews:v2`.

This example is enabled by the fact that the `productpage` service adds a custom `end-user` header to all outbound HTTP requests to the reviews service.

1. Run the following command to enable user-based routing:

```bash
kubectl apply -f -<<EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
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

2. Confirm the traffic

- On the `/productpage` of the Bookinfo app, log in as user `jason`. The star ratings appear next to each review.

![Request Routing1](/docs/user_guide/request_routing1.png)

- Log in as another user. Refresh the browser. Now the stars are gone. This is because traffic is routed to `reviews:v1` for all users except Jason.

![Request Routing2](/docs/user_guide/request_routing2.png)

### Understanding what happened

In this task, you used Kmesh to send 100% of the traffic to the `v1` version of each of `reviews` services. You then set a rule to selectively send traffic to version `v2` of the `reviews` service based on a custom `end-user` header added to the request by the `productpage` service.

### Cleanup

1. Remove the application routing rules:

```bash
kubectl delete virtualservice reviews
kubectl delete destinationrules reviews
```

2. If you are not planning to explore any follow-on tasks, refer to the [Install Waypoint/Cleanup](https://kmesh.net/en/docs/userguide/install_waypoint/#cleanup) instructions to remove waypoint and shutdown the application.





