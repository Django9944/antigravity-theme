# Antigravity Theme Vision & Scope Guardrails

> This document defines the long-term product direction, engineering priorities, and explicit "What We Will Not Merge" scope boundaries for **Antigravity Theme** (`@django9944/antigravity-theme`) to keep the core pipeline deterministic, accessible, and maintainable.

## Core Mission

**Antigravity Theme** is built to deliver a perceptual `OKLCH` Matte & Aurora Glass design token system (**7 theme families × Dark / Light = 14 variants + non-intrusive `Stock` reset**) and a **zero-resign cross-platform desktop runtime installer** exclusively for the **Antigravity 2.0 Agent Desktop App** (`macOS` & `Windows`).

## Priorities (In Order)

1. **Zero-Resign Safety & Byte-Exact Reversibility (Security & Safe Defaults)**:
   - Desktop installation (`core/asar-patcher.js`, `install.sh`, `install.ps1`) must never modify `Info.plist` or `_CodeSignature`, ensuring macOS TCC permissions (Accessibility, Screen Recording, Full Disk Access) remain intact.
   - All ASAR header mutations must recalculate per-file and 4 MB block SHA-256 integrity hashes, maintain a verified stock backup (`app.asar.stock`), verify `SHA256SUMS.txt` on self-update (`core/updater.js`), and support instant non-intrusive `Stock` switching or `--uninstall` byte-exact restoration.
2. **Quantitative Perceptual Accessibility (`OKLCH` + `APCA` / `WCAG 2.1`)**:
   - Aesthetics never override readability. Every variant across all 7 families must deterministically pass worst-case `#FFFFFF` and `#000000` glass compositing contrast gates (`APCA` `L1 >= 75`, `L2 >= 60`, `L3 >= 45` and `WCAG 2.1` thresholds) and provide opaque `@media (prefers-reduced-transparency: reduce)` fallbacks.
3. **Single-Pipeline Multi-Target Determinism (Small Core, Multi-Adapter Output)**:
   - A single TypeScript `SemanticIR` pipeline (`src/`) compiles W3C DTCG JSON (`theme.json`), CSS Custom Properties (`variables.css`), Shiki syntax themes (`code-theme.json`), Mermaid palettes (`mermaid.json`), and the desktop runtime bundle (`dist/runtime/current.{css,js}`).

## Contribution Rules of Thumb

- **One PR = One Focused Topic**: Do not bundle unrelated palette tweaks, runtime DOM hooks (`src/runtime/`), and OS installer script changes (`install.sh` / `install.ps1`) in a single pull request.
- **Source-Only Edits**: Always edit source modules in `src/` or `core/` and run `pnpm build` to emit `dist/`. Hand-edited files inside `dist/` will be rejected.
- **No Unrequested Refactor-Only or CI-Chasing PRs**: Pure formatting diffs, speculative abstractions, or unrequested rewrites without a linked issue and measurable verification evidence will not be merged.

## What We Will Not Merge (For Now)

To protect user safety, review bandwidth, and architectural clarity, the following pull requests are **out of scope** for the core repository:

- **Code Editor Ports (VS Code, Antigravity IDE, Cursor, JetBrains, Neovim)**: This project exclusively targets the **Antigravity 2.0 Agent Desktop App** (Left-hand Sidebar · Chat Canvas · Auxiliary Pane).
- **Signature-Breaking Binary Patches**: Any patcher that modifies Electron native binaries, invalidates `_CodeSignature`, or requires users to run `codesign --force --deep -s -` or disable macOS Gatekeeper.
- **Unverified Subjective Color Tweaks**: Palette changes that fail `tests/contrast.test.ts` worst-case glass compositing checks or reintroduce bright accent halos on floating popovers/menus.
- **External Runtime npm Dependencies in `core/`**: The desktop patcher (`core/asar-patcher.js`) and updater (`core/updater.js`) must remain zero-dependency Node.js scripts so standalone release ZIPs execute cleanly on end-user machines.
- **Unmaintained Machine-Translated Long Docs**: User-facing documentation is maintained strictly in synchronized English ([README.md](README.md)) and Simplified Chinese ([README.zh-CN.md](README.zh-CN.md)).

> *Note: These guardrails keep the project reliable as the upstream Antigravity Desktop App evolves. If a new host capability requires revisiting a boundary, open a [Variant or Surface RFC](https://github.com/Django9944/antigravity-theme/issues/new?template=variant-rfc.yml) or start a [GitHub Discussion](https://github.com/Django9944/antigravity-theme/discussions) first.*
