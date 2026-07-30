## kmeshctl secret

使用 secrets 管理 IPsec 的密钥配置数据

```bash
kmeshctl secret [flags]
```

### 示例

```bash
# 使用 kmeshctl secret 管理 IPsec 的密钥配置数据：
kmeshctl secret create or kmeshctl secret create --key=$(echo -n "{36-character user-defined key here}" | xxd -p -c 64)
kmeshctl secret get
kmeshctl secret delete

```

### 选项

```bash
  -h, --help   help for secret
```

### 另请参阅

* [kmeshctl](kmeshctl.md) - 用于运维和调试 Kmesh 的命令行工具
* [kmeshctl secret create](kmeshctl_secret_create.md) - 通过 kmeshctl 生成 IPsec 密钥与配置
* [kmeshctl secret delete](kmeshctl_secret_delete.md) - 通过 kmeshctl 删除 IPsec 密钥与配置
* [kmeshctl secret get](kmeshctl_secret_get.md) - 通过 kmeshctl 获取 IPsec 密钥与配置
