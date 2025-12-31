---
title: 限流
sidebar_position: 11
---

本文档提供了如何测试 Kmesh 本地限流和全局限流功能的分步指南。它涵盖了部署必要组件、配置流量规则以及观察限流行为。

## 本地限流

### 1. 部署 Kmesh 和 istiod（版本 1.24 或更高版本）

请阅读[快速入门](https://kmesh.net/docs/setup/quick-start)完成 Kmesh 的部署。

### 2. 部署 sleep 和 httpbin

我们将部署 `httpbin` 作为接收请求的后端服务，`sleep` 作为发送请求的客户端。

``` sh
kubectl apply -f samples/sleep/sleep.yaml
kubectl apply -f samples/httpbin/httpbin.yaml
```

### 3. 为 httpbin 部署 waypoint

首先，如果您尚未安装 Kubernetes Gateway API CRD，请运行以下命令进行安装。

``` sh
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=v1.4.0" | kubectl create -f -; }
```

接下来，为 `httpbin` 服务创建专用的 Waypoint 代理，并为该服务添加标签以将其流量引导到此 Waypoint。

```sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest

kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

### 4. 部署 EnvoyFilter

此 `EnvoyFilter` 资源将本地限流过滤器注入到 `httpbin` 服务的 Waypoint 代理中。过滤器配置了以下规则：

- 带有 `quota: low` 头的请求将被限制为**每 300 秒 1 个请求**。
- 带有 `quota: medium` 头的请求将被限制为**每 300 秒 3 个请求**。
- 其他请求将受到**每 300 秒 10 个请求**的默认限制。

`workloadSelector` 确保此过滤器仅应用于 `httpbin-waypoint` 代理。

```sh
kubectl apply -f -<<EOF
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: httpbin.ratelimit
  namespace: default
spec:
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
      proxy:
        proxyVersion: ^1.*
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.local_ratelimit
        typed_config:
          '@type': type.googleapis.com/udpa.type.v1.TypedStruct
          type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
          value:
            customResponseBody: local_rate_limited
            statPrefix: http_local_rate_limiter
  - applyTo: HTTP_ROUTE
    match:
      proxy:
        proxyVersion: ^1.*
      routeConfiguration:
        vhost:
          name: inbound|http|8000
          route:
            name: default
    patch:
      operation: MERGE
      value:
        typed_per_filter_config:
          envoy.filters.http.local_ratelimit:
            '@type': type.googleapis.com/udpa.type.v1.TypedStruct
            type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
            value:
              customResponseBody: local_rate_limited
              descriptors:
              - entries:
                - key: header_match
                  value: Service[httpbin.default]-User[none]-Id[3100861967]
                tokenBucket:
                  fillInterval: 300s
                  maxTokens: 1
                  tokensPerFill: 1
              - entries:
                - key: header_match
                  value: Service[httpbin.default]-User[none]-Id[4123289408]
                tokenBucket:
                  fillInterval: 300s
                  maxTokens: 3
                  tokensPerFill: 3
              filterEnabled:
                defaultValue:
                  numerator: 100
                runtimeKey: local_rate_limit_enabled
              filterEnforced:
                defaultValue:
                  numerator: 100
                runtimeKey: local_rate_limit_enforced
              rateLimits:
              - actions:
                - headerValueMatch:
                    descriptorValue: Service[httpbin.default]-User[none]-Id[3100861967]
                    headers:
                    - exactMatch: low
                      name: quota
              - actions:
                - headerValueMatch:
                    descriptorValue: Service[httpbin.default]-User[none]-Id[4123289408]
                    headers:
                    - exactMatch: medium
                      name: quota
              responseHeadersToAdd:
              - append: false
                header:
                  key: x-local-rate-limit
                  value: "true"
              statPrefix: http_local_rate_limiter
              tokenBucket:
                fillInterval: 300s
                maxTokens: 10
                tokensPerFill: 10
  workloadSelector:
    labels:
      gateway.networking.k8s.io/gateway-name: httpbin-waypoint
EOF
```

### 5. 通过 istioctl 查看 waypoint 中的 envoy filter 配置

要验证配置，首先获取 Waypoint Pod 的名称，然后使用 `istioctl` 检查其配置。

```sh
export WAYPOINT_POD=$(kubectl get pod -l gateway.networking.k8s.io/gateway-name=httpbin-waypoint -o jsonpath='{.items[0].metadata.name}')
istioctl proxy-config all $WAYPOINT_POD -ojson | grep ratelimit -A 20
```

### 6. 查找以下结果，表示配置已发送到 waypoint

```sh
        "envoy.filters.http.local_ratelimit": {
            "@type": "type.googleapis.com/udpa.type.v1.TypedStruct",
            "type_url": "type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit",
            "value": {
             "stat_prefix": "http_local_rate_limiter",
             "token_bucket": {
              "max_tokens": 10,
              "tokens_per_fill": 10,
              "fill_interval": "300s"
             },
             "filter_enabled": {
              "default_value": {
               "numerator": 100
              },
              "runtime_key": "local_rate_limit_enabled"
             },
             "filter_enforced": {
              "default_value": {
               "numerator": 100
              },
              "runtime_key": "local_rate_limit_enforced"
             },
             "response_headers_to_add": [
```

### 7. 通过 sleep 访问 httpbin 查看限流是否生效

现在，让我们从 `sleep` Pod 向 `httpbin` 服务发送请求来测试限流规则。

首先，获取 `sleep` Pod 的名称：

```sh
export SLEEP_POD=$(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}')
```

#### 测试用例 1："medium" 配额

`quota: medium` 规则允许 3 个请求。第四个请求应该被限流。

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
```

第四个命令的预期输出：

``` sh
local_rate_limited
```

#### 测试用例 2："low" 配额

`quota: low` 规则仅允许 1 个请求。第二个请求应该被限流。

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
```

第二个命令的预期输出：

``` sh
local_rate_limited
```

## 全局限流

本节展示如何使用全局限流服务。您将部署一个示例应用程序，配置限流规则，在入口网关上启用 Envoy HTTP 限流过滤器，并验证超出限制时的响应。

### 1. 部署 Kmesh 和 istiod（版本 1.24 到 1.26）

请阅读[快速入门](https://kmesh.net/docs/setup/quick-start)完成 Kmesh 的部署。

### 2. 部署 httpbin

部署 httpbin 应用程序。在 `./samples/httpbin/httpbin.yaml` 中将 `replicas: 1` 更改为 `replicas: 2`，以确保多个实例处理请求。

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpbin
spec:
  replicas: 2
# ...
```

``` sh
kubectl apply -f ./samples/httpbin/httpbin.yaml
```

为 httpbin 服务创建 waypoint。如果您尚未安装 Kubernetes Gateway API CRD，请运行[本地限流](#3-为-httpbin-部署-waypoint)中的相同命令。

``` sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest
kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

### 3. 配置请求限流规则

创建一个由限流服务使用的 `ConfigMap`。它定义了基于路径的描述符，将 `/status/200` 限制为每分钟 1 个请求，所有其他路径限制为每分钟 100 个请求。

```sh
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ratelimit-config
data:
  config.yaml: |
    domain: ratelimit
    descriptors:
      - key: PATH
        value: "/status/200"
        rate_limit:
          unit: minute
          requests_per_unit: 1
      - key: PATH
        rate_limit:
          unit: minute
          requests_per_unit: 100
EOF
```

### 4. 部署全局限流服务

部署 Envoy 全局限流服务。它读取 `ratelimit-config` ConfigMap 并暴露一个 gRPC 端点供入口网关使用。

``` sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.25/samples/ratelimit/rate-limit-service.yaml
```

### 5. 配置 EnvoyFilter 以使用全局限流服务

将 Envoy HTTP 限流过滤器插入到 HTTP 过滤器链中，并将其指向 `ratelimit` gRPC 服务。

```sh
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: filter-ratelimit
  namespace: default
spec:
  workloadSelector:
    labels:
      gateway.networking.k8s.io/gateway-name: httpbin-waypoint
  configPatches:
    - applyTo: CLUSTER
      match:
        context: SIDECAR_INBOUND
      patch:
        operation: ADD
        value:
          name: rate_limit_cluster
          type: STRICT_DNS
          connect_timeout: 0.25s
          lb_policy: ROUND_ROBIN
          http2_protocol_options: {}
          load_assignment:
            cluster_name: rate_limit_cluster
            endpoints:
            - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: ratelimit.default.svc.cluster.local
                      port_value: 8081
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: "envoy.filters.network.http_connection_manager"
              subFilter:
                name: "envoy.filters.http.router"
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.ratelimit
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
            domain: ratelimit
            failure_mode_deny: true
            timeout: 10s
            rate_limit_service:
              grpc_service:
                envoy_grpc:
                  cluster_name: rate_limit_cluster
                  authority: ratelimit.default.svc.cluster.local
              transport_api_version: V3
EOF
```

应用第二个 `EnvoyFilter`，将 `:path` 请求头映射到 `PATH` 描述符。

``` sh
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: filter-ratelimit-svc
  namespace: default
spec:
  workloadSelector:
    labels:
      gateway.networking.k8s.io/gateway-name: httpbin-waypoint
  configPatches:
    - applyTo: VIRTUAL_HOST
      match:
        context: SIDECAR_INBOUND
        routeConfiguration:
          vhost:
            name: ""
            route:
              action: ANY
      patch:
        operation: MERGE
        # 应用限流规则。
        value:
          rate_limits:
            - actions:
              - request_headers:
                  header_name: ":path"
                  descriptor_key: "PATH"
EOF
```

### 6. 对 httpbin 进行限流测试

``` sh
kubectl apply -f ./samples/sleep/sleep.yaml
sleep 10
export SLEEP_POD=$(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}')
```

``` sh
for i in {0..2}; do kubectl exec -it $SLEEP_POD -- curl -s "http://httpbin:8000/status/200" -o /dev/null -w "%{http_code}\n"; sleep 1; done
```

预期输出：

``` sh
200
429
429
```

输出显示 HTTP 状态码：

- **200**：正常。请求成功。
- **429**：请求过多。请求被拒绝，因为超出了限流限制。
