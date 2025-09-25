---
sidebar_position: 5
title: 尝试 Service Entry
---

Service Entry 使您能够添加条目到 Istio 内部维护的服务注册表，以便网格中的服务可以访问和路由到这些手动指定的服务。本指南将向您展示如何使用 Service Entry 配置外部服务访问。

## 准备工作

1. **使默认命名空间由 Kmesh 管理**
2. **部署 Httpbin 作为示例应用程序，并部署 Sleep 作为 curl 客户端**
3. **为默认命名空间安装 waypoint**

   _以上步骤可以参考 [安装 Waypoint | Kmesh](/i18n/zh/docusaurus-plugin-content-docs/current/application-layer/install_waypoint.md#准备工作)_

## 部署示例应用程序

我们需要部署 Httpbin 作为目标服务：

```bash
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.21/samples/httpbin/httpbin.yaml
```

检查部署状态：

```bash
kubectl get pods
```

您应该看到 httpbin 和 sleep 正在运行：

```bash
NAME                       READY   STATUS    RESTARTS   AGE
httpbin-6f4464f6c5-h9x2p   1/1     Running   0          30s
sleep-9454cc476-86vgb      1/1     Running   0          5m
```

## 配置 Service Entry 和路由规则

现在我们将创建一个 Service Entry 来定义外部服务，并配置 VirtualService 将流量路由到内部服务。

应用以下配置：

```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-fake-svc
  namespace: default
spec:
  exportTo:
    - "*"
  hosts:
    - kmesh-fake.com
  ports:
    - name: http
      number: 80
      protocol: HTTP
  addresses:
    - 240.240.0.1
  resolution: DNS
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: fake-service-route
  namespace: default
spec:
  hosts:
  - kmesh-fake.com
  http:
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: httpbin.default.svc.cluster.local
        port:
          number: 8000
EOF
```

## 了解配置

这个配置创建了：

1. **ServiceEntry**: 定义了一个名为 `kmesh-fake.com` 的外部服务，使用 IP 地址 `240.240.0.1`
2. **VirtualService**: 将访问 `kmesh-fake.com` 的流量重定向到集群内的 `httpbin` 服务

## 测试 Service Entry 配置

1. **测试访问虚拟外部服务**：

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/headers
   ```

   您应该看到来自 httpbin 服务的响应：

   ```json
   {
     "headers": {
       "Accept": "*/*",
       "Host": "kmesh-fake.com",
       "User-Agent": "curl/8.16.0"
     }
   }
   ```

2. **验证请求头信息**：

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/get
   ```

   输出应该显示请求被成功路由到 httpbin 服务：

   ```json
   {
     "args": {},
     "headers": {
       "Accept": "*/*",
       "Host": "kmesh-fake.com",
       "User-Agent": "curl/8.16.0"
     },
     "origin": "10.244.1.6",
     "url": "http://kmesh-fake.com/get"
   }
   ```

3. **测试不同的 HTTP 端点**：

   测试成功状态码：

   ```bash
   kubectl exec deploy/sleep -- curl -s http://kmesh-fake.com/status/200
   ```

   测试特定状态码并显示返回码：

   ```bash
   kubectl exec deploy/sleep -- curl -s -o /dev/null -w "%{http_code}\n" http://kmesh-fake.com/status/418
   ```

   第二个命令应该返回 HTTP 状态码：

   ```txt
   418
   ```

4. **检查响应头信息**：

   ```bash
   kubectl exec deploy/sleep -- curl -IsS http://kmesh-fake.com/headers
   ```

   您应该看到包含 envoy 和路由信息的响应头：

   ```txt
   HTTP/1.1 200 OK
   server: envoy
   date: Sat, 20 Sep 2025 07:51:51 GMT
   content-type: application/json
   content-length: 78
   access-control-allow-origin: *
   access-control-allow-credentials: true
   x-envoy-upstream-service-time: 1
   x-envoy-decorator-operation: httpbin.default.svc.cluster.local:8000/*
   ```

## 理解发生了什么

当您向 `kmesh-fake.com` 发出请求时：

1. **Service Entry** 告诉 Istio 这是一个有效的服务目标
2. **VirtualService** 将对该主机的请求重定向到集群内的 `httpbin` 服务
3. Kmesh 处理这个路由规则，将流量转发到正确的目标

这演示了如何使用 Service Entry 来：

- 定义外部服务
- 重定向流量到内部服务
- 控制出站流量路由

## 高级用例

### 配置真实外部服务

您也可以配置访问真实的外部服务。例如：

```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-httpbin
spec:
  hosts:
  - httpbin.org
  ports:
  - number: 80
    name: http
    protocol: HTTP
  - number: 443
    name: https
    protocol: HTTPS
  resolution: DNS
EOF
```

测试外部服务访问：

```bash
kubectl exec deploy/sleep -- curl -s http://httpbin.org/headers
```

## 清理

删除创建的 Service Entry 和 VirtualService：

```bash
kubectl delete serviceentry external-fake-svc
kubectl delete virtualservice fake-service-route
kubectl delete serviceentry external-httpbin
```

如果您不打算继续探索后续任务，请参考 [安装 Waypoint/清理](/i18n/zh/docusaurus-plugin-content-docs/current/application-layer/install_waypoint.md#清理) 说明删除 waypoint 并关闭应用程序。
