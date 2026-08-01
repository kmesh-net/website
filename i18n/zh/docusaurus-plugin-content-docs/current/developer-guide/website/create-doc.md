---
title: 创建文档
sidebar_position: 1
---

## 在 Docusaurus 中创建文档：初学者指南

Docusaurus 是一款可轻松构建文档网站的强大工具。它使用 Markdown 文件生成静态 HTML 页面，便于创建和维护项目文档。本指南将介绍在 Docusaurus 中创建文档所需了解的全部内容，从理解目录结构到配置侧边栏导航。

### 1. 理解 Docusaurus 目录结构

创建 Docusaurus 项目时，会生成特定的目录结构来组织站点。与文档相关的关键目录和文件包括：

- **`docs/`**：存放所有文档文件。该目录中的每个文件都是 Markdown 文件（扩展名为 `.md` 或 `.mdx`），将被转换为文档站点上的一个页面。

- **`docusaurus.config.js`**：Docusaurus 站点的主配置文件，控制站点标题、导航等设置。

- **`sidebars.js`**（可选）：用于手动配置文档的侧边栏导航。

- **`static/`**：存放静态资源（如图片），可在文档中引用。

例如，典型的 Docusaurus 项目可能如下所示：

```text
my-docusaurus-site/
├── docs/
│   ├── intro.md
│   └── getting-started.md
├── src/
│   └── pages/
├── static/
│   └── img/
├── docusaurus.config.js
├── package.json
└── sidebars.js
```

在此结构中，`docs/` 文件夹是所有文档文件的中心位置。你将在此处创建和存放文档。

### 2. 文档开头的参数（Front Matter）

在 Docusaurus 中，每个 Markdown 文件顶部都可以有可选的 **front matter** 部分。Front matter 使用 YAML 格式，并由三连短横线（`---`）包围。它提供文档的元数据，便于自定义行为与外观。Front matter 中常见的参数（字段）包括：

- **`id`**：文档的唯一标识符。未指定时，默认为不含扩展名的文件名（例如 `my-doc.md` 对应 `my-doc`）。
- **`title`**：文档标题，显示在侧边栏和页面标题中。若省略，Docusaurus 会使用文件中的第一个标题。
- **`slug`**：文档的自定义 URL 路径（例如 `/my-custom-url`）。
- **`tags`**：用于分类文档的关键词。

以下是 front matter 示例：

```yaml
---
id: my-doc
title: My Document
slug: /my-custom-url
tags:
  - example
  - documentation
---
```

该 front matter 告诉 Docusaurus：

- 文档的唯一 ID 为 `my-doc`。
- 标题为 “My Document”。
- URL 路径为 `/my-custom-url`，而非默认的 `/docs/my-doc`。
- 标签为 “example” 和 “documentation”。

Front matter 是可选的，但强烈建议使用，以便更好地控制文档。

### 3. 目录结构如何影响路径与侧边栏导航

`docs/` 目录内的文件夹结构同时决定文档的 URL 路径和侧边栏导航。

- **URL 路径**：默认情况下，文件夹结构会成为文档 URL 的一部分。例如：

  - `docs/intro.md` → `/docs/intro`
  - `docs/architecture/overview.md` → `/docs/architecture/overview`
    你可以通过 front matter 中的 `slug` 参数覆盖该行为。

- **侧边栏导航**：Docusaurus 可根据文件夹结构自动生成侧边栏。`docs/` 下的每个子文件夹都会成为侧边栏中的一个分类，该文件夹内的文件则成为该分类下的链接。例如：

  ```text
  docs/
  ├── intro.md
  └── architecture/
      ├── overview.md
      └── components.md
  ```

  该结构可能生成如下侧边栏：

  - Intro
  - Architecture
    - Overview
    - Components

  文件夹名称（例如 `architecture`）不会自动成为分类名称，除非另行配置。你可以使用侧边栏配置文件自定义此行为。

#### `_category_.json` 文件

在子文件夹中，你可以添加名为 `_category_.json` 的文件，以配置该文件夹在侧边栏中的显示方式。该文件定义分类属性。示例如下：

```json
{
  "label": "Architecture",
  "position": 3,
  "link": {
    "type": "generated-index"
  }
}
```

- **`label`**：侧边栏中该分类显示的名称（例如 “Architecture”）。
- **`position`**：该分类在侧边栏中的顺序（例如 3 表示它是第三项）。
- **`link`**：定义点击分类时的行为。值 `"type": "generated-index"` 告诉 Docusaurus 为该分类自动生成索引页，列出文件夹中的所有文档（例如 `overview.md` 和 `components.md`）。

该文件让你能够精细控制该特定文件夹的侧边栏表现。

### 4. 创建文档的分步流程（适合初学者）

如果你是 Docusaurus 新手，请按以下步骤创建第一份文档：

1. **搭建 Docusaurus**：

   - 在终端中运行以下命令安装 Docusaurus：

     ```bash
     npx create-docusaurus@latest my-site classic
     ```

   - 这会使用 classic 模板在 `my-site` 文件夹中创建新的 Docusaurus 站点。
   - 进入项目目录：

     ```bash
     cd my-site
     ```

2. **进入 Docs 文件夹**：

   - 打开项目目录中的 `docs/` 文件夹（例如 `my-site/docs/`）。

3. **创建 Markdown 文件**：

   - 使用文本编辑器新建文件，例如 `my-doc.md`。

4. **添加 Front Matter（可选）**：

   - 在文件顶部添加如下元数据：

     ```yaml
     ---
     id: my-doc
     title: My Document
     ---
     ```

5. **撰写内容**：

   - 在 front matter 下方使用 Markdown 撰写文档。例如：

     ```markdown
     # My Document

     Welcome to my first Docusaurus document!

     ## Features

     - Easy to use
     - Highly customizable
     ```

6. **用文件夹组织（可选）**：

   - 若要归类相关文档，可创建子文件夹（例如 `docs/features/`），并将文件移入或在其中创建（例如 `features/my-doc.md`）。

7. **配置侧边栏（可选）**：

   - 若使用自动侧边栏生成，Docusaurus 会依据你的文件夹结构。
   - 若要自定义分类，可在子文件夹中添加 `_category_.json` 文件。例如，在 `docs/features/` 中：

     ```json
     {
       "label": "Features",
       "position": 2,
       "link": {
         "type": "generated-index"
       }
     }
     ```

   - 也可以编辑根目录下的 `sidebars.js` 进行手动侧边栏配置。

8. **预览站点**：
   - 运行以下命令启动开发服务器：

     ```bash
     npm start
     ```

     或

     ```bash
     yarn start
     ```

   - 打开浏览器并访问 `http://localhost:3000` 查看站点。
   - 确认新文档已出现，且侧边栏反映了你的结构。

### 5. `.md` 文件示例

以下是你可能创建的完整 Markdown 文件示例：

```markdown
---
id: architecture-overview
title: Architecture Overview
slug: /architecture
tags:
  - architecture
  - overview
---

# Architecture Overview

This document provides an overview of the system's architecture.

## Components

- **Frontend**: Built with React.
- **Backend**: Powered by Node.js.

## Design Principles

- Modularity
- Scalability
```

- Front matter 设置了 ID、标题、自定义 URL 和标签。
- 正文使用 Markdown 组织结构并提升可读性。

### 6. 更多资源

有关在 Docusaurus 中创建和自定义文档的更多详情，请访问官方文档：

- [https://docusaurus.io/docs/create-doc](https://docusaurus.io/docs/create-doc)

本指南涵盖了基础知识，而 Docusaurus 还提供版本管理、多语言支持等高级功能。当你逐渐熟悉后，可以探索这些功能以完善文档站点。
