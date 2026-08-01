## kmeshctl accesslog

启用或禁用 Kmesh 的访问日志（accesslog）

```bash
kmeshctl accesslog [flags]
```

### 示例

```bash
# 启用 Kmesh 的访问日志：
kmeshctl accesslog <kmesh-daemon-pod> enable

# 禁用 Kmesh 的访问日志：
kmeshctl accesslog <kmesh-daemon-pod> disable
```

### 选项

```bash
  -h, --help   help for accesslog
```

### 另请参阅

* [kmeshctl](kmeshctl.md)  - 用于运维和调试 Kmesh 的命令行工具
