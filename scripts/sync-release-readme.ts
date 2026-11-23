import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const RELEASE_HISTORY_START = '<!-- RELEASE_HISTORY:START -->';
export const RELEASE_HISTORY_END = '<!-- RELEASE_HISTORY:END -->';

const ZH_BULLET_TRANSLATIONS: Readonly<Record<string, readonly string[]>> = {
  '0.2.0': [
    '**7 大主题色系 × Dark / Light（14 款 OKLCH 变体）+ `Stock` 还原**：在旗舰 `Orbital`（`antigravity-dark`、`antigravity-light`）基础上新增 6 大天文极光色系（`prism`、`zenith`、`lagoon`、`solar`、`nova`、`nebula` × Dark/Light），全量通过 APCA 与 WCAG 2.1 对比度门禁并支持无痕切回 `stock`。',
    '**模块化语义桌面运行时（`dist/runtime/current.{css,js}`）**：新增由 SemanticIR 编译的桌面运行时，提供极光多层网格玻璃、右上角悬浮主题胶囊切换器、双媒体胶囊、xterm ANSI 桥接及弹窗质感优化。',
    '**跨平台零重签 ASAR 安装器、自动自愈与安全热更新**：新增 `core/asar-patcher.js`、`core/updater.js`、macOS（`install.sh`、`*.command`、LaunchAgent 自愈）及 Windows（`install.ps1`、`*.bat`、计划任务自愈），支持 SHA-256 校验与字节级原厂还原。',
    '**升级版三栏预览工作台与三端发版流水线**：在 `preview/` 新增 7 色系选择器、极光网格背景舞台与仿真悬浮胶囊；`pack-release.ts` 同步输出标准包、`-macos.zip`、`-windows.zip` 与统一 `SHA256SUMS.txt`，并新增每日 `antigravity-watch.yml` CI 巡检。',
  ],
  '0.1.0': [
    '初始 OKLCH Design Token 编译器与确定性多格式适配器（`theme.json`、`variables.css`、`code-theme.json`、`mermaid.json`）。',
    'Option A（`ADR-006`）高不透明度磨砂玻璃调色板：**Antigravity Dark（星轨岩板）** 与 **Antigravity Light（星轨云瓷）**。',
    '交互式 Antigravity 2.0 Agent 桌面端三栏预览工作台（`preview/`）。',
    '自动化 Schema、宿主 CSS 覆盖率、极限玻璃对比度（`APCA` + `WCAG 2.1`）、L5 聚焦环/边框、DOM 堆叠 Diff 及 Shiki Tier-1 代码高亮回归测试套件。',
  ],
};

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
    const localizedBullets =
      locale === 'zh-CN' ? ZH_BULLET_TRANSLATIONS[rel.version] : undefined;
    const activeBullets = localizedBullets ?? rel.bullets;
    const items =
      activeBullets.length > 0
        ? activeBullets.map((b) => `- ${b}`).join('\n')
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
  const manifestPath = resolve(rootDir, 'manifest.json');
  let hookVersion = 'v2';
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      hookVersion?: unknown;
    };
    if (typeof manifest.hookVersion === 'string' && manifest.hookVersion.trim()) {
      hookVersion = manifest.hookVersion.trim();
    }
  }
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
    `- **Target Application**: Antigravity 2.0 Agent Desktop App Only (\`macOS\` & \`Windows\` zero-resign ASAR Hook \`${hookVersion}\`, plus W3C DTCG / CSS Variable packs)`,
    `- **Theme Families (7 Families × Dark / Light = 14 OKLCH + APCA Variants + \`Stock\`)**:`,
    `  - **Orbital** (\`antigravity-dark\` / \`antigravity-light\`) — Flagship Orbital Slate & Cloud Matte Glass`,
    `  - **Prism**, **Zenith**, **Lagoon**, **Solar**, **Nova**, **Nebula** (\`antigravity-<family>-dark\` / \`antigravity-<family>-light\`) — Celestial Aurora OKLCH Matte Glass`,
    `- **Live 3-Pane Preview Workbench**: https://django9944.github.io/antigravity-theme/preview/`,
    ``,
    `## What's Changed in \`${tag}\` (Iteration Notes)`,
    ``,
    iterationBody,
    ``,
    `## Release Bundles & Verification`,
    ``,
    `| Asset | Purpose |`,
    `| :--- | :--- |`,
    `| \`antigravity-theme-${tag}.zip\` | Full Design Token & Theme Pack (\`dist/manifest.json\`, \`variables.css\`, \`theme.json\`, \`code-theme.json\`, \`mermaid.json\`, and \`dist/runtime/\`) for all 14 variants |`,
    `| \`antigravity-theme-${tag}-macos.zip\` | macOS One-Click Installer (\`install.command\`, \`install.sh\`, \`core/asar-patcher.js\`, \`core/updater.js\`, LaunchAgent auto-heal & \`dist/runtime/\`) |`,
    `| \`antigravity-theme-${tag}-windows.zip\` | Windows One-Click Installer (\`install.bat\`, \`install.ps1\`, \`core/asar-patcher.js\`, \`core/updater.js\`, Scheduled Task auto-heal & \`dist/runtime/\`) |`,
    `| \`SHA256SUMS.txt\` | Unified SHA-256 integrity checksums for all three release ZIP archives |`,
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
