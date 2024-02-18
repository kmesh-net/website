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
## Cluster start mode

### Kmesh container image prepare

Download the corresponding version of the Kmesh container image, use the following command to load the image into the environment

```sh
[root@ ~]# docker load -i Kmesh.tar
```

### Start Kmesh container

Download the yaml file

Start Kmesh

```sh
[root@ ~]# kubectl apply -f kmesh.yaml
```

By default, the Kmesh function is used, which can be selected by adjusting the startup parameters in the yaml file

### Check kmesh service status

```sh
[root@ ~]# kubectl get pods -A -owide | grep kmesh
default        kmesh-deploy-j8q68                   1/1     Running   0          6h15m   192.168.11.6    node1   <none>
```

View the running status of kmesh service

```sh
[root@ ~]# kubectl logs -f kmesh-deploy-j8q68
time="2023-07-25T09:28:37+08:00" level=info msg="options InitDaemonConfig successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="bpf Start successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="controller Start successful" subsys=manager
time="2023-07-25T09:28:38+08:00" level=info msg="command StartServer successful" subsys=manager
```

## Helm Install Kemsh

### Preparation

Istio installation is required prior to Kmesh due to certificate dependency.

It is recommended to install Istio using istioctl. Refer to [istio documentation](https://istio.io/latest/docs/ops/diagnostic-tools/istioctl/) for instructions on installing istioctl.

After installing istioctl, you can install Istio using the following commands:

```console
istioctl manifest install --set profile=default
```

Review the results:

```console
kubeclt get po -n istio-system
NAMESPACE            NAME                                                    READY   STATUS    RESTARTS   AGE
istio-system         istio-ingressgateway-65b5c9f9bb-8w5ml                   1/1     Running   0          37s
istio-system         istiod-657f7686cf-hshwp                                 1/1     Running   0          2m5s
```

### Install Kmesh

Use the following command to install Kmesh:

```console
helm install kmesh ./deploy/helm -n kmesh-system --create-namespace
```

Verify the Kmesh chart installation:

```console
$ kubectl get po -n istio-system 
NAMESPACE            NAME                                                 READY   STATUS    RESTARTS   AGE
kmesh-system         kmesh-jflr9                                          1/1     Running   0          56s
```

## Local start mode

Download the corresponding version of the Kmesh software package

### install Kmesh software package

```
[root@ ~]# yum install Kmesh
```

### Configure Kmesh service

```sh
# disable ads switch
[root@ ~]# vim /usr/lib/systemd/system/kmesh.service
ExecStart=/usr/bin/kmesh-daemon -enable-kmesh -enable-ads=false
[root@ ~]# systemctl daemon-reload
```

### Start Kmesh service

```sh
[root@ ~]# systemctl start kmesh.service
# View the running status of the Kmesh service
[root@ ~]# systemctl status kmesh.service
```

### Stop Kmesh service

```sh
[root@ ~]# systemctl stop kmesh.service
```

More use mode of Kmesh service, See: [Kmesh project homepage](https://github.com/kmesh-net/kmesh#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)


## Compile and Build

### Source code compilation

- Code download

  ```sh
  [root@ ~]# git clone https://github.com/kmesh-net/kmesh.git
  ```

- Code compilation

  ```sh
  [root@ ~]# cd kmesh/
  [root@ ~]# ./build.sh -b
  ```

- Program installation

  ```sh
  # The installation script displays the locations of all installation files for Kmesh
  [root@ ~]# ./build.sh -i
  ```

- Compile cleanup

  ```sh
  [root@ ~]# ./build.sh -c
  ```

- Program uninstallation

  ```sh
  [root@ ~]# ./build.sh -u

More compilation methods of Kmesh, See:[Kmesh Compilation and Construction](https://github.com/kmesh-net/kmesh/blob/main/docs/kmesh_compile.md)


