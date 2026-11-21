import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWLIST_ROOT_FILES = ['LICENSE', 'README.md', 'README.zh-CN.md', 'CHANGELOG.md'] as const;
const DESKTOP_SHARED_FILES = [
  'manifest.json',
  'core/package.json',
  'core/asar-patcher.js',
  'core/updater.js',
  'dist/runtime/current.css',
  'dist/runtime/current.js',
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
] as const;
const MACOS_DESKTOP_FILES = [
  ...DESKTOP_SHARED_FILES,
  'install.sh',
  'install.command',
  'uninstall.command',
  '检查更新.command',
] as const;
const WINDOWS_DESKTOP_FILES = [
  ...DESKTOP_SHARED_FILES,
  'install.ps1',
  'install.bat',
  'uninstall.bat',
  '检查更新.bat',
] as const;

const ALLOWED_DIST_EXTS = new Set(['.json', '.css']);
const ALLOWED_RUNTIME_EXTS = new Set(['.css', '.js']);
const SEMVER_RE = /^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/;

export interface PackedArchiveEntry {
  readonly name: string;
  readonly archivePath: string;
  readonly checksum: string;
}

function assertNoSymlinksAndCollect(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      throw new Error(`Symlink forbidden in release bundle: ${full}`);
    }
    if (stat.isDirectory()) {
      results.push(...assertNoSymlinksAndCollect(full));
    } else if (stat.isFile()) {
      results.push(full);
    } else {
      throw new Error(`Unsupported non-regular file in release bundle: ${full}`);
    }
  }
  return results;
}

function validateDistRelativePath(relPosix: string): void {
  const base = basename(relPosix);
  if (base.startsWith('.')) {
    throw new Error(`Hidden dotfile forbidden in dist/: ${relPosix}`);
  }
  if (relPosix.startsWith('runtime/')) {
    const sub = relPosix.slice('runtime/'.length);
    if (!sub || sub.includes('/') || !ALLOWED_RUNTIME_EXTS.has(extname(base))) {
      throw new Error(`Unauthorized runtime file in dist/: ${relPosix}`);
    }
    return;
  }
  if (!ALLOWED_DIST_EXTS.has(extname(base))) {
    throw new Error(`Unauthorized file extension in dist/: ${relPosix}`);
  }
}

function sha256File(path: string): string {
  const data = readFileSync(path);
  return createHash('sha256').update(data).digest('hex');
}

function copyCheckedRelativeFile(
  rootDir: string,
  stageDir: string,
  relPosix: string,
  preserveExecutable = false,
): void {
  const src = resolve(rootDir, relPosix);
  if (!existsSync(src)) {
    throw new Error(`Missing required release file: ${relPosix}`);
  }
  const stat = lstatSync(src);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Release file must be a regular non-symlink file: ${relPosix}`);
  }
  const dst = resolve(stageDir, relPosix);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { dereference: false });
  if (preserveExecutable && (relPosix.endsWith('.sh') || relPosix.endsWith('.command'))) {
    chmodSync(dst, 0o755);
  }
}

function createArchive(
  stageDir: string,
  archiveBaseName: string,
  releaseDir: string,
  options: { flattenRoot: boolean },
): PackedArchiveEntry {
  const zipName = `${archiveBaseName}.zip`;
  const zipPath = resolve(releaseDir, zipName);
  const packCwd = options.flattenRoot ? stageDir : releaseDir;
  const targets = options.flattenRoot
    ? readdirSync(stageDir).filter((entry) => !entry.startsWith('.'))
    : [archiveBaseName];

  let archiveFile = zipName;
  let archivePath = zipPath;

  try {
    execFileSync('zip', ['-r', '-q', zipPath, '--', ...targets], { cwd: packCwd });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    rmSync(zipPath, { force: true });
    if (code !== 'ENOENT') {
      throw err;
    }
    archiveFile = `${archiveBaseName}.tar.gz`;
    archivePath = resolve(releaseDir, archiveFile);
    execFileSync('tar', ['-czf', archivePath, '--', ...targets], { cwd: packCwd });
  }

  return {
    name: archiveFile,
    archivePath,
    checksum: sha256File(archivePath),
  };
}

export function packRelease(
  rootDir = DEFAULT_ROOT_DIR,
  releaseDir = resolve(rootDir, 'release'),
): {
  archivePath: string;
  checksumsPath: string;
  checksum: string;
  archives: readonly PackedArchiveEntry[];
} {
  const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8')) as {
    version?: unknown;
  };
  if (typeof pkg.version !== 'string' || !SEMVER_RE.test(pkg.version)) {
    throw new Error(`Invalid package.json version: ${String(pkg.version)}`);
  }

  const distDir = resolve(rootDir, 'dist');
  if (!existsSync(distDir)) {
    throw new Error('dist/ does not exist. Run "pnpm build" before packing.');
  }

  const manifestPath = resolve(distDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error('dist/manifest.json is missing. Run "pnpm build" before packing.');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { version?: unknown };
  if (manifest.version !== pkg.version) {
    throw new Error(
      `Stale dist/manifest.json version (${String(manifest.version)}) != package.json (${pkg.version}). Run "pnpm build".`,
    );
  }

  // Validate source dist/ before copying
  for (const file of assertNoSymlinksAndCollect(distDir)) {
    const rel = relative(distDir, file).replace(/\\/g, '/');
    validateDistRelativePath(rel);
  }

  const bundleName = `antigravity-theme-v${pkg.version}`;
  rmSync(releaseDir, { recursive: true, force: true });
  mkdirSync(releaseDir, { recursive: true });

  // 1. Standard W3C DTCG + CSS Variables Theme Pack (wrapped under bundleName/)
  const standardStageDir = resolve(releaseDir, bundleName);
  mkdirSync(standardStageDir, { recursive: true });
  cpSync(distDir, resolve(standardStageDir, 'dist'), { recursive: true, dereference: false });
  for (const file of ALLOWLIST_ROOT_FILES) {
    copyCheckedRelativeFile(rootDir, standardStageDir, file);
  }
  const allowRootSet = new Set<string>(ALLOWLIST_ROOT_FILES);
  for (const file of assertNoSymlinksAndCollect(standardStageDir)) {
    const rel = relative(standardStageDir, file).replace(/\\/g, '/');
    if (rel.startsWith('dist/')) {
      validateDistRelativePath(rel.slice('dist/'.length));
    } else if (!allowRootSet.has(rel)) {
      throw new Error(`Unauthorized root file in staged bundle: ${rel}`);
    }
  }
  const standardEntry = createArchive(standardStageDir, bundleName, releaseDir, { flattenRoot: false });
  rmSync(standardStageDir, { recursive: true, force: true });

  // 2. macOS Desktop Installer & Auto-Heal Bundle (flattened root with manifest.json at top level)
  const macStageDir = resolve(releaseDir, `.stage-${bundleName}-macos`);
  mkdirSync(macStageDir, { recursive: true });
  for (const file of MACOS_DESKTOP_FILES) {
    copyCheckedRelativeFile(rootDir, macStageDir, file, true);
  }
  const macAllowSet = new Set<string>(MACOS_DESKTOP_FILES);
  for (const file of assertNoSymlinksAndCollect(macStageDir)) {
    const rel = relative(macStageDir, file).replace(/\\/g, '/');
    if (basename(file).startsWith('.') || !macAllowSet.has(rel)) {
      throw new Error(`Unauthorized file in macOS staged bundle: ${rel}`);
    }
  }
  const macEntry = createArchive(macStageDir, `${bundleName}-macos`, releaseDir, { flattenRoot: true });
  rmSync(macStageDir, { recursive: true, force: true });

  // 3. Windows Desktop Installer & Auto-Heal Bundle (flattened root with manifest.json at top level)
  const winStageDir = resolve(releaseDir, `.stage-${bundleName}-windows`);
  mkdirSync(winStageDir, { recursive: true });
  for (const file of WINDOWS_DESKTOP_FILES) {
    copyCheckedRelativeFile(rootDir, winStageDir, file, false);
  }
  const winAllowSet = new Set<string>(WINDOWS_DESKTOP_FILES);
  for (const file of assertNoSymlinksAndCollect(winStageDir)) {
    const rel = relative(winStageDir, file).replace(/\\/g, '/');
    if (basename(file).startsWith('.') || !winAllowSet.has(rel)) {
      throw new Error(`Unauthorized file in Windows staged bundle: ${rel}`);
    }
  }
  const winEntry = createArchive(winStageDir, `${bundleName}-windows`, releaseDir, { flattenRoot: true });
  rmSync(winStageDir, { recursive: true, force: true });

  const archives = [standardEntry, macEntry, winEntry] as const;
  const checksumsPath = resolve(releaseDir, 'SHA256SUMS.txt');
  writeFileSync(
    checksumsPath,
    archives.map((entry) => `${entry.checksum}  ${entry.name}`).join('\n') + '\n',
    'utf8',
  );

  for (const entry of archives) {
    console.log(`Packed ${entry.name} (${entry.checksum})`);
  }

  return {
    archivePath: standardEntry.archivePath,
    checksumsPath,
    checksum: standardEntry.checksum,
    archives,
  };
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
  packRelease();
}
