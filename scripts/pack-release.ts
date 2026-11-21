import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
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
const ALLOWED_DIST_EXTS = new Set(['.json', '.css']);
const SEMVER_RE = /^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/;

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

function sha256File(path: string): string {
  const data = readFileSync(path);
  return createHash('sha256').update(data).digest('hex');
}

export function packRelease(
  rootDir = DEFAULT_ROOT_DIR,
  releaseDir = resolve(rootDir, 'release'),
): { archivePath: string; checksumsPath: string; checksum: string } {
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
    const base = basename(file);
    const rel = relative(distDir, file);
    if (base.startsWith('.')) {
      throw new Error(`Hidden dotfile forbidden in dist/: ${rel}`);
    }
    if (!ALLOWED_DIST_EXTS.has(extname(base))) {
      throw new Error(`Unauthorized file extension in dist/: ${rel}`);
    }
  }

  const bundleName = `antigravity-theme-v${pkg.version}`;
  const stageDir = resolve(releaseDir, bundleName);
  rmSync(releaseDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  cpSync(distDir, resolve(stageDir, 'dist'), { recursive: true, dereference: false });
  for (const file of ALLOWLIST_ROOT_FILES) {
    const src = resolve(rootDir, file);
    if (!existsSync(src)) {
      throw new Error(`Missing required release file: ${file}`);
    }
    const stat = lstatSync(src);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`Root release file must be a regular non-symlink file: ${file}`);
    }
    cpSync(src, resolve(stageDir, file), { dereference: false });
  }

  // Re-verify staged tree strictly against root allowlist vs dist allowlist
  const allowRootSet = new Set<string>(ALLOWLIST_ROOT_FILES);
  for (const file of assertNoSymlinksAndCollect(stageDir)) {
    const rel = relative(stageDir, file).replace(/\\/g, '/');
    if (rel.startsWith('dist/')) {
      const base = basename(file);
      if (base.startsWith('.') || !ALLOWED_DIST_EXTS.has(extname(base))) {
        throw new Error(`Unauthorized dist file in staged bundle: ${rel}`);
      }
    } else if (!allowRootSet.has(rel)) {
      throw new Error(`Unauthorized root file in staged bundle: ${rel}`);
    }
  }

  const zipName = `${bundleName}.zip`;
  const zipPath = resolve(releaseDir, zipName);
  let archiveFile = zipName;
  let archivePath = zipPath;

  try {
    execFileSync('zip', ['-r', '-q', zipName, '--', bundleName], { cwd: releaseDir });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    rmSync(zipPath, { force: true });
    if (code !== 'ENOENT') {
      throw err;
    }
    archiveFile = `${bundleName}.tar.gz`;
    archivePath = resolve(releaseDir, archiveFile);
    execFileSync('tar', ['-czf', archiveFile, '--', bundleName], { cwd: releaseDir });
  }

  const checksum = sha256File(archivePath);
  const checksumsPath = resolve(releaseDir, 'SHA256SUMS.txt');
  writeFileSync(checksumsPath, `${checksum}  ${archiveFile}\n`, 'utf8');

  rmSync(stageDir, { recursive: true, force: true });

  console.log(`Packed ${archiveFile} (${checksum})`);
  return { archivePath, checksumsPath, checksum };
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
