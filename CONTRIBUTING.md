# Contributing to Antigravity Theme

Thank you for helping improve **Antigravity Theme**—an open-source **High-Opacity Matte Glass** (`OKLCH`) theme pack (`Antigravity Dark` & `Antigravity Light`) built **exclusively for the Antigravity 2.0 Agent Desktop App**.

## Quick Development Setup

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm preview
```

## Contribution Rules

1. **Scope**: Exclusively targets the **Antigravity 2.0 Agent Desktop App** (no code editor ports such as Antigravity IDE or VS Code, and zero Electron binary patching).
2. **Single Source of Truth**: Never hand-edit files inside `dist/`. Modify palettes or adapters in `src/` and re-run `pnpm build && pnpm test`.
3. **Accessibility Gates**: All color changes must pass `APCA` and `WCAG 2.1` checks (including worst-case `#ffffff` / `#000000` glass compositing) and `@media (prefers-reduced-transparency: reduce)` fallback verification.
4. **Release & README Sync**: Add a Changeset (`pnpm changeset`) for user-facing changes. Version bumps (`pnpm ci:version`) automatically synchronize iteration notes into `CHANGELOG.md`, `README.md`, and `README.zh-CN.md`.
5. **License**: Contributions are licensed under the [MIT License](./LICENSE).
