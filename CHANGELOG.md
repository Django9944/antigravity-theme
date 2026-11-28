# Changelog

## 0.2.2

### Patch Changes

- Automated patch release: fix(runtime): increase confirmation modal opacity and backdrop blur (`b9ad054`)

All notable changes to `@django9944/antigravity-theme` will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/) and is managed with [Changesets](https://github.com/changesets/changesets).

## 0.2.1

### Patch Changes

- **Desktop Runtime Polish & Performance**: Switched floating popups to pure-black shadows with theme-tinted frosted glass, unblocked overview panel and popup exit transitions, offloaded collapse blur, deduplicated the Hook v2 ASAR engine, and hardened installers.
- **Adaptive SVG Hero Previews & Governance Docs**: Added light/dark adaptive SVG hero previews (`preview/hero-{dark,light}.svg`), localized zh-CN release history sync, and aligned standalone repository governance docs.
- **Antigravity `2.35.2` Verification & Automated Release Pipeline**: Verified `app.asar` Hook v2 compatibility against Antigravity `2.35.2`, synced `verifiedHostVersion` & `.upstream-baseline.json`, and automated host-version PRs, upstream baseline sync PRs, and patch releases (`v0.2.x`).

## 0.2.0

### Minor Changes

- **7 Theme Families × Dark / Light (14 OKLCH Variants) + Stock Reset**: Expanded flagship `Orbital` (`antigravity-dark`, `antigravity-light`) with six celestial OKLCH families (`prism`, `zenith`, `lagoon`, `solar`, `nova`, `nebula` × Dark/Light), all passing APCA & WCAG 2.1 contrast gates plus non-intrusive `stock` restore.
- **Modular Semantic Desktop Runtime (`dist/runtime/current.{css,js}`)**: Added a SemanticIR-compiled desktop runtime featuring Aurora multi-layer mesh glass, floating top-right ghost switcher, dual media capsules, xterm ANSI bridge, and modal chrome polish.
- **Zero-Resign Cross-Platform ASAR Installer, Auto-Heal & Self-Updater**: Added `core/asar-patcher.js`, `core/updater.js`, macOS (`install.sh`, `*.command`, LaunchAgent auto-heal), and Windows (`install.ps1`, `*.bat`, Scheduled Task auto-heal) with SHA-256 integrity verification and byte-exact stock restore.
- **Upgraded 3-Pane Preview Workbench & 3-Archive Release Pipeline**: Added 7-family selector, Aurora mesh stage backdrop, and simulated ghost switcher to `preview/`; updated `pack-release.ts` to emit standard, `-macos.zip`, and `-windows.zip` with unified `SHA256SUMS.txt` plus daily `antigravity-watch.yml` CI monitoring.

## 0.1.0

### Minor Changes

- Initial OKLCH Design Token compiler and deterministic multi-format adapters (`theme.json`, `variables.css`, `code-theme.json`, `mermaid.json`).
- Option A (`ADR-006`) High-Opacity Matte Frosted Glass palettes: **Antigravity Dark (Orbital Slate Matte Glass)** and **Antigravity Light (Orbital Cloud Matte Glass)**.
- Interactive 3-pane Antigravity 2.0 Agent Desktop preview workbench (`preview/`).
- Automated schema, host CSS coverage, worst-case glass contrast (`APCA` + `WCAG 2.1`), L5 ring/border, DOM-stacked Diff, and Shiki Tier-1 code-fence regression test suite.
