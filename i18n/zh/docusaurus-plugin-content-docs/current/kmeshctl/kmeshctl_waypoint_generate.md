## kmeshctl waypoint generate

生成 waypoint 配置

### 简介

以 YAML 形式生成 waypoint 配置

```bash
kmeshctl waypoint generate [flags]
```

### 示例

```bash
  # 以 yaml 形式生成 waypoint
  kmeshctl waypoint generate --namespace default

  # 生成可为 default 命名空间中 service 流量处理的 waypoint
  kmeshctl waypoint generate --for service -n default
```

### 选项

```bash
      --for string        Specify the traffic type [all none service workload] for the waypoint
  -h, --help              help for generate
  -r, --revision string   The revision to label the waypoint with
```

### 继承自父命令的选项

```bash
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl waypoint](kmeshctl_waypoint.md) - 管理 waypoint 配置
