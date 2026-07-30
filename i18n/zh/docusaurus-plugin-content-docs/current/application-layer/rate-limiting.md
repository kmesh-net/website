--- 
title: 限流
sidebar_position: 11
---

本文档提供逐步指南，介绍如何测试 Kmesh 的本地限流和全局限流功能。内容涵盖部署所需组件、配置流量规则，以及观察限流行为。

## 本地限流

### 1. 部署 Kmesh 和 istiod（版本 1.24 或更高）

请阅读[快速入门](https://kmesh.net/docs/setup/quick-start)以完成 Kmesh 的部署。

### 2. 部署 sleep 和 httpbin

我们将部署 `httpbin` 作为接收请求的后端服务，并部署 `sleep` 作为发送请求的客户端。

``` sh
kubectl apply -f samples/sleep/sleep.yaml
kubectl apply -f samples/httpbin/httpbin.yaml
```

### 3. 为 httpbin 部署 Waypoint

首先，如果尚未安装 Kubernetes Gateway API CRD，请运行以下命令进行安装。

``` sh
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=v1.4.0" | kubectl create -f -; }
```

接下来，为 `httpbin` 服务创建专用的 Waypoint 代理，并为该服务打上标签，使其流量经由该 Waypoint。

```sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest

kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

### 4. 部署 EnvoyFilter

此 `EnvoyFilter` 资源会将本地限流过滤器注入到 `httpbin` 服务的 Waypoint 代理中。该过滤器配置了以下规则：

- 带有请求头 `quota: low` 的请求将被限制为**每 300 秒 1 个请求**。
- 带有请求头 `quota: medium` 的请求将被限制为**每 300 秒 3 个请求**。
- 其他请求将受默认限制：**每 300 秒 10 个请求**。

`workloadSelector` 确保该过滤器仅应用于 `httpbin-waypoint` 代理。

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

### 5. 通过 istioctl 查看 Waypoint 中的 EnvoyFilter 配置

为验证配置，首先获取 Waypoint Pod 的名称，然后使用 `istioctl` 检查其配置。

```sh
export WAYPOINT_POD=$(kubectl get pod -l gateway.networking.k8s.io/gateway-name=httpbin-waypoint -o jsonpath='{.items[0].metadata.name}')
istioctl proxy-config all $WAYPOINT_POD -ojson | grep ratelimit -A 20
```

### 6. 若出现以下结果，说明配置已下发到 Waypoint

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

### 7. 通过 sleep 访问 httpbin，验证限流是否生效

现在，从 `sleep` Pod 向 `httpbin` 服务发送请求，以测试限流规则。

首先，获取 `sleep` Pod 的名称：

```sh
export SLEEP_POD=$(kubectl get pod -l app=sleep -o jsonpath='{.items[0].metadata.name}')
```

#### 测试用例 1："medium" 配额

`quota: medium` 的规则允许 3 个请求。第 4 个请求应被限流。

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:medium' http://httpbin:8000/headers
```

第 4 条命令的预期输出：

``` sh
local_rate_limited
```

#### 测试用例 2："low" 配额

`quota: low` 的规则仅允许 1 个请求。第 2 个请求应被限流。

```sh
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
kubectl exec -it $SLEEP_POD -- curl -H 'quota:low' http://httpbin:8000/headers
```

第 2 条命令的预期输出：

``` sh
local_rate_limited
```

## 全局限流

本节介绍如何使用全局限流服务。你将部署示例应用、配置限流规则、在入口网关上启用 Envoy HTTP Rate Limit 过滤器，并在超出限制时验证响应。

### 1. 部署 Kmesh 和 istiod（版本 1.24 至 1.26）

请阅读[快速入门](https://kmesh.net/docs/setup/quick-start)以完成 Kmesh 的部署。

### 2. 部署 httpbin

部署 httpbin 应用。将 `./samples/httpbin/httpbin.yaml` 中的 `replicas: 1` 改为 `replicas: 2`，以确保由多个实例处理请求。

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

为 httpbin 服务创建 Waypoint。如果尚未安装 Kubernetes Gateway API CRD，请运行[本地限流](#3-为-httpbin-部署-waypoint)中的相同命令。

``` sh
kmeshctl waypoint apply -n default --name httpbin-waypoint --image ghcr.io/kmesh-net/waypoint:latest
kubectl label service httpbin istio.io/use-waypoint=httpbin-waypoint
```

### 3. 配置请求限流

创建由限流服务消费的 `ConfigMap`。它定义了基于 PATH 的描述符：将 `/status/200` 限制为每分钟 1 个请求，将其余所有路径限制为每分钟 100 个请求。

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

部署 Envoy 全局限流服务。它读取 `ratelimit-config` `ConfigMap`，并暴露供入口网关使用的 gRPC 端点。

``` sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.25/samples/ratelimit/rate-limit-service.yaml
```

### 5. 配置 EnvoyFilter 以使用全局限流服务

将 Envoy HTTP Rate Limit 过滤器插入 HTTP 过滤器链，并指向 `ratelimit` gRPC 服务。

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

再应用第二个 `EnvoyFilter`，将 `:path` 请求头映射到 `PATH` 描述符。

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
        # Applies the rate limit rules.
        value:
          rate_limits:
            - actions:
              - request_headers:
                  header_name: ":path"
                  descriptor_key: "PATH"
EOF
```

### 6. 针对 httpbin 测试限流

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

输出显示的 HTTP 状态码含义如下：

- **200**：OK。请求成功。
- **429**：Too Many Requests。因超出限流而被拒绝。
