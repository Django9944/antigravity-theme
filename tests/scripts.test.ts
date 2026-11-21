import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  diffUpstreamState,
  extractAntigravityAppEntries,
  extractHostCssVariables,
  type UpstreamBaseline,
} from '../scripts/check-upstream-app.js';
import { packRelease } from '../scripts/pack-release.js';
import { blendOver, oklch } from '../src/core/color.js';
import { apcaContrast, wcagContrast, worstCaseGlassContrast } from '../src/core/contrast.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(resolve(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('Color & Contrast Error Guards', () => {
  it('rejects out-of-range OKLCH inputs and translucent backgrounds', () => {
    expect(() => oklch(Number.NaN, 0.1, 250)).toThrow();
    expect(() => oklch(1.2, 0.1, 250)).toThrow();
    expect(() => oklch(0.5, -0.01, 250)).toThrow();
    expect(() => blendOver('#ffffff80', '#00000080')).toThrow(/opaque background/i);
    expect(() => apcaContrast('#ffffff', '#00000080')).toThrow(/opaque background/i);
    expect(() => wcagContrast('#ffffff', '#00000080')).toThrow(/opaque background/i);
  });

  it('detects polarity zero-crossing in worstCaseGlassContrast', () => {
    const res = worstCaseGlassContrast('#808080', '#80808040');
    expect(res.polarityCrossesZero).toBe(true);
    expect(res.minAbsApca).toBe(0);
    expect(res.minWcag).toBe(1.0);
  });
});

describe('Upstream Antigravity App Parser & Diff', () => {
  const baseline: UpstreamBaseline = {
    sourceUrl: 'https://antigravity.google/docs/changelog.md',
    lastSeenHeading: '2026-11-15 — v2.1.0',
    knownHostCssVariables: ['--color-background-primary', '--color-text-primary'],
  };

  it('ignores fenced code blocks containing ## and ### headings', () => {
    const md = [
      '## Antigravity App',
      '### 2026-11-21 — v2.2.0',
      '```markdown',
      '## Fake Section That Must Not Break',
      '### Fake Heading Inside Fence',
      '```',
      '### 2026-11-15 — v2.1.0',
      '## Antigravity CLI',
      '### 2026-11-20 — CLI Only',
    ].join('\n');

    const entries = extractAntigravityAppEntries(md);
    expect(entries).toEqual(['2026-11-21 — v2.2.0', '2026-11-15 — v2.1.0']);

    const report = diffUpstreamState(baseline, entries);
    expect(report.hasChanges).toBe(true);
    expect(report.addedEntries).toEqual(['2026-11-21 — v2.2.0']);
  });

  it('detects newly introduced --color-* host CSS variables', () => {
    const md = [
      '## Antigravity App',
      '### 2026-11-15 — v2.1.0',
      'Added `--color-ring-accent` and `--color-background-primary`.',
    ].join('\n');

    const hostVars = extractHostCssVariables(md);
    const report = diffUpstreamState(
      baseline,
      extractAntigravityAppEntries(md),
      hostVars,
      'online',
    );
    expect(report.hasChanges).toBe(true);
    expect(report.addedEntries).toEqual([]);
    expect(report.addedHostVariables).toEqual(['--color-ring-accent']);
  });
});

describe('packRelease Purity & Version Enforcement', () => {
  function stageValidWorkspace(): string {
    const dir = makeTempDir('agy-pack-');
    cpSync(resolve(ROOT_DIR, 'dist'), resolve(dir, 'dist'), { recursive: true });
    for (const file of [
      'package.json',
      'LICENSE',
      'README.md',
      'README.zh-CN.md',
      'CHANGELOG.md',
    ]) {
      cpSync(resolve(ROOT_DIR, file), resolve(dir, file));
    }
    return dir;
  }

  it('rejects extensionless executables, dotfiles, and symlinks inside dist/', () => {
    const dir = stageValidWorkspace();
    writeFileSync(resolve(dir, 'dist', 'evil-script'), '#!/bin/sh\n', 'utf8');
    expect(() => packRelease(dir)).toThrow(/Unauthorized file extension/i);

    const dir2 = stageValidWorkspace();
    writeFileSync(resolve(dir2, 'dist', '.DS_Store'), 'junk', 'utf8');
    expect(() => packRelease(dir2)).toThrow(/Hidden dotfile forbidden/i);

    const dir3 = stageValidWorkspace();
    mkdirSync(resolve(dir3, 'outside'), { recursive: true });
    writeFileSync(resolve(dir3, 'outside', 'secret.json'), '{}', 'utf8');
    symlinkSync(resolve(dir3, 'outside', 'secret.json'), resolve(dir3, 'dist', 'leak.json'));
    expect(() => packRelease(dir3)).toThrow(/Symlink forbidden/i);
  });

  it('rejects stale dist/manifest.json version mismatch', () => {
    const dir = stageValidWorkspace();
    const pkgPath = resolve(dir, 'package.json');
    const pkg = JSON.parse(
      `{"name":"@django9944/antigravity-theme","version":"9.9.9"}`,
    ) as Record<string, string>;
    writeFileSync(pkgPath, JSON.stringify(pkg), 'utf8');
    expect(() => packRelease(dir)).toThrow(/Stale dist\/manifest\.json version/i);
  });

  it('packs a valid workspace into an archive with matching SHA256SUMS.txt', () => {
    const dir = stageValidWorkspace();
    const res = packRelease(dir);
    expect(existsSync(res.archivePath)).toBe(true);
    expect(existsSync(res.checksumsPath)).toBe(true);
    expect(res.checksum).toMatch(/^[0-9a-f]{64}$/);
    const archiveBase = basename(res.archivePath);
    expect(readFileSync(res.checksumsPath, 'utf8')).toBe(`${res.checksum}  ${archiveBase}\n`);
    const stageBase = archiveBase.replace(/\.(zip|tar\.gz)$/, '');
    expect(existsSync(resolve(dir, 'release', stageBase))).toBe(false);
  });
});
