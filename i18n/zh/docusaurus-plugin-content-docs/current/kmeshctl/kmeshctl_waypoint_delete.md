## kmeshctl waypoint delete

删除 waypoint 配置

### 简介

从集群中删除 waypoint 配置

```bash
kmeshctl waypoint delete [flags]
```

### 示例

```bash
  # 从默认命名空间删除 waypoint
  kmeshctl waypoint delete

  # 按名称删除 waypoint（名称可通过 kmeshctl waypoint list 获取）
  kmeshctl waypoint delete waypoint-name --namespace default

  # 按名称删除多个 waypoint
  kmeshctl waypoint delete waypoint-name1 waypoint-name2 --namespace default

  # 删除指定命名空间中的所有 waypoint
  kmeshctl waypoint delete --all --namespace default
```

### 选项

```bash
      --all    Delete all waypoints in the namespace
  -h, --help   help for delete
```

### 继承自父命令的选项

```bash
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl waypoint](kmeshctl_waypoint.md) - 管理 waypoint 配置
