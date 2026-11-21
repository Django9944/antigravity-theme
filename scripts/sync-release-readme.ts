import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const RELEASE_HISTORY_START = '<!-- RELEASE_HISTORY:START -->';
export const RELEASE_HISTORY_END = '<!-- RELEASE_HISTORY:END -->';

export interface ChangelogReleaseEntry {
  readonly version: string;
  readonly body: string;
  readonly bullets: readonly string[];
}

/**
 * Parses `CHANGELOG.md` into ordered release entries (`## <version>`).
 */
export function parseChangelogReleases(changelogMarkdown: string): ChangelogReleaseEntry[] {
  const clean = changelogMarkdown.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);
  const releases: ChangelogReleaseEntry[] = [];

  let currentVersion: string | null = null;
  let currentLines: string[] = [];

  const flush = (): void => {
    if (!currentVersion) return;
    const body = currentLines.join('\n').trim();
    const bullets = currentLines
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- ') || line.startsWith('* '))
      .map((line) => line.replace(/^[-*]\s+/, '').trim());
    releases.push({
      version: currentVersion,
      body,
      bullets,
    });
  };

  for (const line of lines) {
    const versionMatch = /^##\s+v?(\d+\.\d+\.\d+(?:[+-][0-9A-Za-z.-]+)?)\b/.exec(line.trim());
    if (versionMatch && versionMatch[1]) {
      flush();
      currentVersion = versionMatch[1];
      currentLines = [];
      continue;
    }
    if (currentVersion !== null) {
      currentLines.push(line);
    }
  }
  flush();

  return releases;
}

/**
 * Renders the Markdown block placed inside `<!-- RELEASE_HISTORY:START --> ... <!-- RELEASE_HISTORY:END -->`.
 */
export function renderReadmeReleaseHistory(
  releases: readonly ChangelogReleaseEntry[],
  locale: 'en' | 'zh-CN',
  repoUrl = 'https://github.com/Django9944/antigravity-theme',
): string {
  if (releases.length === 0) {
    return locale === 'zh-CN' ? '_暂无发版记录。_' : '_No releases recorded yet._';
  }

  const blocks: string[] = [];
  releases.forEach((rel, idx) => {
    const tag = `v${rel.version}`;
    const badge =
      idx === 0
        ? locale === 'zh-CN'
          ? '（当前最新版本 / Latest）'
          : '(Latest Release)'
        : '';
    const heading = `### [${tag}](${repoUrl}/releases/tag/${tag}) ${badge}`.trim();
    const items =
      rel.bullets.length > 0
        ? rel.bullets.map((b) => `- ${b}`).join('\n')
        : rel.body || (locale === 'zh-CN' ? '- 常规维护与质量门禁更新。' : '- Maintenance update.');
    blocks.push(`${heading}\n\n${items}`);
  });

  return blocks.join('\n\n');
}

function replaceBetweenMarkers(
  content: string,
  replacementBody: string,
  fileLabel: string,
): string {
  const startIdx = content.indexOf(RELEASE_HISTORY_START);
  const endIdx = content.indexOf(RELEASE_HISTORY_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      `Missing ${RELEASE_HISTORY_START} ... ${RELEASE_HISTORY_END} markers in ${fileLabel}`,
    );
  }
  const before = content.slice(0, startIdx + RELEASE_HISTORY_START.length);
  const after = content.slice(endIdx);
  return `${before}\n\n${replacementBody}\n\n${after}`;
}

/**
 * Synchronizes the release history section and current version indicator in `README.md` and `README.zh-CN.md`.
 */
export function syncReadmeReleaseHistory(rootDir = DEFAULT_ROOT_DIR): {
  version: string;
  releaseCount: number;
} {
  const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8')) as {
    version: string;
  };
  const changelogRaw = readFileSync(resolve(rootDir, 'CHANGELOG.md'), 'utf8');
  const releases = parseChangelogReleases(changelogRaw);
  if (releases.length === 0) {
    throw new Error('No release entries found in CHANGELOG.md');
  }

  const enPath = resolve(rootDir, 'README.md');
  const zhPath = resolve(rootDir, 'README.zh-CN.md');

  const enBlock = renderReadmeReleaseHistory(releases, 'en');
  const zhBlock = renderReadmeReleaseHistory(releases, 'zh-CN');

  let enContent = replaceBetweenMarkers(readFileSync(enPath, 'utf8'), enBlock, 'README.md');
  enContent = enContent.replace(
    /^(- \*\*Current Version\*\*: `)v?[0-9]+\.[0-9]+\.[0-9]+(?:[+-][0-9A-Za-z.-]+)?(`)/m,
    `$1v${pkg.version}$2`,
  );
  writeFileSync(enPath, enContent, 'utf8');

  let zhContent = replaceBetweenMarkers(readFileSync(zhPath, 'utf8'), zhBlock, 'README.zh-CN.md');
  zhContent = zhContent.replace(
    /^(- \*\*当前版本\*\*：`)v?[0-9]+\.[0-9]+\.[0-9]+(?:[+-][0-9A-Za-z.-]+)?(`)/m,
    `$1v${pkg.version}$2`,
  );
  writeFileSync(zhPath, zhContent, 'utf8');

  return { version: pkg.version, releaseCount: releases.length };
}

/**
 * Generates GitHub Release notes combining the project description, variant overview, and iteration changes for `targetVersion`.
 */
export function generateReleaseNotes(
  rootDir = DEFAULT_ROOT_DIR,
  targetVersion?: string,
): string {
  const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
    description: string;
  };
  const version = (targetVersion ?? pkg.version).replace(/^v/, '');
  const tag = `v${version}`;

  const changelogRaw = readFileSync(resolve(rootDir, 'CHANGELOG.md'), 'utf8');
  const releases = parseChangelogReleases(changelogRaw);
  const matching = releases.find((r) => r.version === version) ?? releases[0];

  const iterationBody = matching
    ? matching.bullets.length > 0
      ? matching.bullets.map((b) => `- ${b}`).join('\n')
      : matching.body
    : `- Release ${tag} of ${pkg.name}.`;

  return [
    `## Project Overview`,
    ``,
    `**Antigravity Theme** (\`${pkg.name}\`) — ${pkg.description}`,
    ``,
    `- **Target Application**: Antigravity 2.0 Agent Desktop App Only (Left-hand Sidebar · Chat Canvas · Auxiliary Pane)`,
    `- **Theme Variants**:`,
    `  - **Antigravity Dark (\`antigravity-dark\`)** — Orbital Slate Matte Glass (` +
      `\`#161b22\` canvas, \`#10151c\` shell, \`#86c1ff\` Weightless Cobalt accent)`,
    `  - **Antigravity Light (\`antigravity-light\`)** — Orbital Cloud Matte Glass (` +
      `\`#f5f9fc\` canvas, \`#ecf1f5\` shell, \`#005697\` Weightless Cobalt accent)`,
    `- **Live 3-Pane Preview Workbench**: https://django9944.github.io/antigravity-theme/preview/`,
    ``,
    `## What's Changed in \`${tag}\` (Iteration Notes)`,
    ``,
    iterationBody,
    ``,
    `## Release Bundle & Verification`,
    ``,
    `| Asset | Purpose |`,
    `| :--- | :--- |`,
    `| \`antigravity-theme-${tag}.zip\` | Distributable Theme Pack containing \`dist/manifest.json\`, \`variables.css\`, \`theme.json\`, \`code-theme.json\`, and \`mermaid.json\` for both Dark and Light variants |`,
    `| \`SHA256SUMS.txt\` | SHA-256 integrity checksum for \`antigravity-theme-${tag}.zip\` |`,
    ``,
  ].join('\n');
}

function runCli(): void {
  const args = process.argv.slice(2);
  const writeNotesIdx = args.indexOf('--write-notes');
  const versionIdx = args.indexOf('--version');
  const targetVersion =
    versionIdx !== -1 && args[versionIdx + 1] ? args[versionIdx + 1] : undefined;

  const { version, releaseCount } = syncReadmeReleaseHistory(DEFAULT_ROOT_DIR);
  console.log(
    `Synchronized ${releaseCount} release entry(ies) into README.md & README.zh-CN.md (current: v${version})`,
  );

  if (writeNotesIdx !== -1) {
    const outPath = args[writeNotesIdx + 1];
    if (!outPath) {
      throw new Error('Expected output file path after --write-notes');
    }
    const resolvedOut = resolve(DEFAULT_ROOT_DIR, outPath);
    mkdirSync(dirname(resolvedOut), { recursive: true });
    const notes = generateReleaseNotes(DEFAULT_ROOT_DIR, targetVersion);
    writeFileSync(resolvedOut, notes, 'utf8');
    console.log(`Wrote GitHub Release notes to ${resolvedOut}`);
  }
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
  runCli();
}
