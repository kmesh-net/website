---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/


title: "Kmesh: Metrics and Accesslog in Detail"

subtitle: ""

summary: "How kmesh uses ebpf to get traffic infos to build metrics and accesslogs."

authors: [LiZhenCheng9527]

tags: [introduce]

categories: [General]

date: 2024-10-11T14:35:00+08:00

lastmod: 2024-10-11T14:35:09+08:00

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
## Introduction

Kmesh is kernel native sidecarless service mesh data plane. It sinks traffic governance into the OS kernel with the help of `ebpf` and `programmable kernel`. It reduces the resource overhead and network latency of the service mesh.

And the data of the traffic can be obtained directly in the kernel and can uses `bpf map` passed to the user space. This data is used to build metrics and accesslogs.

## How to Get Data

In the kernel, it is possible to get the metrics data carried by the socket directly.

The data carried in the bpf_tcp_sock is as follows:

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

**Notes:** The above data was not fully utilized for metrics and accesslog. Kmesh will fill in the metrics later in the development. The data used at this stage are:

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

In addition to this data that can be accessed directly, Kmesh temporary data while the link is being established. Obtain data such as link duration from the previously temporarily recorded data when the link is closed.

## How to Handle Data

After Kmesh is done with the data from this link, it will pass the data to the user state through ringbuf.

After parses the data from ringbuf in the use space, Kmesh builds `metricLabels` based on the linked source and destination information. it then updates the cache in the `metricController`.

This is because the data reported through ringbuf is linked data at the Pod granularity, but the metrics presented to the user are both at the pod granularity and at the service granularity. Therefore, aggregation is also required.

Get the hostname and namespace of the destination service in the cluster from the `Services` information in the destination Workload.

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

After building the metriclabels at the workload granularity and the metriclabels at the service granularity, update the cache.

Every 5 seconds, the metrics information will be updated into Prometheus through the Prometheus API.

Accesslog related data is generated when metrics are processed. With each link closure, the Accesslog is generated using this data and printed to the Kmesh's log.

The architecture diagram is shown below:

<div align="center">
<img src="images/probe.svg" />
</div>

### Result

Metrics monitored by Kmesh L4 at this stage:

**Workload:**

|Name|Describe|
|---|---|
|kmesh_tcp_workload_connections_opened_total|The total number of TCP connections opened to a workload|
|kmesh_tcp_workload_connections_closed_total|The total number of TCP connections closed to a workload|
|kmesh_tcp_workload_received_bytes_total|The size of the total number of bytes received in response to a workload over a TCP connection|
|kmesh_tcp_workload_sent_bytes_total|The size of the total number of bytes sent in response to a workload over a TCP connection|
|kmesh_tcp_workload_conntections_failed_total|The total number of TCP connections failed to a workload|

**Service:**

|Name|Describe|
|---|---|
|kmesh_tcp_connections_opened_total|The total number of TCP connections opened to a service|
|kmesh_tcp_connections_closed_total|The total number of TCP connections closed to a service|
|kmesh_tcp_received_bytes_total|The size of the total number of bytes reveiced in response to a service over a TCP connection|
|kmesh_tcp_sent_bytes_total|The size of the total number of bytes sent in response to a service over a TCP connection|
|kmesh_tcp_conntections_failed_total|The total number of TCP connections failed to a service|

Metric Result:

```sh
kmesh_tcp_workload_received_bytes_total{connection_security_policy="mutual_tls",destination_app="httpbin",destination_canonical_revision="v1",destination_canonical_service="httpbin",destination_cluster="Kubernetes",destination_pod_address="10.244.0.11",destination_pod_name="httpbin-5c5944c58c-v9mlk",destination_pod_namespace="default",destination_principal="-",destination_version="v1",destination_workload="httpbin",destination_workload_namespace="default",reporter="destination",request_protocol="tcp",response_flags="-",source_app="sleep",source_canonical_revision="latest",source_canonical_service="sleep",source_cluster="Kubernetes",source_principal="-",source_version="latest",source_workload="sleep",source_workload_namespace="default"} 231
```

It can also be viewed via the prometheus dashboard. Refer to [Kmesh observability](https://kmesh.net/en/docs/userguide/metric/)

Accesslog monitored by Kmesh L4 at this stage:

|Name|Describe|
|---|---|
|src.addr|Source address and port, source workload of the request|
|src.workload|Name of the Pod that initiated the request|
|src.namespace|Namespace of source worklaod|
|dst.addr|Destination address and port, destination workload of the request|
|dst.service|Hostname of deatination service|
|dst.workload|Name of the Pod receiving the request|
|dst.namespace|Namespace of destination workload|
|direction|The direction of the traffic. INBOUND means into the destination service, OUTBOUND means out of the source service|
|sent_bytes|Number of bytes sent for this connection|
|received_bytes|Number of bytes received for this connection|
|duration|Duration of this connection|

Accesslog Result:

```sh
accesslog: 2024-09-14 08:19:26.552709932 +0000 UTC 
src.addr=10.244.0.17:51842, src.workload=prometheus-5fb7f6f8d8-h9cts, src.namespace=istio-system, 
dst.addr=10.244.0.13:9080, dst.service=productpage.echo-1-27855.svc.cluster.local, dst.workload=productpage-v1-8499c849b9-bz9t9, dst.namespace=echo-1-27855, direction=INBOUND, sent_bytes=5, received_bytes=292, duration=2.733902ms
```

## Summary

Kmesh takes the traffic data directly from the socket and passes it as ringbuf to the user space to generate `Metric` and `Accesslog`. and expose it to Prometheus.

Avoid intercepting traffic in the user space and getting metrics in a native way. And batch update Metrics in user space at regular intervals to avoid increasing network latency during heavy traffic.

Subsequently, we will also develop the trace to complement the observability capability of kmesh. 

Welcome to participate in the [Kmesh community](https://github.com/kmesh-net/kmesh)!