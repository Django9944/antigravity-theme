# Contributing to Antigravity Theme

Thank you for helping improve **Antigravity Theme**—an open-source, high-opacity matte frosted glass theme pack built **exclusively for the Antigravity 2.0 Agent Desktop App**.

For complete governance rules, triage policy, and variant admission criteria, see:
- **English**: [07 Open-Source Governance, Contributing & Roadmap](./docs/en/07-governance-roadmap.md)
- **简体中文**: [07 开源治理、社区运营与路线图](./docs/zh-CN/07-governance-roadmap.md)

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
4. **Bilingual Docs**: Keep architectural or process updates synchronized across `docs/en/` and `docs/zh-CN/`.
5. **License**: Contributions are licensed under the [MIT License](./LICENSE).
