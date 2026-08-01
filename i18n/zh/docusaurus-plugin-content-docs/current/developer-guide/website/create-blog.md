---
title: 创建博客
sidebar_position: 3
---

## 在 Docusaurus 中创建博客：完整指南

Docusaurus 是一款强大的静态站点生成器，内置博客功能，便于创建和分享博客文章。本指南将说明如何搭建博客、撰写文章、配置选项以及维护内容——面向初学者，易于上手。

### 1. Docusaurus 中的博客功能是什么？

Docusaurus 的博客功能允许你：

- 以 Markdown 文件撰写博客文章。
- 自动生成列出所有文章的博客索引页。
- 为每篇博客文章创建独立页面。
- 自定义博客的外观与行为。

非常适合分享项目更新、教程或任何基于时间的内容，且几乎无需额外配置。

### 2. 博客目录结构

在 Docusaurus 项目中，博客文章存放在 `blog/` 目录下。每篇文章是一个独立的 Markdown 文件，文件名通常包含发布日期和 slug（URL 友好的标题）。示例如下：

```text
blog/
├── 2023-10-05-my-first-post.md
└── 2023-10-06-another-post.md
```

- **日期**：`YYYY-MM-DD` 部分（例如 `2023-10-05`）决定文章的发布日期与排序。
- **Slug**：日期之后的部分（例如 `my-first-post`）会成为 URL 的一部分（例如 `/blog/my-first-post`）。

你可以将所有文章放在 `blog/` 目录中，也可以使用子目录进行组织（对大多数情况而言，扁平结构已经足够）。

### 3. 撰写博客文章：Front Matter

每篇博客文章都以 **front matter** 部分开头——位于文件顶部、由三连短横线（`---`）包围的 YAML 块。该部分包含文章的元数据。示例如下：

```yaml
---
title: My First Blog Post
date: 2023-10-05
author: John Doe
tags: ["example", "blog"]
---
```

关键字段包括：

- **`title`**：文章标题，显示在文章页和博客索引中。
- **`date`**：发布日期（必须与文件名中的日期一致）。
- **`author`**：作者姓名（可选）。
- **`tags`**：用于分类的标签列表（可选）。

Front matter 对于 Docusaurus 正确识别并展示你的文章至关重要。

### 4. 撰写博客正文

在 front matter 之后，使用 Markdown 撰写文章内容。Docusaurus 支持标准 Markdown 语法——标题、列表、链接、图片等。示例如下：

```markdown
# My First Blog Post

Welcome to my blog!

## Why I Started This Blog

I’m excited to share my experiences. Here’s why:

- To document my progress
- To connect with others
- To learn from feedback

## What’s Next?

Look out for posts on:

1. Project setup tips
2. Coding best practices
3. Fun experiments
```

Docusaurus 还支持 MDX，可让你在文章中加入 React 组件以实现交互元素（对初学者而言这是可选的）。

### 5. 配置博客

你可以通过编辑项目根目录下的 `docusaurus.config.js` 文件来自定义博客。博客设置通常定义在 `presets` 部分。示例如下：

```javascript
module.exports = {
  // ...
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        blog: {
          path: "blog", // Directory for blog posts
          routeBasePath: "blog", // URL path for the blog
          blogTitle: "My Blog", // Blog page title
          blogDescription: "Thoughts and updates on my project", // Blog description
          postsPerPage: 10, // Posts per index page
          showReadingTime: true, // Show reading time for posts
        },
      },
    ],
  ],
};
```

关键选项：

- **`path`**：博客文章存放路径（默认：`blog`）。
- **`routeBasePath`**：博客的 URL 路径（例如 `/blog`）。
- **`blogTitle`**：博客索引页显示的标题。
- **`blogDescription`**：用于 SEO 与订阅源的简短描述。
- **`postsPerPage`**：每个索引页显示的文章数量。
- **`showReadingTime`**：是否显示每篇文章的预计阅读时间。

更多选项请参阅 [Docusaurus 博客文档](https://docusaurus.io/docs/blog)。

### 6. 将博客加入站点导航

为方便用户找到博客，可通过 `docusaurus.config.js` 在导航栏或页脚添加链接。

#### 导航栏示例

```javascript
module.exports = {
  // ...
  themeConfig: {
    navbar: {
      items: [
        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },
      ],
    },
  },
};
```

#### 页脚示例

```javascript
module.exports = {
  // ...
  themeConfig: {
    footer: {
      links: [
        {
          title: "Links",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
          ],
        },
      ],
    },
  },
};
```

这样即可从站点任意位置访问博客。

### 7. 在本地预览博客

要查看博客效果，请启动开发服务器：

```bash
npm start
```

或

```bash
yarn start
```

在浏览器中打开 `http://localhost:3000/blog` 即可查看博客索引。点击任意文章可查看其独立页面。

### 8. 博客管理最佳实践

随着博客内容增多，可按以下建议保持条理：

- **文件命名**：坚持使用 `YYYY-MM-DD-title.md` 这类一致格式，以便按时间排序。
- **标签**：在 front matter 中使用标签对相关文章分组。Docusaurus 会自动创建标签页（例如 `/blog/tags/example`）。
- **内容结构**：保持文章主题聚焦，并使用标题提升可读性。
- **更新维护**：定期检查 front matter（如日期、标签），确保准确无误。

### 9. 博客文章完整示例

以下是一篇完整的博客文章文件示例：

```markdown
---
title: My First Blog Post
date: 2023-10-05
author: John Doe
tags: ["example", "blog"]
---

# My First Blog Post

Hi everyone!

## Why I’m Here

I started this blog to:

- Share my project journey
- Help others learn
- Get community input

## Coming Soon

Next, I’ll write about:

1. Setting up tools
2. Writing clean code
3. Cool ideas to try

Thanks for reading!
```

该文件包含 front matter 与 Markdown 内容，可直接由 Docusaurus 处理。

### 10. 后续步骤与资源

你现在已经拥有一个可运行的 Docusaurus 博客！若要进一步完善，可以探索：

- 为订阅者添加 RSS 源。
- 使用 CSS 自定义博客设计。
- 使用 MDX 实现高级功能。

更多详情请访问 [Docusaurus 官方博客文档](https://docusaurus.io/docs/blog)。
