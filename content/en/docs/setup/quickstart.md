---
draft: false
linktitle: Quick Start
menu:
  docs:
    parent: setup
    weight: 5
title: Quick Start
toc: true
type: docs

---
## Cluster start mode

### Kmesh container image prepare

-   Kmesh achieves the ability to completely sink traffic management below the OS through kernel enhancements. When releasing images, the range of OS for which the image is applicable must be considered. To this end, we consider releasing three types of images:

    - Supported OS versions with kernel enhancement modifications

      The current [openEuler 23.03](https://repo.openeuler.org/openEuler-23.03/) OS natively supports the kernel enhancement features required by Kmesh. Kmesh release images can be directly installed and run on this OS. For a detailed list of supported OS versions with kernel enhancement modifications, please refer to [this link](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_support.md).
    
    - For all OS versions:

      To be compatible with different OS versions, Kmesh provides online compilation and running images. After Kmesh is deployed, it will automatically select Kmesh features supported by the host machine's kernel capabilities, to meet the demand for one image to run in different OS environments.
      
      
      
      Considering the universality of kmesh, we have released an image for compiling and building kmesh. Users can conveniently create a kmesh image based on this, which can run on their current OS version. By default, it is named `ghcr.io/kmesh-net/kmesh:latest`, but the user can adjust it as needed. Please refer to [Kmesh Build Compilation](docs/kmesh_compile.md#build docker image) for more details.
      
      
      ```bash
      make docker TAG=latest
      ```
  
- Start Kmesh

  - Install from Helm

  ```sh
  [root@ ~]# helm install kmesh ./deploy/helm -n kmesh-system --create-namespace
  ```

  - Install from Yaml

  ```sh
  # get kmesh.yaml from deploy/yaml/kmesh.yaml
  [root@ ~]# kubectl apply -f kmesh.yaml
  [root@ ~]# kubectl apply -f clusterrole.yaml
  [root@ ~]# kubectl apply -f clusterrolebinding.yaml
  [root@ ~]# kubectl apply -f serviceaccount.yaml
  ```

  By default, the Kmesh base function is used, other function can be selected by adjusting the startup parameters in the yaml file.

- Check kmesh service status

  ```sh
  [root@ ~]# kubectl get pods -A | grep kmesh
  kmesh-system   kmesh-l5z2j                                 1/1     Running   0          117m
  ```

- View the running status of kmesh service

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



## Compile and Build

### Source code compilation

- Code download

  ```sh
  [root@ ~]# git clone https://github.com/kmesh-net/kmesh.git
  ```

- Code compilation

  ```sh
  [root@dev tmp]# cd kmesh/
  [root@dev Kmesh]# make build
  ```

  Kmesh will be compiled and built within the build image, and the build artifacts will be output to the `out` directory.

  ```bash
  [root@localhost kmesh]# ls out/amd64/
  kmesh-cmd  kmesh-daemon       libbpf.so    libbpf.so.0.8.1       libkmesh_deserial.so  libprotobuf-c.so.1      mdacore
  kmesh-cni  libboundscheck.so  libbpf.so.0  libkmesh_api_v2_c.so  libprotobuf-c.so      libprotobuf-c.so.1.0.0
  ```

- More compilation methods of Kmesh, See: [Kmesh Compilation and Construction](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_compile.md)
