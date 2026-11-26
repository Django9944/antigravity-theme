import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitCodeFenceTheme } from './adapters/code-fence.js';
import { emitCssVariables } from './adapters/css-vars.js';
import { emitDtcgThemeJson } from './adapters/dtcg-json.js';
import { emitMermaidTheme } from './adapters/mermaid.js';
import { emitDesktopRuntimeBundle } from './adapters/runtime-bundle.js';
import { serializeDeterministicJson } from './core/json.js';
import type { SemanticIR } from './core/types.js';
import { resolveSemanticIR } from './tokens/semantic.js';
import { THEME_FAMILIES, VARIANTS } from './variants.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');
const STAGE_DIR = resolve(ROOT_DIR, '.dist-staging');

function readPackageMeta(): { name: string; version: string } {
  const pkgRaw = readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw) as { name?: unknown; version?: unknown };
  if (typeof pkg.name !== 'string' || pkg.name.trim().length === 0 || /\s/.test(pkg.name)) {
    throw new Error(`Invalid package.json name: ${String(pkg.name)}`);
  }
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/.test(pkg.version)) {
    throw new Error(`Invalid package.json version: ${String(pkg.version)}`);
  }
  return { name: pkg.name, version: pkg.version };
}

export function buildAllThemes(): void {
  const { name, version } = readPackageMeta();
  const seenIds = new Set<string>();

  rmSync(STAGE_DIR, { recursive: true, force: true });
  mkdirSync(STAGE_DIR, { recursive: true });

  const manifestVariants: Array<Record<string, unknown>> = [];
  const compiledIrs: SemanticIR[] = [];

  try {
    for (const variant of VARIANTS) {
      if (!/^[a-z0-9-]+$/.test(variant.id)) {
        throw new Error(`Unsafe variant id "${variant.id}"; expected /^[a-z0-9-]+$/`);
      }
      if (seenIds.has(variant.id)) {
        throw new Error(`Duplicate variant id "${variant.id}" in src/variants.ts`);
      }
      seenIds.add(variant.id);

      const ir = resolveSemanticIR(variant, version);
      compiledIrs.push(ir);
      const variantDir = resolve(STAGE_DIR, variant.id);
      mkdirSync(variantDir, { recursive: true });

      const dtcgDoc = emitDtcgThemeJson(ir);
      const cssDoc = emitCssVariables(ir, name);
      const codeThemeDoc = emitCodeFenceTheme(ir);
      const mermaidDoc = emitMermaidTheme(ir);

      writeFileSync(resolve(variantDir, 'theme.json'), serializeDeterministicJson(dtcgDoc), 'utf8');
      writeFileSync(resolve(variantDir, 'variables.css'), cssDoc, 'utf8');
      writeFileSync(
        resolve(variantDir, 'code-theme.json'),
        serializeDeterministicJson(codeThemeDoc),
        'utf8',
      );
      writeFileSync(
        resolve(variantDir, 'mermaid.json'),
        serializeDeterministicJson(mermaidDoc),
        'utf8',
      );

      manifestVariants.push({
        id: variant.id,
        family: variant.family,
        familyName: variant.familyName,
        displayName: variant.displayName,
        description: variant.description,
        mode: variant.mode,
        files: {
          theme: `./${variant.id}/theme.json`,
          cssVariables: `./${variant.id}/variables.css`,
          codeTheme: `./${variant.id}/code-theme.json`,
          mermaid: `./${variant.id}/mermaid.json`,
        },
      });
    }

    const runtimeDir = resolve(STAGE_DIR, 'runtime');
    mkdirSync(runtimeDir, { recursive: true });
    const runtimeBundle = emitDesktopRuntimeBundle(compiledIrs, version);
    writeFileSync(resolve(runtimeDir, 'current.css'), runtimeBundle.currentCss, 'utf8');
    writeFileSync(resolve(runtimeDir, 'current.js'), runtimeBundle.currentJs, 'utf8');

    const manifest = {
      name,
      version,
      license: 'MIT',
      targetSoftware: 'Antigravity 2.0 Agent Desktop App',
      material: 'high-opacity-matte-glass',
      runtime: {
        css: './runtime/current.css',
        js: './runtime/current.js',
      },
      families: THEME_FAMILIES.map((f) => ({
        id: f.family,
        name: f.familyName,
        nameZhDark: f.nameZhDark,
        nameZhLight: f.nameZhLight,
        darkId: f.darkId,
        lightId: f.lightId,
      })),
      variants: manifestVariants,
    };

    writeFileSync(resolve(STAGE_DIR, 'manifest.json'), serializeDeterministicJson(manifest), 'utf8');

    // Sync root desktop installer manifest.json with package version
    const rootManifestPath = resolve(ROOT_DIR, 'manifest.json');
    let existingVerifiedHostVersion = '2.35.2';
    if (existsSync(rootManifestPath)) {
      try {
        const prev = JSON.parse(readFileSync(rootManifestPath, 'utf8')) as {
          verifiedHostVersion?: unknown;
        };
        if (typeof prev.verifiedHostVersion === 'string' && prev.verifiedHostVersion.trim()) {
          existingVerifiedHostVersion = prev.verifiedHostVersion.trim();
        }
      } catch {
        // Fallback to default verified host version
      }
    }
    const rootDesktopManifest = {
      name: 'antigravity-theme',
      version: `v${version}`,
      repo: 'Django9944/antigravity-theme',
      hostUpdaterUrl: 'https://antigravity-hub-auto-updater-974169037036.us-central1.run.app/manifest',
      verifiedHostVersion: existingVerifiedHostVersion,
      hookVersion: 'v2',
      hookStartMarker: '/* === Antigravity Custom Theme Hook v2 === */',
      hookEndMarker: '/* === End Antigravity Custom Theme Hook === */',
      legacyMarker: 'custom-theme injection hook',
      anchors: [
        'void loadHubWindowUrl(win, url, { skipBootstrapMint });',
        'void win.loadURL(url);',
      ],
      anchorFallbackRegex:
        'void\\s+(?:loadHubWindowUrl\\s*\\(\\s*win\\s*,[^;]*|win\\.loadURL\\s*\\([^;]*)\\)\\s*;',
      payloadDir: 'dist/runtime',
      payloads: ['current.css', 'current.js'],
    };
    writeFileSync(rootManifestPath, serializeDeterministicJson(rootDesktopManifest), 'utf8');

    // Replace dist/ only after all variants have compiled cleanly
    rmSync(DIST_DIR, { recursive: true, force: true });
    renameSync(STAGE_DIR, DIST_DIR);
  } catch (err) {
    rmSync(STAGE_DIR, { recursive: true, force: true });
    throw err;
  }

  console.log(
    `Built ${VARIANTS.length} Antigravity theme variants + desktop runtime into dist/ (v${version})`,
  );
}

function isExecutedDirectly(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isExecutedDirectly()) {
  buildAllThemes();
}
