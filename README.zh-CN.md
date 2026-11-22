# Antigravity Theme

[![CI Gates](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Django9944/antigravity-theme?label=Release&color=1666aa)](https://github.com/Django9944/antigravity-theme/releases)
[![Live Preview Workbench](https://img.shields.io/badge/Live_Preview-3--Pane_Workbench-005697)](https://django9944.github.io/antigravity-theme/preview/)
[![Accessibility](https://img.shields.io/badge/Contrast-APCA_%2B_WCAG_2.1_Verified-00753f)](./tests/contrast.test.ts)
[![Color Space](https://img.shields.io/badge/Tokens-OKLCH_%2B_W3C_DTCG-6355a2)](./src/palettes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-383f47.svg)](./LICENSE)

> [English](./README.md) | **简体中文** · **[在线打开三栏交互仿真预览台 ↗](https://django9944.github.io/antigravity-theme/preview/)**

**Antigravity Theme**（`@django9944/antigravity-theme`）是一套专为 **Antigravity 2.0 Agent 桌面端应用** 打造的开源 **OKLCH 磨砂与极光玻璃主题系统 + 零重签跨平台桌面安装器**（支持 `macOS` 与 `Windows`）。

它将同一套 TypeScript `OKLCH` + `APCA`/`WCAG 2.1` 对比度门禁词元管线编译为两类开箱即用的产物：

1. **标准 Design Token 与主题包（`dist/<variant>/`）** —— 覆盖 **7 大主题色系 × Dark/Light（共 14 款变体）** 的 W3C DTCG JSON、`--color-*` / `--agy-*` CSS 变量表、Shiki 代码高亮表与 Mermaid 配色。
2. **零重签桌面端运行时（`dist/runtime/` + `core/`）** —— 语义化编译生成的 `current.css` 与 `current.js`（右上角悬浮主题胶囊切换器、支持无缝切换 **`Stock`（官方原版）**），由跨平台共享引擎 `core/asar-patcher.js`（`Hook v1`）无损注入，**绝不修改 `Info.plist` 与 `_CodeSignature`，完整保留 macOS TCC 系统权限**。

> [!NOTE]
> **适用范围边界**：本项目仅面向 **Antigravity 2.0 Agent 桌面端应用**（左侧边栏 · 对话画布 · 右侧辅助面板），并非代码编辑器主题（不包含 Antigravity IDE、VS Code 及其他编辑器）。

## 主题色系矩阵（7 大色系 × Dark / Light = 14 款 OKLCH 变体 + `Stock`）

| 色系 (`Family`) | 暗色 ID | 亮色 ID | 视觉气质与材质 | 编译产物（`dist/<id>/`） |
| :--- | :--- | :--- | :--- | :--- |
| **Orbital（星轨 · 旗舰默认）** | `antigravity-dark` | `antigravity-light` | 星轨岩板 / 云瓷磨砂玻璃 + 无重钴蓝强调色 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Prism（棱光）** | `antigravity-prism-dark` | `antigravity-prism-light` | 四点流光棱镜折射极光玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Zenith（天穹）** | `antigravity-zenith-dark` | `antigravity-zenith-light` | 深空天穹澄澈蔚蓝玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Lagoon（沧澜）** | `antigravity-lagoon-dark` | `antigravity-lagoon-light` | 沧澜暗青与青瓷矿石玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Solar（日珥）** | `antigravity-solar-dark` | `antigravity-solar-light` | 日珥暮橙与曦光暖珀玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Nova（绯星）** | `antigravity-nova-dark` | `antigravity-nova-light` | 绯星绛夜与初霞玫红玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Nebula（星云）** | `antigravity-nebula-dark` | `antigravity-nebula-light` | 星云夜紫与浅薰衣草霞紫玻璃 | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Stock（官方原版）** | `stock` | `stock` | 零侵入撤销自定义样式，恢复原版外观 | `current.js` 运行时剥离 |

- **索引清单**：[`dist/manifest.json`](./dist/manifest.json)（`@django9944/antigravity-theme/manifest.json`）
- **桌面运行时**：`./runtime/current.css` · `./runtime/current.js`（`@django9944/antigravity-theme/runtime/*`）

## 桌面端一键安装（macOS & Windows）

### macOS (`Antigravity.app`)

1. 前往 [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) 下载 **`antigravity-theme-v0.2.0-macos.zip`** 并解压（或在仓库目录执行 `pnpm install && pnpm build`）。
2. 双击 **`install.command`**，或在终端执行：

```bash
./install.sh --install             # 备份原厂 app.asar、注入 Hook v1 并分发 current.css / current.js
./install.sh --doctor              # 只读诊断当前 Antigravity 的锚点兼容性与 SHA-256 完整性
./install.sh --enable-auto-heal    # 注册 LaunchAgent：宿主自动升级后静默恢复主题钩子
./install.sh --update              # 拉取最新 Release、校验 SHA256SUMS.txt，智能热更新或重注入
./install.sh --uninstall           # 字节级还原原厂 app.asar 并移除 LaunchAgent
```

### Windows (`%LOCALAPPDATA%\Programs\Antigravity`)

1. 下载并解压 **`antigravity-theme-v0.2.0-windows.zip`**。
2. 双击 **`install.bat`**（或卸载 **`uninstall.bat`** / 检查更新 **`检查更新.bat`**），或在 PowerShell 中运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1                     # 一键安装与分发载荷
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Doctor             # 只读 ASAR 兼容诊断
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -EnableAutoHeal     # 注册登录自愈计划任务
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Update             # 校验 SHA256 在线更新
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall          # 还原原厂 ASAR 并清理任务
```

> [!TIP]
> **默认主题与偏好保存**：首次安装默认选中旗舰 **Orbital** 主题；通过右上角悬浮胶囊菜单切换的偏好会在后续更新中持续保留，也可随时一键无痕切换回 **Stock（官方原版）**。

## 核心亮点

- **科学对比度与极光网格系统**：基于 `OKLCH` 统一明度权重，14 套暗/亮色主题在 `#FFFFFF` / `#000000` 极端壁纸下均通过 `APCA`（`L1 ≥ 75`、`L2 ≥ 60`、`L3 ≥ 45`）与 `WCAG 2.1` 自动化验证。
- **跨平台零重签 ASAR 引擎（`core/asar-patcher.js`）**：精算新旧字节偏移与 4 MB 分块 `SHA256` 校验和，支持注入、幂等重装、只读体检及字节级剥离还原；不改动 `.app` 签名实体。
- **自动升级热更新与宿主双路监控**：`core/updater.js` 在 `hookVersion` 不变时执行零重启热替换；`.github/workflows/upstream-sync.yml` 与 `.github/workflows/antigravity-watch.yml` 分别每周/每日巡检官方文档变量与真实 Electron 更新包 ASAR 兼容性。
- **三栏交互式预览工作台**：前往 **[三栏交互仿真预览台 ↗](https://django9944.github.io/antigravity-theme/preview/)** 切换 7 大色系、Dark/Light、`Stock`、极光背景、纯黑/纯白极限壁纸及模拟右上角悬浮胶囊菜单。

## Release 三端产物与校验

| 资产文件名 | 适用场景 | 包含内容 |
| :--- | :--- | :--- |
| `antigravity-theme-v<ver>.zip` | 设计系统与工具链集成 | 完整 `dist/`（14 套 DTCG/CSS + `runtime/`）、`LICENSE`、`README*`、`CHANGELOG.md` |
| `antigravity-theme-v<ver>-macos.zip` | macOS 桌面用户 | `install.sh`、`*.command`、`manifest.json`、`core/`、`dist/runtime/` |
| `antigravity-theme-v<ver>-windows.zip` | Windows 桌面用户 | `install.ps1`、`*.bat`、`manifest.json`、`core/`、`dist/runtime/` |
| `SHA256SUMS.txt` | 全局完整性校验 | 统一收录以上 3 个 ZIP 压缩包的 SHA-256 哈希值 |

## 当前项目状态

- **当前版本**：`v0.2.0`（7 色系 × Dark/Light OKLCH 编译器、语义化桌面运行时、零重签跨平台 ASAR 安装器、升级版预览工作台、三产物发版与双路上游巡检）
- **发布渠道**：[GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) 与 npm（`@django9944/antigravity-theme`）
- **开源协议**：[MIT License](./LICENSE)

## 快速开始与本地开发

```bash
pnpm install
pnpm typecheck
pnpm build            # 编译 14 套 OKLCH 主题与 dist/runtime/current.{css,js}
pnpm test             # 运行 DTCG/CSS Schema、APCA/WCAG 对比度、Shiki 与 ASAR 回归测试
pnpm test:asar        # 运行零外部依赖的跨平台 ASAR 与沙盒安装器测试
pnpm doctor           # 一键诊断本机 Antigravity 客户端 app.asar 兼容性
pnpm pack:release     # 打包标准包、macOS 包、Windows 包及 SHA256SUMS.txt
pnpm sync:readme      # 从 CHANGELOG.md 同步发版历史到中英文 README
pnpm preview          # 在 http://127.0.0.1:4173/preview/ 启动三栏交互仿真预览台
```

## 版本迭代记录（Release History & Iteration Log）

> 每次版本迭代发布（`pnpm sync:readme` / `pnpm ci:version`）时自动从 [`CHANGELOG.md`](./CHANGELOG.md) 同步生成。

<!-- RELEASE_HISTORY:START -->

### [v0.2.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.2.0) （当前最新版本 / Latest）

- **7 Theme Families × Dark / Light (14 OKLCH Variants) + Stock Reset**: Expanded flagship `Orbital` (`antigravity-dark`, `antigravity-light`) with six celestial OKLCH families (`prism`, `zenith`, `lagoon`, `solar`, `nova`, `nebula` × Dark/Light), all passing APCA & WCAG 2.1 contrast gates plus non-intrusive `stock` restore.
- **Modular Semantic Desktop Runtime (`dist/runtime/current.{css,js}`)**: Added a SemanticIR-compiled desktop runtime featuring Aurora multi-layer mesh glass, floating top-right ghost switcher, dual media capsules, xterm ANSI bridge, and modal chrome polish.
- **Zero-Resign Cross-Platform ASAR Installer, Auto-Heal & Self-Updater**: Added `core/asar-patcher.js`, `core/updater.js`, macOS (`install.sh`, `*.command`, LaunchAgent auto-heal), and Windows (`install.ps1`, `*.bat`, Scheduled Task auto-heal) with SHA-256 integrity verification and byte-exact stock restore.
- **Upgraded 3-Pane Preview Workbench & 3-Archive Release Pipeline**: Added 7-family selector, Aurora mesh stage backdrop, and simulated ghost switcher to `preview/`; updated `pack-release.ts` to emit standard, `-macos.zip`, and `-windows.zip` with unified `SHA256SUMS.txt` plus daily `antigravity-watch.yml` CI monitoring.

### [v0.1.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.1.0)

- Initial OKLCH Design Token compiler and deterministic multi-format adapters (`theme.json`, `variables.css`, `code-theme.json`, `mermaid.json`).
- Option A (`ADR-006`) High-Opacity Matte Frosted Glass palettes: **Antigravity Dark (Orbital Slate Matte Glass)** and **Antigravity Light (Orbital Cloud Matte Glass)**.
- Interactive 3-pane Antigravity 2.0 Agent Desktop preview workbench (`preview/`).
- Automated schema, host CSS coverage, worst-case glass contrast (`APCA` + `WCAG 2.1`), L5 ring/border, DOM-stacked Diff, and Shiki Tier-1 code-fence regression test suite.

<!-- RELEASE_HISTORY:END -->

## 开源协议

- Copyright (c) 2026 Django9944 and Antigravity Theme Contributors（[MIT License](./LICENSE)）。
- **免责声明**：本项目为独立的非商业开源社区主题工具，与 Google 或 Antigravity 官方无关联。ASAR 补丁仅在本地无损注入样式入口且保持苹果原生应用签名实体不变，随时可通过 `--uninstall` 字节级恢复原厂状态。
