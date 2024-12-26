---
date: 2023-07-14
draft: false
lastmod: 2023-07-14
linktitle: 成员管理
menu:
  docs:
    parent: community
    weight: 3
title: 成员管理
toc: true
type: docs
---
**注**：本文档根据Kmesh社区的状态和反馈同步刷新。

本文档简要概述了Kmesh社区角色以及与之相关的要求和责任。

| 角色 | 要求 | 工作职责 | 权限 |
| -----| ---------------- | ------------ | -------|
| [Member](#member) | Sponsor from 2 approvers, active in community, contributed to Kmesh | Welcome and guide new contributors | Kmesh GitHub organization Member |
| [Reviewer](#reviewer) | Review contributions from other members | History of review and authorship in a subproject | Review contributions from community members |  Read access to specific packages in relevant repository |
| [Approver](#approver) | Sponsor from 2 maintainers, has good experience and knowledge of domain, actively contributed to code and review  | Review and approve contributions from community members | Write access to specific packages in relevant repository |
| [Maintainer](#maintainer) | Sponsor from 2 owners, shown good technical judgement in feature design/development and PR review | Participate in release planning and feature development/maintenance | Top level write access to relevant repository. Name entry in Maintainers file of the repository |

**注**：所有Kmesh社区成员都必须遵守Kmesh【行为准则】。

## 成员

成员是社区的积极参与者，他们通过撰写PR做出贡献，审查问题/PR或参与关于松弛/邮件列表的社区讨论。

### 需求

- 来自2名批准人的申办者
- 在其GitHub帐户上启用了【双因素身份验证】
- 积极为社区做出贡献。捐款可包括但不限于：
  - 创作PR
  - 审查其他社区成员撰写的问题/PR
  - 参与有关松弛/邮件列表的社区讨论
  - 参加Kmesh社区会议

### 职责和特权

- Kmesh GitHub组织成员
- 可以分配给问题和公关，社区成员也可以请求他们的审查
- 参与分配的问题和PR
- 欢迎新的贡献者
- 指导新贡献者查阅相关文档/文件
- 帮助/激励新成员为Kmesh做出贡献

## 审批人

审批人是对该领域有良好经验和知识的活跃成员。积极参与问题/PR评审，并在评审中识别出相关问题。

### 需求

- 来自2名维护人员的申办者
- 会员至少2个月
- 已经评审了大量的PR
- 具备良好的代码库知识

### 职责和权限

- 审查代码以维护/提高代码质量
- 确认社区成员提出的审查请求并处理这些请求
- 可以批准与相关专业知识相关的代码贡献以接受
- 对回购中的特定软件包具有“写入访问权限”，通过机器人强制实施
- 继续贡献并指导其他社区成员在Kmesh项目中做出贡献

## 维护人员

维护人员是指过去在特性设计/开发中表现出良好技术判断力的审批人。对项目和项目中的功能有全面的了解。

### 需求

- 来自2名业主的赞助商
- 批准人至少2个月
- 由项目所有者提名
- 在特性设计/开发中具有良好的技术判断力

### 职责和特权

- 参与发布计划
- 维护项目代码质量
- 根据特性分级标准，确保API与前向/后向版本兼容
- 分析并提出Kmesh项目中的新特性/增强
- 展示合理的技术判断力
- 导师贡献者和批准者
- 拥有对相关存储库的顶级写入访问权限（在需要手动签入时，可以单击合并PR按钮）
- 存储库的维护人员文件中的名称条目
- 参与并推动多种功能的设计/开发


**注**：这些角色仅适用于Kmesh github组织和存储库。目前，Kmesh没有正式的程序来审查和接受这些角色。我们很快就会想出一个程序。

[双因素身份验证]: (https://help.github.com/articles/about-two-factor-authentication)