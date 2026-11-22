# Antigravity Theme

[![CI Gates](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Django9944/antigravity-theme?label=Release&color=1666aa)](https://github.com/Django9944/antigravity-theme/releases)
[![Live Preview Workbench](https://img.shields.io/badge/Live_Preview-3--Pane_Workbench-005697)](https://django9944.github.io/antigravity-theme/preview/)
[![Accessibility](https://img.shields.io/badge/Contrast-APCA_%2B_WCAG_2.1_Verified-00753f)](./tests/contrast.test.ts)
[![Color Space](https://img.shields.io/badge/Tokens-OKLCH_%2B_W3C_DTCG-6355a2)](./src/palettes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-383f47.svg)](./LICENSE)

> **English** | [简体中文](./README.zh-CN.md) · **[Launch Live Interactive 3-Pane Preview Workbench ↗](https://django9944.github.io/antigravity-theme/preview/)**

**Antigravity Theme** (`@django9944/antigravity-theme`) is an open-source **OKLCH Matte & Aurora Glass Theme System + Zero-Resign Cross-Platform Desktop Installer** built exclusively for the **Antigravity 2.0 Agent Desktop App** (`macOS` & `Windows`).

It unifies two capabilities from a single TypeScript `OKLCH` + `APCA`/`WCAG 2.1` Design Token pipeline:

1. **Standard Design Token & Theme Packs (`dist/<variant>/`)** — Deterministic W3C DTCG JSON, `--color-*` & `--agy-*` CSS Custom Properties, Shiki syntax themes, and Mermaid configs across **7 theme families × Dark / Light (14 variants)**.
2. **One-Click Zero-Resign Desktop Runtime (`dist/runtime/` + `core/`)** — Semantic runtime stylesheets (`current.css`) and host-aware controller (`current.js` with floating top-right switcher & non-intrusive `Stock` reset), injected cleanly via `core/asar-patcher.js` (`Hook v1`) without breaking macOS TCC permissions (`_CodeSignature` / `Info.plist` untouched).

> [!NOTE]
> **Scope Boundary**: Purpose-built exclusively for the **Antigravity 2.0 Agent Desktop App** (Left-hand Sidebar · Chat Canvas · Auxiliary Pane). It is not a code editor theme (excludes Antigravity IDE, VS Code, and other code editors).

## Theme Families (7 Families × Dark / Light = 14 Variants + `Stock`)

| Family | Dark ID (`displayName`) | Light ID (`displayName`) | Visual Character & Material | Compiled Artifacts |
| :--- | :--- | :--- | :--- | :--- |
| **Orbital** *(Flagship)* | `antigravity-dark` | `antigravity-light` | Slate/Cloud Matte Glass · Weightless Cobalt | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Prism** *(Spectral)* | `antigravity-prism-dark` | `antigravity-prism-light` | Multi-point Spectral Aurora Slate & Porcelain Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Zenith** *(Azure)* | `antigravity-zenith-dark` | `antigravity-zenith-light` | Deep Ocean & Clear Azure Aurora Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Lagoon** *(Teal)* | `antigravity-lagoon-dark` | `antigravity-lagoon-light` | Deep Lagoon & Aqua Mineral Teal Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Solar** *(Amber)* | `antigravity-solar-dark` | `antigravity-solar-light` | Solar Flare & Warm Horizon Amber Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Nova** *(Crimson)* | `antigravity-nova-dark` | `antigravity-nova-light` | Deep Burgundy & Rose Nova Aurora Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Nebula** *(Violet)* | `antigravity-nebula-dark` | `antigravity-nebula-light` | Twilight Indigo & Soft Lavender Nebula Glass | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Stock** *(Runtime only)* | `stock` | `stock` | Restores native un-themed Antigravity appearance | Non-intrusive strip in `current.js` |

- **Manifest Index**: [`dist/manifest.json`](./dist/manifest.json) (`@django9944/antigravity-theme/manifest.json`)
- **Desktop Runtime Bundle**: `./runtime/current.css` · `./runtime/current.js` (`@django9944/antigravity-theme/runtime/*`)
- **Per-Variant Tokens**: `@django9944/antigravity-theme/<variant-id>/{variables.css,theme.json,code-theme.json,mermaid.json}`

## Desktop Quick Install (macOS & Windows)

### macOS (`Antigravity.app`)

1. Download **`antigravity-theme-v0.2.0-macos.zip`** from [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) and extract it, or clone this repository (`pnpm install && pnpm build`).
2. Double-click **`install.command`** (or run in Terminal):

```bash
./install.sh --install             # Backup stock app.asar, inject Hook v1, deploy dist/runtime/current.{css,js}
./install.sh --doctor              # Read-only ASAR compatibility, anchor & SHA-256 block integrity check
./install.sh --enable-auto-heal    # Enable LaunchAgent (re-injects automatically after host app upgrades)
./install.sh --update              # Download latest release, verify SHA256SUMS.txt, hot-patch if hook unchanged
./install.sh --uninstall           # Byte-exact stock restore & remove LaunchAgent
```

### Windows (`%LOCALAPPDATA%\Programs\Antigravity`)

1. Download **`antigravity-theme-v0.2.0-windows.zip`** from [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) and extract it.
2. Double-click **`install.bat`** (or run in PowerShell):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1                     # Install & deploy payloads
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Doctor             # Read-only ASAR diagnostic
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -EnableAutoHeal     # Register logon auto-heal task
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Update             # Verified self-update
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall          # Restore stock & cleanup tasks
```

> [!TIP]
> **Default Theme & Preferences**: Fresh installs default to the flagship **Orbital** theme, preserve your selected theme across updates via the floating top-right switcher, and support instant non-intrusive switching back to **Stock** at any time.

## Key Highlights

- **Perceptual `OKLCH` + Quantitative `APCA`/`WCAG 2.1` Gates**: Every palette across all 14 variants is verified against pure `#FFFFFF` / `#000000` worst-case backdrops for prose (`L1 ≥ 75`, `L2 ≥ 60`, `L3 ≥ 45`), rings, diffs, alerts, and 16-color terminal ANSI tokens.
- **Zero-Resign ASAR Injection (`core/asar-patcher.js`)**: Rebuilds the ASAR header JSON + per-file & 4 MB multi-block SHA-256 integrity hashes cleanly while leaving `Info.plist` and `_CodeSignature` untouched so macOS Accessibility / Screen Recording permissions stay intact.
- **Self-Healing & Smart Updater (`core/updater.js`)**: Automatically strips and heals corrupted/missing stock backups, detects when upstream upgrades overwrite `app.asar`, and selects zero-restart hot CSS/JS swap when `hookVersion` is unchanged.
- **Dual Upstream CI Watch**: `.github/workflows/upstream-sync.yml` tracks Antigravity changelog CSS variables weekly, while `.github/workflows/antigravity-watch.yml` monitors official Electron update channels daily and validates real `app.asar` compatibility.
- **Interactive 3-Pane Preview Workbench**: Test all 7 families, Dark/Light schemes, Aurora mesh backdrop, stress wallpapers (`#FFFFFF` / `#000000`), `Reduced Transparency`, and the simulated top-right ghost switcher at **[Preview Workbench ↗](https://django9944.github.io/antigravity-theme/preview/)**.

## Release Assets & Verification

| Asset | Audience | Contents |
| :--- | :--- | :--- |
| `antigravity-theme-v<ver>.zip` | Theme consumers & token pipelines | `dist/` (14 variants DTCG/CSS + `runtime/`), `LICENSE`, `README*`, `CHANGELOG.md` |
| `antigravity-theme-v<ver>-macos.zip` | macOS desktop users | `install.sh`, `*.command`, `manifest.json`, `core/{package.json,asar-patcher.js,updater.js}`, `dist/runtime/` |
| `antigravity-theme-v<ver>-windows.zip` | Windows desktop users | `install.ps1`, `*.bat`, `manifest.json`, `core/{package.json,asar-patcher.js,updater.js}`, `dist/runtime/` |
| `SHA256SUMS.txt` | All users & updater | Unified SHA-256 checksums covering all three release archives |

## Project Status

- **Current Version**: `v0.2.0` (7 Families × Dark/Light OKLCH Token Compiler, Semantic Desktop Runtime, Zero-Resign Cross-Platform ASAR Installer, Upgraded 3-Pane Preview Workbench, Dual Upstream Watch & Multi-Archive CI)
- **Distribution**: [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) (`ZIP` bundles + `SHA256SUMS.txt`) & npm (`@django9944/antigravity-theme`)
- **License**: [MIT License](./LICENSE)

## Local Development

```bash
pnpm install
pnpm typecheck
pnpm build            # Compile 14 OKLCH variants + dist/runtime/current.{css,js}
pnpm test             # Run DTCG/CSS schema, APCA/WCAG contrast, Shiki & ASAR tests
pnpm test:asar        # Run standalone cross-platform ASAR, updater & sandbox tests
pnpm doctor           # Inspect local Antigravity.app ASAR compatibility
pnpm check:host-compat -- --json
pnpm pack:release     # Stage & verify standard, -macos.zip, -windows.zip + SHA256SUMS.txt
pnpm sync:readme      # Synchronize CHANGELOG.md history into README.md & README.zh-CN.md
pnpm preview          # Launch interactive 3-pane preview at http://127.0.0.1:4173/preview/
```

## Release History & Iteration Log

> Automatically synchronized from [`CHANGELOG.md`](./CHANGELOG.md) during each release (`pnpm sync:readme` / `pnpm ci:version`).

<!-- RELEASE_HISTORY:START -->

### [v0.2.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.2.0) (Latest Release)

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

## License

- Copyright (c) 2026 Django9944 and Antigravity Theme Contributors ([MIT License](./LICENSE)).
- **Disclaimer**: This is an independent, non-commercial open-source community theme project not affiliated with Google or Antigravity. Desktop ASAR patching modifies only local Electron UI resource metadata cleanly (`_CodeSignature` untouched) and includes full reversible uninstall & stock backup recovery.
