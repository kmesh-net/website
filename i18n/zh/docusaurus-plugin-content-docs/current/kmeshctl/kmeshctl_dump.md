## kmeshctl dump

转储内核原生模式或双引擎模式的配置

```bash
kmeshctl dump [flags]
```

### 示例

```bash
# 内核原生模式（表格输出）：
kmeshctl dump <kmesh-daemon-pod> kernel-native

# 双引擎模式（表格输出）：
kmeshctl dump <kmesh-daemon-pod> dual-engine

# 以原始 JSON 输出：
kmeshctl dump <kmesh-daemon-pod> kernel-native -o json
```

### 选项

```bash
  -h, --help            help for dump
  -o, --output string   Output format: table or json (default "table")
```

### 另请参阅

* [kmeshctl](kmeshctl.md) - 用于运维和调试 Kmesh 的命令行工具
