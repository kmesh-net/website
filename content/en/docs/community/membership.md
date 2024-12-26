---
date: 2023-07-14
draft: false
lastmod: 2023-07-14
linktitle: Membership
menu:
  docs:
    parent: community
    weight: 15
title: Membership
toc: true
type: docs
---
**Note :** This document keeps changing based on the status and feedback of Kmesh Community.

This document gives a brief overview of the Kmesh community roles with the requirements and responsibilities associated with them.

| <div style="width: 100pt">Role | Requirements | Responsibilities | Privileges |
| -----| ---------------- | ------------ | -------|
| [Member](#member) | Sponsor from 2 approvers, active in community, contributed to Kmesh | Welcome and guide new contributors | Kmesh GitHub organization Member |
| [Reviewer](#reviewer) | Review contributions from other members | History of review and authorship in a subproject | Review contributions from community members |  Read access to specific packages in relevant repository |
| [Approver](#approver) | Sponsor from 2 maintainers, has good experience and knowledge of domain, actively contributed to code and review  | Review and approve contributions from community members | Write access to specific packages in relevant repository |
| [Maintainer](#maintainer) | Sponsor from 2 owners, shown good technical judgement in feature design/development and PR review | Participate in release planning and feature development/maintenance | Top level write access to relevant repository. Name entry in Maintainers file of the repository |

**Note :** It is mandatory for all Kmesh community members to follow Kmesh [Code of Conduct].

## Member

Members are active participants in the community who contribute by authoring PRs,
reviewing issues/PRs or participate in community discussions on slack/mailing list.


### Requirements

- Sponsor from 2 approvers
- Enabled [two-factor authentication] on their GitHub account
- Actively contributed to the community. Contributions may include, but are not limited to:
    - Authoring PRs
    - Reviewing issues/PRs authored by other community members
    - Participating in community discussions on slack/mailing list
    - Participate in Kmesh community meetings


### Responsibilities and privileges

- Member of the Kmesh GitHub organization
- Can be assigned to issues and PRs and community members can also request their review
- Participate in assigned issues and PRs
- Welcome new contributors
- Guide new contributors to relevant docs/files
- Help/Motivate new members in contributing to Kmesh

## Reviewer

Reviewers are able to review code for quality and correctness on some part of a
subproject. They are knowledgeable about both the codebase and software
engineering principles.

### Requirements
- member for at least 1 months
- Primary reviewer for at least 5 PRs to the codebase
- Reviewed or merged at least 10 substantial PRs to the codebase
- Knowledgeable about the codebase
- Sponsored by a subproject approver
- With no objections from other approvers
- Done through PR to update the OWNERS file
- May either self-nominate, be nominated by an approver in this subproject.

### Responsibilities and privileges

- Code reviewer status may be a precondition to accepting large code contributions
- Responsible for project quality control
- Focus on code quality and correctness, including testing and factoring
- May also review for more holistic issues, but not a requirement
- Expected to be responsive to review requests
- Assigned PRs to review related to subproject of expertise
- Assigned test bugs related to subproject of expertise
- May get a badge on PR and issue comments

## Approver

Approvers are active members who have good experience and knowledge of the domain.
They have actively participated in the issue/PR reviews and have identified relevant issues during review.


### Requirements

- Sponsor from 2 maintainers
- Member for at least 2 months
- Have reviewed good number of PRs
- Have good codebase knowledge


### Responsibilities and Privileges

- Review code to maintain/improve code quality
- Acknowledge and work on review requests from community members
- May approve code contributions for acceptance related to relevant expertise
- Have 'write access' to specific packages inside a repo, enforced via bot
- Continue to contribute and guide other community members to contribute in Kmesh project

## Maintainer

Maintainers are approvers who have shown good technical judgement in feature design/development in the past.
Has overall knowledge of the project and features in the project.

### Requirements

- Sponsor from 2 owners
- Approver for at least 2 months
- Nominated by a project owner
- Good technical judgement in feature design/development

### Responsibilities and privileges

- Participate in release planning
- Maintain project code quality
- Ensure API compatibility with forward/backward versions based on feature graduation criteria
- Analyze and propose new features/enhancements in Kmesh project
- Demonstrate sound technical judgement
- Mentor contributors and approvers
- Have top level write access to relevant repository (able click Merge PR button when manual check-in is necessary)
- Name entry in Maintainers file of the repository
- Participate & Drive design/development of multiple features

**Note :** These roles are applicable only for Kmesh github organization and repositories. Currently Kmesh doesn't have a formal process for review and acceptance into these roles. We will come-up with a process soon.

[two-factor authentication]: (https://help.github.com/articles/about-two-factor-authentication)
[Maintainers]: (https://github.com/kmesh-net/kmesh/blob/main/MAINTAINERS.md)