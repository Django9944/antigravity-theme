# Antigravity Theme

> **English** | [简体中文](./README.zh-CN.md)

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

## Key Highlights

- **High-Opacity Matte Glass System**: Layered glassmorphism (`backdrop-filter` blur/saturation, directional `1px` specular edge highlights, and worst-case wallpaper contrast guards) paired with automatic `@media (prefers-reduced-transparency: reduce)` opaque fallbacks.
- **Agent-First Surface Hierarchy**: Purpose-built visual grammar for multi-agent orchestration—differentiating user prompts, agent prose, collapsed thinking traces, tool execution states, permission approvals, subagent trees, and rich Artifacts.
- **Perceptual Design Token Pipeline**: Single source of truth authored in TypeScript (`OKLCH`), compiling deterministically into W3C DTCG Theme JSON, standard CSS Custom Properties (`--color-background-*`, `--color-text-*`, `--color-border-*`, `--color-ring-*`, `--agy-*`), Shiki code-block themes, and Mermaid palettes.
- **Verified Accessibility**: Automated `APCA` (`Lc` thresholds) and `WCAG 2.1` (AA/AAA) unit gates covering solid surfaces, translucent diff washes, status badges, and 16-color agent terminal output.
- **Official & Safe Delivery Model**: Strictly adheres to Antigravity 2.0 appearance settings, configuration schemas, and official theme import standards—zero binary patching or Electron tampering.
- **Automated QA & Upstream Sync**: Dist-backed APCA/WCAG contrast gates, DTCG/CSS schema checks, Shiki code-fence token snapshots, interactive `pnpm preview` workbench, weekly monitoring of Antigravity App release notes (`antigravity.google/docs/changelog.md`), and Changesets-driven releases.

## Project Status

- **Current Version**: `v0.1.0` (Phase 1–2 Implemented — OKLCH Token Compiler, High-Opacity Matte Glass Theme Pack, 3-Pane Preview Workbench, Automated QA Gates & CI/CD)
- **Next Milestone**: `v1.0.0` — Live Antigravity 2.0 Desktop App visual sign-off ([05 QA Plan](./docs/en/05-qa-testing-plan.md#5-layer-4-live-antigravity-20-visual-sign-off-checklist)) & Playwright pixel-diff CI
- **Distribution**: GitHub Releases (Theme Pack ZIP + `SHA256SUMS.txt`) & npm (`@django9944/antigravity-theme`)
- **License**: [MIT License](./LICENSE) ([Compliance Details](./docs/en/07-governance-roadmap.md#2-licensing--legal-compliance-mit))

## Quick Start & Live Preview

```bash
pnpm install
pnpm typecheck
pnpm build     # Compile deterministic theme artifacts into dist/
pnpm test      # Run DTCG/CSS schema, APCA/WCAG contrast & Shiki snapshot gates
pnpm preview   # Launch interactive 3-pane preview at http://127.0.0.1:4173/preview/
```

Run `pnpm preview` to inspect `Antigravity Dark` and `Antigravity Light` live across stress wallpapers (`#FFFFFF` / `#000000`) and reduced-transparency fallback mode.

## Documentation Map

All 0-to-1 specifications are maintained in strictly mirrored bilingual trees under [`docs/`](./docs/README.md):

| No. | Document | English | 简体中文 |
| :---: | :--- | :--- | :--- |
| 01 | **Project Charter** — Vision, Agent-first positioning, competitive analysis, KPIs & risks | [en/01-project-charter.md](./docs/en/01-project-charter.md) | [zh-CN/01-project-charter.md](./docs/zh-CN/01-project-charter.md) |
| 02 | **PRD & Requirements** — Personas, Agent UI surfaces, FR/NFR & code-fence coverage | [en/02-prd-requirements.md](./docs/en/02-prd-requirements.md) | [zh-CN/02-prd-requirements.md](./docs/zh-CN/02-prd-requirements.md) |
| 03 | **Visual Design System** — OKLCH/APCA baselines, 3-tier tokens & candidate palettes | [en/03-visual-design-system.md](./docs/en/03-visual-design-system.md) | [zh-CN/03-visual-design-system.md](./docs/zh-CN/03-visual-design-system.md) |
| 04 | **Technical Architecture** — OKLCH compiler, Theme Pack schema, CSS bridge & ADRs | [en/04-technical-architecture.md](./docs/en/04-technical-architecture.md) | [zh-CN/04-technical-architecture.md](./docs/zh-CN/04-technical-architecture.md) |
| 05 | **QA & Testing Plan** — Contrast matrix, UI harness visual regression & App checklist | [en/05-qa-testing-plan.md](./docs/en/05-qa-testing-plan.md) | [zh-CN/05-qa-testing-plan.md](./docs/zh-CN/05-qa-testing-plan.md) |
| 06 | **Release & Maintenance Runbook** — CI/CD, GitHub/npm releases & Antigravity App sync | [en/06-release-maintenance-runbook.md](./docs/en/06-release-maintenance-runbook.md) | [zh-CN/06-release-maintenance-runbook.md](./docs/zh-CN/06-release-maintenance-runbook.md) |
| 07 | **Governance & Roadmap** — MIT license, contributing SOP, triage & v2 roadmap | [en/07-governance-roadmap.md](./docs/en/07-governance-roadmap.md) | [zh-CN/07-governance-roadmap.md](./docs/zh-CN/07-governance-roadmap.md) |

## License

Copyright (c) 2026 Antigravity Theme Contributors. Licensed under the **MIT License**.
