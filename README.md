# Antigravity Theme

[![CI Gates](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/Django9944/antigravity-theme/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Django9944/antigravity-theme?label=Release&color=1666aa)](https://github.com/Django9944/antigravity-theme/releases)
[![Live Preview Workbench](https://img.shields.io/badge/Live_Preview-3--Pane_Workbench-005697)](https://django9944.github.io/antigravity-theme/preview/)
[![Accessibility](https://img.shields.io/badge/Contrast-APCA_%2B_WCAG_2.1_Verified-00753f)](./tests/contrast.test.ts)
[![Color Space](https://img.shields.io/badge/Tokens-OKLCH_%2B_W3C_DTCG-6355a2)](./src/palettes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-383f47.svg)](./LICENSE)

> **English** | [简体中文](./README.zh-CN.md) · **[Launch Live Interactive 3-Pane Preview Workbench ↗](https://django9944.github.io/antigravity-theme/preview/)**

**Antigravity Theme** is an open-source **High-Opacity Matte Glass** theme pack (`Antigravity Dark` & `Antigravity Light`) built for the **Antigravity 2.0 Agent Desktop App**.

It is engineered from a single TypeScript `OKLCH` design token source with automated `APCA` and `WCAG 2.1` contrast gates, delivering a cohesive visual hierarchy across all three Antigravity Agent surfaces while staying aligned with the host CSS variable protocol (`--color-*`):

- **Left-hand Sidebar** — Agent sessions, workspace navigation, and active status indicators
- **Chat Canvas** — User prompts, agent prose, thinking traces, tool execution cards, `/` slash commands, and `@` mentions
- **Auxiliary Pane** — Subagents, Background Tasks, Artifacts (Markdown, Alerts, Mermaid, KaTeX, Carousels), Files Changed Diffs, Terminals, and Browser Pane

> [!NOTE]
> **Scope Boundary**: Purpose-built exclusively for the **Antigravity 2.0 Agent Desktop App**. It is not a code editor theme (excludes Antigravity IDE, VS Code, and other code editors).

## Theme Variants & Package Exports

Each variant in `dist/` (and `@django9944/antigravity-theme`) compiles into 4 deterministic artifacts:

| Variant | ID | Palette & Material | Compiled Artifacts (`dist/<id>/`) |
| :--- | :--- | :--- | :--- |
| **Antigravity Dark** | `antigravity-dark` | **Orbital Slate Matte Glass** — cool slate-blue dark surfaces with Weightless Cobalt accents | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |
| **Antigravity Light** | `antigravity-light` | **Orbital Cloud Matte Glass** — airy cloud-porcelain light surfaces for editorial reading comfort | `variables.css` · `theme.json` · `code-theme.json` · `mermaid.json` |

- **Manifest Index**: [`dist/manifest.json`](./dist/manifest.json) (`@django9944/antigravity-theme/manifest.json`)
- **CSS Custom Properties**: `@django9944/antigravity-theme/antigravity-dark/variables.css` / `antigravity-light/variables.css`
- **W3C DTCG Design Tokens**: `@django9944/antigravity-theme/antigravity-dark/theme.json` / `antigravity-light/theme.json`

## Core Palette Swatches (`OKLCH` & Compiled Hex)

| Semantic Role | Host / Agent CSS Variable | Antigravity Dark (`OKLCH` → Hex / RGBA) | Antigravity Light (`OKLCH` → Hex / RGBA) |
| :--- | :--- | :--- | :--- |
| **Shell Surface (Elev 0)** | `--color-background-secondary` / `--agy-glass-bg-shell` | `oklch(0.195 0.015 255)` → `#10151c` (`α 0.86`) | `oklch(0.955 0.008 245)` → `#ecf1f5` (`α 0.88`) |
| **Chat Canvas (Elev 1)** | `--color-background-primary` / `--agy-glass-bg-canvas` | `oklch(0.220 0.016 255)` → `#161b22` (`α 0.94`) | `oklch(0.980 0.006 245)` → `#f5f9fc` (`α 0.95`) |
| **Card Surface (Elev 2)** | `--color-background-tertiary` / `--agy-glass-bg-card` | `oklch(0.250 0.016 255)` → `#1d2229` (`α 0.82`) | `oklch(0.962 0.007 245)` → `#eff3f7` (`α 0.86`) |
| **Popover Surface (Elev 3)** | `--agy-surface-elevated` / `--agy-glass-bg-popover` | `oklch(0.275 0.017 255)` → `#222830` (`α 0.91`) | `oklch(0.992 0.004 245)` → `#fafdff` (`α 0.93`) |
| **Primary Prose (L1)** | `--color-text-primary` | `oklch(0.915 0.010 250)` → `#dee4e9` | `oklch(0.240 0.018 252)` → `#192028` |
| **Thinking / Metadata (L3)** | `--color-text-tertiary` / `--agy-thinking-fg` | `oklch(0.715 0.014 250)` → `#9da4ac` | `oklch(0.495 0.014 248)` → `#5c636a` |
| **Weightless Cobalt (Accent)** | `--color-text-info` / `--color-ring-primary` | `oklch(0.795 0.120 250)` → `#86c1ff` | `oklch(0.448 0.140 250)` → `#005697` |
| **Running Cyan** | `--agy-running-accent` / `--agy-subagent-working` | `oklch(0.795 0.105 205)` → `#5cd0dc` | `oklch(0.442 0.105 205)` → `#005f67` |
| **Atmospheric Violet** | `--agy-subagent-waiting` / `--agy-alert-important-fg` | `oklch(0.802 0.120 290)` → `#bdb3ff` | `oklch(0.445 0.140 290)` → `#55419a` |
| **Emerald Green (Success)** | `--color-text-success` / `--agy-done-accent` | `oklch(0.790 0.122 154)` → `#77d296` | `oklch(0.438 0.128 152)` → `#006330` |
| **Warm Amber (Approval)** | `--color-text-warning` / `--agy-approval-fg` | `oklch(0.810 0.122 78)` → `#ecb75f` | `oklch(0.452 0.120 68)` → `#794900` |
| **Restrained Crimson (Error)** | `--color-text-danger` / `--agy-error-accent` | `oklch(0.800 0.126 22)` → `#ffa09c` | `oklch(0.455 0.142 24)` → `#962b2d` |

## Key Highlights

- **High-Opacity Matte Glass System**: Layered glassmorphism (`backdrop-filter` blur/saturation, directional `1px` specular edge highlights, and worst-case wallpaper contrast guards) paired with automatic `@media (prefers-reduced-transparency: reduce)` opaque fallbacks.
- **Agent-First Surface Hierarchy**: Purpose-built visual grammar for multi-agent orchestration—differentiating user prompts, agent prose, collapsed thinking traces, tool execution states, permission approvals, subagent trees, and rich Artifacts.
- **Perceptual Design Token Pipeline**: Single source of truth authored in TypeScript (`OKLCH`), compiling deterministically into W3C DTCG Theme JSON, standard CSS Custom Properties (`--color-background-*`, `--color-text-*`, `--color-border-*`, `--color-ring-*`, `--agy-*`), Shiki code-block themes, and Mermaid palettes.
- **Verified Accessibility**: Automated `APCA` (`Lc` thresholds) and `WCAG 2.1` (AA/AAA) unit gates covering solid surfaces, translucent diff washes, status badges, and 16-color agent terminal output.
- **Official & Safe Delivery Model**: Strictly adheres to Antigravity 2.0 appearance settings, configuration schemas, and official theme import standards—zero binary patching or Electron tampering.
- **Automated Upstream Sync & Release Pipeline**: Weekly monitoring of Antigravity App release notes (`antigravity.google/docs/changelog.md`) that automatically updates `.upstream-baseline.json` and opens a sync PR, paired with Changesets-driven releases that synchronize iteration history directly into `README.md`.

## Project Status

- **Current Version**: `v0.1.0` (OKLCH Token Compiler, High-Opacity Matte Glass Theme Pack, 3-Pane Preview Workbench, Automated QA Gates & CI/CD)
- **Next Milestone**: `v1.0.0` — Live Antigravity 2.0 Desktop App visual sign-off & Playwright pixel-diff CI
- **Distribution**: [GitHub Releases](https://github.com/Django9944/antigravity-theme/releases) (Theme Pack ZIP + `SHA256SUMS.txt`) & npm (`@django9944/antigravity-theme`)
- **License**: [MIT License](./LICENSE)

## Quick Start & Live Preview

- **Online Preview (Zero Install)**: Open **[https://django9944.github.io/antigravity-theme/preview/](https://django9944.github.io/antigravity-theme/preview/)** to switch between `Antigravity Dark` and `Antigravity Light`, test stress wallpapers (`#FFFFFF` / `#000000`), and toggle `Reduced Transparency`.
- **Local Development**:

```bash
pnpm install
pnpm typecheck
pnpm build        # Compile deterministic theme artifacts into dist/
pnpm test         # Run DTCG/CSS schema, APCA/WCAG contrast & Shiki snapshot gates
pnpm sync:readme  # Synchronize CHANGELOG.md iteration history into README.md & README.zh-CN.md
pnpm preview      # Launch interactive 3-pane preview at http://127.0.0.1:4173/preview/
```

## Release History & Iteration Log

> Automatically synchronized from [`CHANGELOG.md`](./CHANGELOG.md) during each release (`pnpm sync:readme` / `pnpm ci:version`).

<!-- RELEASE_HISTORY:START -->

### [v0.1.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.1.0) (Latest Release)

- Initial OKLCH Design Token compiler and deterministic multi-format adapters (`theme.json`, `variables.css`, `code-theme.json`, `mermaid.json`).
- Option A (`ADR-006`) High-Opacity Matte Frosted Glass palettes: **Antigravity Dark (Orbital Slate Matte Glass)** and **Antigravity Light (Orbital Cloud Matte Glass)**.
- Interactive 3-pane Antigravity 2.0 Agent Desktop preview workbench (`preview/`).
- Automated schema, host CSS coverage, worst-case glass contrast (`APCA` + `WCAG 2.1`), L5 ring/border, DOM-stacked Diff, and Shiki Tier-1 code-fence regression test suite.

<!-- RELEASE_HISTORY:END -->

## License

Copyright (c) 2026 Antigravity Theme Contributors. Licensed under the **MIT License**.
