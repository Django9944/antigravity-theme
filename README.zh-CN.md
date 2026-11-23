# Antigravity Theme

[![CI Gates](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Django9944/antigravity-theme?label=Release&color=1666aa)](https://github.com/Django9944/antigravity-theme/releases)
[![Live Preview Workbench](https://img.shields.io/badge/Live_Preview-3--Pane_Workbench-005697)](https://django9944.github.io/antigravity-theme/preview/)
[![Accessibility](https://img.shields.io/badge/Contrast-APCA_%2B_WCAG_2.1_Verified-00753f)](./tests/contrast.test.ts)
[![Color Space](https://img.shields.io/badge/Tokens-OKLCH_%2B_W3C_DTCG-6355a2)](./src/palettes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-383f47.svg)](./LICENSE)

> [English](./README.md) | **简体中文** · **[在线打开三栏交互仿真预览台 ↗](https://django9944.github.io/antigravity-theme/preview/)**
>
> **[产品愿景 (Vision)](./VISION.md) · [Agent 协作指南 (Agents)](./AGENTS.md) · [贡献指南 (Contributing)](./CONTRIBUTING.md) · [安全策略 (Security)](./SECURITY.md) · [行为准则 (Code of Conduct)](./CODE_OF_CONDUCT.md) · [社区讨论 (Discussions)](https://github.com/Django9944/antigravity-theme/discussions)**

**Antigravity Theme**（`@django9944/antigravity-theme`）是一套专为 **Antigravity 2.0 Agent 桌面端应用** 打造的开源 **OKLCH 磨砂与极光玻璃主题系统 + 零重签跨平台桌面安装器**（覆盖 **7 大主题色系 × Dark/Light 共 14 款变体 + 一键还原 `Stock` 原版**，支持 `macOS` 与 `Windows`）。双击脚本即可无损安装，**绝不破坏苹果原生签名与 TCC 系统权限**，并可在应用右上角悬浮胶囊菜单随时实时切换色系或导出一整套标准 Design Token。

> [!NOTE]
> **适用范围边界**：本项目仅面向 **Antigravity 2.0 Agent 桌面端应用**（左侧边栏 · 对话画布 · 右侧辅助面板），并非代码编辑器主题（不包含 Antigravity IDE、VS Code 及其他编辑器）。

## 桌面端 30 秒快速上手（macOS & Windows）

### 三步一键启用

1. **下载安装包**：前往 [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) 下载对应系统的 **`antigravity-theme-v0.2.0-macos.zip`** 或 **`antigravity-theme-v0.2.0-windows.zip`** 并解压。
2. **双击脚本一键操作**：

| 操作 | macOS (`Antigravity.app`) | Windows (`%LOCALAPPDATA%\Programs\Antigravity`) |
| :--- | :--- | :--- |
| **一键安装 / 启用主题** | 双击 `install.command` | 双击 `install.bat` |
| **在线校验更新** | 双击 `检查更新.command` | 双击 `检查更新.bat` |
| **彻底卸载 / 还原原厂** | 双击 `uninstall.command` | 双击 `uninstall.bat` |

3. **在客户端内实时切换主题**：重启 Antigravity（首次安装默认启用旗舰 **Orbital 星轨** 主题）。将鼠标移至窗口**右上角悬浮主题胶囊**，即可实时切换 7 大色系、明暗模式，或随时点击 **`Stock`** 无痕切回官方原版外观。

### 进阶命令行与自动自愈（CLI）

适合终端进阶用户、只读兼容性排查，或在宿主客户端升级后自动恢复主题钩子：

**macOS（`install.sh` — `Hook v2`）**

```bash
./install.sh --install             # 备份原厂 app.asar、注入 Hook v2 并分发 current.css / current.js
./install.sh --doctor              # 只读诊断当前 Antigravity 的锚点兼容性与 SHA-256 完整性
./install.sh --enable-auto-heal    # 注册 LaunchAgent：宿主自动升级后静默恢复主题钩子
./install.sh --update              # 拉取最新 Release、校验 SHA256SUMS.txt，智能热更新或重注入
./install.sh --uninstall           # 字节级还原原厂 app.asar 并移除 LaunchAgent
```

**Windows（`install.ps1` — `Hook v2`）**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1                     # 一键安装与分发载荷
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Doctor             # 只读 ASAR 兼容诊断
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -EnableAutoHeal     # 注册登录自愈计划任务
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Update             # 校验 SHA256 在线更新
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall          # 还原原厂 ASAR 并清理任务
```

> [!TIP]
> **偏好记忆**：通过右上角悬浮胶囊选中的色系与明暗偏好会在 `--update` 更新及自动自愈后持续保留。

## 主题色系矩阵（7 大色系 × Dark / Light = 14 款变体 + `Stock`）

| 色系 (`Family`) | 暗色 ID（中文名） | 亮色 ID（中文名） | 主色调 (`OKLCH`) | 视觉气质与材质 |
| :--- | :--- | :--- | :--- | :--- |
| **Orbital（星轨 · 旗舰）** | `antigravity-dark`（星轨暗夜） | `antigravity-light`（星轨云瓷） | `255°` 无重钴蓝 | 星轨岩板 / 云瓷磨砂玻璃 |
| **Prism（棱光）** | `antigravity-prism-dark`（暗夜棱光） | `antigravity-prism-light`（流光棱镜） | `256°` 四点极光 | 靛蓝岩板与净白瓷面 · 四点光谱极光 |
| **Zenith（天穹）** | `antigravity-zenith-dark`（天穹深蓝） | `antigravity-zenith-light`（天穹澄蓝） | `236°` 深空蔚蓝 | 深空天穹澄澈蔚蓝极光玻璃 |
| **Lagoon（沧澜）** | `antigravity-lagoon-dark`（沧澜暗青） | `antigravity-lagoon-light`（沧澜青瓷） | `184°` 翡翠暗青 | 沧澜暗青与青瓷矿石玻璃 |
| **Solar（日珥）** | `antigravity-solar-dark`（日珥暮橙） | `antigravity-solar-light`（曦光暖橙） | `42°` 黑曜暮琥珀 | 日珥暮橙与曦光暖珀玻璃 |
| **Nova（绯星）** | `antigravity-nova-dark`（绯星绛夜） | `antigravity-nova-light`（绯星初霞） | `16°` 勃艮第玫红 | 绯星绛夜与初霞玫红玻璃 |
| **Nebula（星云）** | `antigravity-nebula-dark`（星云夜紫） | `antigravity-nebula-light`（星云霞紫） | `294°` 暮光薰衣草紫 | 星云夜紫与浅薰衣草霞紫玻璃 |
| **Stock（官方原版）** | `stock` | `stock` | 原厂默认 | `current.js` 运行时无痕剥离恢复 |

前往 **[三栏交互仿真预览台 ↗](https://django9944.github.io/antigravity-theme/preview/)** 在线体验全套 14 款变体、极光网格背景、`#FFFFFF` / `#000000` 极限壁纸对比度测试及 `Reduced Transparency` 实机效果。

## 为什么选择 Antigravity Theme？（核心架构与安全亮点）

- **科学对比度门禁（`OKLCH` + `APCA`/`WCAG 2.1`）**：全部 14 套变体均在纯白 `#FFFFFF` 与纯黑 `#000000` 极端壁纸下通过自动化 `APCA`（`L1 ≥ 75`、`L2 ≥ 60`、`L3 ≥ 45`）与 `WCAG 2.1` 校验，并提供不透明 `@media (prefers-reduced-transparency: reduce)` 降级保护。
- **跨平台零重签 ASAR 引擎（`core/asar-patcher.js`，`Hook v2`）**：精确重算 ASAR 头部 JSON 偏移与文件级 / 4 MB 分块 `SHA-256` 校验和，绝不触碰 `Info.plist` 与 `_CodeSignature`，完整保留 macOS 辅助功能与录屏等 TCC 权限。
- **自动自愈与安全热更新（`core/updater.js`）**：更新前强制核验 `SHA256SUMS.txt`；当 `hookVersion` 不变时执行免重启热替换 `current.{css,js}`；执行 `--uninstall` 可字节级还原 `app.asar.stock`。
- **双路官方上游自动巡检**：`.github/workflows/upstream-sync.yml` 每周监测官方更新日志 CSS 变量，`.github/workflows/antigravity-watch.yml` 每日拉取官方 Electron 安装包实测真实 `app.asar` 注入兼容性。
- **单一管线多端 Design Token 导出（`@django9944/antigravity-theme`）**：同一份 TypeScript `SemanticIR` 确定性编译生成 `theme.json`（W3C DTCG）、`variables.css`（`--color-*` 与 `--agy-*`）、`code-theme.json`（Shiki）、`mermaid.json` 与桌面端运行时 `dist/runtime/current.{css,js}`。

## Release 三端产物与 NPM 子路径导出

| 资产文件名 | 适用场景 | 包含内容 |
| :--- | :--- | :--- |
| `antigravity-theme-v<ver>.zip` | 设计系统与工具链集成 | 完整 `dist/`（14 套 DTCG/CSS/Shiki/Mermaid + `runtime/`）、`LICENSE`、`README*`、`CHANGELOG.md` |
| `antigravity-theme-v<ver>-macos.zip` | macOS 桌面用户 | `install.sh`、`*.command`、`manifest.json`、`core/{package.json,asar-patcher.js,updater.js}`、`dist/runtime/` |
| `antigravity-theme-v<ver>-windows.zip` | Windows 桌面用户 | `install.ps1`、`*.bat`、`manifest.json`、`core/{package.json,asar-patcher.js,updater.js}`、`dist/runtime/` |
| `SHA256SUMS.txt` | 全局完整性校验 | 统一收录以上 3 个 ZIP 压缩包的 SHA-256 哈希值 |

- **NPM 索引清单**：[`dist/manifest.json`](./dist/manifest.json)（`@django9944/antigravity-theme/manifest.json`）
- **NPM 桌面运行时**：`@django9944/antigravity-theme/runtime/current.css` · `@django9944/antigravity-theme/runtime/current.js`
- **NPM 分变体 Token**：`@django9944/antigravity-theme/<variant-id>/{variables.css,theme.json,code-theme.json,mermaid.json}`

## 当前项目状态与本地开发

- **当前版本**：`v0.2.0`
- **发布渠道**：[GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) 与 npm（`@django9944/antigravity-theme`）
- **开源协议**：[MIT License](./LICENSE)

```bash
pnpm install
pnpm typecheck
pnpm build            # 编译 14 套 OKLCH 主题与 dist/runtime/current.{css,js}
pnpm test             # 运行 DTCG/CSS Schema、APCA/WCAG 对比度、Shiki 与 ASAR 回归测试
pnpm test:asar        # 运行零外部依赖的跨平台 ASAR 与沙盒安装器测试
pnpm doctor           # 一键诊断本机 Antigravity 客户端 app.asar 兼容性
pnpm check:host-compat -- --json
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

## 工程治理、安全边界与社区规范

| 目标 | 入口 |
| :--- | :--- |
| 产品愿景与不合并边界（`What We Will Not Merge`） | [`VISION.md`](./VISION.md) |
| AI Agent 协作与架构分层守则 | [`AGENTS.md`](./AGENTS.md) |
| 贡献指南与人类所有权签字规范（Human Ownership Policy） | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| 安全模型、零重签 ASAR 信任边界与漏洞上报 | [`SECURITY.md`](./SECURITY.md) |
| 社区行为准则（Contributor Covenant v2.1） | [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) |
| 第三方开源组件声明 | [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) |

## 开源协议

- Copyright (c) 2026 Django9944 and Antigravity Theme Contributors（[MIT License](./LICENSE) · [第三方组件声明](./THIRD_PARTY_NOTICES.md)）。
- **免责声明**：本项目为独立的非商业开源社区主题工具，与 Google 或 Antigravity 官方无关联。ASAR 补丁仅在本地无损注入样式入口且保持苹果原生应用签名实体不变，随时可通过 `--uninstall` 字节级恢复原厂状态。
