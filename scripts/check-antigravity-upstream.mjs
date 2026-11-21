#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const PATCHER = path.join(ROOT, 'core', 'asar-patcher.js');

export function parseElectronUpdaterYaml(yamlText) {
    const text = String(yamlText || '');
    const versionMatch = text.match(/^version:\s*([^\r\n]+)/m);
    const urlMatch = text.match(/^\s*-\s*url:\s*([^\r\n]+)/m);
    const sha512Match = text.match(/^sha512:\s*([^\r\n]+)/m) || text.match(/^\s*sha512:\s*([^\r\n]+)/m);
    const sizeMatch = text.match(/^\s*size:\s*(\d+)/m);
    const pathMatch = text.match(/^path:\s*([^\r\n]+)/m);

    const url = urlMatch ? urlMatch[1].trim() : '';
    const buildIdMatch = url.match(/\/antigravity-hub\/([^/]+)\//);

    return {
        version: versionMatch ? versionMatch[1].trim() : '',
        buildId: buildIdMatch ? buildIdMatch[1].trim() : '',
        url,
        sha512: sha512Match ? sha512Match[1].trim() : '',
        size: sizeMatch ? Number(sizeMatch[1]) : 0,
        fileName: pathMatch ? pathMatch[1].trim() : (url ? path.basename(url) : '')
    };
}

function httpGetBuffer(url, headers = {}, maxRedirects = 5, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const req = https.get(
            url,
            {
                headers: {
                    'User-Agent': 'Antigravity-Theme-HostWatcher',
                    'x-app-version': '2.0.0',
                    ...headers
                },
                timeout: timeoutMs
            },
            (res) => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    res.resume();
                    if (maxRedirects <= 0) return reject(new Error('HTTP 重定向过多'));
                    const nextUrl = new URL(res.headers.location, url).toString();
                    return resolve(httpGetBuffer(nextUrl, headers, maxRedirects - 1, timeoutMs));
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
        req.on('timeout', () => req.destroy(new Error(`请求超时 (${timeoutMs}ms): ${url}`)));
        req.on('error', reject);
    });
}

function extractCandidateLinesFromAsar(asarPath) {
    try {
        const buf = fs.readFileSync(asarPath);
        const H = buf.readUInt32LE(4);
        const jsonLen = buf.readUInt32LE(12);
        const dataStart = 8 + H;
        const tree = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
        const uNode = tree?.files?.dist?.files?.['utils.js'];
        if (!uNode) return [];
        const content = buf.toString('utf8', dataStart + Number(uNode.offset), dataStart + Number(uNode.offset) + Number(uNode.size));
        const lines = content.split(/\r?\n/);
        const hits = [];
        for (let i = 0; i < lines.length; i++) {
            if (/(?:loadHubWindowUrl|loadURL|WindowUrl|did-finish-load|dom-ready)/.test(lines[i])) {
                hits.push(`L${i + 1}: ${lines[i].trim().slice(0, 140)}`);
            }
        }
        return hits.slice(0, 15);
    } catch {
        return [];
    }
}

export function verifyAsarFile(asarPath) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-host-verify-'));
    try {
        const docRes = spawnSync(process.execPath, [PATCHER, 'doctor', asarPath, '--json'], {
            encoding: 'utf8',
            env: { ...process.env, ELECTRON_NO_ASAR: '1' }
        });
        const doctor = docRes.stdout ? JSON.parse(docRes.stdout) : { status: 'ERROR', error: docRes.stderr };
        if (doctor.status === 'ANCHOR_MISSING' || docRes.status !== 0) {
            return {
                compatible: false,
                doctor,
                lifecycleOk: false,
                candidateHints: extractCandidateLinesFromAsar(asarPath)
            };
        }

        const patchedPath = path.join(tmpDir, 'patched.asar');
        const strippedPath = path.join(tmpDir, 'stripped.asar');

        const inj = spawnSync(process.execPath, [PATCHER, 'inject', asarPath, patchedPath], {
            encoding: 'utf8',
            env: { ...process.env, ELECTRON_NO_ASAR: '1' }
        });
        const verP = spawnSync(process.execPath, [PATCHER, 'verify-patched', patchedPath], {
            encoding: 'utf8',
            env: { ...process.env, ELECTRON_NO_ASAR: '1' }
        });
        const str = spawnSync(process.execPath, [PATCHER, 'strip', patchedPath, strippedPath], {
            encoding: 'utf8',
            env: { ...process.env, ELECTRON_NO_ASAR: '1' }
        });
        const verC = spawnSync(process.execPath, [PATCHER, 'verify-clean', strippedPath], {
            encoding: 'utf8',
            env: { ...process.env, ELECTRON_NO_ASAR: '1' }
        });

        let byteExact = false;
        if (doctor.status === 'CLEAN' && fs.existsSync(strippedPath)) {
            const origHash = crypto.createHash('sha256').update(fs.readFileSync(asarPath)).digest('hex');
            const stripHash = crypto.createHash('sha256').update(fs.readFileSync(strippedPath)).digest('hex');
            byteExact = origHash === stripHash;
        } else {
            byteExact = verC.status === 0;
        }

        const lifecycleOk = inj.status === 0 && verP.status === 0 && str.status === 0 && verC.status === 0 && byteExact;
        return {
            compatible: lifecycleOk,
            doctor,
            lifecycleOk,
            byteExact,
            candidateHints: lifecycleOk ? [] : extractCandidateLinesFromAsar(asarPath)
        };
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

async function downloadAndVerifyRemoteMacAsar(zipUrl) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-remote-mac-'));
    try {
        const zipPath = path.join(tmpDir, 'Antigravity.zip');
        const dlRes = spawnSync('curl', ['-sSL', '--max-time', '180', '-o', zipPath, zipUrl], { encoding: 'utf8' });
        if (dlRes.status !== 0 || !fs.existsSync(zipPath)) {
            throw new Error(`下载 Antigravity.zip 失败: ${dlRes.stderr}`);
        }
        const uzRes = spawnSync('unzip', ['-q', zipPath, '*/Contents/Resources/app.asar', '-d', tmpDir], { encoding: 'utf8' });
        if (uzRes.status !== 0) {
            throw new Error(`从 Antigravity.zip 提取 app.asar 失败: ${uzRes.stderr}`);
        }
        const extractedAsar = path.join(tmpDir, 'Antigravity.app', 'Contents', 'Resources', 'app.asar');
        if (!fs.existsSync(extractedAsar)) {
            throw new Error('解压后未找到 Antigravity.app/Contents/Resources/app.asar');
        }
        return verifyAsarFile(extractedAsar);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

async function runCli() {
    const args = process.argv.slice(2);
    const asJson = args.includes('--json');
    const verifyRemote = args.includes('--verify-remote-asar');
    const localIdx = args.indexOf('--verify-local-asar');
    const localAsar = localIdx >= 0 ? args[localIdx + 1] : '';

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const baseUrl = (manifest.hostUpdaterUrl || 'https://antigravity-hub-auto-updater-974169037036.us-central1.run.app/manifest').replace(/\/+$/, '');

    const channels = {
        win_x64: 'latest-x64-win.yml',
        mac_arm64: 'latest-arm64-mac.yml',
        mac_x64: 'latest-x64-mac.yml'
    };

    const platforms = {};
    for (const [key, file] of Object.entries(channels)) {
        const raw = (await httpGetBuffer(`${baseUrl}/${file}`)).toString('utf8');
        platforms[key] = parseElectronUpdaterYaml(raw);
    }

    const latestVersion = platforms.mac_arm64?.version || platforms.win_x64?.version || '';
    const buildId = platforms.mac_arm64?.buildId || platforms.win_x64?.buildId || '';
    const verifiedHostVersion = manifest.verifiedHostVersion || '';

    let asarVerification = null;
    if (localAsar) {
        asarVerification = verifyAsarFile(localAsar);
    } else if (verifyRemote && platforms.mac_arm64?.url) {
        asarVerification = await downloadAndVerifyRemoteMacAsar(platforms.mac_arm64.url);
    }

    const result = {
        checkedAt: new Date().toISOString(),
        themeVersion: manifest.version,
        verifiedHostVersion,
        latestHostVersion: latestVersion,
        buildId,
        isNewHostVersion: Boolean(latestVersion && latestVersion !== verifiedHostVersion),
        platforms,
        asarVerification
    };

    if (asJson) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('=== Antigravity Official Release Monitor ===');
        console.log(`Latest Host Version   : ${result.latestHostVersion} (build: ${result.buildId})`);
        console.log(`Verified Host Version : ${result.verifiedHostVersion}`);
        console.log(`Is New Host Version   : ${result.isNewHostVersion}`);
        console.log(`Windows x64 Package   : ${platforms.win_x64?.url}`);
        console.log(`macOS arm64 Package   : ${platforms.mac_arm64?.url}`);
        console.log(`macOS x64 Package     : ${platforms.mac_x64?.url}`);
        if (asarVerification) {
            console.log(`ASAR Compatibility    : ${asarVerification.compatible ? 'COMPATIBLE (INJECT & STRIP OK)' : 'INCOMPATIBLE'}`);
            console.log(`Matched Anchor        : ${asarVerification.doctor?.matchedAnchor || '<NONE>'}`);
        }
        console.log('============================================');
    }

    if (asarVerification && !asarVerification.compatible) {
        process.exit(2);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    runCli().catch((err) => {
        console.error(err && err.message ? err.message : String(err));
        process.exit(1);
    });
}
