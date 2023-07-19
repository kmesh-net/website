---
draft: false
linktitle: Get Started
menu:
  docs:
    parent: quickstart
    weight: 1
title: Get Started
toc: true
type: docs

---
## Prerequisites

## 安装与部署

### 软件要求

* 操作系统：推荐使用openEuler-23.03，其他操作系统请参考：《其他平台使用指导》

## 安装Kmesh

* 安装Kmesh软件包，参考命令如下：

```shell
[root@openEuler ~]# yum install Kmesh
```

* 查看安装是否成功，参考命令如下，若回显有对应软件包，表示安装成功：

```shell
[root@openEuler ~]# rpm -q Kmesh
```

## 部署Kmesh

### 集群启动模式

启动前，先进行配置修改，设置集群中控制面程序ip信息（如istiod ip地址），操作如下：
```json
    "clusters": [
      {
        "name": "xds-grpc",
        "type" : "STATIC",
        "connect_timeout": "1s",
        "lb_policy": "ROUND_ROBIN",
        "load_assignment": {
          "cluster_name": "xds-grpc",
          "endpoints": [{
            "lb_endpoints": [{
              "endpoint": {
                "address":{
                  "socket_address": {
                          "protocol": "TCP",
                          "address": "192.168.0.1",# 设置控制面ip(如istiod ip)
                          "port_value": 15010
                     }
                }
              }
            }]
          }]
```

### 本地启动模式

启动前，修改kmesh.service，禁用ads开关，操作如下：
```shell
[root@openEuler ~]# vim /usr/lib/systemd/system/kmesh.service
ExecStart=/usr/bin/kmesh-daemon -enable-kmesh -enable-ads=false
[root@openEuler ~]# systemctl daemon-reload
```
Kmesh服务启动时会调用kmesh-daemon程序，具体使用方式可以参考[kmesh-daemon使用](#kmesh-daemon使用)。

### 启动Kmesh

```shell
# 启动Kmesh服务
[root@openEuler ~]# systemctl start kmesh.service
# 查看Kmesh运行状态
[root@openEuler ~]# systemctl status kmesh.service
```

### 停止Kmesh

```shell
# 停止Kmesh服务
[root@openEuler ~]# systemctl stop kmesh.service
```

## 使用方法

### kmesh-daemon使用

```shell
# 命令help
[root@openEuler ~]# kmesh-daemon -h
Usage of kmesh-daemon:
  -bpf-fs-path string
        bpf fs path (default "/sys/fs/bpf")
  -cgroup2-path string
        cgroup2 path (default "/mnt/kmesh_cgroup2")
  -config-file string
        [if -enable-kmesh] deploy in kube cluster (default "/etc/kmesh/kmesh.json")
  -enable-ads
        [if -enable-kmesh] enable control-plane from ads (default true)
  -enable-kmesh
        enable bpf kmesh
  -service-cluster string
        [if -enable-kmesh] TODO (default "TODO")
  -service-node string
        [if -enable-kmesh] TODO (default "TODO")

# 默认使能ads
[root@openEuler ~]# kmesh-daemon -enable-kmesh

# 使能ads，并指定配置文件路径
[root@openEuler ~]# kmesh-daemon -enable-kmesh -enable-ads=true -config-file=/examples/kmesh.json

# 不使能ads
[root@openEuler ~]# kmesh-daemon -enable-kmesh -enable-ads=false
```

### kmesh-cmd使用

```shell
# 命令help
[root@openEuler ~]# kmesh-cmd -h
Usage of kmesh-cmd:
  -config-file string
        input config-resources to bpf maps (default "./config-resources.json")

# 手动加载配置
[root@openEuler ~]# kmesh-cmd -config-file=/examples/config-resources.json
```

### 运维相关命令使用

```shell
# 命令help
[root@openEuler ~]# curl http://localhost:15200/help
    /help: print list of commands
    /options: print config options
    /bpf/kmesh/maps: print bpf kmesh maps in kernel
    /controller/envoy: print control-plane in envoy cache
    /controller/kubernetes: print control-plane in kubernetes cache

# 读取加载的配置
[root@openEuler ~]# curl http://localhost:15200/bpf/kmesh/maps
[root@openEuler ~]# curl http://localhost:15200/options
```

### 注意事项

* -enable-ads=true时，Kmesh从服务网格控制面自动接收编排规则，此配置下，不要使用kmesh-cmd命令下发规则，避免多次配置。

* -bpf-fs-path选项用于指定系统的bpf文件系统路径，kmesh bpf程序相关的数据会存放在该路径下，默认路径为/sys/fs/bpf。

* -cgroup2-path选项用于指定系统cgroup路径，默认路径为/mnt/kmesh_cgroup2。
