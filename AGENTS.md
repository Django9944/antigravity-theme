# AGENTS.md

> Keep this file concise (< 15,000 characters) so Coding Agents can load it whole without blowing context budgets. Every rule below encodes a concrete architectural invariant or release gate of `@django9944/antigravity-theme`.

## Product & Design Priorities

- **One owner per responsibility**:
  - Color math, `OKLCH` primitives, and `APCA`/`WCAG 2.1` contrast engines live exclusively in `src/core/` and `src/palettes/`.
  - Semantic tokens (`SemanticIR`) and variant registries live in `src/tokens/semantic.ts` and `src/variants.ts`.
  - Multi-format target emission (`theme.json`, `variables.css`, `code-theme.json`, `mermaid.json`, and `dist/runtime/current.{css,js}`) belongs in `src/adapters/` and `src/build.ts`.
  - Zero-dependency desktop ASAR injection and verified self-update engines belong in `core/asar-patcher.js` and `core/updater.js`.
- **Small core, strict scope boundary**: Purpose-built exclusively for the **Antigravity 2.0 Agent Desktop App** (`macOS` & `Windows`). Do not add code editor ports (VS Code, Antigravity IDE, Cursor) or code-signature-breaking binary patches ([VISION.md](VISION.md)).
- **Trust boundaries**: Treat host `app.asar` headers, remote GitHub Release manifests, and CLI arguments as untrusted inputs. Validate once at the boundary, verify `SHA256SUMS.txt` before applying updates, leave `Info.plist` and `_CodeSignature` untouched, and preserve byte-exact stock backups (`app.asar.stock`).

## Architecture & Code Rules

- **Unidirectional dependency flow**:
  `src/core` & `src/palettes` -> `src/tokens/semantic` & `src/variants` -> `src/adapters` & `src/runtime` -> `src/build.ts` -> `dist/` & `core/`.
  Never import outer layers (`src/adapters`, `src/runtime`, `scripts/`) from inner token or color modules.
- **Zero runtime npm dependencies in `core/`**: `core/asar-patcher.js` and `core/updater.js` must rely strictly on Node.js built-in modules (`node:fs`, `node:crypto`, `node:path`, etc.) so standalone macOS/Windows release ZIPs run without `node_modules`.
- **Never hand-edit generated artifacts**: Files under `dist/` (`dist/<variant>/*`, `dist/runtime/current.{css,js}`, `dist/manifest.json`) are deterministic build outputs. Edit source contracts in `src/` and regenerate via `pnpm build`.
- **Never weaken contrast or schema gates**: Do not bypass type, schema, or accessibility checks with `@ts-nocheck`, `any` casts, or lowered `APCA` (`L1 >= 75`, `L2 >= 60`, `L3 >= 45`) / `WCAG 2.1` thresholds in `tests/contrast.test.ts` and `tests/schema.test.ts`.
- **Preserve packaging & README sync contracts**:
  - `scripts/pack-release.ts` enforces strict file allowlists (`ALLOWLIST_ROOT_FILES`, `MACOS_DESKTOP_FILES`, `WINDOWS_DESKTOP_FILES`) and extension checks on `dist/`.
  - `scripts/sync-release-readme.ts` requires `<!-- RELEASE_HISTORY:START -->` / `<!-- RELEASE_HISTORY:END -->` and the `- **Current Version**: \`vX.Y.Z\`` / `- **当前版本**：\`vX.Y.Z\`` lines in [README.md](README.md) and [README.zh-CN.md](README.zh-CN.md).

## Verification & Toolchain Commands

Run these commands (Node.js >= 20, `pnpm@10.34.9`) after your final edit:

- Install dependencies: `pnpm install --frozen-lockfile`
- Fast check (typecheck): `pnpm typecheck`
- Build deterministic theme pack & desktop runtime: `pnpm build`
- Full unit, schema, APCA/WCAG contrast & Shiki snapshot suite: `pnpm test`
- Cross-platform zero-dependency ASAR & installer sandbox suite: `pnpm test:asar`
- Verify README release history sync & 3-archive release packager: `pnpm sync:readme && pnpm pack:release`

### Verification Policy

1. Reproduce defects end-to-end before editing when feasible; confirm the test fails before the fix and passes after.
2. Never claim a command passed if you did not run it after your final edit. Also assert `git status --porcelain dist/ manifest.json` is clean after `pnpm build`.
3. For visual palette or desktop runtime CSS/JS changes, verify in `pnpm preview` (`preview/`) across Dark/Light families, `Stock` reset, `#FFFFFF`/`#000000` worst-case backdrops, and `Reduced Transparency` mode, and capture before/after screenshots.

## Pull Request & Human Accountability

- Follow Conventional Commits for PR titles: `feat|fix|docs|refactor|perf|test|build|ci|chore|revert(scope): concise outcome` (enforced by `.github/workflows/pr-title.yml`).
- **Human ownership is mandatory**: AI agents must NEVER check or attest to human review/readiness checkboxes (`Author Readiness`) in PR descriptions on behalf of the human owner.
- Keep commits/PRs focused on one topic; never commit credentials, local scratch plans, or `release/` staging artifacts.
- **Language & localization**: Keep code identifiers, commit messages, PR titles, and engineering governance files in English. Keep user-facing documentation synchronized across [README.md](README.md) (English) and [README.zh-CN.md](README.zh-CN.md) (Simplified Chinese).

## Scoped Guides

- Contribution workflow & PR limits: [CONTRIBUTING.md](CONTRIBUTING.md)
- Product scope & won't-merge list: [VISION.md](VISION.md)
- Security boundary & threat model: [SECURITY.md](SECURITY.md)
- Community standards: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Third-party attributions: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
