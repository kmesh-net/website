---
draft: false
linktitle: Build
menu:
  docs:
    parent: developer guide
    weight: 1
title: Build
toc: true
type: docs
---

## Prerequisites

## Kmesh Cluster Startup Mode

Starting deployment based on container images

- Obtain the [container image](https://github.com/kmesh-net/kmesh/releases/) and load it to the cluster.

```sh
[root@dev Kmesh]# docker load -i kmesh-1.0.1.tar
```

- Start Kmesh.

- Start the Kmesh container.

```sh
[root@dev Kmesh]# docker run -itd --privileged=true -v /mnt:/mnt -v /sys/fs/bpf:/sys/fs/bpf -v /lib/modules:/lib/modules --name kmesh kmesh:1.0.1
```

- Start Kmesh in daemonset mode.

```sh
[root@dev Kmesh]# kubectl apply -f kmesh.yaml
```