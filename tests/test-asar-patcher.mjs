#!/usr/bin/env node
'use strict';

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseElectronUpdaterYaml, verifyAsarFile } from '../scripts/check-antigravity-upstream.mjs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PATCHER = path.join(ROOT, 'core', 'asar-patcher.js');
const UPDATER = path.join(ROOT, 'core', 'updater.js');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

function buildIntegrity(buf, blockSize = 4194304) {
    const blocks = [];
    for (let i = 0; i < buf.length; i += blockSize) {
        blocks.push(sha256(buf.subarray(i, Math.min(i + blockSize, buf.length))));
    }
    return {
        algorithm: 'SHA256',
        hash: sha256(buf),
        blockSize,
        blocks
    };
}

/**
 * Build a spec-compliant Electron ASAR archive with files before and after dist/utils.js
 * so offset shifting and integrity verification are thoroughly exercised.
 */
function createSyntheticAsar(utilsContent, blockSize = 4194304) {
    const preBuf = Buffer.from('{"name":"antigravity-synthetic","version":"2.34.0"}\n', 'utf8');
    const utilsBuf = Buffer.from(utilsContent, 'utf8');
    const postBuf = Buffer.from('console.log("neighbor-after-utils");\n', 'utf8');

    const tree = {
        files: {
            'package.json': {
                size: preBuf.length,
                offset: '0',
                integrity: buildIntegrity(preBuf, blockSize)
            },
            dist: {
                files: {
                    'utils.js': {
                        size: utilsBuf.length,
                        offset: String(preBuf.length),
                        integrity: buildIntegrity(utilsBuf, blockSize)
                    },
                    'after.js': {
                        size: postBuf.length,
                        offset: String(preBuf.length + utilsBuf.length),
                        integrity: buildIntegrity(postBuf, blockSize)
                    }
                }
            }
        }
    };

    const jsonBuf = Buffer.from(JSON.stringify(tree), 'utf8');
    const pad = (4 - (jsonBuf.length % 4)) % 4;
    const payloadSize = 4 + jsonBuf.length + pad;
    const H = 8 + jsonBuf.length + pad;
    const headerBuf = Buffer.alloc(16 + jsonBuf.length + pad, 0);
    headerBuf.writeUInt32LE(4, 0);
    headerBuf.writeUInt32LE(H, 4);
    headerBuf.writeUInt32LE(payloadSize, 8);
    headerBuf.writeUInt32LE(jsonBuf.length, 12);
    jsonBuf.copy(headerBuf, 16);

    return Buffer.concat([headerBuf, preBuf, utilsBuf, postBuf]);
}

function runPatcher(args) {
    return spawnSync(process.execPath, [PATCHER, ...args], {
        encoding: 'utf8',
        env: { ...process.env, ELECTRON_NO_ASAR: '1' }
    });
}

function verifyNeighborIntact(asarPath) {
    const buf = fs.readFileSync(asarPath);
    const H = buf.readUInt32LE(4);
    const jsonLen = buf.readUInt32LE(12);
    const dataStart = 8 + H;
    const tree = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
    const afterNode = tree.files.dist.files['after.js'];
    const off = Number(afterNode.offset);
    const sz = Number(afterNode.size);
    const content = buf.toString('utf8', dataStart + off, dataStart + off + sz);
    assert.equal(content, 'console.log("neighbor-after-utils");\n', 'neighbor file after.js must remain intact after offset shift');
}

let passed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`[PASS] ${name}`);
    } catch (err) {
        console.error(`[FAIL] ${name}`);
        console.error(err);
        process.exitCode = 1;
    }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-theme-test-'));

try {
    test('manifest.json schema, repository identity, and compiled runtime payloads', () => {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        assert.match(manifest.version, /^v\d+\.\d+\.\d+/, 'version must be semver-like vX.Y.Z');
        assert.equal(manifest.repo, 'Django9944/antigravity-theme');
        assert.equal(manifest.payloadDir, 'dist/runtime');
        assert.match(manifest.hostUpdaterUrl, /^https:\/\/antigravity-hub-auto-updater-/, 'hostUpdaterUrl must point to official Antigravity updater');
        assert.match(manifest.verifiedHostVersion, /^\d+\.\d+\.\d+/, 'verifiedHostVersion must be defined');
        assert.ok(Array.isArray(manifest.anchors) && manifest.anchors.length >= 2);
        assert.ok(Array.isArray(manifest.payloads) && manifest.payloads.includes('current.css') && manifest.payloads.includes('current.js'));
        for (const p of manifest.payloads) {
            assert.ok(fs.existsSync(path.join(ROOT, manifest.payloadDir, p)), `payload ${manifest.payloadDir}/${p} must exist`);
        }
    });

    test('desktop JS modules and scripts pass node --check', () => {
        for (const rel of [
            path.join('dist', 'runtime', 'current.js'),
            path.join('core', 'asar-patcher.js'),
            path.join('core', 'updater.js'),
            path.join('scripts', 'check-host-compat.mjs'),
            path.join('scripts', 'check-antigravity-upstream.mjs'),
            path.join('preview', 'app.js')
        ]) {
            const res = spawnSync(process.execPath, ['--check', path.join(ROOT, rel)], { encoding: 'utf8' });
            assert.equal(res.status, 0, `${rel} syntax check failed: ${res.stderr}`);
        }
    });

    test('dist/runtime/current.js THEME_PACK_VERSION matches manifest.json and defaults to orbital', () => {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        const js = fs.readFileSync(path.join(ROOT, 'dist', 'runtime', 'current.js'), 'utf8');
        const m = js.match(/const\s+THEME_PACK_VERSION\s*=\s*['"]([^'"]+)['"]/);
        assert.ok(m, 'current.js must define THEME_PACK_VERSION');
        assert.equal(m[1], manifest.version, 'current.js THEME_PACK_VERSION must match manifest.json version');
        assert.match(js, /return\s+['"]orbital['"];/, 'default theme fallback must be orbital');
        assert.ok(js.includes('"id":"orbital"'), 'current.js must register orbital theme');
        assert.ok(js.includes('"id":"stock"'), 'current.js must register stock reset option');
    });

    test('core/updater.js semver, SHA256SUMS, update mode, resolvePayloadSource, and resolveStagingRoot', () => {
        const updater = require(UPDATER);
        assert.equal(updater.compareSemver('v0.2.0', 'v0.1.0'), 1);
        assert.equal(updater.compareSemver('v0.2.0', 'v0.2.0'), 0);
        assert.equal(updater.compareSemver('v0.1.9', 'v0.2.0'), -1);

        const sampleZip = path.join(tmpDir, 'sample-macos.zip');
        fs.writeFileSync(sampleZip, Buffer.from('synthetic-zip-payload'));
        const goodHash = sha256(fs.readFileSync(sampleZip));
        const sumsText = `${goodHash}  sample-macos.zip\n0000000000000000000000000000000000000000000000000000000000000000  other.zip\n`;
        assert.equal(updater.verifyFileSha256(sampleZip, sumsText, 'sample-macos.zip').ok, true);
        assert.equal(updater.verifyFileSha256(sampleZip, sumsText, 'other.zip').ok, false);
        assert.equal(updater.verifyFileSha256(sampleZip, sumsText, 'missing.zip').ok, false);

        assert.equal(updater.decideUpdateMode({ oldHookVersion: 'v1', newHookVersion: 'v1', asarState: 'PATCHED_V1' }), 'hot');
        assert.equal(updater.decideUpdateMode({ oldHookVersion: 'v1', newHookVersion: 'v2', asarState: 'PATCHED_V1' }), 'full');
        assert.equal(updater.decideUpdateMode({ oldHookVersion: 'v1', newHookVersion: 'v1', asarState: 'CLEAN' }), 'full');
        assert.equal(updater.decideUpdateMode({ oldHookVersion: 'v1', newHookVersion: 'v1', asarState: 'PATCHED_LEGACY' }), 'full');

        const resolvedCss = updater.resolvePayloadSource(ROOT, { payloadDir: 'dist/runtime' }, 'current.css');
        assert.equal(resolvedCss, path.join(ROOT, 'dist', 'runtime', 'current.css'));

        const wrappedDir = path.join(tmpDir, 'wrapped-staging');
        const innerDir = path.join(wrappedDir, 'bundle-root');
        fs.mkdirSync(innerDir, { recursive: true });
        fs.writeFileSync(path.join(innerDir, 'manifest.json'), '{}');
        assert.equal(updater.resolveStagingRoot(wrappedDir), innerDir);

        const flatDir = path.join(tmpDir, 'flat-staging');
        fs.mkdirSync(flatDir, { recursive: true });
        fs.writeFileSync(path.join(flatDir, 'manifest.json'), '{}');
        assert.equal(updater.resolveStagingRoot(flatDir), flatDir);
    });

    test('scripts/check-antigravity-upstream.mjs parses official Electron updater YAML and verifies ASAR', () => {
        const sampleYaml = [
            'version: 2.34.0',
            'files:',
            '  - url: https://storage.googleapis.com/antigravity-public/antigravity-hub/2.34.0-5887025308631040/darwin-arm/Antigravity.zip',
            '    sha512: 4mY3QkbpWxuru5gPvJrabdr3tMH/mnQDtallcA5m6bZQ6g3AClqU5N6gryt0eml7mrLtm7Vkb+iIQdDRB3wCFw==',
            '    size: 211599326',
            'path: Antigravity.zip',
            'sha512: 4mY3QkbpWxuru5gPvJrabdr3tMH/mnQDtallcA5m6bZQ6g3AClqU5N6gryt0eml7mrLtm7Vkb+iIQdDRB3wCFw=='
        ].join('\n');
        const parsed = parseElectronUpdaterYaml(sampleYaml);
        assert.equal(parsed.version, '2.34.0');
        assert.equal(parsed.buildId, '2.34.0-5887025308631040');
        assert.equal(parsed.fileName, 'Antigravity.zip');
        assert.equal(parsed.size, 211599326);

        const okAsar = path.join(tmpDir, 'host-ok.asar');
        fs.writeFileSync(okAsar, createSyntheticAsar('void loadHubWindowUrl(win, url, { skipBootstrapMint });\n'));
        const okRes = verifyAsarFile(okAsar);
        assert.equal(okRes.compatible, true);
        assert.equal(okRes.byteExact, true);

        const badAsar = path.join(tmpDir, 'host-bad.asar');
        fs.writeFileSync(badAsar, createSyntheticAsar('void futureLoadWindowUrl(win, url);\n'));
        const badRes = verifyAsarFile(badAsar);
        assert.equal(badRes.compatible, false);
        assert.ok(badRes.candidateHints.some((l) => l.includes('futureLoadWindowUrl')), 'should extract candidate anchor hints on failure');
    });

    test('dist/runtime/current.css has balanced braces and theme scoping', () => {
        const css = fs.readFileSync(path.join(ROOT, 'dist', 'runtime', 'current.css'), 'utf8');
        const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
        const opens = (clean.match(/\{/g) || []).length;
        const closes = (clean.match(/\}/g) || []).length;
        assert.equal(opens, closes, `current.css unbalanced braces: {=${opens}, }=${closes}`);
        assert.ok(css.includes('html[data-ag-custom-theme]'), 'current.css must scope styles under html[data-ag-custom-theme]');
    });

    test('installers preserve platform encodings, auto-heal labels, and legacy cleanup hooks', () => {
        const sh = fs.readFileSync(path.join(ROOT, 'install.sh'), 'utf8');
        assert.ok(!sh.includes('\r\n'), 'install.sh must use LF line endings');
        assert.ok(sh.includes('core/asar-patcher.js'));
        assert.ok(sh.includes('Django9944/antigravity-theme'));
        assert.ok(sh.includes('com.django9944.antigravity-theme.autoheal'));
        assert.ok(sh.includes('com.django9944.antigravity-custom-themes.autoheal'));

        const ps1Raw = fs.readFileSync(path.join(ROOT, 'install.ps1'));
        assert.equal(ps1Raw[0], 0xef, 'install.ps1 must begin with UTF-8 BOM');
        assert.equal(ps1Raw[1], 0xbb, 'install.ps1 must begin with UTF-8 BOM');
        assert.equal(ps1Raw[2], 0xbf, 'install.ps1 must begin with UTF-8 BOM');
        const ps1 = ps1Raw.toString('utf8');
        assert.ok(ps1.includes('AntigravityTheme-AutoHeal'));
        assert.ok(ps1.includes('AntigravityCustomThemes-AutoHeal'));

        for (const bat of ['install.bat', 'uninstall.bat', '检查更新.bat']) {
            const raw = fs.readFileSync(path.join(ROOT, bat), 'utf8');
            assert.ok(raw.includes('\r\n'), `${bat} must use CRLF line endings`);
        }
    });

    const anchorFixtures = [
        {
            name: 'Antigravity < 2.34 (win.loadURL)',
            code: 'function openHub(win, url) {\n    void win.loadURL(url);\n    return win;\n}\n'
        },
        {
            name: 'Antigravity 2.34+ (loadHubWindowUrl)',
            code: 'function openHub(win, url, skipBootstrapMint) {\n    void loadHubWindowUrl(win, url, { skipBootstrapMint });\n    return win;\n}\n'
        },
        {
            name: 'Future fallback regex variant',
            code: 'function openHub(win, url) {\n    void loadHubWindowUrl(win, url, { skipBootstrapMint: true, extra: 1 });\n    return win;\n}\n'
        }
    ];

    for (const fx of anchorFixtures) {
        test(`Full ASAR lifecycle (inspect -> inject -> idempotent -> doctor -> strip -> byte-exact): ${fx.name}`, () => {
            const stockBuf = createSyntheticAsar(fx.code);
            const stockHash = sha256(stockBuf);
            const stockPath = path.join(tmpDir, `stock-${passed}.asar`);
            const patched1 = path.join(tmpDir, `patched1-${passed}.asar`);
            const patched2 = path.join(tmpDir, `patched2-${passed}.asar`);
            const stripped = path.join(tmpDir, `stripped-${passed}.asar`);
            fs.writeFileSync(stockPath, stockBuf);

            let r = runPatcher(['inspect', stockPath]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(r.stdout.trim(), 'CLEAN');

            r = runPatcher(['inject', stockPath, patched1]);
            assert.equal(r.status, 0, r.stderr);
            assert.match(r.stdout.trim(), /^INJECT_OK:\d+$/);
            verifyNeighborIntact(patched1);

            r = runPatcher(['inspect', patched1]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(r.stdout.trim(), 'PATCHED_V1');

            r = runPatcher(['verify-patched', patched1]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(r.stdout.trim(), 'VERIFY_OK');

            r = runPatcher(['inject', patched1, patched2]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(sha256(fs.readFileSync(patched1)), sha256(fs.readFileSync(patched2)), 're-inject must be byte-idempotent');

            r = runPatcher(['doctor', patched1, '--json']);
            assert.equal(r.status, 0, r.stderr);
            const doc = JSON.parse(r.stdout);
            assert.equal(doc.status, 'PATCHED_V1');
            assert.equal(doc.integrityOk, true);
            assert.equal(doc.boundsOk, true);

            r = runPatcher(['strip', patched1, stripped]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(r.stdout.trim(), 'STRIP_OK');
            verifyNeighborIntact(stripped);

            r = runPatcher(['verify-clean', stripped]);
            assert.equal(r.status, 0, r.stderr);
            assert.equal(r.stdout.trim(), 'CLEAN_OK');

            const strippedHash = sha256(fs.readFileSync(stripped));
            assert.equal(strippedHash, stockHash, 'stripped ASAR must match original stock ASAR byte-for-byte');
        });
    }

    test('Legacy hook upgrade to V1 and clean strip to stock', () => {
        const stockCode = 'function openHub(win, url) {\n    void win.loadURL(url);\n    return win;\n}\n';
        const legacyHook =
            '    // === Antigravity custom-theme injection hook (start) ===\n' +
            '    console.log("old");\n' +
            '    // === Antigravity custom-theme injection hook (end) ===\n';
        const legacyCode = stockCode.replace('void win.loadURL(url);\n', 'void win.loadURL(url);\n' + legacyHook);

        const stockBuf = createSyntheticAsar(stockCode);
        const legacyPath = path.join(tmpDir, 'legacy.asar');
        const upgradedPath = path.join(tmpDir, 'upgraded.asar');
        const strippedPath = path.join(tmpDir, 'legacy-stripped.asar');
        fs.writeFileSync(legacyPath, createSyntheticAsar(legacyCode));

        let r = runPatcher(['inspect', legacyPath]);
        assert.equal(r.status, 0, r.stderr);
        assert.equal(r.stdout.trim(), 'PATCHED_LEGACY');

        r = runPatcher(['inject', legacyPath, upgradedPath]);
        assert.equal(r.status, 0, r.stderr);

        r = runPatcher(['verify-patched', upgradedPath]);
        assert.equal(r.status, 0, r.stderr);

        r = runPatcher(['strip', upgradedPath, strippedPath]);
        assert.equal(r.status, 0, r.stderr);
        assert.equal(sha256(fs.readFileSync(strippedPath)), sha256(stockBuf));
    });

    test('Multi-block (>4MB) utils.js integrity calculation and round-trip', () => {
        const bigPad = '// ' + 'x'.repeat(4 * 1024 * 1024 + 1024) + '\n';
        const bigCode = bigPad + 'void loadHubWindowUrl(win, url, { skipBootstrapMint });\n';
        const stockBuf = createSyntheticAsar(bigCode);
        const stockPath = path.join(tmpDir, 'big.asar');
        const patchedPath = path.join(tmpDir, 'big-patched.asar');
        const strippedPath = path.join(tmpDir, 'big-stripped.asar');
        fs.writeFileSync(stockPath, stockBuf);

        let r = runPatcher(['inject', stockPath, patchedPath]);
        assert.equal(r.status, 0, r.stderr);

        r = runPatcher(['verify-patched', patchedPath]);
        assert.equal(r.status, 0, r.stderr);

        r = runPatcher(['strip', patchedPath, strippedPath]);
        assert.equal(r.status, 0, r.stderr);
        assert.equal(sha256(fs.readFileSync(strippedPath)), sha256(stockBuf));
    });

    test('Missing anchor fails safely with exit code 2', () => {
        const badPath = path.join(tmpDir, 'no-anchor.asar');
        fs.writeFileSync(badPath, createSyntheticAsar('function unrelated() { return 42; }\n'));

        const r = runPatcher(['inspect', badPath]);
        assert.equal(r.status, 2);
        assert.ok(r.stderr.includes('ANCHOR_MISSING'));

        const d = runPatcher(['doctor', badPath, '--json']);
        assert.equal(d.status, 2);
        assert.equal(JSON.parse(d.stdout).status, 'ANCHOR_MISSING');
    });

    if (process.platform === 'win32') {
        test('Windows install.ps1 end-to-end sandbox install -> doctor -> uninstall -> auto-heal', () => {
            const fakeApp = path.join(tmpDir, 'FakeAntigravity');
            const fakeRes = path.join(fakeApp, 'resources');
            fs.mkdirSync(fakeRes, { recursive: true });
            const stockBuf = createSyntheticAsar('void loadHubWindowUrl(win, url, { skipBootstrapMint });\n');
            const fakeAsar = path.join(fakeRes, 'app.asar');
            fs.writeFileSync(fakeAsar, stockBuf);

            const psExe = 'powershell.exe';
            const psBase = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'install.ps1'), '-AppPath', fakeApp, '-NonInteractive'];
            const fakeUserData = path.join(tmpDir, 'WinUserData');
            const winEnv = { ...process.env, AG_USER_DATA_DIR: fakeUserData };

            let r = spawnSync(psExe, psBase, { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 0, `install.ps1 failed:\n${r.stdout}\n${r.stderr}`);
            assert.ok(fs.existsSync(path.join(fakeRes, 'app.asar.stock-backup')));
            assert.ok(fs.existsSync(path.join(fakeRes, 'custom-theme', 'current.css')));
            assert.ok(fs.existsSync(path.join(fakeRes, 'custom-theme', 'current.js')));
            assert.ok(fs.existsSync(path.join(fakeUserData, 'custom-theme', 'current.css')));

            r = spawnSync(psExe, [...psBase, '-Doctor'], { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 0, `install.ps1 -Doctor failed:\n${r.stdout}\n${r.stderr}`);
            assert.ok(r.stdout.includes('PATCHED_V1'));

            r = spawnSync(psExe, [...psBase, '-Uninstall'], { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 0, `install.ps1 -Uninstall failed:\n${r.stdout}\n${r.stderr}`);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), sha256(stockBuf));
            assert.ok(!fs.existsSync(path.join(fakeRes, 'app.asar.stock-backup')));
            assert.ok(!fs.existsSync(path.join(fakeUserData, 'custom-theme')));

            r = spawnSync(psExe, [...psBase, '-AutoHeal'], { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 0, `install.ps1 -AutoHeal (CLEAN) failed:\n${r.stdout}\n${r.stderr}`);
            const healedHash = sha256(fs.readFileSync(fakeAsar));
            assert.notEqual(healedHash, sha256(stockBuf));

            r = spawnSync(psExe, [...psBase, '-AutoHeal'], { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 0);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), healedHash);

            const badBuf = createSyntheticAsar('function noAnchor() {}\n');
            fs.writeFileSync(fakeAsar, badBuf);
            r = spawnSync(psExe, [...psBase, '-AutoHeal'], { encoding: 'utf8', env: winEnv });
            assert.equal(r.status, 2);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), sha256(badBuf));
        });
    }

    if (process.platform === 'darwin' || process.platform === 'linux') {
        test('Unix install.sh end-to-end sandbox install -> doctor -> uninstall -> auto-heal', () => {
            const fakeApp = path.join(tmpDir, 'FakeAntigravity.app');
            const fakeRes = path.join(fakeApp, 'Contents', 'Resources');
            const fakeUserData = path.join(tmpDir, 'UserData');
            fs.mkdirSync(fakeRes, { recursive: true });
            const stockBuf = createSyntheticAsar('void loadHubWindowUrl(win, url, { skipBootstrapMint });\n');
            const fakeAsar = path.join(fakeRes, 'app.asar');
            fs.writeFileSync(fakeAsar, stockBuf);

            const env = { ...process.env, AG_USER_DATA_DIR: fakeUserData };
            const baseArgs = [path.join(ROOT, 'install.sh'), '--app-path', fakeApp, '--non-interactive'];

            let r = spawnSync('bash', [...baseArgs, '--install'], { encoding: 'utf8', env });
            assert.equal(r.status, 0, `install.sh --install failed:\n${r.stdout}\n${r.stderr}`);
            assert.ok(fs.existsSync(path.join(fakeRes, 'custom-theme', 'current.css')));
            assert.ok(fs.existsSync(path.join(fakeRes, 'custom-theme', 'current.js')));
            assert.ok(fs.existsSync(path.join(fakeUserData, 'custom-theme', 'current.css')));

            // Idempotent reinstall succeeds cleanly
            r = spawnSync('bash', [...baseArgs, '--install'], { encoding: 'utf8', env });
            assert.equal(r.status, 0, `install.sh idempotent reinstall failed:\n${r.stdout}\n${r.stderr}`);

            r = spawnSync('bash', [...baseArgs, '--doctor'], { encoding: 'utf8', env });
            assert.equal(r.status, 0, `install.sh --doctor failed:\n${r.stdout}\n${r.stderr}`);
            assert.ok(r.stdout.includes('PATCHED_V1'));

            r = spawnSync('bash', [...baseArgs, '--uninstall'], { encoding: 'utf8', env });
            assert.equal(r.status, 0, `install.sh --uninstall failed:\n${r.stdout}\n${r.stderr}`);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), sha256(stockBuf), 'uninstalled ASAR must match stock byte-for-byte');
            assert.ok(!fs.existsSync(path.join(fakeRes, 'custom-theme')), 'app Contents/Resources/custom-theme should be removed on uninstall');

            r = spawnSync('bash', [...baseArgs, '--auto-heal'], { encoding: 'utf8', env });
            assert.equal(r.status, 0, `install.sh --auto-heal (CLEAN) failed:\n${r.stdout}\n${r.stderr}`);
            const healedHash = sha256(fs.readFileSync(fakeAsar));
            assert.notEqual(healedHash, sha256(stockBuf));

            r = spawnSync('bash', [...baseArgs, '--auto-heal'], { encoding: 'utf8', env });
            assert.equal(r.status, 0);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), healedHash);

            const badBuf = createSyntheticAsar('function noAnchor() {}\n');
            fs.writeFileSync(fakeAsar, badBuf);
            r = spawnSync('bash', [...baseArgs, '--auto-heal'], { encoding: 'utf8', env });
            assert.equal(r.status, 2);
            assert.equal(sha256(fs.readFileSync(fakeAsar)), sha256(badBuf));
        });
    }
} finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

if (process.exitCode && process.exitCode !== 0) {
    console.error('\nSome tests failed.');
    process.exit(process.exitCode);
} else {
    console.log(`\nAll ${passed} tests passed!`);
}
