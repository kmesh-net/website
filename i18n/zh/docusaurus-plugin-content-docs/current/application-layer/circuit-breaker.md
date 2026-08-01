--- 
title: 熔断器
sidebar_position: 10
---

本文档提供逐步指南，介绍如何测试 Kmesh 的熔断功能。内容涵盖部署所需组件、配置流量规则，以及观察熔断行为。

## 步骤 1. 部署 Kmesh

请阅读[快速入门](https://kmesh.net/docs/setup/quick-start)以完成 Kmesh 的部署。

## 步骤 2. 部署 fortio 和 httpbin

``` sh
kubectl apply -f -<<EOF
apiVersion: v1
kind: Service
metadata:
  name: fortio
  labels:
    app: fortio
    service: fortio
spec:
  ports:
  - port: 8080
    name: http
  selector:
    app: fortio
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fortio-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fortio
  template:
    metadata:
      annotations:
        # This annotation causes Envoy to serve cluster.outbound statistics via 15000/stats
        # in addition to the stats normally served by Istio. The Circuit Breaking example task
        # gives an example of inspecting Envoy stats via proxy config.
        proxy.istio.io/config: |-
          proxyStatsMatcher:
            inclusionPrefixes:
            - "cluster.outbound"
            - "cluster_manager"
            - "listener_manager"
            - "server"
            - "cluster.xds-grpc"
      labels:
        app: fortio
    spec:
      containers:
      - name: fortio
        image: fortio/fortio:latest_release
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http-fortio
        - containerPort: 8079
          name: grpc-ping
EOF
```

```sh
kubectl apply -f samples/httpbin/httpbin.yaml
```

## 步骤 3. 为 httpbin 配置 Waypoint

首先，如果尚未安装 Kubernetes Gateway API CRD，请运行以下命令进行安装。

``` sh
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=444631bfe06f3bcca5d0eadf1857eac1d369421d" | kubectl apply -f -; }
```

接下来，为 `httpbin` 服务创建专用的 Waypoint 代理，并为该服务打上标签，使其流量经由该 Waypoint。

```sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest
kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

## 步骤 4. 配置 DestinationRule

```sh
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: httpbin
spec:
  host: httpbin
  trafficPolicy:
    connectionPool:
      tcp:
        # Maximum number of TCP connections to the target service
        maxConnections: 1
      http:
        # Maximum number of pending HTTP requests
        http1MaxPendingRequests: 1
        # Maximum number of requests allowed per connection.
        maxRequestsPerConnection: 1
    outlierDetection:
      # Circuit breaker settings
      consecutive5xxErrors: 1
      interval: 1s
      baseEjectionTime: 3m
      maxEjectionPercent: 100
EOF
```

## 步骤 5. 通过 istioctl 查看 Waypoint 中的 CDS 配置

首先，获取 Waypoint Pod 的名称。

```sh
export WAYPOINT_POD=$(kubectl get pod -l gateway.networking.k8s.io/gateway-name=httpbin-waypoint -o jsonpath='{.items[0].metadata.name}')
```

然后查看配置。

```sh
istioctl proxy-config all $WAYPOINT_POD 
```

## 步骤 6. 通过 fortio 访问以观察实际现象

现在，使用 `fortio` 向 `httpbin` 发送突发流量。

```sh
export FORTIO_POD=$(kubectl get pods -l app=fortio -o 'jsonpath={.items[0].metadata.name}')

kubectl exec "$FORTIO_POD" -c fortio -- /usr/bin/fortio load -c 5 -qps 0 -n 50 -loglevel Warning http://httpbin:8000/get
```

你应该会看到部分请求以 503 错误失败，表明熔断器按预期工作。

```sh
...
IP addresses distribution:
10.96.56.163:8000: 33
Code 200 : 19 (38.0 %)
Code 503 : 31 (62.0 %)
Response Header Sizes : count 50 avg 114.38 +/- 146.1 min 0 max 301 sum 5719
Response Body/Total Sizes : count 50 avg 382.48 +/- 46.6 min 346 max 442 sum 19124
All done 50 calls (plus 0 warmup) 3.162 ms avg, 1247.0 qps
```
