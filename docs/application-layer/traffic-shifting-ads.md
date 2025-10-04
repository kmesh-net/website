---
sidebar_position: 2
title: Traffic Shifting
description: Set up weight-based and header-based HTTP traffic shifting in Kmesh.
keywords: [traffic shifting, weight, header, routing, http, split]
---

This task shows you how to set up Traffic Shifting policy for http traffic in Kmesh.

## Before you begin

- Install Kmesh
  
  Please refer to [quickstart](/docs/setup/quick-start.md) and change into `Kernel Native Mode`
  
- Deploy the fortio Applications

  ```bash
  kubectl apply -f samples/fortio/fortio-route.yaml
  kubectl apply -f samples/fortio/netutils.yaml
  ```

- Check app status and ensure that the service application is managed by Kmesh

  ```bash
  kubectl get pod 
  NAME                         READY   STATUS    RESTARTS   AGE
  fortio-v1-596b55cb8b-sfktr   1/1     Running   0          57m
  fortio-v2-76997f99f4-qjsmd   1/1     Running   0          57m
  netutils-575f5c569-lr98z     1/1     Running   0          67m
  
  kubectl describe pod netutils-575f5c569-lr98z | grep Annotations
  Annotations:      kmesh.net/redirection: enabled
  ```

## Test the routing configuration

- Display the defined routes with the following command:

  ```bash
  $ kubectl get virtualservices -o yaml
  apiVersion: v1
  items:
  - apiVersion: networking.istio.io/v1beta1
    kind: VirtualService
    metadata:
      annotations:
        kubectl.kubernetes.io/last-applied-configuration: |
          {"apiVersion":"networking.istio.io/v1alpha3","kind":"VirtualService","metadata":{"annotations":{},"name":"fortio","namespace":"default"},"spec":{"hosts":["fortio"],"http":[{"route":[{"destination":{"host":"fortio","subset":"v1"},"weight":90},{"destination":{"host":"fortio","subset":"v2"},"weight":10}]}]}}
      creationTimestamp: "2024-07-09T09:00:36Z"
      generation: 1
      name: fortio
      namespace: default
      resourceVersion: "11166"
      uid: 0a07f283-ac26-4d86-b3bd-ce6aa07dc628
    spec:
      hosts:
      - fortio
      http:
      - route:
        - destination:
            host: fortio
            subset: v1
          weight: 90
        - destination:
            host: fortio
            subset: v2
          weight: 10
  kind: List
  metadata:
    resourceVersion: ""
  ```

- You have configured fortio 90% to route to the `v1` version of the fortio server

  ```bash
  $ for i in {1..20}; do kubectl exec -it $(kubectl get pod | grep netutils | awk '{print $1}') -- curl -v $(kubectl get svc -owide | grep fortio | awk '{print $3}'):80 | grep "Server:"; done
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 2
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 1
  < Server: 2
  < Server: 1
  < Server: 1
  ```

## Route based on user identity

- Next, you will change the route configuration so that all traffic from a specific user is routed to a specific service version. In this case, all traffic from a user named Jason will be routed to the service `fortio:v2`.

- Apply the updated configuration:

  ```bash
  kubectl apply -f samples/fortio/fortio-v1-10-v2-90.yaml
  ```

  **fortio-header.yaml**

  ```yaml
  apiVersion: networking.istio.io/v1alpha3
  kind: VirtualService
  metadata:
    name: fortio
  spec:
    hosts:
    - fortio
    http:
    - route:
      - destination:
          host: fortio
          subset: v1
        weight: 10
      - destination:
          host: fortio
          subset: v2
        weight: 90
  ```
  
- Verify response from Server 1:

  ```bash
  $ for i in {1..20}; do kubectl exec -it $(kubectl get pod | grep netutils | awk '{print $1}') -- curl -v $(kubectl get svc -owide | grep fortio | awk '{print $3}'):80 | grep "Server:"; done
  < Server: 2
  < Server: 2
  < Server: 1
  < Server: 2
  < Server: 1
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 1
  < Server: 2
  < Server: 2
  < Server: 2
  < Server: 1
  < Server: 2
  < Server: 2
  < Server: 2
  ```

## Understanding what happened

In this task you migrated traffic from an old to new version of the `fortio` service using kmesh's weighted routing feature.

With Kmesh, you can allow the two versions of the `fortio` service to scale up and down independently, without affecting the traffic distribution between them.

## Clean up

1. Remove the application route rules:

   ```bash
   kubectl delete -f samples/fortio/fortio-route.yaml
   kubectl delete -f samples/fortio/netutils.yaml
   ```

2. Remove kmesh:

   - Please refer to [cleanup](/docs/setup/quick-start.md#clean-up)
