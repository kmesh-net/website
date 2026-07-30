---
sidebar_position: 4
title: Kmesh daemon Map 无感升级
---

# 项目文档：Kmesh daemon Map 无感升级

## 当前策略

升级时，Kmesh-daemon 会将当前的 MapSpec（由 `bpf2go` 嵌入的 `CollectionSpec`）快照到磁盘。在升级过程中，daemon 会读取先前持久化的快照作为 oldMapSpec，并与当前的 MapSpec 进行严格比较。如果检测到 map 兼容（类型与布局相同），daemon 会复用已有的 pinned map。如果不兼容，daemon 不会尝试复杂的在线迁移；而是创建一个新的空 map，先 pin 到临时路径，再通过 unpin 旧 map 并将临时 pin 重命名为原路径，原子地替换原来的 pin。

## 何时能保证流量无感

### 安全变更

1. 新增 map（不改动现有 map 的属性）。

2. 增大现有 map 的 `MaxEntries`（容量增大），且不改变 key/value 的布局或大小。

### 会破坏无感升级的变更

1. `Key` 类型或 `Value` 类型变更，包括嵌套结构体定义的变更。

2. `KeySize` 或 `ValueSize` 变更（例如从 4 字节变为 16 字节）。

3. 字段偏移变更（字段重排、删除、重命名），或导致布局不兼容的嵌套结构体布局变更。

4. MapType 变更（例如 Hash → Array）。

5. 减小 `MaxEntries`。

当检测到上述任一变更时，升级逻辑会将旧 map 视为不兼容并创建新的空 map，从而导致运行时状态丢失。

## 测试建议

将新的 daemon 构建打包成镜像并发布。将该镜像地址设置到环境变量 KMESH_UPGRADE_IMAGE。在项目的全新克隆中运行 e2e 测试，并传入 `--skip-build-daemonupgarde-image` 标志以跳过测试内部的镜像构建步骤（该标志让测试使用外部提供的 KMESH_UPGRADE_IMAGE）。随后 TestKmeshUpgrade 测试会对 daemonset 执行滚动升级，并验证流量连续性是否得到保持。
