# Security Policy

## Scope & Safe Delivery Boundary

**Antigravity Theme** (`@django9944/antigravity-theme`) is a purely declarative theme pack built exclusively for the **Antigravity 2.0 Agent Desktop App**:

- **Static Artifacts Only**: All compiled deliverables in `dist/` and GitHub Release bundles are strictly static `.json` (W3C DTCG tokens, Shiki code themes, Mermaid palettes) and `.css` (CSS Custom Properties) files.
- **Zero Binary Modification**: This project never executes runtime scripts inside the host application, never patches Electron binaries (`app.asar`), never tampers with code signatures, and never bypasses sandbox boundaries.
- **Automated Purity Enforcement**: CI gates (`tests/schema.test.ts` and `tests/scripts.test.ts`) reject any symlinks, hidden dotfiles, or non-`.json`/`.css` files inside `dist/` and release archives.

## Supported Versions

| Version | Supported |
| :--- | :---: |
| `0.1.x` / `main` | ✅ |

## Reporting a Vulnerability

If you discover a security issue in the build scripts, local preview server (`scripts/serve-preview.ts`), or CI/CD workflows:

1. **Private Disclosure**: Please report it via [GitHub Security Advisories](https://github.com/Django9944/antigravity-theme/security/advisories/new) rather than opening a public issue.
2. **Response SLA**: Maintainers will acknowledge reports within **48 hours** and provide a remediation timeline or patch release within **7 days**.
