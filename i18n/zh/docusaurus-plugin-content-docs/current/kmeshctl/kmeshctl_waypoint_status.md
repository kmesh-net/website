## kmeshctl waypoint status

显示命名空间中 waypoint 的状态

### 简介

显示指定命名空间（未指定时为默认命名空间）中 waypoint 的状态

```bash
kmeshctl waypoint status [flags]
```

### 示例

```bash
  # 显示默认命名空间中 waypoint 的状态
  kmeshctl waypoint status

  # 显示指定命名空间中 waypoint 的状态
  kmeshctl waypoint status --namespace foo
```

### 选项

```bash
  -h, --help   help for status
```

### 继承自父命令的选项

```bash
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl waypoint](kmeshctl_waypoint.md) - 管理 waypoint 配置
