#!/usr/bin/env node
'use strict';

process.noAsar = true;

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.json');

function loadManifest(manifestPath = MANIFEST_PATH) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function parseSemver(tag) {
    const clean = String(tag || '').trim().replace(/^[vV]/, '').split('-')[0];
    const parts = clean.split('.').map((n) => parseInt(n, 10));
    if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) return null;
    while (parts.length < 3) parts.push(0);
    return parts.slice(0, 3);
}

function compareSemver(a, b) {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (!pa || !pb) {
        return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase() ? 0 : -1;
    }
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return 1;
        if (pa[i] < pb[i]) return -1;
    }
    return 0;
}

function parseSha256Sums(text) {
    const map = Object.create(null);
    for (const rawLine of String(text || '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const m = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
        if (m) {
            map[path.basename(m[2].trim())] = m[1].toLowerCase();
        }
    }
    return map;
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    const buf = fs.readFileSync(filePath);
    hash.update(buf);
    return hash.digest('hex').toLowerCase();
}

function verifyFileSha256(filePath, checksumsText, expectedFileName) {
    const sums = parseSha256Sums(checksumsText);
    const key = path.basename(expectedFileName || filePath);
    const expected = sums[key];
    if (!expected) {
        return { ok: false, reason: `SHA256SUMS.txt 中未找到 ${key}`, actual: null, expected: null };
    }
    const actual = sha256File(filePath);
    return {
        ok: actual === expected,
        reason: actual === expected ? 'OK' : `SHA256 不匹配 (expected=${expected}, actual=${actual})`,
        actual,
        expected
    };
}

function extractReleaseSummary(bodyText, maxLines = 8) {
    const lines = String(bodyText || '').split(/\r?\n/);
    const picked = [];
    let inStopSection = false;
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (/^###\s+🚀|^###\s+🔒|^<details>|^<\/details>|^<summary>/.test(line)) {
            inStopSection = true;
            continue;
        }
        if (/^##\s+Antigravity (?:Custom Themes|Theme)/i.test(line)) continue;
        if (/^\*\*Full Changelog\*\*/i.test(line)) continue;
        if (inStopSection) continue;
        if (/^(?:###\s+|[-*]\s+|\d+\.\s+)/.test(line)) {
            picked.push(line);
            if (picked.length >= maxLines) break;
        }
    }
    return picked;
}

function decideUpdateMode({ oldHookVersion, newHookVersion, asarState }) {
    const oldVer = String(oldHookVersion || 'v1');
    const newVer = String(newHookVersion || 'v1');
    const hookChanged = oldVer !== newVer;
    const expectedState = `PATCHED_${newVer.toUpperCase()}`;
    if (!hookChanged && asarState === expectedState) {
        return 'hot';
    }
    return 'full';
}

function assertChecksumPresent(rel) {
    if (!rel || !rel.checksumUrl) {
        const tag = rel && rel.tag ? rel.tag : '<unknown>';
        throw new Error(`远端 Release ${tag} 缺少 SHA256SUMS.txt 校验文件，已拒绝更新`);
    }
}

function atomicCopyFile(srcPath, dstPath, { executableOnUnix = false } = {}) {
    const dir = path.dirname(dstPath);
    const base = path.basename(dstPath);
    const tmpPath = path.join(dir, `.${base}.tmp.${process.pid}.${Date.now()}`);
    try {
        fs.copyFileSync(srcPath, tmpPath);
        if (executableOnUnix && process.platform !== 'win32') {
            try {
                fs.chmodSync(tmpPath, 0o755);
            } catch {}
        }
        fs.renameSync(tmpPath, dstPath);
    } catch (err) {
        try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {}
        throw err;
    }
}

function httpGetBuffer(url, maxRedirects = 5, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const req = https.get(
            url,
            {
                headers: {
                    'User-Agent': 'Antigravity-Theme-Updater',
                    Accept: 'application/vnd.github+json'
                },
                timeout: timeoutMs
            },
            (res) => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    res.resume();
                    if (maxRedirects <= 0) {
                        return reject(new Error('HTTP 重定向次数过多'));
                    }
                    const nextUrl = new URL(res.headers.location, url).toString();
                    return resolve(httpGetBuffer(nextUrl, maxRedirects - 1, timeoutMs));
                }
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    res.resume();
                    return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            }
        );
        req.on('timeout', () => {
            req.destroy(new Error(`请求超时 (${timeoutMs}ms): ${url}`));
        });
        req.on('error', reject);
    });
}

async function fetchLatestRelease(repo, platformHint) {
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const buf = await httpGetBuffer(apiUrl);
    const data = JSON.parse(buf.toString('utf8'));
    const assets = Array.isArray(data.assets) ? data.assets : [];

    const plat = platformHint || (process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'universal');
    const zipAsset =
        assets.find((a) => a.name && a.name.endsWith(`-${plat}.zip`)) ||
        assets.find((a) => a.name && a.name.endsWith('-universal.zip')) ||
        assets.find((a) => a.name && a.name.endsWith('.zip')) ||
        null;
    const sumAsset = assets.find((a) => a.name === 'SHA256SUMS.txt') || null;

    return {
        tag: String(data.tag_name || ''),
        publishedAt: data.published_at ? String(data.published_at).slice(0, 10) : '近期',
        htmlUrl: String(data.html_url || `https://github.com/${repo}/releases/latest`),
        body: String(data.body || ''),
        assetName: zipAsset ? zipAsset.name : null,
        assetUrl: zipAsset ? zipAsset.browser_download_url : null,
        checksumUrl: sumAsset ? sumAsset.browser_download_url : null
    };
}

function extractZip(zipPath, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    if (process.platform === 'win32') {
        const tarRes = spawnSync('tar.exe', ['-xf', zipPath, '-C', destDir], { encoding: 'utf8' });
        if (tarRes.status === 0) return;
        const psRes = spawnSync(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`],
            { encoding: 'utf8' }
        );
        if (psRes.status !== 0) {
            throw new Error(`解压 ZIP 失败: ${psRes.stderr || tarRes.stderr}`);
        }
    } else {
        const res = spawnSync('unzip', ['-oq', zipPath, '-d', destDir], { encoding: 'utf8' });
        if (res.status !== 0) {
            throw new Error(`unzip 解压失败: ${res.stderr}`);
        }
    }
}

function copyDirContents(srcDir, dstDir) {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const dstPath = path.join(dstDir, entry.name);
        if (entry.isDirectory()) {
            copyDirContents(srcPath, dstPath);
        } else if (entry.isFile()) {
            const isUnixExec = entry.name.endsWith('.sh') || entry.name.endsWith('.command');
            atomicCopyFile(srcPath, dstPath, { executableOnUnix: isUnixExec });
        }
    }
}

function resolvePayloadSource(repoDir, manifest, fileName) {
    const payloadDir = manifest && typeof manifest.payloadDir === 'string' && manifest.payloadDir.trim()
        ? manifest.payloadDir.trim()
        : '';
    const candidates = [
        payloadDir ? path.join(repoDir, payloadDir, fileName) : '',
        path.join(repoDir, 'dist', 'runtime', fileName),
        path.join(repoDir, fileName)
    ].filter(Boolean);
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function resolveStagingRoot(stagingDir) {
    if (fs.existsSync(path.join(stagingDir, 'manifest.json'))) {
        return stagingDir;
    }
    const entries = fs.readdirSync(stagingDir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.'));
    if (entries.length === 1 && entries[0].isDirectory()) {
        const nested = path.join(stagingDir, entries[0].name);
        if (fs.existsSync(path.join(nested, 'manifest.json'))) {
            return nested;
        }
    }
    return stagingDir;
}

async function runCli() {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const manifest = loadManifest();

    if (cmd === 'check') {
        const platIdx = args.indexOf('--platform');
        const plat = platIdx >= 0 ? args[platIdx + 1] : undefined;
        const rel = await fetchLatestRelease(manifest.repo, plat);
        const hasUpdate = Boolean(rel.tag) && compareSemver(rel.tag, manifest.version) > 0;
        const out = {
            repo: manifest.repo,
            currentVersion: manifest.version,
            remoteTag: rel.tag,
            hasUpdate,
            publishedAt: rel.publishedAt,
            htmlUrl: rel.htmlUrl,
            assetName: rel.assetName,
            assetUrl: rel.assetUrl,
            checksumUrl: rel.checksumUrl,
            summary: extractReleaseSummary(rel.body, 8)
        };
        console.log(JSON.stringify(out, null, 2));
        return;
    }

    if (cmd === 'download') {
        const workDir = args[1];
        if (!workDir) throw new Error('download 需要提供临时工作目录路径');
        const platIdx = args.indexOf('--platform');
        const plat = platIdx >= 0 ? args[platIdx + 1] : undefined;

        const rel = await fetchLatestRelease(manifest.repo, plat);
        if (!rel.assetUrl || !rel.assetName) {
            throw new Error(`远端 Release ${rel.tag} 未找到可下载的 ZIP 资产`);
        }
        assertChecksumPresent(rel);

        fs.mkdirSync(workDir, { recursive: true });
        const zipPath = path.join(workDir, rel.assetName);
        const zipBuf = await httpGetBuffer(rel.assetUrl, 5, 30000);
        fs.writeFileSync(zipPath, zipBuf);

        const sumsText = (await httpGetBuffer(rel.checksumUrl)).toString('utf8');
        const v = verifyFileSha256(zipPath, sumsText, rel.assetName);
        if (!v.ok) {
            throw new Error(`下载包完整性校验失败: ${v.reason}`);
        }
        const verified = true;
        const zipSha = v.actual;

        const rawStagingDir = path.join(workDir, 'staging');
        extractZip(zipPath, rawStagingDir);
        const stagingDir = resolveStagingRoot(rawStagingDir);

        const newManifestPath = path.join(stagingDir, 'manifest.json');
        const newManifest = fs.existsSync(newManifestPath) ? loadManifest(newManifestPath) : {};
        const oldHookVersion = manifest.hookVersion || 'v1';
        const newHookVersion = newManifest.hookVersion || 'v1';

        console.log(
            JSON.stringify(
                {
                    remoteTag: rel.tag,
                    oldVersion: manifest.version,
                    newVersion: newManifest.version || rel.tag,
                    oldHookVersion,
                    newHookVersion,
                    hookChanged: oldHookVersion !== newHookVersion,
                    checksumVerified: verified,
                    zipSha256: zipSha,
                    stagingDir
                },
                null,
                2
            )
        );
        return;
    }

    if (cmd === 'apply') {
        const stagingDir = args[1];
        const repoDir = args[2];
        const themeDirs = args.slice(3).filter(Boolean);
        if (!stagingDir || !repoDir) {
            throw new Error('apply 需要提供 <stagingDir> <repoDir> [themeDirs...]');
        }
        copyDirContents(stagingDir, repoDir);
        const newManifestPath = path.join(repoDir, 'manifest.json');
        const newManifest = fs.existsSync(newManifestPath) ? loadManifest(newManifestPath) : manifest;
        const payloads = newManifest.payloads || ['current.css', 'current.js'];

        for (const dir of themeDirs) {
            fs.mkdirSync(dir, { recursive: true });
            for (const f of payloads) {
                const src = resolvePayloadSource(repoDir, newManifest, f);
                if (src) {
                    atomicCopyFile(src, path.join(dir, f));
                }
            }
        }
        console.log('APPLY_OK');
        return;
    }

    throw new Error(`未知命令: ${cmd || '<empty>'}（支持 check / download / apply）`);
}

if (require.main === module) {
    runCli().catch((err) => {
        console.error(err && err.message ? err.message : String(err));
        process.exit(1);
    });
} else {
    module.exports = {
        parseSemver,
        compareSemver,
        parseSha256Sums,
        verifyFileSha256,
        decideUpdateMode,
        assertChecksumPresent,
        atomicCopyFile,
        extractReleaseSummary,
        resolvePayloadSource,
        resolveStagingRoot
    };
}
