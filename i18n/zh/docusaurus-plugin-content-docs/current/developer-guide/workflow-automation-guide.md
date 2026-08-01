---
sidebar_position: 3
title: 自动化工作流
---

# 项目文档：自动化工作流

本文档概述 Kmesh 项目的自动化工作流，旨在提升文档质量并简化版本管理流程。

## 1. kmeshctl 同步工作流

**目的：** 通过 Pull Request（PR）自动将 kmeshctl CLI 文档从 kmesh 仓库同步到 kmesh-website 仓库。

**工作流触发条件：** 向 kmesh 仓库的 main 分支推送，且变更发生在 `docs/ctl/` 目录时。

### 步骤

1. **检出仓库：** 工作流会检出 kmesh-website 和 kmesh 两个仓库。
2. **使用 rsync 同步：** 使用 rsync 命令将 kmesh 中的 `docs/ctl/` 目录同步到 kmesh-website 的 docs/kmeshctl/ 目录。`--delete` 标志确保已删除的文件也会被移除。
3. **创建 Pull Request：** 若检测到变更，工作流会提交这些变更，并使用 `peter-evans/create-pull-request` action 在 kmesh-website 仓库中创建 PR。分支名包含时间戳，以确保唯一性并避免冲突。

### 维护说明

- **Secrets：** `WEBSITE_PAT` secret 必须对 `kmesh-net/kmesh` 和 kmesh-net/website 仓库都具有写权限。
- **路径变更：** 若源目录或目标目录路径发生变化，请更新工作流中的 `KMESH_CTL_DIR` 和 `WEBSITE_KMESHCTL_DIR` 变量。

## 2. Docusaurus 版本管理与 i18n（中文）处理

Docusaurus 版本管理系统会基于源 docs/ 目录的内容创建新版本。执行 docusaurus docs:version 命令时，它会自动生成一个新的版本化文件夹（例如 `versioned_docs/version-X.Y.Z/`），其中包含全部英文文档。

### 中文文档（i18n）版本管理

- Docusaurus 版本管理命令不会自动为位于 `i18n/zh/docusaurus-plugin-content-docs/` 的中文翻译创建对应的版本化文件夹。
- 因此，创建新版本后，不会存在 `i18n/zh/docusaurus-plugin-content-docs/version-X.Y.Z/` 文件夹。
- 这会导致已选择中文语言的用户在导航到新版本时出现 “Page Not Found” 错误。

### 解决方案：自定义 404 页面

- 为提供流畅的用户体验，已实现自定义 404 页面。
- 当中文用户遇到新版本缺失页面时，会看到一个有用的错误页面。
- 该页面包含醒目按钮，方便用户跳转到所请求文档的英文版，或返回首页。
- 此方法确保即使用户所需的最新版本中文翻译尚未提供，也始终能够获取所需信息。

该方案在保持文档及时更新与多语言站点实际约束之间取得平衡——翻译工作可能落后于英文新内容的发布。

### 维护说明

- 该工作流依赖 `GITHUB_TOKEN` 创建 PR。
- 请确保使用 `npm install` 命令，因为没有可用的 `package-lock.json` 文件。

## 3. 中文语法检查工作流

**目的：** 自动检查中文文档的语法与拼写。

**工作流触发条件：** 向 main 分支推送或发起 pull request，且变更发生在 `docs/cn/zh/` 目录下的文件时。

### 步骤

- **检出与设置：** 工作流检出代码并设置 Python 环境。
- **安装依赖：** 安装 language-tool-python 包。
- **运行语法检查：** 使用 LanguageTool 库仅扫描 `docs/cn/zh/` 目录及其子目录中的 .md 文件，检查中文（zh-CN）内容。
- **报告问题：** 脚本会针对发现的问题提供详细、带颜色标记的输出，包括文件、行号、错误类型（拼写、语法、风格）、上下文与建议，并创建 GitHub warning 注解。

### 维护说明

- 该工作流较为稳健，并包含初始化 LanguageTool 服务时的重试机制。
- 能妥善处理编码错误。
- 输出设计便于开发者阅读，会对错误进行分类并提供可操作的反馈。
