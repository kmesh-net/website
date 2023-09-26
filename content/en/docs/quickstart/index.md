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


