## kmeshctl waypoint list

列出受管的 waypoint 配置

### 简介

列出集群中受管的 waypoint 配置

```bash
kmeshctl waypoint list [flags]
```

### 示例

```bash
  # 列出指定命名空间中的所有 waypoint
  kmeshctl waypoint list --namespace default

  # 列出集群中的所有 waypoint
  kmeshctl waypoint list -A
```

### 选项

```bash
  -A, --all-namespaces   List all waypoints in all namespaces
  -h, --help             help for list
```

### 继承自父命令的选项

```bash
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl waypoint](kmeshctl_waypoint.md) - 管理 waypoint 配置
