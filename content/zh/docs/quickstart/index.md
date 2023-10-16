---
draft: false
linktitle: 快速开始
menu:
  docs:
    parent: quickstart
    weight: 1
title: 快速开始
toc: true
type: docs

---
## 集群启动模式

### Kmesh容器镜像准备

下载对应版本Kmesh容器镜像后，使用如下命令将镜像加载到环境中

```sh
[root@ ~]# docker load -i Kmesh.tar
```

### 启动Kmesh容器

下载对应版本yaml文件

启动Kmesh

```sh
[root@ ~]# kubectl apply -f kmesh.yaml
```

默认使用Kmesh功能，可通过调整yaml文件中的启动参数进行功能选择

### 查看kmesh服务启动状态

```sh
[root@ ~]# kubectl get pods -A -owide | grep kmesh
default        kmesh-deploy-j8q68                   1/1     Running   0          6h15m   192.168.11.6    node1   <none> 
```

查看kmesh服务运行状态

```sh
[root@ ~]# kubectl logs -f kmesh-deploy-j8q68
time="2023-07-25T09:28:37+08:00" level=info msg="options InitDaemonConfig successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="bpf Start successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="controller Start successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="command StartServer successful" subsys=manager
```

## 本地启动模式

下载对应版本Kmesh软件包

### 安装Kmesh软件包

```
[root@ ~]# yum install Kmesh
```

### 配置Kmesh服务

```sh
# 禁用ads开关
[root@ ~]# vim /usr/lib/systemd/system/kmesh.service
ExecStart=/usr/bin/kmesh-daemon -enable-kmesh -enable-ads=false
[root@ ~]# systemctl daemon-reload
```

### 启动Kmesh服务

```sh
[root@ ~]# systemctl start kmesh.service
# 查看Kmesh服务运行状态
[root@ ~]# systemctl status kmesh.service
```

### 停止Kmesh服务

```sh
[root@ ~]# systemctl stop kmesh.service
```

更多Kmesh服务使用方式，请参考[Kmesh项目主页](https://github.com/kmesh-net/kmesh#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)


## 编译构建

### 源码编译

- 代码下载

  ```sh
  [root@ ~]# git clone https://github.com/kmesh-net/kmesh.git
  ```

- 代码编译

  ```sh
  [root@ ~]# cd kmesh/
  [root@ ~]# ./build.sh -b
  ```

- 程序安装

  ```sh
  # 安装脚本显示了Kmesh所有安装文件的位置
  [root@ ~]# ./build.sh -i
  ```

- 编译清理

  ```sh
  [root@ ~]# ./build.sh -c
  ```

- 程序卸载

  ```sh
  [root@ ~]# ./build.sh -u

更多Kmesh编译方式，请参考[Kmesh编译构建](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_compile-zh.md)

