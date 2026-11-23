<!--
Required PR title format: <type>(<optional-scope>): <concise user-facing outcome>
Allowed types: feat, fix, docs, refactor, perf, test, build, ci, chore, revert
Good: fix(runtime): use pure-black floating shadows and theme-tinted frosted glass popups
Bad: fix: css / Update files
Keep "Allow edits from maintainers" enabled on fork PRs.
-->

Closes #<!-- issue-number (or remove if N/A) -->

## What Problem This Solves

<!-- Describe the concrete user, accessibility, or desktop installer problem in 1–3 plain sentences.
Remember: Antigravity Theme exclusively targets the Antigravity 2.0 Agent Desktop App (see VISION.md). -->

## User Impact & Approach

<!-- Lead with the observable outcome across the 14 OKLCH variants, desktop runtime (current.{css,js}), or ASAR installer (core/).
For internal-only changes, state "No user-visible change." Highlight any hookVersion or manifest changes. -->

## Evidence & Validation Performed

<!-- List only commands/checks you actually ran after your final edit and their observed outcomes.
For visual/UI changes, attach Before/After screenshots from `pnpm preview` (`preview/`). -->

- [ ] Edited source tokens/adapters in `src/` or installer modules in `core/` only (never hand-edited `dist/`)
- [ ] `pnpm typecheck` — `<observed result>`
- [ ] `pnpm build` (and verified `git status --porcelain dist/ manifest.json` is clean) — `<observed result>`
- [ ] `pnpm test` (DTCG/CSS schema, APCA/WCAG contrast, Shiki snapshots) — `<observed result>`
- [ ] `pnpm test:asar` (Cross-platform ASAR patcher, updater & sandbox tests) — `<observed result>`
- [ ] Added a Changeset (`pnpm changeset`) and synchronized bilingual docs (`README.md` & `README.zh-CN.md`) if user-facing behavior changed

## Author Readiness (Human Owner Sign-Off Required)

<!-- AI agents MUST leave this section unchecked for the human owner to review and attest. -->

Human owner: <!-- @GitHub-handle -->

- [ ] I reviewed the complete final diff, understand the edge cases, and take full responsibility for this PR (including any AI-assisted work).
- [ ] I ran the relevant checks above after my final edit and recorded any remaining proof gaps honestly.
- [ ] I checked the diff for secrets, unrelated cleanup, and alignment with `VISION.md`.
