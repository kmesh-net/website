## kmeshctl secret create

通过 kmeshctl 生成 IPsec 密钥与配置

```bash
kmeshctl secret create [flags]
```

### 示例

```bash
# 使用随机 IPsec 密钥生成 IPsec 配置：
kmeshctl secret create
# 使用用户自定义密钥生成 IPsec 配置：
kmeshctl secret create --key=$(echo -n "{36-character user-defined key here}" | xxd -p -c 64)
```

### 选项

```bash
  -h, --help         help for create
  -k, --key string   key of the encryption
```

### 另请参阅

* [kmeshctl secret](kmeshctl_secret.md) - 使用 secrets 管理 IPsec 的密钥配置数据
