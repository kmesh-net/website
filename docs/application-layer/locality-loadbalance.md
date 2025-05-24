---
sidebar_position: 9
title: Locality Load Balancing
---

This document introduces how to use Locality Load Balancing with Istio in the Kmesh.

> The current Kmesh Locality Load Balancing is at the L4 level and only support [Locality Failover](https://istio.io/latest/docs/tasks/traffic-management/locality-load-balancing/failover/).

## What is Locality Load Balancing?

A locality defines the geographic location of a workload instance within mesh. Locality Load Balancing in service mesh helps improve the availability and performance of services by intelligently routing traffic based on the location of the service instances.

We strongly recommend that you first read <https://istio.io/latest/docs/tasks/traffic-management/locality-load-balancing/> to understand what locality load balancing is.

## Supported Modes and Configuration Methods for Kmesh

Currently, Istio's ambient mode only supports specifying a fixed locality load balancing policy by configuring specific fields. This includes two modes: PreferClose and Local.

### 1. PreferClose

A failover mode that uses NETWORK, REGION, ZONE, and SUBZONE as the routingPreference.

- With `spec.trafficDistribution`（k8s >= beta [1.31.0](https://kubernetes.io/docs/concepts/services-networking/service/), isito >= [1.23.1](https://istio.io/latest/news/releases/1.23.x/announcing-1.23/)）

  ```yaml
  spec:
    trafficDistribution: # spec.trafficDistribution
      preferClose: true
  ```

- With annotation

  ```yaml
  metadata:
    annotations:
      networking.istio.io/traffic-distribution: PreferClose
  ```

### 2. Local

A strict mode that only matches the current NODE.

- spec.internalTrafficPolicy: Local (k8s >= beta 1.24 or >= 1.26)

  ```yaml
  spec:
    internalTrafficPolicy: Local
  ```

## Experimental Testing

### Prepare the environment

- Refer to [develop with kind](/docs/setup/develop-with-kind.md)
- We prepare three nodes in the cluster
- istio >= 1.23.1
- k8s >= 1.31.0
- Ensure sidecar injection is disabled: `kubectl label namespace default istio-injection-`
- Required images:
  - docker.io/istio/examples-helloworld-v1
  - curlimages/curl

```yaml
kind create cluster --image=kindest/node:v1.31.0 --config=- <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: ambient
nodes:
- role: control-plane
- role: worker
- role: worker
- role: worker
EOF
```

### 1. Assign locality information to the node

```bash
kubectl label node ambient-worker topology.kubernetes.io/region=region
kubectl label node ambient-worker topology.kubernetes.io/zone=zone1
kubectl label node ambient-worker topology.kubernetes.io/subzone=subzone1
```

```bash
kubectl label node ambient-worker2 topology.kubernetes.io/region=region
kubectl label node ambient-worker2 topology.kubernetes.io/zone=zone1
kubectl label node ambient-worker2 topology.kubernetes.io/subzone=subzone2
```

```bash
kubectl label node ambient-worker3 topology.kubernetes.io/region=region
kubectl label node ambient-worker3 topology.kubernetes.io/zone=zone2
kubectl label node ambient-worker3 topology.kubernetes.io/subzone=subzone3
```

### 2. Start test servers

- Create `sample` namespace

  ```bash
  kubectl create namespace sample
  ```

- Run a service

  ```yaml
  kubectl apply -n sample -f - <<EOF
  apiVersion: v1
  kind: Service
  metadata:
    name: helloworld
    labels:
      app: helloworld
      service: helloworld
  spec:
    ports:
    - port: 5000
      name: http
    selector:
      app: helloworld
    trafficDistribution: PreferClose
  EOF
  ```

- Start a service instance on the ambient-worker

  ```yaml
  kubectl apply -n sample -f - <<EOF
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: helloworld-region.zone1.subzone1
    labels:
      app: helloworld
      version: region.zone1.subzone1
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: helloworld
        version: region.zone1.subzone1
    template:
      metadata:
        labels:
          app: helloworld
          version: region.zone1.subzone1
      spec:
        containers:
        - name: helloworld
          env:
          - name: SERVICE_VERSION
            value: region.zone1.subzone1
          image: docker.io/istio/examples-helloworld-v1
          resources:
            requests:
              cpu: "100m"
          imagePullPolicy: IfNotPresent
          ports:
          - containerPort: 5000
        nodeSelector:
          kubernetes.io/hostname: ambient-worker
  EOF
  ```

- Start a service instance on the ambient-worker2

  ```yaml
  kubectl apply -n sample -f - <<EOF
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: helloworld-region.zone1.subzone2
    labels:
      app: helloworld
      version: region.zone1.subzone2
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: helloworld
        version: region.zone1.subzone2
    template:
      metadata:
        labels:
          app: helloworld
          version: region.zone1.subzone2
      spec:
        containers:
        - name: helloworld
          env:
          - name: SERVICE_VERSION
            value: region.zone1.subzone2
          image: docker.io/istio/examples-helloworld-v1
          resources:
            requests:
              cpu: "100m"
          imagePullPolicy: IfNotPresent
          ports:
          - containerPort: 5000
        nodeSelector:
          kubernetes.io/hostname: ambient-worker2
  EOF
  ```

- Start a service instance on the ambient-worker3

  ```yaml
  kubectl apply -n sample -f - <<EOF
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: helloworld-region.zone2.subzone3
    labels:
      app: helloworld
      version: region.zone2.subzone3
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: helloworld
        version: region.zone2.subzone3
    template:
      metadata:
        labels:
          app: helloworld
          version: region.zone2.subzone3
      spec:
        containers:
        - name: helloworld
          env:
          - name: SERVICE_VERSION
            value: region.zone2.subzone3
          image: docker.io/istio/examples-helloworld-v1
          resources:
            requests:
              cpu: "100m"
          imagePullPolicy: IfNotPresent
          ports:
          - containerPort: 5000
        nodeSelector:
          kubernetes.io/hostname: ambient-worker3
  EOF
  ```

### 3. Test on client

- Start the test client on the ambient-worker

  ```yaml
  kubectl apply -n sample -f - <<EOF
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: sleep
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: sleep
    template:
      metadata:
        labels:
          app: sleep
      spec:
        terminationGracePeriodSeconds: 0
        containers:
        - name: sleep
          image: curlimages/curl
          command: ["/bin/sleep", "infinity"]
          imagePullPolicy: IfNotPresent
          volumeMounts:
          - mountPath: /etc/sleep/tls
            name: secret-volume
        volumes:
        - name: secret-volume
          secret:
            secretName: sleep-secret
            optional: true
        nodeSelector:
          kubernetes.io/hostname: ambient-worker
  EOF
  ```

- Test the access

  ```bash
  kubectl exec -n sample "$(kubectl get pod -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}')" -c sleep -- curl -sSL "http://helloworld:5000/hello"
  ```

  The output is from the helloworld-region.zone1.subzone1 that is currently co-located on the ambient-worker:

  ```text
  Hello version: region.zone1.subzone1, instance: helloworld-region.zone1.subzone1-6d6fdfd856-9dhv8
  ```

- Remove the service on the ambient-worker and test Failover

  ```bash
  kubectl delete deployment -n sample helloworld-region.zone1.subzone1
  ```

  ```bash
  kubectl exec -n sample "$(kubectl get pod -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}')" -c sleep -- curl -sSL "http://helloworld:5000/hello"
  ```

  The output is helloworld-region.zone1.subzone2, and a failover of the traffic has occurred:

  ```text
  Hello version: region.zone1.subzone2, instance: helloworld-region.zone1.subzone2-948c95bdb-7p6zb
  ```

- Relabel the locality of the ambient-worker3 same as the worker2 and test

  ```bash
  kubectl label node ambient-worker3 topology.kubernetes.io/zone=zone1 --overwrite
  kubectl label node ambient-worker3 topology.kubernetes.io/subzone=subzone2 --overwrite
  ```

  Delete helloworld-region.zone2.subzone3 and re-apply the development pod as follows, then run test:

  ```bash
  kubectl delete deployment -n sample helloworld-region.zone2.subzone3

  kubectl apply -n sample -f - <<EOF
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: helloworld-region.zone1.subzone2-worker3
    labels:
      app: helloworld
      version: region.zone1.subzone2-worker3
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: helloworld
        version: region.zone1.subzone2-worker3
    template:
      metadata:
        labels:
          app: helloworld
          version: region.zone1.subzone2-worker3
      spec:
        containers:
        - name: helloworld
          env:
          - name: SERVICE_VERSION
            value: region.zone1.subzone2-worker3
          image: docker.io/istio/examples-helloworld-v1
          resources:
            requests:
              cpu: "100m"
          imagePullPolicy: IfNotPresent
          ports:
          - containerPort: 5000
        nodeSelector:
          kubernetes.io/hostname: ambient-worker3
  EOF
  ```

  Test multiple times:

  ```bash
  kubectl exec -n sample "$(kubectl get pod -n sample -l app=sleep -o jsonpath='{.items[0].metadata.name}')" -c sleep -- curl -sSL "http://helloworld:5000/hello"
  ```

  The output randomly shows helloworld-region.zone1.subzone2 and helloworld-region.zone1.subzone2-worker3:

  ```text
  Hello version: region.zone1.subzone2-worker3, instance: helloworld-region.zone1.subzone2-worker3-6d6fdfd856-6kd2s
  Hello version: region.zone1.subzone2, instance: helloworld-region.zone1.subzone2-948c95bdb-7p6zb
  Hello version: region.zone1.subzone2, instance: helloworld-region.zone1.subzone2-948c95bdb-7p6zb
  Hello version: region.zone1.subzone2-worker3, instance: helloworld-region.zone1.subzone2-worker3-6d6fdfd856-6kd2s
  Hello version: region.zone1.subzone2, instance: helloworld-region.zone1.subzone2-948c95bdb-7p6zb
  ```
