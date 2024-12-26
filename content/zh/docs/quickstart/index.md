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

  Kmesh实现通过内核增强将完整的流量治理能力下沉至OS。当发布镜像时，镜像适用的OS的范围是必须考虑的。因此，我们考虑发布三种类型的镜像：

  - 支持内核增强的OS版本：

    当前[openEuler 23.03](https://repo.openeuler.org/openEuler-23.03/)原生支持Kmesh所需的内核增强特性。Kmesh发布的镜像可以直接在该OS上安装运行。对于详细的支持内核增强的OS版本列表，请参见[链接](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_support.md)。
  
  - 针对所有OS版本：

    为了兼容不同的OS版本，Kmesh提供在线编译并运行的镜像。在Kmesh被部署之后，它会基于宿主机的内核能力自动选择运行的Kmesh特性，从而满足一个镜像在不同OS环境运行的要求。
    
    
    
    考虑到kmesh使用的通用性，我们也发布了用于kmesh编译构建的镜像。用户可以基于此镜像方便的制作出可以在当前OS版本上运行的kmesh镜像。默认命名为ghcr.io/kmesh-net/kmesh:latest，用户可自行调整，参考[Kmesh编译构建](docs/kmesh_compile-zh.md#docker image编译)
  
    ```bash
    make docker TAG=latest
    ```
### 启动Kmesh容器

默认使用Kmesh功能，可通过调整yaml文件中的启动参数进行功能选择

- 启动Kmesh容器

  默认使用名为 ghcr.io/kmesh-net/kmesh:latest的镜像，如需使用兼容模式或其他版本可自行修改

  -  Helm安装方式

   ```sh
  [root@ ~]# helm install kmesh ./deploy/charts/kmesh-helm -n kmesh-system --create-namespace
   ```

  - Yaml安装方式

  ```sh
  # get kmesh.yaml：来自代码仓 deploy/yaml/kmesh.yaml
  [root@ ~]# kubectl apply -f kmesh.yaml
  [root@ ~]# kubectl apply -f clusterrole.yaml
  [root@ ~]# kubectl apply -f clusterrolebinding.yaml
  [root@ ~]# kubectl apply -f serviceaccount.yaml
  ```

  默认使用Kmesh功能，可通过调整yaml文件中的启动参数进行功能选择

- 查看kmesh服务启动状态

  ```sh
  [root@ ~]# kubectl get pods -A | grep kmesh
  kmesh-system   kmesh-l5z2j                                 1/1     Running   0          117m
  ```

- 查看kmesh服务运行状态

  ```sh
  [root@master mod]# kubectl logs -f -n kmesh-system kmesh-l5z2j
  time="2024-02-19T10:16:52Z" level=info msg="service node sidecar~192.168.11.53~kmesh-system.kmesh-system~kmesh-system.svc.cluster.local connect to discovery address istiod.istio-system.svc:15012" subsys=controller/envoy
  time="2024-02-19T10:16:52Z" level=info msg="options InitDaemonConfig successful" subsys=manager
  time="2024-02-19T10:16:53Z" level=info msg="bpf Start successful" subsys=manager
  time="2024-02-19T10:16:53Z" level=info msg="controller Start successful" subsys=manager
  time="2024-02-19T10:16:53Z" level=info msg="command StartServer successful" subsys=manager
  time="2024-02-19T10:16:53Z" level=info msg="start write CNI config\n" subsys="cni installer"
  time="2024-02-19T10:16:53Z" level=info msg="kmesh cni use chained\n" subsys="cni installer"
  time="2024-02-19T10:16:54Z" level=info msg="Copied /usr/bin/kmesh-cni to /opt/cni/bin." subsys="cni installer"
  time="2024-02-19T10:16:54Z" level=info msg="kubeconfig either does not exist or is out of date, writing a new one" subsys="cni installer"
  time="2024-02-19T10:16:54Z" level=info msg="wrote kubeconfig file /etc/cni/net.d/kmesh-cni-kubeconfig" subsys="cni installer"
  time="2024-02-19T10:16:54Z" level=info msg="command Start cni successful" subsys=manager
  ```



## 编译构建

- 准备工作

  - docker-engine安装

    ```sh
    [root@dev Kmesh]# yum install docker-engine
    ```

  - 镜像原料准备

    Kmesh的镜像编译需要准备好kmesh源码，以及kmesh-build镜像，镜像可以通过如下命令获取

    注意：kmesh-build镜像需要和源码版本相匹配

    ```bash
    docker pull ghcr.io/kmesh-net/kmesh-build-x86:latest
    ```

### 源码编译

- 代码下载

  ```sh
  [root@dev tmp]# git clone https://github.com/kmesh-net/kmesh.git
  ```

- 代码修改编译

  ```sh
  [root@dev tmp]# cd kmesh/
  [root@dev Kmesh]# make build
  ```

  kmesh会在编译镜像中进行编译构建，并将编译产物输出至out目录

  ```bash
  [root@localhost kmesh]# ls out/amd64/
  kmesh-cmd  kmesh-daemon       libbpf.so    libbpf.so.0.8.1       libkmesh_deserial.so  libprotobuf-c.so.1      mdacore
  kmesh-cni  libboundscheck.so  libbpf.so.0  libkmesh_api_v2_c.so  libprotobuf-c.so      libprotobuf-c.so.1.0.0
  ```

- 更多Kmesh编译方式，请参考[Kmesh编译构建](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_compile-zh.md)

