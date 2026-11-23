# Contributing to Antigravity Theme

Thanks for helping improve **Antigravity Theme** (`@django9944/antigravity-theme`)—an open-source **OKLCH Matte & Aurora Glass Theme System (7 Families × Dark / Light = 14 Variants + `Stock` Reset) & Zero-Resign Cross-Platform Desktop Installer** built exclusively for the **Antigravity 2.0 Agent Desktop App**.

Please review [VISION.md](VISION.md), [AGENTS.md](AGENTS.md), and our [Code of Conduct](CODE_OF_CONDUCT.md) before proposing major changes so your effort aligns with project scope and engineering invariants.

## Issue, PR & Support Routing

| Situation | Where to go | Notes |
| :--- | :--- | :--- |
| Usage question, aesthetic preference, or custom CSS override | [GitHub Discussions](https://github.com/Django9944/antigravity-theme/discussions) | Do not open a Bug Issue for general questions; [Discord @angusyoung9944](https://discord.com/users/953288159876239420) |
| Readability, contrast, runtime switcher, or ASAR installer bug | [Visual & Installer Bug Report](https://github.com/Django9944/antigravity-theme/issues/new?template=visual-bug.yml) | Include variant ID, affected Antigravity 2.0 surface, screenshot, and `--doctor` output |
| New theme family, variant, or surface enhancement proposal | [Variant or Surface RFC](https://github.com/Django9944/antigravity-theme/issues/new?template=variant-rfc.yml) | Align on OKLCH palette direction and APCA contrast targets before coding |
| Security vulnerability (ASAR patcher, updater, scripts, CI) | [SECURITY.md](SECURITY.md) | **Never** disclose security vulnerabilities in public issues |
| Ready code or documentation fix | [Pull Requests](https://github.com/Django9944/antigravity-theme/pulls) | One PR = one focused topic; link `Closes #<issue>` |

## Quick Development Setup

```bash
pnpm install
pnpm typecheck
pnpm build            # Compile 14 OKLCH variants + dist/runtime/current.{css,js}
pnpm test             # Run DTCG/CSS schema, APCA/WCAG contrast, Shiki & ASAR tests
pnpm test:asar        # Run standalone cross-platform ASAR patcher, updater & sandbox tests
pnpm preview          # Launch interactive 3-pane workbench at http://127.0.0.1:4173/preview/
```

## Contribution Boundaries & Rules

1. **Scope Alignment**: Check the "What We Will Not Merge" list in [VISION.md](VISION.md). This project exclusively targets the **Antigravity 2.0 Agent Desktop App** (code editor ports such as Antigravity IDE or VS Code are out of scope).
2. **Single Source of Truth**: Never hand-edit files inside `dist/`. Modify palettes, semantic tokens, or runtime templates in `src/` (or installer logic in `core/`) and re-run `pnpm build && pnpm test && pnpm test:asar`.
3. **Accessibility & Integrity Gates**:
   - All color changes must pass `APCA` (`L1 >= 75`, `L2 >= 60`, `L3 >= 45`) and `WCAG 2.1` checks across worst-case `#FFFFFF` / `#000000` glass compositing (`tests/contrast.test.ts`) and `@media (prefers-reduced-transparency: reduce)` opaque fallback checks (`tests/schema.test.ts`).
   - All desktop installer or `core/` changes must preserve macOS `_CodeSignature` / `Info.plist`, pass 4 MB block SHA-256 integrity checks, and pass `pnpm test:asar`.
4. **Release & Bilingual README Sync**: Add a Changeset (`pnpm changeset`) for user-facing changes. Version bumps (`pnpm ci:version` / `pnpm sync:readme`) automatically synchronize iteration history into `CHANGELOG.md`, [README.md](README.md), and [README.zh-CN.md](README.zh-CN.md).
5. **Allow Maintainer Edits**: Keep **Allow edits by maintainers** enabled on fork PRs so maintainers can assist with final verification.

## AI-Assisted Contributions (Human Ownership Policy)

AI-assisted pull requests are welcome, **provided a human takes full responsibility for the complete submission**:

1. You must personally read the final diff, understand the OKLCH token math / ASAR byte-offset implications, and explain why the change fits the codebase.
2. Provide real verification evidence (commands run after your final edit and observed output, plus before/after screenshots from `pnpm preview` for visual changes). Do not claim unrun tests or simulated outputs as passing.
3. **Human readiness sign-off**: AI agents must NOT check or attest to the **Author Readiness** section in the PR template on a human's behalf.

## Pull Request Checklist

1. **Conventional Title**: PR titles must match `<type>(<optional-scope>): <concise user-facing outcome>` (enforced by `.github/workflows/pr-title.yml`).
   - Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - Good: `fix(runtime): use pure-black floating shadows and theme-tinted frosted glass popups`
   - Bad: `Update theme` or `fix: css`
2. **Local Validation**:
   - `pnpm install --frozen-lockfile`
   - `pnpm typecheck`
   - `pnpm build` (confirm `git status --porcelain dist/ manifest.json` is clean after committing generated artifacts)
   - `pnpm test`
   - `pnpm test:asar`
   - `pnpm sync:readme && pnpm pack:release`
3. **Do not hand-edit `CHANGELOG.md`** when submitting feature/fix PRs; add a Changeset file under `.changeset/` instead.
4. **License**: Contributions are licensed under the [MIT License](LICENSE).
