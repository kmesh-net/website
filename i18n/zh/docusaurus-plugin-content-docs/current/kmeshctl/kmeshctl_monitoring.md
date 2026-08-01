## kmeshctl monitoring

按需控制 Kmesh 监控功能的开启与关闭

```bash
kmeshctl monitoring [flags]
```

### 示例

```bash
# 启用/禁用 Kmesh 的访问日志：
kmeshctl monitoring <kmesh-daemon-pod> --accesslog enable/disable

# 启用/禁用由 bpf 生成的服务指标与访问日志：
kmeshctl monitoring <kmesh-daemon-pod> --all enable/disable

# 启用/禁用 workload 粒度指标：
kmeshctl monitoring <kmesh-daemon-pod> --workloadMetrics enable/disable

# 启用/禁用连接粒度指标：
kmeshctl monitoring <kmesh-daemon-pod> --connectionMetrics enable/disable

# 若要更改集群中所有 kmesh daemon 的监控功能：
# 在每个节点启用/禁用 Kmesh 的访问日志：
kmeshctl monitoring --accesslog enable/disable

# 在每个节点启用/禁用 workload 粒度指标：
kmeshctl monitoring --workloadMetrics enable/disable

# 在每个节点启用/禁用连接粒度指标：
kmeshctl monitoring --connectionMetrics enable/disable

# 在每个节点启用/禁用由 bpf 生成的服务、workload 与连接指标及访问日志：
kmeshctl monitoring --all enable/disable
```

### 选项

```bash
      --accesslog string           Control accesslog enable or disable
      --all string                 Control accesslog and services' and workloads' metrics enable or disable together
      --connectionMetrics string   Control connection granularity metrics enable or disable
  -h, --help                       help for monitoring
      --workloadMetrics string     Control workload granularity metrics enable or disable
```

### 另请参阅

* [kmeshctl](kmeshctl.md) - 用于运维和调试 Kmesh 的命令行工具
