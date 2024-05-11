

[TOC]

# Authorization

This task shows you how to set up Kmesh authorization policy.

## Before you begin

- Understand the [AuthorizationPolicy](#AuthorizationPolicy)

- Install Kmesh

  Please refer [quickstart](https://kmesh.net/en/docs/setup/quickstart/)

- Deploy the Sample Applications

  Please refer [deploy applications](https://kmesh.net/en/docs/setup/quickstart/#deploy-the-sample-applications)

- Check app status and ensure that the service application is managed by Kmesh

  ```log
  kubectl get pod 
  NAME                                      READY   STATUS    RESTARTS   AGE
  kubectl get pod  -o wide | grep sleep
  sleep-78ff5975c6-phhll                      1/1     Running            0          30h   10.244.2.22   ambient-worker    <none>           <none>
  sleep-78ff5975c6-plh7r                      1/1     Running            0          30h   10.244.1.46   ambient-worker2   <none>           <none>
  
  kubectl describe po httpbin-65975d4c6f-96kgw | grep Annotations
  Annotations:      kmesh.net/redirection: enabled
  ```

## Configure ALLOW authorization policy

- Create an "allow-by-srcip" authorization policy for the httpbin workload within the corresponding namespace, apply the policy by running the following command, which allows requests from a specified IP address. In this example, the IP address `10.244.1.46/32` corresponds to the pod `sleep-78ff5975c6-plh7r`

  ```
  kubectl apply -f - <<EOF
  apiVersion: security.istio.io/v1beta1
  kind: AuthorizationPolicy
  metadata:
   name: allow-by-srcip
   namespace: default
  spec:
   selector:
     matchLabels:
       app: httpbin
   action: ALLOW
   rules:
   - from:
     - source:
         ipBlocks:
         - 10.244.1.46/32
  EOF
  ```

  

- Verify whether requests from the corresponding IP are being allowed.

  ```log
  kubectl exec sleep-78ff5975c6-plh7r -c sleep -- curl  http://httpbin:8000/headers
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                   Dload  Upload   Total   Spent    Left  Speed
    0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0{
    "headers": {
      "Accept": "*/*", 
      "Host": "httpbin:8000", 
      "User-Agent": "curl/8.5.0"
    }
  }
  100   105  100   105    0     0  18078      0 --:--:-- --:--:-- --:--:-- 21000
  ```

  

- Verify if requests from other IPs are being denied.

  ```
  kubectl exec sleep-78ff5975c6-phhll -c sleep -- curl  http://httpbin:8000/headers
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                   Dload  Upload   Total   Spent    Left  Speed
    0   105    0     0    0     0      0      0 --:--:--  0:01:00 --:--:--     0
  curl: (56) Recv failure: Connection reset by peer
  ```

  

- Clean up the AuthorizationPolicy.

  ```log
  kubectl delete AuthorizationPolicy allow-by-srcip -n default
  ```

  

## Configure DENY authorization policy

- Create a "deny-by-srcip" authorization policy for the httpbin workload within the specified namespace, which denies requests from a particular IP address, execute the following command

  ```
  kubectl apply -f - <<EOF
  apiVersion: security.istio.io/v1beta1
  kind: AuthorizationPolicy
  metadata:
   name: deny-by-srcip
   namespace: default
  spec:
   selector:
     matchLabels:
       app: httpbin
   action: DENY
   rules:
   - from:
     - source:
         ipBlocks:
         - 10.244.1.46/32
  EOF
  ```

- Verify whether requests from the corresponding IP are being denied.

  ```
  kubectl exec sleep-78ff5975c6-plh7r -c sleep -- curl  "http://httpbin:8000/headers"
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                   Dload  Upload   Total   Spent    Left  Speed
    0   105    0     0    0     0      0      0 --:--:--  0:01:04 --:--:--     0
  curl: (56) Recv failure: Connection reset by peer
  ```

- Verify if requests from other IPs are being allowed.

  ```
  kubectl exec sleep-78ff5975c6-phhll -c sleep -- curl  "http://httpbin:8000/headers"
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                   Dload  Upload   Total   Spent    Left  Speed
    0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0{
    "headers": {
      "Accept": "*/*", 
      "Host": "httpbin:8000", 
      "User-Agent": "curl/8.5.0"
    }
  }
  100   105  100   105    0     0  11284      0 --:--:-- --:--:-- --:--:-- 11666
  ```

  

- Clean up the AuthorizationPolicy.

  ```log
  kubectl delete AuthorizationPolicy deny-by-srcip -n default
  ```

  

## Clean up

Please refer [cleanup](https://kmesh.net/en/docs/setup/quickstart/#clean-up)



## AuthorizationPolicy

| Field   | Type     | Description                                                  | Required |
| ------- | -------- | ------------------------------------------------------------ | -------- |
| `rules` | `Rule[]` | Optional. A list of rules to match the request. A match occurs when at least one rule matches the request.If not set, the match will never occur. This is equivalent to setting a default of deny for the target workloads if the action is ALLOW. | No       |

### Rule 

Rule matches requests from a list of sources that perform a list of operations subject to a list of conditions. A match occurs when at least one source, one operation and all conditions matches the request. An empty rule is always matched.

| Field  | Type     | Description                                                  | Required |
| ------ | -------- | ------------------------------------------------------------ | -------- |
| `from` | `From[]` | Optional. `from` specifies the source of a request.If not set, any source is allowed. | No       |
| `to`   | `To[]`   | Optional. `to` specifies the operation of a request.If not set, any operation is allowed. | No       |

#### Rule.From

From includes a list of sources.

| Field    | Type     | Description                               | Required |
| -------- | -------- | ----------------------------------------- | -------- |
| `source` | `Source` | Source specifies the source of a request. | No       |

#### Rule.To

To includes a list of operations.

| Field       | Type        | Description                                     | Required |
| ----------- | ----------- | ----------------------------------------------- | -------- |
| `operation` | `Operation` | Operation specifies the operation of a request. | No       |

### Source

Source specifies the source identities of a request. Fields in the source are ANDed together.

For example, the following source matches if the principal is `admin` or `dev` and the namespace is `prod` or `test` and the ip is not `203.0.113.4`.

```yaml
principals: ["admin", "dev"]
namespaces: ["prod", "test"]
notIpBlocks: ["203.0.113.4"]
```



| Field           | Type       | Description                                                  | Required |
| --------------- | ---------- | ------------------------------------------------------------ | -------- |
| `principals`    | `string[]` | Optional. A list of peer identities derived from the peer certificate. The peer identity is in the format of `"<TRUST_DOMAIN>/ns/<NAMESPACE>/sa/<SERVICE_ACCOUNT>"`, for example, `"cluster.local/ns/default/sa/productpage"`. This field requires mTLS enabled and is the same as the `source.principal` attribute.If not set, any principal is allowed. | No       |
| `notPrincipals` | `string[]` | Optional. A list of negative match of peer identities.       | No       |
| `namespaces`    | `string[]` | Optional. A list of namespaces derived from the peer certificate. This field requires mTLS enabled and is the same as the `source.namespace` attribute.If not set, any namespace is allowed. | No       |
| `notNamespaces` | `string[]` | Optional. A list of negative match of namespaces.            | No       |
| `ipBlocks`      | `string[]` | Optional. A list of IP blocks, populated from the source address of the IP packet. Single IP (e.g. `203.0.113.4`) and CIDR (e.g. `203.0.113.0/24`) are supported. This is the same as the `source.ip` attribute.If not set, any IP is allowed. | No       |
| `notIpBlocks`   | `string[]` | Optional. A list of negative match of IP blocks.             | No       |

### Operation

Operation specifies the operations of a request. Fields in the operation are ANDed together.

| Field      | Type       | Description                                                  | Required |
| ---------- | ---------- | ------------------------------------------------------------ | -------- |
| `ports`    | `string[]` | Optional. A list of ports as specified in the connection.If not set, any port is allowed. | No       |
| `notPorts` | `string[]` | Optional. A list of negative match of ports as specified in the connection. | No       |

