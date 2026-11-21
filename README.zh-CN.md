# Antigravity Theme

> [English](./README.md) | **简体中文**

**Antigravity Theme** 是一款**纯粹面向 Antigravity 2.0 Agent 桌面端应用**打造的开源外观配置与换肤主题包项目（**针对 Agent 智能体客户端，不包含 Antigravity IDE 代码编辑器、VS Code 及其他编辑器**）。

项目基于感知均匀色彩空间（`OKLCH`）、严格的视觉无障碍对比度基线（`APCA` + `WCAG 2.1`）以及确定性 Design Token 编译体系构建，全面覆盖 Antigravity Agent 客户端的每一层核心界面——包括 **左侧边栏（Left-hand Sidebar）**、**对话画布（Chat Canvas：消息流、思考块、工具调用卡、`/` 斜杠命令、`@` 引用菜单）** 与 **右侧辅助面板（Auxiliary Pane：Subagents、Background Tasks、Artifacts、Files Changed Diff、Terminals、Browser Pane）**，并原生对齐 Antigravity 宿主 CSS 主题变量协议（`--color-*`）。

## 项目状态

- **当前阶段**：Phase 1–2 已工程落地（`v0.1.0`）— OKLCH 编译器、方案 A 哑光毛玻璃 Theme Pack（`dist/`）、三栏交互仿真预览台（`preview/`）、自动化对比度/视觉回归测试与 CI/CD 流水线已就绪
- **目标软件**：仅限 Antigravity 2.0 Agent 桌面端（不包含任何代码编辑器）
- **首版目标**：`v1.0.0`（核心双变体：`Antigravity Dark` 深色主主题 + `Antigravity Light` 浅色主主题）
- **发布渠道**：GitHub Releases（标准化 Theme Pack：JSON + CSS Variables）与 npm（`@django9944/antigravity-theme`）
- **开源协议**：[MIT License](./LICENSE)（[合规说明](./docs/zh-CN/07-governance-roadmap.md#2-开源协议与合规要求mit)）

## 核心特性

- **失重毛玻璃材质体系（Frosted Glass / Glassmorphism）**：分层半透明玻璃质感（`backdrop-filter` 模糊与饱和度增强、`1px` 顶部高光折射边、极端壁纸底色对比度兜底），并内置 `@media (prefers-reduced-transparency: reduce)` 自动不透明降级方案。
- **Agent-First 交互层级视觉语法**：专为多智能体协同工作台设计，清晰区分用户指令、Agent 正文、折叠推理块（Thinking）、工具执行状态卡片、权限审批横幅、子智能体状态树与富文本 Artifacts（Markdown / Alerts / Mermaid / KaTeX / Carousel）。
- **感知色彩与 Design Token 编译体系**：以 TypeScript + `OKLCH` 作为单一事实源（SSOT），确定性编译输出 Antigravity Theme JSON、标准 CSS 变量表（`--color-background-*` / `--color-text-*` / `--color-border-*` / `--color-ring-*`）与对话内嵌代码块高亮色板。
- **可验证的无障碍对比度**：集成 `APCA`（Lc 阈值）与 `WCAG 2.1`（AA/AAA）自动化单测门禁，覆盖实色表面、半透明 Diff 叠层、状态徽章与智能体终端 16 色 ANSI 输出。
- **官方合规、零侵入交付边界**：严格对齐 Antigravity 2.0 `Settings > Appearance` 外观配置与官方/未来自定义主题导入规范，**严禁破解应用二进制、篡改签名或绕过沙箱**。
- **全自动化测试与上游巡检流水线**：直接基于 `dist/` 的 APCA/WCAG 对比度门禁、DTCG/CSS Schema 校验、Shiki 代码块快照、`pnpm preview` 交互仿真工作台（Playwright 像素回归将于 `v1.0.0` 接入）、每周巡检 Antigravity App 更新日志（`antigravity.google/docs/changelog.md`）与 Changesets 自动发版。

## 文档导航

全套从 0 到 1 的中英双语平行文档存放于 [`docs/`](./docs/README.md) 目录：

| 编号 | 文档主题 | 简体中文 | English |
| :---: | :--- | :--- | :--- |
| 01 | **项目立项书** — 背景动机、Agent 定位、竞品对比、KPI 与风险评估 | [zh-CN/01-project-charter.md](./docs/zh-CN/01-project-charter.md) | [en/01-project-charter.md](./docs/en/01-project-charter.md) |
| 02 | **需求分析与产品规格（PRD）** — 用户画像、Agent 界面场景、FR/NFR 与代码块覆盖 | [zh-CN/02-prd-requirements.md](./docs/zh-CN/02-prd-requirements.md) | [en/02-prd-requirements.md](./docs/en/02-prd-requirements.md) |
| 03 | **视觉设计原则与色板评审体系** — OKLCH/APCA 基线、三层 Token 与 3 套候选色板 | [zh-CN/03-visual-design-system.md](./docs/zh-CN/03-visual-design-system.md) | [en/03-visual-design-system.md](./docs/en/03-visual-design-system.md) |
| 04 | **技术架构与工程方案** — OKLCH 编译器、Theme Pack Schema、CSS 变量桥接与 ADR | [zh-CN/04-technical-architecture.md](./docs/zh-CN/04-technical-architecture.md) | [en/04-technical-architecture.md](./docs/en/04-technical-architecture.md) |
| 05 | **质量保障与自动化测试方案** — 对比度矩阵、UI 仿真回归测试与 App 验收清单 | [zh-CN/05-qa-testing-plan.md](./docs/zh-CN/05-qa-testing-plan.md) | [en/05-qa-testing-plan.md](./docs/en/05-qa-testing-plan.md) |
| 06 | **发布、运维与上游同步手册** — CI/CD、GitHub/npm 发布与 Antigravity App 变更巡检 | [zh-CN/06-release-maintenance-runbook.md](./docs/zh-CN/06-release-maintenance-runbook.md) | [en/06-release-maintenance-runbook.md](./docs/en/06-release-maintenance-runbook.md) |
| 07 | **开源治理、社区运营与路线图** — MIT 协议、贡献指南、分诊 SOP 与 v2 规划 | [zh-CN/07-governance-roadmap.md](./docs/zh-CN/07-governance-roadmap.md) | [en/07-governance-roadmap.md](./docs/en/07-governance-roadmap.md) |

## 快速开始与下一步里程碑

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm preview   # 在 http://127.0.0.1:4173/preview/ 启动三栏交互仿真预览台
```

1. **交互式视觉复核**：运行 `pnpm preview`，可在浏览器中实时切换深浅变体、极端壁纸（`#FFFFFF` / `#000000`）与 `Reduced Transparency` 降级模式。
2. **下一里程碑（`v1.0.0`）**：对照真实 Antigravity 2.0 桌面端完成 [05 实机视觉对照验收清单](./docs/zh-CN/05-qa-testing-plan.md#5-layer-4antigravity-20-实机视觉对照验收清单发版前强制执行) 并发布首个正式版。

## 开源协议

Copyright (c) 2026 Antigravity Theme Contributors. 本项目采用 **MIT License** 协议开源。
