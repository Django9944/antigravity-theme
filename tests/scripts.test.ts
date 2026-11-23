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
  applyUpstreamBaselineUpdate,
  diffUpstreamState,
  extractAntigravityAppEntries,
  extractHostCssVariables,
  type UpstreamBaseline,
} from '../scripts/check-upstream-app.js';
import { packRelease } from '../scripts/pack-release.js';
import {
  generateReleaseNotes,
  parseChangelogReleases,
  syncReadmeReleaseHistory,
} from '../scripts/sync-release-readme.js';
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

describe('Upstream Antigravity App Parser, Diff & Auto-Baseline Update', () => {
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

  it('detects newly introduced --color-* host CSS variables and updates baseline deterministically', () => {
    const md = [
      '## Antigravity App',
      '### 2026-11-22 — v2.3.0',
      'Added `--color-ring-accent` and `--color-background-primary`.',
    ].join('\n');

    const entries = extractAntigravityAppEntries(md);
    const hostVars = extractHostCssVariables(md);
    const report = diffUpstreamState(baseline, entries, hostVars, 'online');
    expect(report.hasChanges).toBe(true);
    expect(report.addedEntries).toEqual(['2026-11-22 — v2.3.0']);
    expect(report.addedHostVariables).toEqual(['--color-ring-accent']);

    const updated = applyUpstreamBaselineUpdate(baseline, report);
    expect(updated.lastSeenHeading).toBe('2026-11-22 — v2.3.0');
    expect(updated.knownHostCssVariables).toEqual([
      '--color-background-primary',
      '--color-text-primary',
      '--color-ring-accent',
    ]);
  });
});

describe('Release Notes & README Iteration Sync', () => {
  it('parses CHANGELOG.md releases, synchronizes README.md / README.zh-CN.md, and generates release notes with project description', () => {
    const dir = makeTempDir('agy-readme-sync-');
    for (const file of ['package.json', 'manifest.json', 'CHANGELOG.md', 'README.md', 'README.zh-CN.md']) {
      cpSync(resolve(ROOT_DIR, file), resolve(dir, file));
    }

    const releases = parseChangelogReleases(readFileSync(resolve(dir, 'CHANGELOG.md'), 'utf8'));
    expect(releases.length).toBeGreaterThanOrEqual(2);
    expect(releases[0]?.version).toBe('0.2.0');
    expect(releases.some((r) => r.version === '0.1.0')).toBe(true);
    expect(releases[0]?.bullets.length).toBeGreaterThan(0);

    const syncRes = syncReadmeReleaseHistory(dir);
    expect(syncRes.version).toBe('0.2.0');
    expect(syncRes.releaseCount).toBe(releases.length);

    const enReadme = readFileSync(resolve(dir, 'README.md'), 'utf8');
    const zhReadme = readFileSync(resolve(dir, 'README.zh-CN.md'), 'utf8');
    expect(enReadme).toContain('### [v0.2.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.2.0) (Latest Release)');
    expect(zhReadme).toContain('### [v0.2.0](https://github.com/Django9944/antigravity-theme/releases/tag/v0.2.0) （当前最新版本 / Latest）');
    expect(zhReadme).toContain('7 大主题色系 × Dark / Light');

    const notes = generateReleaseNotes(dir, '0.2.0');
    expect(notes).toContain('## Project Overview');
    expect(notes).toContain('OKLCH matte & aurora glass theme system');
    expect(notes).toContain('zero-resign ASAR Hook `v2`');
    expect(notes).toContain("## What's Changed in `v0.2.0` (Iteration Notes)");
    expect(notes).toContain('antigravity-theme-v0.2.0.zip');
    expect(notes).toContain('antigravity-theme-v0.2.0-macos.zip');
    expect(notes).toContain('antigravity-theme-v0.2.0-windows.zip');
    expect(notes).toContain('SHA256SUMS.txt');
  });
});

describe('packRelease Purity & Version Enforcement', () => {
  function stageValidWorkspace(): string {
    const dir = makeTempDir('agy-pack-');
    cpSync(resolve(ROOT_DIR, 'dist'), resolve(dir, 'dist'), { recursive: true });
    cpSync(resolve(ROOT_DIR, 'core'), resolve(dir, 'core'), { recursive: true });
    for (const file of [
      'package.json',
      'manifest.json',
      'LICENSE',
      'README.md',
      'README.zh-CN.md',
      'CHANGELOG.md',
      'install.sh',
      'install.command',
      'uninstall.command',
      '检查更新.command',
      'install.ps1',
      'install.bat',
      'uninstall.bat',
      '检查更新.bat',
    ]) {
      cpSync(resolve(ROOT_DIR, file), resolve(dir, file));
    }
    return dir;
  }

  it('rejects .js in variant dirs, invalid runtime files, dotfiles, and symlinks inside dist/', () => {
    const dir = stageValidWorkspace();
    writeFileSync(resolve(dir, 'dist', 'evil-script'), '#!/bin/sh\n', 'utf8');
    expect(() => packRelease(dir)).toThrow(/Unauthorized file extension/i);

    const dirVariantJs = stageValidWorkspace();
    writeFileSync(resolve(dirVariantJs, 'dist', 'antigravity-dark', 'evil.js'), 'alert(1);\n', 'utf8');
    expect(() => packRelease(dirVariantJs)).toThrow(/Unauthorized file extension/i);

    const dirRuntimeEvil = stageValidWorkspace();
    writeFileSync(resolve(dirRuntimeEvil, 'dist', 'runtime', 'evil.sh'), '#!/bin/sh\n', 'utf8');
    expect(() => packRelease(dirRuntimeEvil)).toThrow(/Unauthorized runtime file/i);

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

  it('packs standard, macOS, and Windows archives with matching unified SHA256SUMS.txt', () => {
    const dir = stageValidWorkspace();
    const res = packRelease(dir);
    expect(res.archives.length).toBe(3);
    expect(existsSync(res.archivePath)).toBe(true);
    expect(existsSync(res.checksumsPath)).toBe(true);
    expect(res.checksum).toMatch(/^[0-9a-f]{64}$/);

    for (const entry of res.archives) {
      expect(existsSync(entry.archivePath)).toBe(true);
      expect(entry.checksum).toMatch(/^[0-9a-f]{64}$/);
      const stageBase = entry.name.replace(/\.(zip|tar\.gz)$/, '');
      expect(existsSync(resolve(dir, 'release', stageBase))).toBe(false);
      expect(existsSync(resolve(dir, 'release', `.stage-${stageBase}`))).toBe(false);
    }

    const expectedSums =
      res.archives.map((entry) => `${entry.checksum}  ${entry.name}`).join('\n') + '\n';
    expect(readFileSync(res.checksumsPath, 'utf8')).toBe(expectedSums);
    expect(basename(res.archives[0]!.archivePath)).toMatch(/^antigravity-theme-v0\.2\.0\.(zip|tar\.gz)$/);
    expect(basename(res.archives[1]!.archivePath)).toMatch(/^antigravity-theme-v0\.2\.0-macos\.(zip|tar\.gz)$/);
    expect(basename(res.archives[2]!.archivePath)).toMatch(/^antigravity-theme-v0\.2\.0-windows\.(zip|tar\.gz)$/);
  });
});
