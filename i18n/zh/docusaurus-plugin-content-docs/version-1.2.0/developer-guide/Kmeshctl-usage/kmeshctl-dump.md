---
title: Kmeshctl Dump（转储）
sidebar_position: 3
---

转储内核原生模式或双引擎模式的配置

```bash
kmeshctl dump [flags]
```

### 示例

```bash
# 内核原生模式：
kmeshctl dump <kmesh-daemon-pod> kernel-native

# 双引擎模式：
kmeshctl dump <kmesh-daemon-pod> dual-engine
```

### 选项

```bash
  -h, --help   help for dump
```
