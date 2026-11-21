# Documentation Index / 文档总索引

> Back to Root: [README.md](../README.md) | [README.zh-CN.md](../README.zh-CN.md)

This directory contains the complete 0-to-1 specification suite for **Antigravity Theme** (exclusively targeting the **Antigravity 2.0 Agent Desktop App**), maintained in strictly mirrored bilingual trees (`docs/en/` and `docs/zh-CN/`).

本目录包含 **Antigravity Theme**（**仅面向 Antigravity 2.0 Agent 桌面端应用**）从 0 到 1 的全套工程与产品规范文档，采用严格 1:1 对应的中英双语平行目录结构（`docs/zh-CN/` 与 `docs/en/`）。

## Document Directory / 文档目录

| ID | Lifecycle Stage / 阶段 | 简体中文 (`zh-CN/`) | English (`en/`) | Purpose / 核心用途 |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Initiation / 立项 | [01-project-charter.md](./zh-CN/01-project-charter.md) | [01-project-charter.md](./en/01-project-charter.md) | Agent-first vision, scope boundaries, competitive analysis, KPIs, milestones & risk register. |
| **02** | Requirements / 需求 | [02-prd-requirements.md](./zh-CN/02-prd-requirements.md) | [02-prd-requirements.md](./en/02-prd-requirements.md) | User personas, Antigravity 2.0 Agent UI surfaces, variant matrix, FR/NFR & embedded code-fence scope. |
| **03** | Visual Design / 视觉 | [03-visual-design-system.md](./zh-CN/03-visual-design-system.md) | [03-visual-design-system.md](./en/03-visual-design-system.md) | Design principles, OKLCH & APCA/WCAG baselines, 3-tier tokens, elevation tiers & 3 candidate palettes. |
| **04** | Architecture / 技术 | [04-technical-architecture.md](./zh-CN/04-technical-architecture.md) | [04-technical-architecture.md](./en/04-technical-architecture.md) | Repo blueprint, OKLCH Token Compiler, Theme Pack JSON & `--color-*` CSS output, safe config integration & ADRs. |
| **05** | Quality / 测试 | [05-qa-testing-plan.md](./zh-CN/05-qa-testing-plan.md) | [05-qa-testing-plan.md](./en/05-qa-testing-plan.md) | Automated contrast gates, schema checks, UI harness + Shiki visual regression & live App QA checklist. |
| **06** | Operations / 运维发布 | [06-release-maintenance-runbook.md](./zh-CN/06-release-maintenance-runbook.md) | [06-release-maintenance-runbook.md](./en/06-release-maintenance-runbook.md) | CI/CD, Changesets/SemVer, GitHub Releases & npm publishing, Antigravity App changelog/token sync & rollback. |
| **07** | Governance / 开源治理 | [07-governance-roadmap.md](./zh-CN/07-governance-roadmap.md) | [07-governance-roadmap.md](./en/07-governance-roadmap.md) | MIT compliance, contributing SOP, visual bug triage & v1.0–v2.0 roadmap. |

## Bilingual Synchronization Policy / 双语同步约定

1. **1:1 Mirroring**: Every document ID (`01`–`07`), major heading number, table structure, and decision record must stay synchronized between `zh-CN/` and `en/`.
2. **PR Gate**: Any pull request that alters architectural decisions, requirements, or maintenance procedures in one language must update its counterpart in the same PR (or link a tracked follow-up translation issue labeled `docs-sync`).
3. **Relative Links Only**: Internal cross-references always use relative Markdown paths without hardcoded line numbers.
