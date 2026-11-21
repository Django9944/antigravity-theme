import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitCodeFenceTheme } from './adapters/code-fence.js';
import { emitCssVariables } from './adapters/css-vars.js';
import { emitDtcgThemeJson } from './adapters/dtcg-json.js';
import { emitMermaidTheme } from './adapters/mermaid.js';
import { serializeDeterministicJson } from './core/json.js';
import { resolveSemanticIR } from './tokens/semantic.js';
import { VARIANTS } from './variants.js';

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

    const manifest = {
      name,
      version,
      license: 'MIT',
      targetSoftware: 'Antigravity 2.0 Agent Desktop App',
      material: 'high-opacity-matte-glass',
      variants: manifestVariants,
    };

    writeFileSync(resolve(STAGE_DIR, 'manifest.json'), serializeDeterministicJson(manifest), 'utf8');

    // Replace dist/ only after all variants have compiled cleanly
    rmSync(DIST_DIR, { recursive: true, force: true });
    renameSync(STAGE_DIR, DIST_DIR);
  } catch (err) {
    rmSync(STAGE_DIR, { recursive: true, force: true });
    throw err;
  }

  console.log(`Built ${VARIANTS.length} Antigravity theme variants into dist/ (v${version})`);
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
