# Security Policy

## Supported Versions

Security updates and upstream Antigravity host compatibility patches are provided for the **latest published release series** on `main`. Please update via `./install.sh --update` (macOS), `install.ps1 -Update` (Windows), or npm before reporting an issue that may already be resolved.

| Version | Supported |
| :--- | :---: |
| `0.2.x` (`main`) | ✅ |
| `<= 0.1.x` | ❌ |

## Security Model & Trust Boundaries

**Antigravity Theme** (`@django9944/antigravity-theme`) operates across two strictly isolated delivery layers:

### 1. Declarative Design Token & Theme Packs (`dist/<variant>/`)
- **Static Artifacts Only**: All 14 variant directories under `dist/<variant>/` contain strictly static `.json` (W3C DTCG tokens, Shiki syntax themes, Mermaid configs) and `.css` (CSS Custom Properties) files.
- **Automated Purity Enforcement**: CI gates (`tests/schema.test.ts` and `scripts/pack-release.ts`) reject any symlinks, hidden dotfiles, or unexpected file extensions inside `dist/` and staged release archives.

### 2. Zero-Resign Desktop Runtime & ASAR Installer (`dist/runtime/` + `core/` + `install.*`)
- **Zero Code-Signature Tampering**: `core/asar-patcher.js` (`Hook v2`) patches only the local Electron `app.asar` JSON header and deploys `dist/runtime/current.{css,js}` while recalculating per-file and 4 MB block SHA-256 integrity hashes. `Info.plist` and `_CodeSignature` are never modified, preserving macOS TCC permissions without ad-hoc re-signing.
- **Byte-Exact Stock Backup & Rollback**: Before applying any hook, the patcher verifies and preserves an uninjected stock backup (`app.asar.stock`). Running `./install.sh --uninstall` or `install.ps1 -Uninstall` restores the host `app.asar` byte-for-byte.
- **Cryptographically Verified Self-Updates**: `core/updater.js` downloads release bundles exclusively from official GitHub Releases (`Django9944/antigravity-theme`) and verifies archive SHA-256 digests against `SHA256SUMS.txt` prior to extraction or hot-swap.
- **Zero Telemetry & Untrusted Input Validation**: All processing runs locally. Host ASAR headers, environment variables, and CLI arguments are treated as untrusted data and validated at the boundary. No telemetry, credentials, or user workspace data are ever collected or transmitted.

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in the ASAR patcher (`core/asar-patcher.js`), self-updater (`core/updater.js`), installer scripts (`install.sh` / `install.ps1`), local preview server (`scripts/serve-preview.ts`), or CI/CD workflows, report it privately via:

- **GitHub Security Advisories**: https://github.com/Django9944/antigravity-theme/security/advisories/new
- **Security Contact Email**: `angusyoung9944@gmail.com`

Please include:
1. Affected version (`package.json` / `manifest.json`), OS (`macOS` / `Windows`), and Antigravity host app version (`./install.sh --doctor` output).
2. Minimal steps or proof-of-concept to reproduce the issue.
3. Concrete security impact and any suggested mitigation.

**Response SLA**: Maintainers will acknowledge reports within **48 hours** and provide a remediation timeline or patched release within **7 days**.
