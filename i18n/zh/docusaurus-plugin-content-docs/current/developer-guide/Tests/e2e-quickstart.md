# Kmesh E2E 测试快速入门

本文档旨在帮助开发者快速上手编写和运行 Kmesh 项目的端到端（E2E）测试。内容涵盖先决条件、测试环境搭建、简单测试函数模板，以及运行测试的说明。按照本指南操作，您将能够高效地编写并执行 E2E 测试，从而保障 Kmesh 功能的稳定性与正确性。

## 先决条件

开始之前，请确保环境中已安装以下工具：

- **Go**：用于运行测试框架。
- **Docker**：用于容器化应用。
- **kubectl**：用于管理 Kubernetes 集群。
- **Kind**：用于在本地创建 Kubernetes 集群。
- **Helm**：用于管理 Kubernetes 应用。

## E2E 测试环境

Kmesh E2E 测试需要一个双节点 KinD 集群：

- **Control Node**：管理集群。
- **Worker Node**：运行测试服务。

测试开始时会部署两个服务：

1. **service-with-waypoint-at-service-granularity**：带有 Waypoint 的服务。
2. **enrolled-to-kmesh**：不带 Waypoint 的服务。

两个服务均使用 Echo Pod，用于测试不同场景。

## 编写 E2E 测试

以下是一个简单的 E2E 测试函数模板，并附有分步说明：

```go
func TestEchoCall(t *testing.T) {
    // Create a new test suite for the current test
    framework.NewTest(t).Run(func(t framework.TestContext) {
        // Define a subtest for the Echo Call functionality
        t.NewSubTest("Echo Call Test").Run(func(t framework.TestContext) {
            // Retrieve the source service (with Waypoint) and destination service (without Waypoint)
            src := apps.ServiceWithWaypointAtServiceGranularity[0]
            dst := apps.EnrolledToKmesh

            // Define test cases with a name and a checker to validate the response
            cases := []struct {
                name string
                checker echo.Checker
            }{
                {
                    name: "basic call", // Name of the test case
                    checker: echo.And(
                        echo.ExpectOK(),                      // Expect the HTTP call to succeed
                        echo.ExpectBodyContains("Hello"),    // Expect the response body to contain "Hello"
                    ),
                },
            }

            // Iterate over each test case and execute it
            for _, c := range cases {
                t.NewSubTest(c.name).Run(func(t framework.TestContext) {
                    // Perform the HTTP call from the source to the destination
                    src.CallOrFail(t, echo.CallOptions{
                        Target:   dst[0],       // Target service
                        PortName: "http",      // Port name to use for the call
                        Checker:  c.checker,    // Checker to validate the response
                    })
                })
            }
        })
    })
}
```

### 步骤说明

1. **`framework.NewTest(t).Run`**：为当前测试初始化一个新的测试套件。
2. **`t.NewSubTest("Echo Call Test").Run`**：为 Echo Call 功能创建一个子测试。
3. **获取服务**：`src` 变量表示源服务（带 Waypoint），`dst` 变量表示目标服务（不带 Waypoint）。
4. **定义测试用例**：每个测试用例包含名称以及用于校验 HTTP 响应的 `checker`。例如，`echo.ExpectOK()` 确保 HTTP 调用成功，`echo.ExpectBodyContains("Hello")` 检查响应体内容。
5. **遍历并执行**：对每个测试用例，`src.CallOrFail` 方法从源向目标发起 HTTP 调用，并使用指定的 `checker` 校验响应。
6. **`echo.CallOptions`**：指定 HTTP 调用的目标服务、端口名称和 checker。

### 资源清理

使用 `t.Cleanup` 方法确保测试完成后清理测试资源。例如：

```go
t.Cleanup(func() {
    // Clean up resources
})
```

### 部署策略

使用 `t.ConfigIstio` 方法部署测试所需的策略。例如：

```go
t.ConfigIstio().YAML("test-namespace", `
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-all
spec:
  rules:
  - {}
`).ApplyOrFail(t)
```

### 使用 echo.Checker

`echo.Checker` 用于验证测试用例是否通过。例如：

```go
// Example: Using echo.Checker to validate HTTP response
src.CallOrFail(t, echo.CallOptions{
    Target:   dst[0],
    PortName: "http",
    Checker: echo.And(
        echo.ExpectOK(),                      // Expect the HTTP call to succeed
        echo.ExpectBodyContains("Hello"),    // Expect the response body to contain "Hello"
        echo.ExpectHeaders(map[string]string{
            "Content-Type": "text/plain",    // Expect the Content-Type header to be "text/plain"
        }),
    ),
})
```

## 运行测试

有关运行测试的详细说明，请参阅 [E2E 测试指南](https://kmesh.net/docs/developer-guide/Tests/e2e-test)。
