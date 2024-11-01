---
draft: false
linktitle: Kmesh Resource Consumption
menu:
  docs:
    parent: performance
    weight: 2
title: Kmesh Resource Consumption
toc: true
type: docs

---

## Background Information
eBPF programs consume a certain amount of CPU and memory resources during their execution. To gain a deeper understanding of Kmesh’s resource consumption under different loads, we conducted several CPU and memory stress tests. These tests aim to evaluate the limits of CPU and memory consumption of Kmesh in real-world usage scenarios.

**This documentation is based on Kmesh 0.4 kernel-native mode**
## Environment setup
![resource_env](/docs/performance/resource_test_env.png)

- K8S version: v1.27
- Kmesh version: 0.4 ads mode
- Kernel version: 5.10
- Node flavor: 8U16G
- Testing tool: fortio
- Metric collecting tools: [bpftop](https://github.com/Netflix/bpftop), [inspektor-gadget](https://github.com/inspektor-gadget/inspektor-gadget)


## Test case 1 - POD with CPU limit scenario，collect Kmesh eBPF CPU usage
### Deploy 1 App A and set App A POD's CPU limit，then generate load and collect Kmesh eBPF CPU usage
![resource_test1](/docs/performance/resource_test1.png)

Set the CPU limit for App A to 1 (1 CPU), and collect corresponding Kmesh eBPF CPU consumption.

**Note: With the system having 8 cores and a CPU limit of 1, it means the POD can consume up to 12.5% of the CPU.**

Generate load using the fortio client.
```sh
#!/bin/bash

client_address=`kubectl get pod | grep fortio-client | awk {'print $1'}`
echo "$client_address" | xargs -P 0 -I {} kubectl exec -it {} -- fortio load -quiet -c 1500 -t 100s -qps 0 -keepalive=false fortio-server.default.svc.cluster.local:80
```

Collect CPU usage using [bpftop](https://github.com/Netflix/bpftop)
```sh
$ ./bpftop
```

Testing result：
![resource_result1](/docs/performance/resource_test_result1.png)

the 12.99% in the figure above means that 12.99% of one CPU core was consumed.

**Results and Conclusion: When APP A fully utilizes one CPU core, the eBPF program consumes 1.73%(totally 13.9% usage of one CPU core  == 1.73% of 8 CPU cores) of the CPU, which is less than the POD CPU limit of 12.5%. There are two possible reasons.**

- APP A and Kmesh eBPF share the POD CPU limit, with Kmesh eBPF CPU being restricted by the POD CPU limit.
- This indicates eBPF CPU cost is fairly small compared to application itself, APP A is not generating enough load to cause eBPF to exceed the CPU limit, further experiments in section 3.2 are needed.

### Deploy multiple instances of App A, set a fixed CPU limit, generate load, and collect the corresponding Kmesh eBPF CPU consumption.
![resource_test2](/docs/performance/resource_test2.png)

Start 4 instances of App A, with a CPU limit of 250m for each instance, totaling 1 CPU for all 4 instances.

Testing result：
![resource_result2](/docs/performance/resource_test_result2.png)

the 13.42% in the figure above means that 13.42% of one CPU core was consumed.


**Results and Conclusion: When APP A fully utilizes one CPU, the eBPF program consumes 1.81% of the CPU, which is less than the POD CPU limit of 12.5%. To further verify this conclusion, experiment 3.3 will be conducted.**

### Based on test 2.2, modify the eBPF code to decrease its performance, causing it to consume more CPU. Observe if it can exceed the POD CPU limit.

Add for loop in Kmesh eBPF code：
```c
SEC("cgroup/connect4")
int cgroup_connect4_prog(struct bpf_sock_addr *ctx)
{
    struct kmesh_context kmesh_ctx = {0};
    kmesh_ctx.ctx = ctx;
    kmesh_ctx.orig_dst_addr.ip4 = ctx->user_ip4;
    kmesh_ctx.dnat_ip.ip4 = ctx->user_ip4;
    kmesh_ctx.dnat_port = ctx->user_port;

    if (handle_kmesh_manage_process(&kmesh_ctx) || !is_kmesh_enabled(ctx)) {
        return CGROUP_SOCK_OK;
    }

    // Add for loop to increase CPU usage
    int i;
    for (i=0;i<65535;i++) {
        bpf_printk("increase cpu usage");
    }
    
    int ret = sock4_traffic_control(ctx);
    return CGROUP_SOCK_OK;
}
```

Testing result：
![resource_result3](/docs/performance/resource_test_result3.png)

When APP A fully utilizes one CPU, the eBPF program consumes up to 12.1% of the CPU, which is still less than the POD CPU limit of 12.5%. After multiple rounds of testing, the eBPF’s CPU consumption is always below the POD CPU limit.


**Conclusion: Kmesh eBPF and APP share the POD CPU limit, with Kmesh eBPF CPU being limited by the POD CPU limit.**

## Test case 2 - Scenario where POD CPU limit is not set, test the consumption of Kmesh eBPF CPU.
### Scenario where the POD CPU limit is not set, test the Kmesh eBPF CPU limit.
![resource_test3](/docs/performance/resource_test3.png)

Create 8 instances of APP A, set the CPU limit to unlimited. Gradually modify the number of processes generating load for APP A until the node's CPU usage reaches 100%, collect the CPU usage of Kmesh eBPF.

Test results (8-core CPU totaling 8000m):
|threads|APP A CPU Usage|eBPF CPU usage|
|--|--|--|
|100|12.3%|1%|
|500|35%|4.1%|
|1000|61.7%|8.8%|
|3000|67%|9.5%|

The total CPU of the system is 8 cores, which is equivalent to 8000m. When there are 3000 concurrent processes, the CPU of the node reaches 100% utilization. At this time, APP A consumes 67% of the CPU, and Kmesh eBPF consumes approximately 9.5%.

**Conclusion：**

- **APP A consumes much more CPU than eBPF, so it is not possible to overload eBPF. In a scenario tested with Fortio, Kmesh eBPF consumes a maximum of 9.5% CPU.**
- **Further testing is needed to determine the maximum CPU consumption limit for eBPF itself.**

### eBPF CPU stress test, by adding infinite loops/large for loops in the eBPF code to boost CPU usage.
The [eBPF official documentation](https://ebpf-docs.dylanreimerink.nl/linux/concepts/verifier/) points out that eBPF programs have a robust security mechanism that automatically detects infinite loops and strictly limits the number of iterations in for loops. In the current Kernel version (v5.10), eBPF programs support a maximum of 65535 iterations in for loops.

Therefore, add 65535 for loops in the code and test it.
```c
SEC("cgroup/connect4")
int cgroup_connect4_prog(struct bpf_sock_addr *ctx)
{
    struct kmesh_context kmesh_ctx = {0};
    kmesh_ctx.ctx = ctx;
    kmesh_ctx.orig_dst_addr.ip4 = ctx->user_ip4;
    kmesh_ctx.dnat_ip.ip4 = ctx->user_ip4;
    kmesh_ctx.dnat_port = ctx->user_port;

    if (handle_kmesh_manage_process(&kmesh_ctx) || !is_kmesh_enabled(ctx)) {
        return CGROUP_SOCK_OK;
    }

    // Add for loop to increase CPU usage
    int i;
    for (i=0;i<65535;i++) {
        bpf_printk("increase cpu usage");
    }

    int ret = sock4_traffic_control(ctx);
    return CGROUP_SOCK_OK;
}
```

Testing result:
![resource_result4](/docs/performance/resource_test_result4.png)

When the CPU of the node is running at 100%, Kmesh eBPF consumes approximately 99.3% of the CPU. This stress test lasted for 10 minutes, during which the kernel and services within the cluster continued to run stably.

**Conclusion: In the Kmesh eBPF component, when adding support for a maximum number of for loop scenarios, eBPF can consume all CPU resources. However, the kernel's security mechanisms ensure the stable operation of the system.**


## Kmesh eBPF Memory limit test
The memory consumption of eBPF has an upper limit: as stated in the [official documentation](https://ebpf-docs.dylanreimerink.nl/linux/concepts/resource-limit/), this limit is set through the `memory.max` setting in cGroup configurations.

However, based on the current implementation of Kmesh, memory is allocated at the start of Kmesh, and does not increase during runtime. To verify the memory usage, the following test was conducted.

### Create 1, 100, and 1000 services respectively in the cluster, and record the eBPF memory consumption.

Collect eBPF memory consumption using [inspektor gadget](https://github.com/inspektor-gadget/inspektor-gadget)

Monitoring eBPF memory usage using command `kubectl gadget top ebpf`

![resource_result_memory](/docs/performance/resource_test_memory.png)

Testing result:
|service number|eBPF Memory usage|
|--|--|
|1|23m|
|100|23m|
|1000|23m|

**Test results: The eBPF memory consumption of Kmesh is 23MB and remains constant, regardless of the number of services.**

### Create a service APP A in the cluster, generate load, and observe eBPF memory consumption
**Test results: Kmesh eBPF memory consumption is 23MB and remains constant, regardless of the load**
