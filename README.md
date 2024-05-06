# Kmesh Docs & Website

This repo contains the source code of [Kmesh Website](https://kmesh.net/en/) and all of the docs for Kmesh.

- [Kmesh Website](https://kmesh.net/en/)
- [Kmesh Docs](https://kmesh.net/en/docs/)
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

## Notes of Writing Documentation

In the Kmesh documentation, a note is required at the beginning of each document as follows:

```console
---
draft: false
linktitle: XXX
menu:
  docs:
    parent: XXX
    weight: 1
title: XXX
toc: true
type: docs

---
```

There are four points to note:

- `linktitle` is the title displayed in the menu.
- `title` is the title displayed on the document page.
- `parent` indicates which directory this document is contained in. For example, if you want to write a document under the `user guide`, you need to set the `parent: user guide`.
  For the correspondence of each menu, please refer to [menus](./config/_default/menus.toml).
  A simpler way is to directly copy the configuration of the existing documents in the directory.
- `weight` is used to order the documents. Should avoid duplication and conflicts prevented.
  It is also best not to use adjacent numbers to facilitate the insertion of new documents. A spacing of 5 is recommended.
  If you want your document to always be at the end of the current directory, you can just use 99.
