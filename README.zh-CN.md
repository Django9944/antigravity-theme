# Antigravity Theme

[![CI Gates](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Django9944/antigravity-theme?label=Release&color=1666aa)](https://github.com/Django9944/antigravity-theme/releases)
[![Live Preview Workbench](https://img.shields.io/badge/Live_Preview-3--Pane_Workbench-005697)](https://django9944.github.io/antigravity-theme/preview/)
[![Accessibility](https://img.shields.io/badge/Contrast-APCA_%2B_WCAG_2.1_Verified-00753f)](./tests/contrast.test.ts)
[![Color Space](https://img.shields.io/badge/Tokens-OKLCH_%2B_W3C_DTCG-6355a2)](./src/palettes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-383f47.svg)](./LICENSE)

> [English](./README.md) | **简体中文** · **[在线打开三栏交互仿真预览台 ↗](https://django9944.github.io/antigravity-theme/preview/)**

**Antigravity Theme** 是专为 **Antigravity 2.0 Agent 桌面端应用**打造的开源**高不透明度哑光毛玻璃（High-Opacity Matte Glass）**双变体主题包（`Antigravity Dark` 与 `Antigravity Light`）。

项目以单一 TypeScript `OKLCH` 感知色彩 Token 为事实源，结合自动化 `APCA` 与 `WCAG 2.1` 无障碍对比度门禁确定性编译，全面覆盖 Antigravity Agent 客户端的三栏核心界面，并原生对齐宿主 CSS 主题变量协议（`--color-*`）：

- **左侧边栏（Left-hand Sidebar）** — 智能体会话列表、工作区导航与运行状态指示
- **对话画布（Chat Canvas）** — 用户指令、Agent 正文、折叠推理块（Thinking）、工具执行卡片、`/` 斜杠命令与 `@` 引用菜单
- **右侧辅助面板（Auxiliary Pane）** — Subagents 子智能体树、Background Tasks、Artifacts（Markdown / Alerts / Mermaid / KaTeX / Carousel）、Files Changed Diff、Terminals 与 Browser Pane

> [!NOTE]
> **适用范围边界**：本项目仅面向 **Antigravity 2.0 Agent 智能体桌面客户端**，并非代码编辑器主题（不包含 Antigravity IDE、VS Code 及其他编辑器）。

## 主题变体与产物导出（Theme Variants & Package Exports）

`dist/` 目录（及 npm 包 `@django9944/antigravity-theme`）中的每个变体均确定性编译为 4 类标准化产物文件：

| 主题变体 | 变体 ID | 色板定位与材质 | 编译产物（`dist/<id>/`） |
| :--- | :--- | :--- | :--- |
| **Antigravity Dark** | `antigravity-dark` | **Orbital Slate 哑光毛玻璃** — 冷调岩板蓝深色基底 + 失重钴蓝（Weightless Cobalt）强调色 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Antigravity Light** | `antigravity-light` | **Orbital Cloud 哑光毛玻璃** — 云瓷白高透浅色基底，兼顾长文阅读舒适度与层次感 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |

- **清单索引（Manifest）**：[`dist/manifest.json`](./dist/manifest.json)（`@django9944/antigravity-theme/manifest.json`）
- **CSS 变量表**：`@django9944/antigravity-theme/antigravity-dark/variables.css` / `antigravity-light/variables.css`
- **W3C DTCG 设计令牌**：`@django9944/antigravity-theme/antigravity-dark/theme.json` / `antigravity-light/theme.json`

## 核心色板速览表（Core Palette Swatches — `OKLCH` & Compiled Hex）

| 语义层级角色 | 宿主 / Agent CSS 变量 | Antigravity Dark (`OKLCH` → Hex / RGBA) | Antigravity Light (`OKLCH` → Hex / RGBA) |
| :--- | :--- | :--- | :--- |
| **外框侧栏层（Elev 0 Shell）** | `--color-background-secondary` / `--agy-glass-bg-shell` | `oklch(0.195 0.015 255)` → `#10151c` (`α 0.86`) | `oklch(0.955 0.008 245)` → `#ecf1f5` (`α 0.88`) |
| **主对话画布（Elev 1 Canvas）** | `--color-background-primary` / `--agy-glass-bg-canvas` | `oklch(0.220 0.016 255)` → `#161b22` (`α 0.94`) | `oklch(0.980 0.006 245)` → `#f5f9fc` (`α 0.95`) |
| **卡片容器层（Elev 2 Card）** | `--color-background-tertiary` / `--agy-glass-bg-card` | `oklch(0.250 0.016 255)` → `#1d2229` (`α 0.82`) | `oklch(0.962 0.007 245)` → `#eff3f7` (`α 0.86`) |
| **浮层菜单层（Elev 3 Popover）** | `--agy-surface-elevated` / `--agy-glass-bg-popover` | `oklch(0.275 0.017 255)` → `#222830` (`α 0.91`) | `oklch(0.992 0.004 245)` → `#fafdff` (`α 0.93`) |
| **主正文文本（L1 Primary）** | `--color-text-primary` | `oklch(0.915 0.010 250)` → `#dee4e9` | `oklch(0.240 0.018 252)` → `#192028` |
| **思考块 / 元信息（L3 Muted）** | `--color-text-tertiary` / `--agy-thinking-fg` | `oklch(0.715 0.014 250)` → `#9da4ac` | `oklch(0.495 0.014 248)` → `#5c636a` |
| **失重钴蓝（主强调色 Cobalt）** | `--color-text-info` / `--color-ring-primary` | `oklch(0.795 0.120 250)` → `#86c1ff` | `oklch(0.448 0.140 250)` → `#005697` |
| **运行态青色（Running Cyan）** | `--agy-running-accent` / `--agy-subagent-working` | `oklch(0.795 0.105 205)` → `#5cd0dc` | `oklch(0.442 0.105 205)` → `#005f67` |
| **大气紫（Waiting / Important）** | `--agy-subagent-waiting` / `--agy-alert-important-fg` | `oklch(0.802 0.120 290)` → `#bdb3ff` | `oklch(0.445 0.140 290)` → `#55419a` |
| **语义翠绿（Success / Done）** | `--color-text-success` / `--agy-done-accent` | `oklch(0.790 0.122 154)` → `#77d296` | `oklch(0.438 0.128 152)` → `#006330` |
| **暖珀黄（Needs Approval）** | `--color-text-warning` / `--agy-approval-fg` | `oklch(0.810 0.122 78)` → `#ecb75f` | `oklch(0.452 0.120 68)` → `#794900` |
| **克制绯红（Error / Caution）** | `--color-text-danger` / `--agy-error-accent` | `oklch(0.800 0.126 22)` → `#ffa09c` | `oklch(0.455 0.142 24)` → `#962b2d` |

## 核心特性

- **高不透明度哑光毛玻璃体系（High-Opacity Matte Glass）**：分层半透明玻璃质感（`backdrop-filter` 模糊与饱和度增强、`1px` 顶部高光折射边、极端壁纸底色对比度兜底），并内置 `@media (prefers-reduced-transparency: reduce)` 自动不透明降级方案。
- **Agent-First 交互层级视觉语法**：专为多智能体协同工作台设计，清晰区分用户指令、Agent 正文、折叠推理块、工具执行状态卡片、权限审批横幅、子智能体状态树与富文本 Artifacts。
- **感知色彩与 Design Token 编译体系**：以 TypeScript + `OKLCH` 作为单一事实源（SSOT），确定性编译输出 W3C DTCG Theme JSON、标准 CSS 变量表（`--color-background-*`、`--color-text-*`、`--color-border-*`、`--color-ring-*`、`--agy-*`）、Shiki 代码块高亮主题与 Mermaid 图表色板。
- **可验证的无障碍对比度**：集成 `APCA`（`Lc` 阈值）与 `WCAG 2.1`（AA/AAA）自动化单测门禁，覆盖实色表面、半透明 Diff 叠层、状态徽章与智能体终端 16 色 ANSI 输出。
- **官方合规、零侵入交付边界**：严格对齐 Antigravity 2.0 `Settings > Appearance` 外观配置与官方主题导入规范，**零二进制修补、零签名篡改、零沙箱绕过**。
- **上游自动监测与自动发版同步流水线**：每周自动巡检 Antigravity App 更新日志（`antigravity.google/docs/changelog.md`），检测到新版本或新增 `--color-*` 宿主变量时自动更新 `.upstream-baseline.json` 并开启同步 PR；发版时自动将项目描述与历次迭代内容同步至 GitHub Release 及 `README.md`。

## 项目状态

- **当前版本**：`v0.1.0`（OKLCH 编译器、高不透明度哑光毛玻璃 Theme Pack、三栏交互仿真预览台、自动化门禁与 CI/CD）
- **下一里程碑**：`v1.0.0` — 对照真实 Antigravity 2.0 桌面端完成实机视觉验收并接入 Playwright 像素回归 CI
- **发布渠道**：[GitHub Releases](https://github.com/Django9944/antigravity-theme/releases)（Theme Pack ZIP + `SHA256SUMS.txt`）与 npm（`@django9944/antigravity-theme`）
- **开源协议**：[MIT License](./LICENSE)

## 快速开始与交互预览

- **免安装在线预览**：访问 **[https://django9944.github.io/antigravity-theme/preview/](https://django9944.github.io/antigravity-theme/preview/)**，即可在浏览器中实时切换 `Antigravity Dark` / `Antigravity Light`、测试极端壁纸（`#FFFFFF` / `#000000`）与 `Reduced Transparency` 降级模式。
- **本地开发与构建**：

```bash
pnpm install
pnpm typecheck
pnpm build        # 编译确定性主题产物至 dist/
pnpm test         # 运行 DTCG/CSS Schema、APCA/WCAG 对比度与 Shiki 快照门禁
pnpm sync:readme  # 将 CHANGELOG.md 历次迭代描述同步更新至 README.md 与 README.zh-CN.md
pnpm preview      # 在 http://127.0.0.1:4173/preview/ 启动三栏交互仿真预览台
```

## 版本迭代记录（Release History & Iteration Log）

> 每次版本迭代发布（`pnpm sync:readme` / `pnpm ci:version`）时自动从 [`CHANGELOG.md`](./CHANGELOG.md) 同步生成。

<!-- RELEASE_HISTORY:START -->

### [v0.1.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.1.0) （当前最新版本 / Latest）

- Initial OKLCH Design Token compiler and deterministic multi-format adapters (`theme.json`, `variables.css`, `code-theme.json`, `mermaid.json`).
- Option A (`ADR-006`) High-Opacity Matte Frosted Glass palettes: **Antigravity Dark (Orbital Slate Matte Glass)** and **Antigravity Light (Orbital Cloud Matte Glass)**.
- Interactive 3-pane Antigravity 2.0 Agent Desktop preview workbench (`preview/`).
- Automated schema, host CSS coverage, worst-case glass contrast (`APCA` + `WCAG 2.1`), L5 ring/border, DOM-stacked Diff, and Shiki Tier-1 code-fence regression test suite.

<!-- RELEASE_HISTORY:END -->

## 开源协议

Copyright (c) 2026 Antigravity Theme Contributors. 本项目采用 **MIT License** 协议开源。
