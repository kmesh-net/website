---
draft: false
linktitle: Traffic Split
menu:
  docs:
    parent: developer guide
    weight: 10
title: Load Balance
toc: true
type: docs

---

### Before you begin

####  Install Kmesh

Because this function needs to be tested in kernel-native mode, we need to modify the startup parameters:

In chapter of [quickstart](https://kmesh.net/en/docs/setup/quickstart/) `Change Kmesh Start Mode`, we should modify `deploy/charts/kmesh-helm/values.yaml`, change `--mode=dual-engine` to `--mode=kernel-native`.

#### Deploy the Sample Applications

```shell
[root@master kmesh]# kubectl apply -f samples/sleep/sleep.yaml -n tcp-echo-test
[root@master kmesh]# kubectl apply -f samples/tcp-echo/tcp-echo-services.yaml -n tcp-echo-test
[root@master kmesh]# kubectl apply -f samples/tcp-echo/tcp-echo-v1_v2.yaml -n tcp-echo-test
```

### Apply weight-based Load Balance

1. Let Kmesh manage the traffic of pods 

   ```shell
   [root@master test]# kubectl label ns default istio.io/dataplane-moda=Kmesh
   ```

2. Confirm that the `tcp-echo` service is up and running by sending some TCP traffic.

   ```shell
   ##get tcp-echo service address
   [root@master test]# kuebctl get svc | grep tcp-
   tcp-echo  ClusterIP  10.96.128.249 <none>  9000/TCP,9001/TCP 43h
   [root@master test]# for i in {1..20}; do kubectl exec sleep-78ff5975c6-cm8hd -c sleep -- sh -c "(date; sleep 1) | nc  10.96.128.249:9000;" done
   two Sat Jul  6 08:46:45 UTC 2024
   two Sat Jul  6 08:46:46 UTC 2024
   one Sat Jul  6 08:46:47 UTC 2024
   one Sat Jul  6 08:46:48 UTC 2024
   two Sat Jul  6 08:46:49 UTC 2024
   two Sat Jul  6 08:46:51 UTC 2024
   two Sat Jul  6 08:46:52 UTC 2024
   one Sat Jul  6 08:46:53 UTC 2024
   two Sat Jul  6 08:46:54 UTC 2024
   two Sat Jul  6 08:46:55 UTC 2024
   one Sat Jul  6 08:46:56 UTC 2024
   one Sat Jul  6 08:46:57 UTC 2024
   two Sat Jul  6 08:46:58 UTC 2024
   one Sat Jul  6 08:47:00 UTC 2024
   two Sat Jul  6 08:47:01 UTC 2024
   one Sat Jul  6 08:47:02 UTC 2024
   two Sat Jul  6 08:47:03 UTC 2024
   one Sat Jul  6 08:47:04 UTC 2024
   one Sat Jul  6 08:47:05 UTC 2024
   two Sat Jul  6 08:47:06 UTC 2024
   ```

### Dump the configuration information

```shell
[root@master kmesh]# ./kmeshctl dump kmesh-5f4fm kernel-native
```

After dump the configuration , we can see that the strategy is load balancing.

```json
{
    "name": "outbound|9001||tcp-echo.default.svc.cluster.local",
    "connectTimeout": 10,
    "lbPolicy": "LEAST_REQUEST",
    "loadAssignment": {
        "clusterName": "outbound|9001||tcp-echo.default.svc.cluster.local",
        "endpoints": [
            {
                "lbEndpoints": [
                    {
                        "address": {
                            "port": 10531,
                            "ipv4": 469890058
                        }
                    },
                    {
                        "address": {
                            "port": 10531,
                            "ipv4": 453112842
                        }
                    }
                ],
                "loadBalancingWeight": 2
            }
        ]
    },
    "circuitBreakers": {
        "maxConnections": 4294967295,
        "maxPendingRequests": 4294967295,
        "maxRequests": 4294967295,
        "maxRetries": 4294967295
    }
}
```

