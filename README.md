# Kmesh Docs & Website

This repo contains the source code of [Kmesh Website](https://kmesh.net/en/) and all of the docs for Kmesh.

- [Kmesh Website](https://kmesh.net/en/)
- [Kmesh Docs](https://kmesh.net/docs/welcome)
- [Kmesh Blog](https://kmesh.net/en/blog/)

Welcome to join us and you are more than appreciated to contribute!

## Quick Start

Here's a quick guide to updating the docs. It assumes you're familiar with the
GitHub workflow and you're happy to use the automated preview of your doc
updates:

1. Fork the [Kmesh/website repo](https://github.com/kmesh-net/website) on GitHub.
2. Make your changes and send a pull request (PR).
3. If you're not yet ready for a review, add a comment to the PR saying it's a
   work in progress or add `[WIP]` in your PRs title. You can also add `/hold` in a comment to mark the PR as not
   ready for merge.
4. Wait for the automated PR workflow to do some checks. When it's ready,
   you should see a comment like this: **Deploy Preview for kmesh-net ready!**
5. Click **Details** to the right of "Deploy preview ready" to see a preview
   of your updates.
6. Continue updating your doc until you're happy with it.
7. When you're ready for a review, add a comment to the PR and assign a
   reviewer/approver. See the
   [Kmesh contributor guide](https://github.com/kmesh-net/kmesh/blob/main/CONTRIBUTING.md).

---

## Development Environment

You can start developing with zero manual setup using either **GitHub Codespaces** or **VS Code Dev Containers**.

### Option 1: GitHub Codespaces (Recommended)

Click the button below to open the project in a ready-to-code cloud environment:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/kmesh-net/website)

Once the Codespace is ready, start the dev server:

```bash
npm start
# or
yarn start
```

### Option 2: VS Code Dev Containers (Local)

1. Install [Docker](https://www.docker.com/products/docker-desktop) and the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for VS Code.
2. Clone the repository and open it in VS Code.
3. When prompted, click **"Reopen in Container"** — or run the command **Dev Containers: Reopen in Container** from the Command Palette.
4. Dependencies are installed automatically. Start the dev server:

   ```bash
   npm start
   # or
   yarn start
   ```

Both options provide a pre-configured environment with Node.js 20 and recommended VS Code extensions for documentation development.

---

## How to Install

The Kmesh website is built using **Docusaurus** with React. Follow these steps to install and run it:

### 1. Prerequisites

- Ensure you have **Node.js** installed (version 16.14 or above)
- npm or yarn package manager

### 2. Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/kmesh-net/website.git
   cd website
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

### 3. Running the Development Server

To start the local development server:

```bash
npm start
# or
yarn start
```

Access the local site at: `http://localhost:3000`

### 4. Building for Production

To build the static files:

```bash
npm run build
# or
yarn build
```

The built files will be in the `build` directory.

To serve the built website locally:

```bash
npm run serve
# or
yarn serve
```

---

## Notes of Writing Documentation

In the Kmesh documentation, each document should include frontmatter at the beginning as follows:

```md
---
title: Document Title
sidebar_label: Menu Label
sidebar_position: 2
description: Brief description of the document
slug: /custom-url-path
---
```

There are several key points to note:

- `title` is the title displayed at the top of the document page
- `sidebar_label` is the title displayed in the sidebar menu (optional)
- `sidebar_position` determines the order of documents in the sidebar (lower numbers appear higher)
- `description` is used for SEO and appears in search results
- `slug` allows you to customize the URL path (optional)

For the sidebar structure, refer to the sidebar configuration in `sidebars.js`.

## Image Optimization Guidelines

To enhance performance, all images (except logos and icons) should include the following attributes:

```jsx
import Image from "@theme/IdealImage";

<Image
  img={require("/img/path/to/image.png")}
  alt="image description"
  width={1200}
/>;
```

Or for markdown:

```md
![image_description](/img/path/to/image.png)
```

Docusaurus automatically handles image optimization including:

- Lazy loading for improved page speed
- Responsive sizing
- Image optimization

Please follow this standard when contributing images to the documentation.

Happy contributing!
