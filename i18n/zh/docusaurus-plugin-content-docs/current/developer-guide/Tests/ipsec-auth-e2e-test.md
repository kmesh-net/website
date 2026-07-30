# IPSec 与 Offload Authorization E2E 测试指南

本文档提供执行 Kmesh IPSec 与 Offload Authorization E2E 测试的分步指南。这些测试用于确保 IPSec 功能以及 Offload Authorization 机制的可靠性、安全性与功能性。

## 先决条件

运行测试前，请确保满足以下条件：

- **Kubernetes 集群**：已安装 Kmesh 的双节点 Kubernetes 集群。
- **工具**：`kubectl`、`tcpdump` 和 `kmeshctl`。
- **应用**：集群中已部署 `echo` 和 `sleep` 应用。

## 部署示例 YAML

**Sleep 应用（保存为 `sleep.yaml`）：**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sleep
  labels:
    app: sleep
spec:
  ports:
  - port: 80
    name: http
  selector:
    app: sleep
---
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
      nodeName: kmesh-testing-control-plane
      containers:
      - name: sleep
        image: curlimages/curl
        command: ["/bin/sleep", "infinity"]
```

**Echo 应用（保存为 `echo.yaml`）：**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: echo
spec:
  ports:
  - name: http
    port: 80
    targetPort: 8080
  selector:
    app: echo
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo
  template:
    metadata:
      labels:
        app: echo
    spec:
      containers:
      - name: echo
        image: gcr.io/istio-testing/app:latest
        args:
        - --port=8080
        ports:
        - containerPort: 8080
```

## IPSec E2E 测试

### 1. 基本连通性测试

该测试验证 IPSec 隧道的建立以及加密通信的正确性。

#### 步骤

1. 部署 `sleep` 和 `echo` 应用：

   ```bash
   kubectl apply -f sleep.yaml
   kubectl apply -f echo.yaml
   ```

2. 验证应用之间的连通性：

   ```bash
   kubectl exec <sleep-pod> -- curl http://<echo-service>
   ```

   **预期输出：**

   ```plaintext
   Hello version: v1, instance: echo-<pod-id>
   ```

3. 检查 IPSec 状态：

   ```bash
   ip xfrm state show
   ```

   **预期输出：**

   ```plaintext
   src {{SRC_IP}} dst {{DST_IP}}
       proto esp spi 0x{{SPI}} reqid 1 mode tunnel
       replay-window 0 
       output-mark 0xd0/0xffffffff
       aead rfc4106(gcm(aes)) {{KEY}} 128
       anti-replay context: seq 0x0, oseq 0x0, bitmap 0x00000000
       sel src ::/0 dst ::/0 
   ```

4. 检查 IPSec 策略：

   ```bash
   ip xfrm policy show
   ```

   **预期输出：**

   ```plaintext
   src ::/0 dst {{DST_SUBNET}} 
       dir out priority 0 
       mark 0xe0/0xffffffff 
       tmpl src {{SRC_IP}} dst {{DST_IP}}
           proto esp spi 0x{{SPI}} reqid 1 mode tunnel
   ```

5. 使用 `tcpdump` 验证加密：

   ```bash
   tcpdump -i any esp
   ```

   **预期输出：** 通信过程中应能看到 ESP 数据包。

### 2. 密钥轮换测试

该测试确保 PSK 更新机制的可靠性，并验证密钥变更期间的服务连续性。

#### 步骤

1. 记录初始 SPI：

   ```bash
   ip xfrm state show
   ```

   **预期输出：**

   ```plaintext
   src {{SRC_IP}} dst {{DST_IP}}
       proto esp spi 0x{{INITIAL_SPI}} reqid 1 mode tunnel
       aead rfc4106(gcm(aes)) {{INITIAL_KEY}} 128
   ```

2. 在应用之间持续发送流量：

   ```bash
   kubectl exec <sleep-pod> -- curl http://<echo-service>
   ```

3. 更新预共享密钥：

   ```bash
   kmeshctl secret create --key=<new-key>
   ```

4. 验证 xfrm 规则中的 SPI 和密钥已更新：

   ```bash
   ip xfrm state show
   ```

   **预期输出：**

   ```plaintext
   src {{SRC_IP}} dst {{DST_IP}}
       proto esp spi 0x{{INITIAL_SPI + 1}} reqid 1 mode tunnel
       aead rfc4106(gcm(aes)) {{NEW_KEY}} 128
   ```

5. 确认通信连续性与加密状态。

## Offload Authorization E2E 测试

### Authorization 测试统一步骤

1. 应用策略：

   ```bash
   kubectl apply -f <policy-file>.yaml
   ```

2. 测试连通性：

   ```bash
   kubectl exec <sleep-pod> -- curl http://<echo-service>
   ```

   **预期输出：**

   - **ALLOW 策略：** curl 命令应成功，HTTP 响应码应为 `200`。
   - **DENY 策略：** curl 命令应失败，且收不到响应。

### 策略示例

#### IP Authorization 策略

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ip-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        ipBlocks:
        - "{{ALLOWED_IP}}"
```

#### Port Authorization 策略

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: port-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        ports: ["{{ALLOWED_PORT}}"]
```

#### Header Authorization 策略

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: header-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - when:
    - key: request.headers["{{HEADER_NAME}}"]
      values: ["{{HEADER_VALUE}}"]
```

#### Namespace Authorization 策略

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: namespace-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["{{SOURCE_NAMESPACE}}"]
```

#### Host Authorization 策略

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: host-allow-policy
  namespace: test-ns1
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        hosts: ["{{TARGET_HOST}}"]
```

## 清理

测试完成后，清理相关资源：

```bash
kubectl delete -f sleep.yaml
kubectl delete -f echo.yaml
kubectl delete authorizationpolicy --all -n test-ns1
```
