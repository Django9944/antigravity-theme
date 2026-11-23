# Third-Party Notices

**Antigravity Theme** (`@django9944/antigravity-theme`) is licensed under the [MIT License](LICENSE).

## Runtime & Desktop Installer (`dist/` & `core/`)

The compiled theme packs (`dist/<variant>/`), desktop runtime bundle (`dist/runtime/current.css`, `dist/runtime/current.js`), and cross-platform ASAR installer / self-updater (`core/asar-patcher.js`, `core/updater.js`) have **zero third-party runtime npm dependencies** and rely solely on standard Web APIs and Node.js built-in modules.

## Development, Build & Verification Toolchain (`devDependencies`)

The TypeScript token compiler (`src/`) and automated verification suite (`tests/`) build upon the following open-source packages:

| Package | Purpose | License |
| :--- | :--- | :--- |
| [`culori`](https://github.com/Evercoder/culori) | Perceptual `OKLCH` to `sRGB` color space conversion & gamut clamping | MIT |
| [`apca-w3`](https://github.com/Myndex/apca-w3) | Accessible Perceptual Contrast Algorithm (`APCA-W3`) contrast calculation | W3C / BSD-3-Clause |
| [`shiki`](https://github.com/shikijs/shiki) | Syntax highlighting token verification & visual regression testing | MIT |
| [`ajv`](https://github.com/ajv-validator/ajv) | JSON Schema validation for W3C DTCG `theme.json` and `manifest.json` | MIT |
| [`happy-dom`](https://github.com/capricorn86/happy-dom) | Headless DOM environment for desktop runtime engine unit tests | MIT |
| [`vitest`](https://github.com/vitest-dev/vitest) | Unit, contrast, schema, and snapshot test runner | MIT |
| [`typescript`](https://github.com/microsoft/TypeScript) & [`tsx`](https://github.com/privatenumber/tsx) | Type checking and TypeScript execution pipeline | Apache-2.0 / MIT |
| [`@changesets/cli`](https://github.com/changesets/changesets) | Semantic versioning and changelog management | MIT |
