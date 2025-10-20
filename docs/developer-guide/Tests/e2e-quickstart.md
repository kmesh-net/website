# Quickstart for Kmesh E2E Testing

This document is designed to help developers quickly get started with writing and running end-to-end (E2E) tests for the Kmesh project. It covers the prerequisites, the test environment setup, a simple test function template, and instructions for running tests. By following this guide, you will be able to write and execute E2E tests efficiently, ensuring the stability and correctness of Kmesh features.

## Prerequisites

Before getting started, ensure the following tools are installed in your environment:

- **Go**: For running the test framework.
- **Docker**: For containerizing applications.
- **kubectl**: For managing Kubernetes clusters.

## E2E Test Environment

Kmesh E2E testing requires a two-node KinD cluster:

- **Control Node**: Manages the cluster.
- **Worker Node**: Runs the test services.

At the start of the test, two services will be deployed:

1. **service-with-waypoint-at-service-granularity**: A service with a Waypoint.
2. **enrolled-to-kmesh**: A service without a Waypoint.

Both services use Echo Pods, which are used to test different scenarios.

## Writing E2E Tests

Here is a simple E2E test function template:

```go
func TestEchoCall(t *testing.T) {
    framework.NewTest(t).Run(func(t framework.TestContext) {
        t.NewSubTest("Echo Call Test").Run(func(t framework.TestContext) {
            // Retrieve test services
            src := apps.ServiceWithWaypointAtServiceGranularity[0]
            dst := apps.EnrolledToKmesh

            // Define test cases
            cases := []struct {
                name string
                checker echo.Checker
            }{
                {
                    name: "basic call",
                    checker: echo.And(echo.ExpectOK(), echo.ExpectBodyContains("Hello")),
                },
            }

            // Execute test cases
            for _, c := range cases {
                t.NewSubTest(c.name).Run(func(t framework.TestContext) {
                    src.CallOrFail(t, echo.CallOptions{
                        Target:   dst[0],
                        PortName: "http",
                        Checker:  c.checker,
                    })
                })
            }
        })
    })
}
```

### Resource Cleanup

Use the `t.Cleanup` method to ensure test resources are cleaned up after the test completes. For example:

```go
t.Cleanup(func() {
    // Clean up resources
})
```

### Deploying Policies

Use the `t.ConfigIstio` method to deploy policies required for the test. For example:

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

### Using echo.Checker

`echo.Checker` is used to verify whether a test case passes. For example:

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

## Running Tests

### Run All Test Cases

To run all test cases, use the following command:

```bash
./test/e2e/run_test.sh
```

### Run a Single Test Case

To run a single test case, use the following command:

```bash
./test/e2e/run_test.sh --only-run-tests -run "TestEchoCall"
```

### Control Test Output Verbosity

```bash
./test/e2e/run_test.sh -v
```

### Repeat Test Cases

```bash
./test/e2e/run_test.sh -count=3
```
