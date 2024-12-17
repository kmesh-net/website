---
draft: false
linktitle: Load Balance
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

 Please refer [quickstart](https://kmesh.net/en/docs/setup/quickstart/)

#### Deploy the Sample Applications

```shell
[root@master test]# kubectl apply -f sleep.yaml -n tcp-echo-test
[root@master test]# kubectl apply -f tcp-echo-services.yaml -n tcp-echo-test
[root@master test]# kubectl apply -f tcp-echo-v1_v2.yaml -n tcp-echo-test
```

#### sleep.yaml

```shell
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sleep
---
apiVersion: v1
kind: Service
metadata:
  name: sleep
  labels:
    app: sleep
    service: sleep
spec:
  ports:
  - port: 80
    name: http
  selector:
    app: sleep
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sleep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sleep
  template:
    metadata:
      labels:
        app: sleep
    spec:
      terminationGracePeriodSeconds: 0
      serviceAccountName: sleep
      containers:
      - name: sleep
        image: curlimages/curl
        command: ["/bin/sleep", "infinity"]
        imagePullPolicy: IfNotPresent
        volumeMounts:
        - mountPath: /etc/sleep/tls
          name: secret-volume
      volumes:
      - name: secret-volume
        secret:
          secretName: sleep-secret
          optional: true
```

#### tcp-echo-services.yaml 

```shell
apiVersion: v1
kind: Service
metadata:
  name: tcp-echo
  labels:
    app: tcp-echo
    service: tcp-echo
spec:
  ports:
  - name: tcp
    port: 9000
  - name: tcp-other
    port: 9001
  # Port 9002 is omitted intentionally for testing the pass through filter chain.
  selector:
    app: tcp-echo
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tcp-echo-v1
  labels:
    app: tcp-echo
    version: v1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tcp-echo
      version: v1
  template:
    metadata:
      labels:
        app: tcp-echo
        version: v1
    spec:
      containers:
      - name: tcp-echo
        image: docker.io/istio/tcp-echo-server:1.3
        imagePullPolicy: IfNotPresent
        args: [ "9000,9001,9002", "one" ]
        ports:
        - containerPort: 9000
        - containerPort: 9001
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tcp-echo-v2
  labels:
    app: tcp-echo
    version: v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tcp-echo
      version: v2
  template:
    metadata:
      labels:
        app: tcp-echo
        version: v2
    spec:
      containers:
      - name: tcp-echo
        image: docker.io/istio/tcp-echo-server:1.3
        imagePullPolicy: IfNotPresent
        args: [ "9000,9001,9002", "two" ]
        ports:
        - containerPort: 9000
        - containerPort: 9001
```

#### tcp-echo-v1_v2.yaml

```shell
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: tcp-echo
spec:
  hosts:
  - tcp-echo
  tcp:
  - route:
    - destination:
        host: tcp-echo
        port:
          number: 9000
        subset: v1
      weight: 25 
    - destination:
        host: tcp-echo
        port:
          number: 9000
        subset: v2
      weight: 75  
```

### Apply weight-based Load Balance

1. Let Kmesh manage the traffic of pods 

   ```shell
   [root@master test]# kubectl label ns default -n tcp-echo-test
   [root@master test]# kubectl delete pods --all -n tcp-echo-test
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
[root@master test]# kubectl exec -it pod kmesh-5f4fm -n kmesh-system -- /bin/bash

[root@kmesh-5f4fm kmesh]# curl localhost:15200/debug/config_dump/ads
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

