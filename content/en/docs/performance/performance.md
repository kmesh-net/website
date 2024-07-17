---
draft: false
linktitle: Kmesh Performance
menu:
  docs:
    parent: performance
    weight: 1
title: Kmesh Performance
toc: true
type: docs

---
## Test Networking

![perf_network](/docs/performance/perf_network.png)

## Test Procedure

Kmesh uses fortio and dstat as performance test tools. Fortio is a powerful microservice load test library that can collect statistics on latency and throughput information such as TP90, TP99, and QPS. dstat is a system information statistics tool. It is used to collect the CPU usage during the test.

- Test method

Test a group of Fortio performance data by using the number of concurrent connections as a variable parameter, and collect the CPU usage during the test. The [test script](https://github.com/kmesh-net/kmesh/test/performance/) has been archived.

## Test execution

```sh
#Preparing the test environment
[root@perf]# ./fortio_perf.sh
# Generate a CSV table of test results in the directory.
[root@perf]# ll
-rw-r--r--. 1 root root 6.1K Nov 5 17:39 fortio_perf_test.csv
```

## Performance
![perf_test](/docs/performance/fortio_performance_test.png)
