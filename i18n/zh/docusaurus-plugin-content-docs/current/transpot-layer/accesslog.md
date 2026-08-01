---
sidebar_position: 6
title: 访问日志
---

## 启用 Kmesh 访问日志

可使用 kmeshctl 启用或禁用 Kmesh accesslog。

请参阅 [Kmeshctl 监控指南](../developer-guide/Kmeshctl-usage/kmeshctl-monitoring.md)

## Kmesh 生成的 TCP 访问日志详解

日志由 Kmesh daemon 在 TCP 连接生命周期的关键阶段生成：

- 若启用了 `connectionMetrics`，则在连接处于活跃状态时按固定的 5 秒间隔生成。

- 在连接关闭时生成

访问日志字段说明：

| 名称           | 描述                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| src.addr       | 源地址与端口，请求的源工作负载                                                                 |
| src.workload   | 发起请求的 Pod 名称                                                                            |
| src.namespace  | 源工作负载所属命名空间                                                                         |
| dst.addr       | 目标地址与端口，请求的目标工作负载                                                             |
| dst.service    | 目标服务的主机名                                                                               |
| dst.workload   | 接收请求的 Pod 名称                                                                            |
| dst.namespace  | 目标工作负载所属命名空间                                                                       |
| direction      | 流量方向。INBOUND 表示进入目标服务，OUTBOUND 表示离开源服务                                    |
| sent_bytes     | 此连接发送的字节数                                                                             |
| received_bytes | 此连接接收的字节数                                                                             |
| duration       | 此连接的持续时间                                                                               |

示例如下：

```bash
accesslog: 2025-04-24 08:54:40.971980208 +0000 UTC src.addr=10.244.2.79:41978, src.workload=ws-client, src.namespace=default, dst.addr=10.244.2.78:8080, dst.service=ws-server-service.default.svc.cluster.local, dst.workload=ws-server, dst.namespace=default, start_time=2025-04-24 08:53:50.919245381 +0000 UTC, direction=OUTBOUND, state=BPF_TCP_ESTABLISHED, sent_bytes=3, received_bytes=227, packet_loss=0, retransmissions=0, srtt=40515us, min_rtt=34us, duration=50052.734827ms
```
