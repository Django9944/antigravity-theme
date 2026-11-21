# Antigravity Theme

> **English** | [简体中文](./README.zh-CN.md)

**Antigravity Theme** is an open-source appearance configuration and theme package project built **exclusively for the Antigravity 2.0 Agent Desktop App** (not a code editor theme; excludes Antigravity IDE, VS Code, and all other editors).

Engineered with perceptual color science (`OKLCH`), strict accessibility baselines (`APCA` + `WCAG 2.1`), and deterministic Design Token compilation, it delivers a cohesive visual language across every Antigravity Agent surface—including the **Left-hand Sidebar**, **Chat Canvas** (messages, thinking blocks, tool cards, `/` slash commands, `@` mentions), and the **Auxiliary Pane** (**Subagents**, **Background Tasks**, **Artifacts**, **Files Changed Diffs**, **Terminals**, and **Browser Pane**)—while staying aligned with Antigravity's host CSS variable protocol (`--color-*`).

## Project Status

- **Current Phase**: Phase 1–2 Implemented (`v0.1.0`) — OKLCH Token Compiler, Option A Matte Glass Theme Pack (`dist/`), Interactive 3-Pane Preview Workbench (`preview/`), Automated QA Gates & CI/CD Active
- **Target Software**: Antigravity 2.0 Agent Desktop App Only (Excludes code editors such as Antigravity IDE / VS Code)
- **Target Release**: `v1.0.0` (Core Dual Variants: `Antigravity Dark` + `Antigravity Light`)
- **Distribution**: GitHub Releases (Versioned Theme Pack: JSON + CSS Variables) & npm (`@django9944/antigravity-theme`)
- **License**: [MIT License](./LICENSE) ([Compliance Details](./docs/en/07-governance-roadmap.md#2-licensing--legal-compliance-mit))

## Key Highlights

- **Frosted Glass Material System**: Layered glassmorphism (`backdrop-filter` blur/saturation, directional `1px` specular edge highlights, and worst-case wallpaper contrast guards) paired with automatic `@media (prefers-reduced-transparency: reduce)` opaque fallbacks.
- **Agent-First Surface Hierarchy**: Purpose-built visual grammar for multi-agent orchestration—differentiating user prompts, agent prose, collapsed thinking traces, tool execution states, permission approvals, subagent trees, and rich Artifacts (Markdown, Alerts, Mermaid, KaTeX, Carousels).
- **Perceptual Design Token Pipeline**: Single source of truth authored in TypeScript using the `OKLCH` color space, compiling deterministically into Antigravity Theme JSON, standard CSS Custom Properties (`--color-background-*`, `--color-text-*`, `--color-border-*`, `--color-ring-*`), and embedded code-block highlight palettes.
- **Verified Accessibility**: Automated `APCA` (Lc thresholds) and `WCAG 2.1` (AA/AAA) unit gates covering solid surfaces, translucent diff washes, status badges, and 16-color agent terminal output.
- **Official & Safe Delivery Model**: Strictly adheres to Antigravity 2.0 appearance settings, configuration schemas, and official theme import standards—zero binary patching or Electron tampering.
- **Automated QA & Upstream Sync**: Dist-backed APCA/WCAG contrast gates, DTCG/CSS schema checks, Shiki code-fence token snapshots, interactive `pnpm preview` workbench (Playwright pixel-diff CI planned for `v1.0.0`), weekly monitoring of Antigravity App release notes (`antigravity.google/docs/changelog.md`), and Changesets-driven releases.

## Documentation Map

All 0-to-1 specifications are maintained in strictly mirrored bilingual trees under [`docs/`](./docs/README.md):

| No. | Document | English | 简体中文 |
| :---: | :--- | :--- | :--- |
| 01 | **Project Charter** — Vision, Agent-first positioning, competitive analysis, KPIs & risks | [en/01-project-charter.md](./docs/en/01-project-charter.md) | [zh-CN/01-project-charter.md](./docs/zh-CN/01-project-charter.md) |
| 02 | **PRD & Requirements** — Personas, Agent UI surfaces, FR/NFR & code-fence coverage | [en/02-prd-requirements.md](./docs/en/02-prd-requirements.md) | [zh-CN/02-prd-requirements.md](./docs/zh-CN/02-prd-requirements.md) |
| 03 | **Visual Design System** — OKLCH/APCA baselines, 3-tier tokens & 3 candidate palettes | [en/03-visual-design-system.md](./docs/en/03-visual-design-system.md) | [zh-CN/03-visual-design-system.md](./docs/zh-CN/03-visual-design-system.md) |
| 04 | **Technical Architecture** — OKLCH compiler, Theme Pack schema, CSS bridge & ADRs | [en/04-technical-architecture.md](./docs/en/04-technical-architecture.md) | [zh-CN/04-technical-architecture.md](./docs/zh-CN/04-technical-architecture.md) |
| 05 | **QA & Testing Plan** — Contrast matrix, UI harness visual regression & App checklist | [en/05-qa-testing-plan.md](./docs/en/05-qa-testing-plan.md) | [zh-CN/05-qa-testing-plan.md](./docs/zh-CN/05-qa-testing-plan.md) |
| 06 | **Release & Maintenance Runbook** — CI/CD, GitHub/npm releases & Antigravity App sync | [en/06-release-maintenance-runbook.md](./docs/en/06-release-maintenance-runbook.md) | [zh-CN/06-release-maintenance-runbook.md](./docs/zh-CN/06-release-maintenance-runbook.md) |
| 07 | **Governance & Roadmap** — MIT license, contributing SOP, triage & v2 roadmap | [en/07-governance-roadmap.md](./docs/en/07-governance-roadmap.md) | [zh-CN/07-governance-roadmap.md](./docs/zh-CN/07-governance-roadmap.md) |

## Quick Start & Next Milestone

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm preview   # Launch interactive 3-pane preview at http://127.0.0.1:4173/preview/
```

1. **Live Visual Review**: Run `pnpm preview` to inspect `Antigravity Dark` and `Antigravity Light` across stress wallpapers (`#FFFFFF` / `#000000`) and reduced-transparency fallback mode.
2. **Next Milestone (`v1.0.0`)**: Complete live Antigravity 2.0 Desktop App visual sign-off checklist ([05 QA Plan](./docs/en/05-qa-testing-plan.md#5-layer-4-live-antigravity-20-visual-sign-off-checklist)) and cut the first public release.

## License

Copyright (c) 2026 Antigravity Theme Contributors. Licensed under the **MIT License**.
