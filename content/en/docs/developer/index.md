---
draft: false
linktitle: Build
menu:
  docs:
    parent: developer guide
    weight: 5
title: Build
toc: true
type: docs
---

## Prerequisites

## Kmesh Cluster Startup Mode

Starting deployment based on container images

- Obtain the [container image](https://github.com/kmesh-net/kmesh/releases/) and load it to the cluster.

```sh
# The Kmesh x86 image is used for openEuler 23.03 OS.
docker pull ghcr.io/kmesh-net/kmesh:v0.3.0
```

- Start Kmesh.

- Start the Kmesh container.

```sh
docker run -itd --privileged=true -v /mnt:/mnt -v /sys/fs/bpf:/sys/fs/bpf -v /lib/modules:/lib/modules --name kmesh kmesh:v0.3.0
```

- Start Kmesh in daemonset mode.

```sh
kubectl apply -f kmesh.yaml
```
