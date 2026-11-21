import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { VARIANTS } from '../src/variants.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');

const PKG_JSON = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf8')) as {
  version: string;
  exports: Record<string, string>;
};

const EXPECTED_HOST_VARS = [
  '--color-background-danger',
  '--color-background-disabled',
  '--color-background-info',
  '--color-background-inverse',
  '--color-background-primary',
  '--color-background-secondary',
  '--color-background-success',
  '--color-background-tertiary',
  '--color-background-warning',
  '--color-border-danger',
  '--color-border-info',
  '--color-border-inverse',
  '--color-border-primary',
  '--color-border-secondary',
  '--color-border-success',
  '--color-border-warning',
  '--color-ring-danger',
  '--color-ring-info',
  '--color-ring-primary',
  '--color-ring-success',
  '--color-ring-warning',
  '--color-text-danger',
  '--color-text-disabled',
  '--color-text-info',
  '--color-text-inverse',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-success',
  '--color-text-tertiary',
  '--color-text-warning',
  '--font-mono',
  '--font-sans',
] as const;

const EXPECTED_GLASS_VARS = [
  '--agy-glass-backdrop-canvas',
  '--agy-glass-backdrop-popover',
  '--agy-glass-backdrop-shell',
  '--agy-glass-bg-canvas',
  '--agy-glass-bg-card',
  '--agy-glass-bg-popover',
  '--agy-glass-bg-shell',
  '--agy-glass-blur-lg',
  '--agy-glass-blur-md',
  '--agy-glass-blur-shell',
  '--agy-glass-blur-sm',
  '--agy-glass-rim-border',
  '--agy-glass-rim-top',
  '--agy-glass-saturate-canvas',
  '--agy-glass-saturate-popover',
  '--agy-glass-saturate-shell',
  '--agy-glass-shadow-card',
  '--agy-glass-shadow-popover',
] as const;

const EXPECTED_REDUCED_TRANSPARENCY_VARS = [
  '--agy-glass-backdrop-canvas',
  '--agy-glass-backdrop-popover',
  '--agy-glass-backdrop-shell',
  '--agy-glass-bg-canvas',
  '--agy-glass-bg-card',
  '--agy-glass-bg-popover',
  '--agy-glass-bg-shell',
  '--agy-glass-blur-lg',
  '--agy-glass-blur-md',
  '--agy-glass-blur-shell',
  '--agy-glass-blur-sm',
  '--agy-glass-saturate-canvas',
  '--agy-glass-saturate-popover',
  '--agy-glass-saturate-shell',
] as const;

const EXPECTED_AGENT_PREFIXES = [
  '--agy-alert-',
  '--agy-approval-',
  '--agy-approve-btn-',
  '--agy-blockquote-',
  '--agy-border-strong',
  '--agy-carousel-control-',
  '--agy-code-',
  '--agy-diff-',
  '--agy-done-accent',
  '--agy-error-accent',
  '--agy-fg-',
  '--agy-inline-code-',
  '--agy-katex-fg',
  '--agy-mermaid-',
  '--agy-running-accent',
  '--agy-status-',
  '--agy-subagent-',
  '--agy-surface-',
  '--agy-table-',
  '--agy-terminal-',
  '--agy-thinking-',
  '--agy-tool-card-',
  '--agy-user-bubble-',
] as const;

const EXPECTED_MERMAID_VAR_KEYS = [
  'darkMode',
  'background',
  'fontFamily',
  'primaryColor',
  'primaryTextColor',
  'primaryBorderColor',
  'secondaryColor',
  'secondaryTextColor',
  'secondaryBorderColor',
  'tertiaryColor',
  'tertiaryTextColor',
  'tertiaryBorderColor',
  'lineColor',
  'textColor',
  'mainBkg',
  'nodeBorder',
  'clusterBkg',
  'clusterBorder',
  'defaultLinkColor',
  'edgeLabelBackground',
  'actorBkg',
  'actorBorder',
  'actorTextColor',
  'signalColor',
  'signalTextColor',
  'noteBkgColor',
  'noteBorderColor',
  'noteTextColor',
] as const;

const MANIFEST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'version', 'license', 'targetSoftware', 'material', 'variants'],
  properties: {
    name: { const: '@django9944/antigravity-theme' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+([+-][0-9A-Za-z.-]+)?$' },
    license: { const: 'MIT' },
    targetSoftware: { const: 'Antigravity 2.0 Agent Desktop App' },
    material: { const: 'high-opacity-matte-glass' },
    variants: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'displayName', 'description', 'mode', 'files'],
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9-]+$' },
          displayName: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          mode: { enum: ['dark', 'light', 'hc-dark', 'hc-light'] },
          files: {
            type: 'object',
            additionalProperties: false,
            required: ['theme', 'cssVariables', 'codeTheme', 'mermaid'],
            properties: {
              theme: { type: 'string' },
              cssVariables: { type: 'string' },
              codeTheme: { type: 'string' },
              mermaid: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const DTCG_THEME_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    '$extensions',
    'surface',
    'glass',
    'fg',
    'border',
    'status',
    'agent',
    'artifact',
    'diff',
    'code',
    'terminal',
  ],
  properties: {
    $extensions: {
      type: 'object',
      required: ['com.antigravity-theme'],
      properties: {
        'com.antigravity-theme': {
          type: 'object',
          required: ['id', 'displayName', 'description', 'mode', 'version', 'targetSoftware'],
          properties: {
            id: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            mode: { enum: ['dark', 'light', 'hc-dark', 'hc-light'] },
            version: { type: 'string' },
            targetSoftware: { const: 'Antigravity 2.0 Agent Desktop App' },
          },
        },
      },
    },
    surface: { type: 'object' },
    glass: { type: 'object' },
    fg: { type: 'object' },
    border: { type: 'object' },
    status: { type: 'object' },
    agent: { type: 'object' },
    artifact: {
      type: 'object',
      required: ['alerts', 'mermaid'],
    },
    diff: { type: 'object' },
    code: { type: 'object' },
    terminal: { type: 'object' },
  },
};

function collectAllFilesSafe(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(dir, entry);
    const stat = lstatSync(full);
    expect(stat.isSymbolicLink(), `Symlink forbidden in dist/: ${full}`).toBe(false);
    if (stat.isDirectory()) {
      files.push(...collectAllFilesSafe(full));
    } else {
      expect(stat.isFile(), `Non-regular file forbidden in dist/: ${full}`).toBe(true);
      files.push(full);
    }
  }
  return files;
}

function assertDtcgTokens(node: unknown, path = 'root'): number {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    throw new Error(`Unexpected non-object DTCG node at ${path}`);
  }
  const obj = node as Record<string, unknown>;
  if ('$value' in obj) {
    const tokenType = obj['$type'];
    expect(['color', 'dimension', 'number', 'shadow'], `${path}.$type`).toContain(tokenType);
    if (tokenType === 'color') {
      expect(String(obj['$value'])).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
    } else if (tokenType === 'dimension') {
      expect(String(obj['$value'])).toMatch(/^\d+(px|rem|em)$/);
    } else if (tokenType === 'number') {
      expect(typeof obj['$value']).toBe('number');
      expect(Number.isFinite(obj['$value'])).toBe(true);
    } else if (tokenType === 'shadow') {
      const sh = obj['$value'] as Record<string, unknown>;
      expect(typeof sh).toBe('object');
      expect(String(sh['color'])).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
      expect(String(sh['offsetX'])).toMatch(/^-?\d+px$/);
      expect(String(sh['offsetY'])).toMatch(/^-?\d+px$/);
      expect(String(sh['blur'])).toMatch(/^\d+px$/);
      expect(String(sh['spread'])).toMatch(/^-?\d+px$/);
    }
    return 1;
  }
  const childKeys = Object.keys(obj).filter((k) => !k.startsWith('$'));
  expect(childKeys.length, `Empty DTCG group forbidden at ${path}`).toBeGreaterThan(0);
  let count = 0;
  for (const key of childKeys) {
    count += assertDtcgTokens(obj[key], `${path}.${key}`);
  }
  return count;
}

export function parseCssVariableBlocks(
  css: string,
  variantId: string,
): {
  baseVars: Map<string, string>;
  reducedVars: Map<string, string>;
} {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const escapedId = variantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const reducedHeaderRe = /@media\s*\(\s*prefers-reduced-transparency\s*:\s*reduce\s*\)\s*\{/;
  const reducedIdx = stripped.search(reducedHeaderRe);
  expect(reducedIdx, 'Missing @media (prefers-reduced-transparency: reduce)').toBeGreaterThan(-1);

  const baseSection = stripped.slice(0, reducedIdx);
  const reducedSection = stripped.slice(reducedIdx);

  const baseBlockMatch = new RegExp(
    `\\[data-antigravity-theme="${escapedId}"\\]\\s*\\{([^}]*)\\}`,
  ).exec(baseSection);
  expect(baseBlockMatch, `Missing base selector block for ${variantId}`).not.toBeNull();

  const reducedBlockMatch = new RegExp(
    `\\[data-antigravity-theme="${escapedId}"\\]\\s*\\{([^}]*)\\}`,
  ).exec(reducedSection);
  expect(reducedBlockMatch, `Missing reduced-transparency selector block for ${variantId}`).not.toBeNull();

  const extractVars = (blockBody: string): Map<string, string> => {
    const map = new Map<string, string>();
    const declRe = /^\s*(--[a-z0-9-]+)\s*:\s*([^;\n]+?)\s*;/gm;
    let m: RegExpExecArray | null;
    while ((m = declRe.exec(blockBody)) !== null) {
      if (m[1] && m[2]) {
        map.set(m[1], m[2]);
      }
    }
    return map;
  };

  return {
    baseVars: extractVars(baseBlockMatch![1] ?? ''),
    reducedVars: extractVars(reducedBlockMatch![1] ?? ''),
  };
}

describe('Distributable Theme Pack Schema & Purity (Layer 1)', () => {
  const ajv = new Ajv();

  it('contains strictly static .json and .css files in dist/ with zero symlinks or unexpected files', () => {
    expect(existsSync(DIST_DIR)).toBe(true);
    const files = collectAllFilesSafe(DIST_DIR).map((f) => relative(DIST_DIR, f).replace(/\\/g, '/'));
    const expected = [
      'manifest.json',
      ...VARIANTS.flatMap((v) => [
        `${v.id}/code-theme.json`,
        `${v.id}/mermaid.json`,
        `${v.id}/theme.json`,
        `${v.id}/variables.css`,
      ]),
    ].sort();
    expect(files.sort()).toEqual(expected);
    for (const file of files) {
      expect(['.json', '.css']).toContain(extname(file));
    }
  });

  it('validates dist/manifest.json and package.json#exports parity', () => {
    const manifest = JSON.parse(readFileSync(resolve(DIST_DIR, 'manifest.json'), 'utf8')) as {
      version: string;
      variants: Array<{ id: string; files: Record<string, string> }>;
    };
    const validate = ajv.compile(MANIFEST_SCHEMA);
    const valid = validate(manifest);
    expect(validate.errors).toBeNull();
    expect(valid).toBe(true);
    expect(manifest.version).toBe(PKG_JSON.version);

    const manifestIds = manifest.variants.map((v) => v.id).sort();
    const sourceIds = VARIANTS.map((v) => v.id).sort();
    expect(manifestIds).toEqual(sourceIds);

    expect(PKG_JSON.exports['./package.json']).toBe('./package.json');
    expect(PKG_JSON.exports['./manifest.json']).toBe('./dist/manifest.json');
    for (const v of manifest.variants) {
      expect(PKG_JSON.exports[`./${v.id}/*`]).toBe(`./dist/${v.id}/*`);
      for (const relPath of Object.values(v.files)) {
        expect(existsSync(resolve(DIST_DIR, relPath)), `Missing manifest file ${relPath}`).toBe(
          true,
        );
      }
    }
  });

  for (const variant of VARIANTS) {
    describe(`Variant: ${variant.displayName} (${variant.id})`, () => {
      const variantDir = resolve(DIST_DIR, variant.id);
      const isLight = variant.mode === 'light' || variant.mode === 'hc-light';

      it('passes W3C DTCG theme.json schema, metadata parity, and token type validation', () => {
        const themeJson = JSON.parse(readFileSync(resolve(variantDir, 'theme.json'), 'utf8')) as {
          $extensions: { 'com.antigravity-theme': Record<string, string> };
          artifact: { mermaid: Record<string, unknown> };
        };
        const validate = ajv.compile(DTCG_THEME_SCHEMA);
        const valid = validate(themeJson);
        expect(validate.errors).toBeNull();
        expect(valid).toBe(true);

        const meta = themeJson.$extensions['com.antigravity-theme'];
        expect(meta['id']).toBe(variant.id);
        expect(meta['mode']).toBe(variant.mode);
        expect(meta['version']).toBe(PKG_JSON.version);
        expect(Object.keys(themeJson.artifact.mermaid).length).toBe(7);

        const leafCount = assertDtcgTokens(themeJson);
        expect(leafCount).toBeGreaterThan(100);
      });

      it('contains 100% of host --color-*, glass, and --agy-* CSS variables plus opaque reduced-transparency fallbacks', () => {
        const css = readFileSync(resolve(variantDir, 'variables.css'), 'utf8');
        const { baseVars, reducedVars } = parseCssVariableBlocks(css, variant.id);

        for (const varName of [...EXPECTED_HOST_VARS, ...EXPECTED_GLASS_VARS]) {
          const val = baseVars.get(varName);
          expect(val, `Missing base CSS variable ${varName}`).toBeDefined();
          expect(val!.length).toBeGreaterThan(0);
          expect(val).not.toMatch(/\b(undefined|NaN|null)\b/i);
        }

        // Validate host color variables and glass rgba values specifically
        for (const varName of EXPECTED_HOST_VARS) {
          if (varName.startsWith('--color-')) {
            expect(baseVars.get(varName), varName).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
          }
        }
        for (const bgVar of [
          '--agy-glass-bg-shell',
          '--agy-glass-bg-canvas',
          '--agy-glass-bg-card',
          '--agy-glass-bg-popover',
        ]) {
          expect(baseVars.get(bgVar), bgVar).toMatch(/^rgba\(\d+, \d+, \d+, 0?\.\d+\)$/);
        }

        // Verify all expected --agy-* agent & code groups are populated
        const allKeys = [...baseVars.keys()];
        for (const prefix of EXPECTED_AGENT_PREFIXES) {
          expect(
            allKeys.some((k) => k.startsWith(prefix)),
            `Expected CSS variables matching ${prefix}`,
          ).toBe(true);
        }
        expect(baseVars.size).toBeGreaterThanOrEqual(125);

        // Verify reduced-transparency fallback enforces opaque 6-digit hex, 0px blur, 100% saturate, backdrop: none
        for (const varName of EXPECTED_REDUCED_TRANSPARENCY_VARS) {
          expect(reducedVars.get(varName), `Missing reduced-transparency ${varName}`).toBeDefined();
        }
        for (const bgVar of [
          '--agy-glass-bg-shell',
          '--agy-glass-bg-canvas',
          '--agy-glass-bg-card',
          '--agy-glass-bg-popover',
        ]) {
          expect(reducedVars.get(bgVar), `Reduced fallback ${bgVar} must be opaque hex`).toMatch(
            /^#[0-9a-f]{6}$/,
          );
        }
        for (const blurVar of [
          '--agy-glass-blur-sm',
          '--agy-glass-blur-md',
          '--agy-glass-blur-shell',
          '--agy-glass-blur-lg',
        ]) {
          expect(reducedVars.get(blurVar)).toBe('0px');
        }
        for (const satVar of [
          '--agy-glass-saturate-shell',
          '--agy-glass-saturate-canvas',
          '--agy-glass-saturate-popover',
        ]) {
          expect(reducedVars.get(satVar)).toBe('100%');
        }
        for (const bdVar of [
          '--agy-glass-backdrop-shell',
          '--agy-glass-backdrop-canvas',
          '--agy-glass-backdrop-popover',
        ]) {
          expect(reducedVars.get(bdVar)).toBe('none');
        }
      });

      it('emits valid Shiki code-theme.json and opaque-note mermaid.json', () => {
        const codeTheme = JSON.parse(
          readFileSync(resolve(variantDir, 'code-theme.json'), 'utf8'),
        ) as {
          name: string;
          type: string;
          fg: string;
          bg: string;
          colors: Record<string, string>;
          tokenColors: Array<{
            name: string;
            scope: string | string[];
            settings: { foreground?: string; fontStyle?: string };
          }>;
        };
        expect(codeTheme.name).toBe(variant.id);
        expect(codeTheme.type).toBe(isLight ? 'light' : 'dark');
        expect(codeTheme.fg).toMatch(/^#[0-9a-f]{6}$/);
        expect(codeTheme.bg).toMatch(/^#[0-9a-f]{6}$/);
        for (const [key, hex] of Object.entries(codeTheme.colors)) {
          expect(hex, `codeTheme.colors[${key}]`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
        }
        expect(codeTheme.tokenColors.length).toBeGreaterThan(20);
        for (const rule of codeTheme.tokenColors) {
          expect(rule.name.length).toBeGreaterThan(0);
          expect(
            typeof rule.scope === 'string' ? rule.scope.length : rule.scope.length,
          ).toBeGreaterThan(0);
          if (rule.settings.foreground !== undefined) {
            expect(rule.settings.foreground).toMatch(/^#[0-9a-f]{6}$/);
          }
        }

        const mermaid = JSON.parse(
          readFileSync(resolve(variantDir, 'mermaid.json'), 'utf8'),
        ) as Record<string, unknown> & {
          theme: string;
          themeVariables: Record<string, unknown>;
        };
        expect(mermaid.theme).toBe('base');
        expect(mermaid['darkMode']).toBeUndefined();
        expect(mermaid.themeVariables['darkMode']).toBe(!isLight);
        for (const key of EXPECTED_MERMAID_VAR_KEYS) {
          expect(mermaid.themeVariables[key], `mermaid.themeVariables.${key}`).toBeDefined();
        }
        expect(mermaid.themeVariables['noteBkgColor']).toMatch(/^#[0-9a-f]{6}$/);
        expect(mermaid.themeVariables['noteBorderColor']).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  }
});
