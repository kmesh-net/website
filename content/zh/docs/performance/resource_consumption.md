---
draft: false
linktitle: Kmesh资源消耗
menu:
  docs:
    parent: performance
    weight: 2
title: Kmesh资源消耗
toc: true
type: docs
---
# 1. 背景信息
eBPF程序在运行过程中会消耗一定的CPU和内存资源，这可能会影响到其他应用程序的性能。为了深入了解Kmesh在不同负载下的资源消耗情况，我们进行了多项CPU与内存摸高测试。这些测试旨在评估Kmesh在实际使用场景中的CPU和内存消耗极限。

**本测试基于Kmesh 0.4版本的ads模式进行。**
# 2. 测试环境
![resource_env](images/resource_test_env.png)

- K8S version: v1.27
- Kmesh version: 0.4 ads 模式
- Kernel version: 5.10
- Node flavor: 8U16G
- Testing tool: fortio
- Metric collecting tools: [bpftop](https://github.com/Netflix/bpftop), [inspektor-gadget](https://github.com/inspektor-gadget/inspektor-gadget)


# 3. 测试用例1 - POD CPU设置limit场景，测试Kmesh eBPF CPU 消耗
## 3.1 启动1个App A实例并固定App A POD的CPU limit，并生成负载，收集相应的Kmesh eBPF CPU消耗
![resource_test1](images/resource_test1.png)

设置App A的CPU limit为1(1个CPU)，并收集相应Kmesh的eBPF CPU消耗。

**注： 系统为8核，CPU limit为1，意味着POD最多消耗12.5%的 CPU**

通过fortio client生成负载
```sh
#!/bin/bash

client_address=`kubectl get pod | grep fortio-client | awk {'print $1'}`
echo "$client_address" | xargs -P 0 -I {} kubectl exec -it {} -- fortio load -quiet -c 1500 -t 100s -qps 0 -keepalive=false fortio-server.default.svc.cluster.local:80
```

使用[bpftop工具](https://github.com/Netflix/bpftop)收集CPU使用
```sh
$ ./bpftop
```

测试结果：

![resource_result1](images/resource_test_result1.png)

图中消耗12.99%指的是消耗了1个CPU核心的12.99%

**结果与结论：当APP A跑满1个CPU时，eBPF程序消耗CPU 1.73%, 小于POD CPU limit 12.5%，有两个可能原因**

- APP A + Kmesh eBPF共用POD CPU limit， Kmesh eBPF CPU受限于POD CPU limit
- 可能由于eBPF的性能过好，APP A不足以生成足够的负载，使eBPF消耗超过limit的CPU，需进一步进行3.2实验

## 3.2 启动多个App A实例，固定CPU limit，并生成负载，收集相应的Kmesh eBPF CPU消耗
![resource_test2](images/resource_test2.png)

启动了4个APP A实例，每个实例CPU limit设置为250m，4个实例共1个CPU

测试结果：

![resource_result2](images/resource_test_result2.png)

图中消耗13.42%指的是消耗了1个CPU核心的13.42%


**结果和结论：当APP A跑满1个CPU时，eBPF程序消耗CPU 1.81%，小于POD CPU limit 12.5%，为了进一步验证此结论，进行3.3实验**

## 3.3 在测试2.2基础上修改eBPF代码，降低执行性能，使其消耗更多CPU，观测是否可以消耗超过POD CPU limit

在Kmesh eBPF代码中增加for循环：
```c
for (i=0;i<65535;i++) {
    bpf_printk("increase cpu usage");
}
```

测试结果：

![resource_result3](images/resource_test_result3.png)

当APP A跑满1个CPU时，eBPF程序最多消耗12.1% CPU， 仍然小于POD CPU limit(12.5%)，经多轮测试，eBPF的CPU消耗永远小于POD CPU limit


**结论: Kmesh eBPF和APP 共用POD CPU limit, Kmesh eBPF CPU受限于POD CPU limit**

# 4. 测试用例2 - POD CPU没有设置limit场景，测试Kmesh eBPF CPU 消耗
## 4.1 POD CPU没有设置limit场景，测试Kmesh eBPF CPU limit
![resource_test3](images/resource_test3.png)

创建8个APP A实例，设置为CPU limit无上限。 逐步修改APP A生成负载的进程数直到节点的CPU使用率为100%，收集Kmesh eBPF的CPU使用率。
测试结果(8核CPU总共8000m):
|threads|APP A CPU Usage|eBPF CPU usage|
|--|--|--|
|100|12.3%|1%|
|500|35%|4.1%|
|1000|61.7%|8.8%|
|3000|67%|9.5%|

系统总的CPU为8核即8000m。 当并发进程3000时，该节点CPU跑满100%。 此时APP A消耗CPU 67%， Kmesh eBPF消耗约9.5%。

**结论：**

- **APP A消耗CPU远高于eBPF消耗的CPU，无法实现将eBPF压爆，使用fortio压测场景Kmesh eBPF最多消耗CPU 9.5%。**
- **对于eBPF本身可消耗CPU上限需要进一步进行测试4.2**

## 4.2 eBPF CPU摸高测试，通过在eBPF代码中加入死循环/大量for循环, boost CPU使用率
[eBPF官方文档](https://ebpf-docs.dylanreimerink.nl/linux/concepts/verifier/)指出, eBPF程序有完善的安全机制，自动检测死循环，并严格限制for循环次数。在目前的Kernel版本(v5.10)， eBPF程序最多支持65535次for循环。

因此在代码中加入65535个for循环，并测试
```c
int i;
for (i=0;i<65535;i++) {
    bpf_printk("increase cpu usage");
}
```

测试结果:

![resource_result4](images/resource_test_result4.png)

当该节点CPU跑满100%。 Kmesh eBPF消耗约99.3% CPU。
此压测持续10分钟，测试期间内核以及集群内服务仍然稳定运行

**结论: 在Kmesh eBPF组件中增加eBPF支持极限数量的for循环场景下，eBPF可以消耗全部CPU，但是内核的安全机制保证系统稳定运行**


# 5. Kmesh eBPF组件 Memory limit测试
eBPF的内存消耗是有上限的：[官网文档](https://ebpf-docs.dylanreimerink.nl/linux/concepts/resource-limit/). 是通过cGroup 设置中的 memory.max设置的。

但是基于目前Kmesh的代码实现，内存是在Kmesh启动的时候分配的，在运行态，内存不增加。为了验证内存使用量，进行下面测试

## 5.1 在集群中分别创建1个，100个，1000个服务，记录eBPF 内存消耗
使用[inspektor gadget](https://github.com/inspektor-gadget/inspektor-gadget)工具收集eBPF内存占用. 

通过`kubectl gadget top ebpf`命令监测eBPF内存占用

![resource_result_memory](images/resource_test_memory.png)

测试结果：
|服务数|eBPF Memory usage|
|--|--|
|1|23m|
|100|23m|
|1000|23m|

**测试结果: Kmesh eBPF内存消耗为23M，并保持不变，与服务数量无关**

## 5.2 在集群中创建1个服务APP A，并生成负载，观测eBPF内存消耗
**测试结果: Kmesh eBPF内存消耗为23M，并保持不变，与负载无关**
