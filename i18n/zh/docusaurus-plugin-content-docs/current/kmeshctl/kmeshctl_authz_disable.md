## kmeshctl authz disable

禁用用于 Kmesh 授权卸载的 xdp authz eBPF 程序

```bash
kmeshctl authz disable [podNames...] [flags]
```

### 示例

```bash
kmeshctl authz disable
kmeshctl authz disable pod1 pod2
```

### 选项

```bash
  -h, --help   help for disable
```

### 另请参阅

* [kmeshctl authz](kmeshctl_authz.md) - 管理用于 Kmesh 授权卸载的 xdp authz eBPF 程序
