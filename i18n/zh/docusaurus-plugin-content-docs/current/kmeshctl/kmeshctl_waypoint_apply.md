## kmeshctl waypoint apply

应用 waypoint 配置

### 简介

将 waypoint 配置应用到集群

```bash
kmeshctl waypoint apply [flags]
```

### 示例

```bash
  # 将 waypoint 应用到当前命名空间
  kmeshctl waypoint apply

  # 将 waypoint 应用到指定命名空间并等待其就绪
  kmeshctl waypoint apply --namespace default --wait
 
  # 将 waypoint 应用到指定 pod
  kmeshctl waypoint apply -n default --name reviews-v2-pod-waypoint --for workload
```

### 选项

```bash
      --enroll-namespace   If set, the namespace will be labeled with the waypoint name
      --for string         Specify the traffic type [all none service workload] for the waypoint
  -h, --help               help for apply
      --overwrite          Overwrite the existing Waypoint used by the namespace
  -r, --revision string    The revision to label the waypoint with
  -w, --wait               Wait for the waypoint to be ready
```

### 继承自父命令的选项

```bash
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl waypoint](kmeshctl_waypoint.md) - 管理 waypoint 配置
