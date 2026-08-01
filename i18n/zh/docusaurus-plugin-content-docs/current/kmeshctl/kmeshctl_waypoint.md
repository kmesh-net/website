## kmeshctl waypoint

管理 waypoint 配置

### 简介

一组用于管理 waypoint 配置的命令

```bash
kmeshctl waypoint [flags]
```

### 示例

```bash
  # 将 waypoint 应用到当前命名空间
  kmeshctl waypoint apply

  # 以 yaml 形式生成 waypoint
  kmeshctl waypoint generate --namespace default

  # 列出指定命名空间中的所有 waypoint
  kmeshctl waypoint list --namespace default
```

### 选项

```bash
  -h, --help               help for waypoint
      --image string       image of the waypoint
      --name string        name of the waypoint (default "waypoint")
  -n, --namespace string   Kubernetes namespace
```

### 另请参阅

* [kmeshctl](kmeshctl.md) - 用于运维和调试 Kmesh 的命令行工具
* [kmeshctl waypoint apply](kmeshctl_waypoint_apply.md) - 应用 waypoint 配置
* [kmeshctl waypoint delete](kmeshctl_waypoint_delete.md) - 删除 waypoint 配置
* [kmeshctl waypoint generate](kmeshctl_waypoint_generate.md) - 生成 waypoint 配置
* [kmeshctl waypoint list](kmeshctl_waypoint_list.md) - 列出受管的 waypoint 配置
* [kmeshctl waypoint status](kmeshctl_waypoint_status.md) - 显示命名空间中 waypoint 的状态
