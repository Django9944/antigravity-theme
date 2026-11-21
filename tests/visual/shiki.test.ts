import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter, type ThemeInput } from 'shiki';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VARIANTS } from '../../src/variants.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES_DIR = resolve(ROOT_DIR, 'tests/fixtures');

const TIER1_FIXTURES = [
  { file: 'sample.ts', lang: 'typescript' },
  { file: 'sample.tsx', lang: 'tsx' },
  { file: 'sample.py', lang: 'python' },
  { file: 'sample.go', lang: 'go' },
  { file: 'sample.rs', lang: 'rust' },
  { file: 'sample.java', lang: 'java' },
  { file: 'sample.html', lang: 'html' },
  { file: 'sample.css', lang: 'css' },
  { file: 'sample.json', lang: 'json' },
  { file: 'sample.yaml', lang: 'yaml' },
  { file: 'sample.toml', lang: 'toml' },
  { file: 'sample.md', lang: 'markdown' },
  { file: 'sample.sh', lang: 'bash' },
  { file: 'sample.diff', lang: 'diff' },
] as const;

const THEME_IDS = VARIANTS.map((v) => v.id);

describe('Shiki Tier-1 Embedded Code-Fence Visual Regression (Layer 3)', () => {
  let highlighter: Awaited<ReturnType<typeof createHighlighter>>;

  beforeAll(async () => {
    const themes = THEME_IDS.map(
      (id) =>
        JSON.parse(
          readFileSync(resolve(ROOT_DIR, 'dist', id, 'code-theme.json'), 'utf8'),
        ) as ThemeInput,
    );
    highlighter = await createHighlighter({
      themes,
      langs: TIER1_FIXTURES.map((f) => f.lang),
    });
  });

  afterAll(() => {
    highlighter?.dispose();
  });

  for (const themeId of THEME_IDS) {
    describe(`Theme: ${themeId}`, () => {
      for (const { file, lang } of TIER1_FIXTURES) {
        it(`tokenizes ${file} (${lang}) consistently`, () => {
          const source = readFileSync(resolve(FIXTURES_DIR, file), 'utf8');
          const { bg, fg, tokens } = highlighter.codeToTokens(source, {
            lang,
            theme: themeId,
          });

          expect(bg).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(fg).toMatch(/^#[0-9a-fA-F]{6}$/);

          const compact = {
            bg,
            fg,
            lines: tokens.map((line) =>
              line
                .filter((t) => t.content.trim().length > 0)
                .map((t) => {
                  expect(t.color).toMatch(/^#[0-9a-fA-F]{6}$/);
                  return `${t.content} :: ${t.color}${t.fontStyle ? ` [${t.fontStyle}]` : ''}`;
                }),
            ),
          };

          expect(compact).toMatchSnapshot();
        });
      }
    });
  }
});
