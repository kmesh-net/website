---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/


title: "Kmesh: 监控指标和访问日志功能详解"

subtitle: ""

summary: "Kmesh是如何使用eBPF直接获取链接信息？并根据这些信息构建监控指标和访问日志的"

authors: [LiZhenCheng9527]

tags: [introduce]

categories: [General]

date: 2024-11-19T14:35:00+08:00

lastmod: 2024-11-19T14:35:09+08:00

featured: false

draft: false


# Featured image

# To use, add an image named `featured.jpg/png` to your page's folder.

# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.

image:

  caption: ""

  focal_point: ""

  preview_only: false


# Projects (optional).

#   Associate this post with one or more of your projects.

#   Simply enter your project's folder or file name without extension.

#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.

#   Otherwise, set `projects = []`.

projects: []
---
## Kmesh介绍

Kmesh 是内核原生sidecarless服务网格数据平面。 它借助 "ebpf "和 "可编程内核"，将流量治理下沉到操作系统内核，大大的降低了服务网格的资源开销和网络延迟。

通过eBPF，流量数据可以直接在内核中获取，并且能够使用 "bpf map"将数据传递到用户空间。Kmesh使用这些数据构建监控指标和访问日志。

## 如何获取原始数据

在内核中，可以直接获取socket携带的流量信息。

bpf_tcp_sock 中携带的数据如下：

```c
struct bpf_tcp_sock {
	__u32 snd_cwnd;		/* Sending congestion window		*/
	__u32 srtt_us;		/* smoothed round trip time << 3 in usecs */
	__u32 rtt_min;
	__u32 snd_ssthresh;	/* Slow start size threshold		*/
	__u32 rcv_nxt;		/* What we want to receive next		*/
	__u32 snd_nxt;		/* Next sequence we send		*/
	__u32 snd_una;		/* First byte we want an ack for	*/
	__u32 mss_cache;	/* Cached effective mss, not including SACKS */
	__u32 ecn_flags;	/* ECN status bits.			*/
	__u32 rate_delivered;	/* saved rate sample: packets delivered */
	__u32 rate_interval_us;	/* saved rate sample: time elapsed */
	__u32 packets_out;	/* Packets which are "in flight"	*/
	__u32 retrans_out;	/* Retransmitted packets out		*/
	__u32 total_retrans;	/* Total retransmits for entire connection */
	__u32 segs_in;		/* RFC4898 tcpEStatsPerfSegsIn
				 * total number of segments in.
				 */
	__u32 data_segs_in;	/* RFC4898 tcpEStatsPerfDataSegsIn
				 * total number of data segments in.
				 */
	__u32 segs_out;		/* RFC4898 tcpEStatsPerfSegsOut
				 * The total number of segments sent.
				 */
	__u32 data_segs_out;	/* RFC4898 tcpEStatsPerfDataSegsOut
				 * total number of data segments sent.
				 */
	__u32 lost_out;		/* Lost packets			*/
	__u32 sacked_out;	/* SACK'd packets			*/
	__u64 bytes_received;	/* RFC4898 tcpEStatsAppHCThruOctetsReceived
				 * sum(delta(rcv_nxt)), or how many bytes
				 * were acked.
				 */
	__u64 bytes_acked;	/* RFC4898 tcpEStatsAppHCThruOctetsAcked
				 * sum(delta(snd_una)), or how many bytes
				 * were acked.
				 */
	__u32 dsack_dups;	/* RFC4898 tcpEStatsStackDSACKDups
				 * total number of DSACK blocks received
				 */
	__u32 delivered;	/* Total data packets delivered incl. rexmits */
	__u32 delivered_ce;	/* Like the above but only ECE marked packets */
	__u32 icsk_retransmits;	/* Number of unrecovered [RTO] timeouts */
};
```

**注意:** 上述数据并没完全用于监控指标和访问日志功能。Kmesh将在后续的开发中逐步补充这些指标。

现阶段使用的数据有：

```c
struct tcp_probe_info {
    __u32 type;
    struct bpf_sock_tuple tuple;
    __u32 sent_bytes;
    __u32 received_bytes;
    __u32 conn_success;
    __u32 direction;
    __u64 duration; // ns
    __u64 close_ns;
    __u32 state; /* tcp state */
    __u32 protocol;
    __u32 srtt_us; /* smoothed round trip time << 3 in usecs */
    __u32 rtt_min;
    __u32 mss_cache;     /* Cached effective mss, not including SACKS */
    __u32 total_retrans; /* Total retransmits for entire connection */
    __u32 segs_in;       /* RFC4898 tcpEStatsPerfSegsIn
                          * total number of segments in.
                          */
    __u32 segs_out;      /* RFC4898 tcpEStatsPerfSegsOut
                          * The total number of segments sent.
                          */
    __u32 lost_out;      /* Lost packets			*/
};
```

除了这些socket携带的数据外，Kmesh通过socket_storage在建立链接时存储临时数据。当链接关闭时，从之前存储的临时数据中获取链接持续时间等数据。

## 数据处理

Kmesh在内核中获取了来自链接的数据后，会通过ringbuf将数据传递给用户态。

Kmesh在用户将ringbuf的数据解析之后，根据这些数据中携带的源服务和目标服务信息更新metricController中的缓存和构建metricLabels。

构建的metriclabels有workload粒度的也有service粒度的。但workload粒度的监控指标最多是集群中pod数量的平方，因此Kmesh提供一个启动开关，使用户能够按需启用监控指标功能和访问日志功能。

```go
namespacedhost := ""
for k, portList := range dstWorkload.Services {
    for _, port := range portList.Ports {
        if port.TargetPort == uint32(dstPort) {
            namespacedhost = k
            break
        }
    }
    if namespacedhost != "" {
        break
    }
}
```

建立工作负载粒度的度量和服务粒度的度量metricLabels后，更新缓存。

每5秒钟，监控指标信息都会通过Prometheus API更新到Prometheus中。

在处理指标时，会一起生成访问日志。每次链接关闭时，都会将生成的Accesslog打印到Kmesh的日志中。

Kmesh监控指标功能和访问日志功能的整体架构图如下所示：

<div align="center">
<img src="images/probe.svg" />
</div>

### 指标细节

现阶段Kmesh L4层监控的指标如下：

**工作负载粒度:**

|Name|Describe|
|---|---|
|kmesh_tcp_workload_connections_opened_total|源工作负载和目标工作负载之间总共建立了多少次链接|
|kmesh_tcp_workload_connections_closed_total|源工作负载和目标工作负载之间总共关闭了多少次链接|
|kmesh_tcp_workload_received_bytes_total|目标工作负载接收到了多少比特的数据|
|kmesh_tcp_workload_sent_bytes_total|源工作负载发送了多少比特的数据|
|kmesh_tcp_workload_conntections_failed_total|源工作负载和目标工作负载之间建立链接失败了多少次|

**服务粒度:**

|Name|Describe|
|---|---|
|kmesh_tcp_connections_opened_total|源工作负载和目标服务之间总共建立了多少次链接|
|kmesh_tcp_connections_closed_total|源工作负载和目标服务之间总共关闭了多少次链接|
|kmesh_tcp_received_bytes_total|目标服务接收到了多少比特的数据|
|kmesh_tcp_sent_bytes_total|源工作负载发送了多少比特的数据|
|kmesh_tcp_conntections_failed_total|源工作负载和目标服务之间建立链接失败了多少次|

监控指标例子:

```sh
kmesh_tcp_workload_received_bytes_total{connection_security_policy="mutual_tls",destination_app="httpbin",destination_canonical_revision="v1",destination_canonical_service="httpbin",destination_cluster="Kubernetes",destination_pod_address="10.244.0.11",destination_pod_name="httpbin-5c5944c58c-v9mlk",destination_pod_namespace="default",destination_principal="-",destination_version="v1",destination_workload="httpbin",destination_workload_namespace="default",reporter="destination",request_protocol="tcp",response_flags="-",source_app="sleep",source_canonical_revision="latest",source_canonical_service="sleep",source_cluster="Kubernetes",source_principal="-",source_version="latest",source_workload="sleep",source_workload_namespace="default"} 231
```

也能够通过prometheus dashboard查看监控指标。具体步骤参考[Kmesh可观测性文档](https://kmesh.net/en/docs/userguide/metric/)

现阶段Kmesh访问日志展示的字段如下：

|Name|Describe|
|---|---|
|src.addr|请求的源地址和端口|
|src.workload|源工作负载名称|
|src.namespace|源工作负载所在的namespace|
|dst.addr|请求的目标地址和端口|
|dst.service|目标服务的域名|
|dst.workload|目标工作负载的名称|
|dst.namespace|目标工作负载的命名空间|
|direction|流量流向，OUTBOUND表示从节点流出，INBOUND表示从流入节点|
|sent_bytes|本次链接发送的数据量|
|received_bytes|本次链接接收的数据量|
|duration|本次链接的持续时间|

Accesslog Result:

```sh
accesslog: 2024-09-14 08:19:26.552709932 +0000 UTC 
src.addr=10.244.0.17:51842, src.workload=prometheus-5fb7f6f8d8-h9cts, src.namespace=istio-system, 
dst.addr=10.244.0.13:9080, dst.service=productpage.echo-1-27855.svc.cluster.local, dst.workload=productpage-v1-8499c849b9-bz9t9, dst.namespace=echo-1-27855, direction=INBOUND, sent_bytes=5, received_bytes=292, duration=2.733902ms
```

## Summary

Kmesh直接从套接字获取流量数据，并将其作为ringbuf传递到用户空间，以生成监控指标和访问日志。

避免在用户空间拦截流量并以本地方式获取指标。 定期批量更新用户空间中的指标，避免在大流量时增加网络延迟。

随后，我们还将开发跟踪功能，以补充 kmesh 的可观测能力。

欢迎感兴趣的同学加入[Kmesh开源社区](https://github.com/kmesh-net/kmesh)!