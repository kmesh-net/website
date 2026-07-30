---
title: 版本管理
sidebar_position: 2
---

# 在 Docusaurus 中进行文档版本管理：完整指南

Docusaurus 内置了强大的文档版本管理支持，这对持续演进的项目至关重要。版本管理使你能够维护多份文档，确保用户可以访问与其使用的软件版本相对应的信息。本文档将引导你完成在 Docusaurus 中设置、管理和优化版本化文档的全过程。

---

## 1. 理解 Docusaurus 中的版本管理

Docusaurus 提供了一套直观的文档版本管理系统：

- **当前版本（Current Version）**：这是最新、正在积极维护的文档版本，存放在 `docs/` 文件夹中。它通常代表 “Next” 版本或尚未发布的最新变更。
- **已版本化文档（Versioned Docs）**：这些是文档在特定时间点的快照，通常与软件发布绑定。它们存放在名为 `versioned_docs/version-<version>/` 的文件夹中，例如版本 1.0 对应 `versioned_docs/version-1.0/`。

例如：

```text
// Project directory structure with versioning
my-docusaurus-project/
├── docs/                       # Current version documentation
├── versioned_docs/             # All versioned documentation
│   ├── version-1.0/            # Version 1.0 documentation
│   └── version-1.1/            # Version 1.1 documentation
├── versioned_sidebars/         # Sidebars for each version
│   ├── version-1.0-sidebars.json
│   └── version-1.1-sidebars.json
└── versions.json               # List of all available versions
```

每套已版本化文档都是创建该版本时 `docs/` 文件夹的完整副本。

---

## 2. 设置版本管理

要在 Docusaurus 中开始文档版本管理，请按以下步骤操作：

### 步骤 1：创建第一个版本

当你准备发布软件新版本时，为当前文档创建版本化快照：

- 在终端中运行以下命令：

```bash
# File: terminal command
npm run docusaurus docs:version <version>
```

或

```bash
# File: terminal command
yarn docusaurus docs:version <version>
```

将 `<version>` 替换为你期望的版本号，例如 `1.0`。

- **会发生什么**：
  - Docusaurus 将整个 `docs/` 文件夹复制到 `versioned_docs/version-1.0/`。
  - 它会更新跟踪所有已版本化文档的 `versions.json` 文件。

创建版本 1.0 后的 `versions.json` 示例：

```json
// File: versions.json
[
  "1.0"
]
```

### 步骤 2：自定义版本标签

默认情况下，版本号（例如 “1.0”）会显示在侧边栏和版本选择器中。你可以在 `docusaurus.config.js` 中自定义这些标签：

```javascript
// File: docusaurus.config.js
module.exports = {
  // ... other configuration
  themeConfig: {
    // ... other theme configuration
    docs: {
      sidebar: {
        versionLabels: {
          '1.0': 'Version 1.0 (Legacy)',
          '1.1': 'Version 1.1',
          'current': 'Next (Unreleased)'
        },
      },
    },
  },
};
```

---

## 3. 管理已版本化文档

版本管理设置完成后，可按如下方式管理文档：

### 更新文档

- **当前版本**：编辑 `docs/` 文件夹中的文件，以反映最新变更与功能。
- **已版本化文档**：若要更新特定版本（例如修正错误或澄清说明），请修改 `versioned_docs/version-<version>/` 中的文件。

**注意**：对已版本化文档的修改应限于小幅修复。重大更新应放入当前版本（`docs/`）。

### 添加新版本

发布新的软件版本时：

```bash
# File: terminal command
# 1. Update docs/ folder with latest content
# 2. Run the versioning command
npm run docusaurus docs:version 2.0
```

这会在 `versioned_docs/version-2.0/` 中创建新快照，并更新 `versions.json`：

```json
// File: versions.json (after adding version 2.0)
[
  "2.0",
  "1.0"
]
```

### 移除版本

要删除某个版本：

```bash
# File: terminal command
# 1. Remove the version folder
rm -rf versioned_docs/version-1.0
rm -rf versioned_sidebars/version-1.0-sidebars.json

# 2. Update versions.json manually
```

编辑 `versions.json` 以移除该版本：

```json
// File: versions.json (after removing version 1.0)
[
  "2.0"
]
```

---

## 4. 为已版本化文档配置侧边栏

Docusaurus 会自动处理每个版本的侧边栏，但你也可以按需自定义。

### 自动生成侧边栏

创建版本时，Docusaurus 会自动创建侧边栏配置：

```json
// File: versioned_sidebars/version-1.0-sidebars.json (automatically generated)
{
  "version-1.0/docs": [
    {
      "type": "category",
      "label": "Getting Started",
      "items": [
        {
          "type": "doc",
          "id": "version-1.0/intro"
        },
        {
          "type": "doc",
          "id": "version-1.0/installation"
        }
      ]
    }
  ]
}
```

### 手动配置侧边栏

若需要更多控制，可以直接修改已版本化的侧边栏文件：

```javascript
// File: versioned_sidebars/version-1.0-sidebars.json (customized)
{
  "version-1.0/docs": [
    {
      "type": "category",
      "label": "Getting Started",
      "items": [
        {
          "type": "doc",
          "id": "version-1.0/intro"
        },
        {
          "type": "doc",
          "id": "version-1.0/installation"
        }
      ]
    },
    {
      "type": "category",
      "label": "Advanced Topics",
      "items": [
        {
          "type": "doc",
          "id": "version-1.0/advanced/configuration"
        }
      ]
    }
  ]
}
```

---

## 5. 链接到已版本化文档

### 版本下拉组件

Docusaurus 会在站点导航中加入版本选择下拉菜单：

```jsx
// File: src/theme/Navbar.js (automatically handled by Docusaurus)
import React from 'react';
import VersionsDropdown from '@theme/VersionsDropdown';

function Navbar() {
  return (
    <nav>
      {/* ... other navbar items */}
      <VersionsDropdown />
    </nav>
  );
}
```

### 创建指向特定版本的自定义链接

在文档中，你可以链接到特定版本：

```markdown
<!-- File: docs/my-doc.md -->

Check our [installation guide for v1.0](/docs/1.0/installation) or the [latest installation guide](/docs/installation).
```

---

## 6. 版本管理最佳实践

- **版本命名**：使用语义化版本号（例如 1.0、1.1、2.0）以保持清晰。

  ```text
  // Recommended version naming
  1.0, 1.1, 2.0  // ✓ Semantic versioning
  
  // Not recommended
  stable, beta, old  // ✗ Ambiguous naming
  ```

- 管理版本标签与可见性的**配置示例**：

  ```javascript
  // File: docusaurus.config.js
  module.exports = {
    // ... other configuration
    presets: [
      [
        '@docusaurus/preset-classic',
        {
          docs: {
            // ... other docs configuration
            lastVersion: 'current',
            versions: {
              current: {
                label: 'Next',
                path: 'next',
              },
              '2.0': {
                label: '2.0',
                path: '2.0',
              },
              '1.0': {
                label: '1.0 (Legacy)',
                path: '1.0',
                banner: 'unmaintained', // Adds a banner indicating this version is no longer maintained
              },
            },
          },
        },
      ],
    ],
  };
  ```

---

## 7. 示例场景

我们以一个有两个发布版本（1.0 和 2.0）的软件项目为例，走一遍版本管理流程。

```bash
# File: terminal commands for versioning workflow
# Initial setup - create version 1.0
npm run docusaurus docs:version 1.0

# Result:
# - versioned_docs/version-1.0/ contains a snapshot of docs/
# - versioned_sidebars/version-1.0-sidebars.json is created
# - versions.json now includes "1.0"

# Later - update docs/ with changes for version 2.0 and create version 2.0
npm run docusaurus docs:version 2.0

# Result: 
# - versioned_docs/version-2.0/ is created
# - versioned_sidebars/version-2.0-sidebars.json is created
# - versions.json now includes "2.0" and "1.0"
# - docs/ becomes the "Next" version
```

最终项目结构：

```text
# File: Project structure after versioning
my-docusaurus-project/
├── docs/                       # Current "Next" version
├── versioned_docs/
│   ├── version-2.0/            # Version 2.0 documentation
│   └── version-1.0/            # Version 1.0 documentation
├── versioned_sidebars/
│   ├── version-2.0-sidebars.json
│   └── version-1.0-sidebars.json
└── versions.json               # ["2.0", "1.0"]
```

结果是用户可以通过下拉菜单轻松在版本间导航的站点：

- **Next**：最新未发布变更
- **2.0**：版本 2.0 的文档
- **1.0 (Legacy)**：版本 1.0 的文档

---

## 8. 更多资源

更多深入信息，请参阅 Docusaurus 官方文档：

- [https://docusaurus.io/docs/versioning](https://docusaurus.io/docs/versioning)

---

本指南提供了在 Docusaurus 中创建和管理版本化文档所需的全部内容。遵循这些步骤，即可确保用户能够访问与其软件版本匹配的正确文档。祝文档编写顺利！
