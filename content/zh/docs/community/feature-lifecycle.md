---
date: 2023-07-14
draft: false
lastmod: 2023-07-14
linktitle: 特性生命周期管理
menu:
  docs:
    parent: community
    weight: 4
title: 特性生命周期管理
toc: true
type: docs
---
本文档旨在澄清特性与对应API的定义和差异在不同的开发阶段（版本）。

每个版本都有不同的稳定性、支持时间、并要求不同的毕业标准进入下一个级别：

\* [Alpha](#alpha)

\* [Beta](#beta)

\* [GA](#ga)

##  Alpha

- 在后续版本中，该特性可能会以不兼容的方式更改/升级。

- 源代码将在发布分支/标记以及二进制文件中提供。

- 对该功能的支持可以随时停止，恕不另行通知。

- 该功能可能存在错误。

- 如果启用该功能，该功能也可能在其他API/功能中诱发错误。

- 该功能可能没有完全实现。

- API版本名称将像v1alpha1, v1alpha2等。每次升级时，后缀数字将递增1。

### 毕业标准

- 每个功能将从alpha级别开始。
- 不应破坏其他API/功能的功能。

## Beta

- 在以后的版本中，该特性可能不会以不兼容的方式进行更改/升级。但如果以不兼容的方式更改，则将提供升级策略。

- 源代码将在发布分支/标记以及二进制文件中提供。

- 在没有2个次要版本通知的情况下，不会停止对该功能的支持，并且至少将在接下来的2个次要版本中出现。

- 该功能的错误将非常少。

- 如果启用该功能，则不会在其他API/功能中诱发错误。

- 该功能将完全实现。

- API版本名称将像v1beta1, v1beta2等。每次升级时，后缀数字将递增1。

### 毕业标准

- 在端到端测试中，应至少有50%的覆盖率。

- Project同意在接下来的至少2个次要版本中支持此功能，并在停止支持之前将发出至少2个次要版本的通知。
- 功能所有者应承诺确保在更高版本中的向后/向前兼容性。

## GA

- 在接下来的几个版本中，该功能将不会以不兼容的方式更改/升级。

- 源代码将在发布分支/标记以及二进制文件中提供。

- 在没有4个次要版本通知的情况下，不会停止对该功能的支持，并且至少将在接下来的4个次要版本中出现。

- 该功能不会有主要的错误，因为它将被完全测试，并进行e2e测试。

- 如果启用该功能，则不会在其他API/功能中诱发错误。

- 该功能将完全实现。

- API版本名称将类似于v1、v2等。

### 毕业标准

- 应该有完整的端到端测试。
- 代码经过彻底测试，据报道非常稳定。
- 项目将至少在接下来的4个次要版本中支持此功能，并在停止支持之前将发出至少4个次要版本的通知。
- 功能所有者应承诺确保在更高版本中的向后/向前兼容性。
- Kmesh维护人员以及使用/与功能/API交互的功能/API所有者的共识。