#!/usr/bin/env node
'use strict';

// Ensure Electron's built-in ASAR filesystem intercept never hijacks fs calls
process.noAsar = true;

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'manifest.json');

function loadManifest() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error(`找不到清单文件: ${MANIFEST_PATH}`);
    }
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw);
}

const MANIFEST = loadManifest();
const ANCHORS = Array.isArray(MANIFEST.anchors) ? MANIFEST.anchors : [];
const ANCHOR_FALLBACK_RE = MANIFEST.anchorFallbackRegex
    ? new RegExp(MANIFEST.anchorFallbackRegex)
    : null;
const HOOK_VERSION = MANIFEST.hookVersion || 'v1';
const HOOK_START = MANIFEST.hookStartMarker || `/* === Antigravity Custom Theme Hook ${HOOK_VERSION} === */`;
const HOOK_END = MANIFEST.hookEndMarker || '/* === End Antigravity Custom Theme Hook === */';
const LEGACY_MARKER = MANIFEST.legacyMarker || 'custom-theme injection hook';

const HOOK_BLOCK = `
${HOOK_START}
try {
    const path_ = require('path');
    const fs_ = require('fs');
    const _ctCandidates = [
        path_.join(process.resourcesPath || '', 'custom-theme'),
        (typeof electron_1 !== 'undefined' && electron_1.app && typeof electron_1.app.getPath === 'function')
            ? path_.join(electron_1.app.getPath('userData'), 'custom-theme') : '',
        path_.join(process.env.HOME || '', 'Library', 'Application Support', 'Antigravity', 'custom-theme'),
        path_.join(process.env.APPDATA || '', 'Antigravity', 'custom-theme')
    ].filter(Boolean);
    const _ctRead = (name) => {
        for (const _d of _ctCandidates) {
            try {
                const _f = path_.join(_d, name);
                if (fs_.existsSync(_f)) return fs_.readFileSync(_f, 'utf8');
            } catch (e) {}
        }
        return null;
    };
    const _ctInject = () => {
        try {
            if (win.isDestroyed?.() || win.webContents?.isDestroyed?.()) return;
            const _css = _ctRead('current.css');
            if (_css && _css.trim()) win.webContents.insertCSS(_css).catch(() => {});
            const _js = _ctRead('current.js');
            if (_js && _js.trim()) win.webContents.executeJavaScript(_js, true).catch(() => {});
        } catch (e) {}
    };
    win.webContents.on('dom-ready', _ctInject);
    win.webContents.on('did-finish-load', _ctInject);
} catch (e) {}
${HOOK_END}`;

function findAnchor(text) {
    if (!text) return null;
    for (const candidate of ANCHORS) {
        if (text.includes(candidate)) return candidate;
    }
    if (ANCHOR_FALLBACK_RE) {
        const match = text.match(ANCHOR_FALLBACK_RE);
        if (match) return match[0];
    }
    return null;
}

function collectUtilsEntries(root) {
    const entries = [];
    function walk(node, relPath) {
        if (!node || typeof node !== 'object' || !node.files || typeof node.files !== 'object') {
            return;
        }
        for (const [name, child] of Object.entries(node.files)) {
            if (!child || typeof child !== 'object') continue;
            const nextPath = relPath ? `${relPath}/${name}` : name;
            if (child.files) {
                walk(child, nextPath);
            } else if (name === 'utils.js' && child.offset !== undefined && child.size !== undefined) {
                entries.push({ relPath: nextPath, node: child });
            }
        }
    }
    walk(root, '');
    entries.sort((a, b) => {
        if (a.relPath === 'dist/utils.js') return -1;
        if (b.relPath === 'dist/utils.js') return 1;
        return a.relPath.localeCompare(b.relPath);
    });
    return entries;
}

function parseAsar(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`ASAR 文件不存在: ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    if (buf.length < 16) {
        throw new Error(`ASAR 文件长度不足 16 字节: ${filePath}`);
    }
    const u0 = buf.readUInt32LE(0);
    const H = buf.readUInt32LE(4);
    const payloadSize = buf.readUInt32LE(8);
    const jsonLen = buf.readUInt32LE(12);
    const dataStart = 8 + H;
    if (u0 !== 4 || jsonLen === 0 || 16 + jsonLen > buf.length || dataStart > buf.length) {
        throw new Error(`ASAR 头部结构无效 (u0=${u0}, H=${H}, jsonLen=${jsonLen}, len=${buf.length})`);
    }
    const jsonStr = buf.toString('utf8', 16, 16 + jsonLen);
    const tree = JSON.parse(jsonStr);
    const candidates = collectUtilsEntries(tree);
    if (candidates.length === 0) {
        throw new Error('ASAR 头部未找到 utils.js 条目');
    }

    let selected = null;
    for (const item of candidates) {
        const offset = Number(item.node.offset);
        const size = Number(item.node.size);
        if (offset < 0 || size <= 0 || dataStart + offset + size > buf.length) {
            continue;
        }
        const content = buf.toString('utf8', dataStart + offset, dataStart + offset + size);
        if (findAnchor(content) || content.includes(HOOK_START) || content.includes(LEGACY_MARKER)) {
            selected = { ...item, offset, size, content };
            break;
        }
        if (!selected) {
            selected = { ...item, offset, size, content };
        }
    }

    if (!selected) {
        throw new Error('ASAR 中的 utils.js 偏移或大小越界');
    }

    return {
        buf,
        H,
        payloadSize,
        jsonLen,
        dataStart,
        tree,
        utilsPath: selected.relPath,
        utilsNode: selected.node,
        offset: selected.offset,
        size: selected.size,
        content: selected.content
    };
}

function stripHooksFromText(text) {
    let out = text;
    out = out.replace(
        /\r?\n\/\* === Antigravity Custom Theme Hook v\d+ === \*\/[\s\S]*?\/\* === End Antigravity Custom Theme Hook === \*\//g,
        ''
    );
    out = out.replace(
        /\/\* === Antigravity Custom Theme Hook v\d+ === \*\/[\s\S]*?\/\* === End Antigravity Custom Theme Hook === \*\/\r?\n?/g,
        ''
    );
    out = out.replace(
        /[ \t]*\/\/ === Antigravity custom-theme injection hook(?: v\d+)? \(start\) ===[\s\S]*?\/\/ === Antigravity custom-theme injection hook(?: v\d+)? \(end\) ===\r?\n?/g,
        ''
    );
    return out;
}

function verifyNodeIntegrity(buf, dataStart, node) {
    const off = Number(node.offset);
    const sz = Number(node.size);
    if (off < 0 || sz < 0 || dataStart + off + sz > buf.length) return false;
    if (!node.integrity) return true;
    const slice = buf.subarray(dataStart + off, dataStart + off + sz);
    const fullHash = crypto.createHash('sha256').update(slice).digest('hex');
    if (fullHash !== String(node.integrity.hash).toLowerCase()) return false;
    const bs = Number(node.integrity.blockSize) || 4194304;
    const blocks = node.integrity.blocks || [];
    const expectedBlocks = sz === 0 ? 0 : Math.ceil(sz / bs);
    if (blocks.length !== expectedBlocks) return false;
    for (let i = 0; i < blocks.length; i++) {
        const bSlice = slice.subarray(i * bs, Math.min((i + 1) * bs, sz));
        const bHash = crypto.createHash('sha256').update(bSlice).digest('hex');
        if (bHash !== String(blocks[i]).toLowerCase()) return false;
    }
    return true;
}

function verifyAllBounds(buf, dataStart, root) {
    let ok = true;
    function walk(n) {
        if (!n || !n.files) return;
        for (const v of Object.values(n.files)) {
            if (v.files) {
                walk(v);
            } else if (v.offset !== undefined && v.size !== undefined) {
                const off = Number(v.offset);
                const sz = Number(v.size);
                if (off < 0 || sz < 0 || dataStart + off + sz > buf.length) {
                    ok = false;
                }
            }
        }
    }
    walk(root);
    return ok;
}

function rebuildAsarWithNewUtils(parsed, newUtilsStr) {
    const { buf, dataStart, tree, utilsNode, offset: oldOff, size: oldSize } = parsed;
    const newUtilsBuf = Buffer.from(newUtilsStr, 'utf8');
    const delta = newUtilsBuf.length - oldSize;

    utilsNode.size = newUtilsBuf.length;
    const bs = (utilsNode.integrity && Number(utilsNode.integrity.blockSize)) || 4194304;
    const blocks = [];
    for (let i = 0; i < newUtilsBuf.length; i += bs) {
        blocks.push(
            crypto.createHash('sha256')
                .update(newUtilsBuf.subarray(i, Math.min(i + bs, newUtilsBuf.length)))
                .digest('hex')
        );
    }
    utilsNode.integrity = {
        algorithm: 'SHA256',
        hash: crypto.createHash('sha256').update(newUtilsBuf).digest('hex'),
        blockSize: bs,
        blocks
    };

    function shiftOffsets(node) {
        if (!node || !node.files) return;
        for (const v of Object.values(node.files)) {
            if (v.files) {
                shiftOffsets(v);
            } else if (v.offset !== undefined && Number(v.offset) > oldOff) {
                v.offset = String(Number(v.offset) + delta);
            }
        }
    }
    shiftOffsets(tree);

    const newJsonBuf = Buffer.from(JSON.stringify(tree), 'utf8');
    const pad = (4 - (newJsonBuf.length % 4)) % 4;
    const newPayloadSize = 4 + newJsonBuf.length + pad;
    const newH = 8 + newJsonBuf.length + pad;
    const headerBuf = Buffer.alloc(16 + newJsonBuf.length + pad, 0);
    headerBuf.writeUInt32LE(4, 0);
    headerBuf.writeUInt32LE(newH, 4);
    headerBuf.writeUInt32LE(newPayloadSize, 8);
    headerBuf.writeUInt32LE(newJsonBuf.length, 12);
    newJsonBuf.copy(headerBuf, 16);

    return Buffer.concat([
        headerBuf,
        buf.subarray(dataStart, dataStart + oldOff),
        newUtilsBuf,
        buf.subarray(dataStart + oldOff + oldSize)
    ]);
}

function main() {
    const [action, targetAsar, outputAsar] = process.argv.slice(2);

    if (!action) {
        console.error('用法: asar-patcher.js <inspect|verify-patched|verify-clean|inject|strip|doctor|meta> [args...]');
        process.exit(1);
    }

    if (action === 'meta') {
        const key = targetAsar;
        if (!key) {
            console.log(JSON.stringify(MANIFEST, null, 2));
            process.exit(0);
        }
        const val = MANIFEST[key];
        if (val === undefined) {
            console.error(`manifest.json 中不存在字段: ${key}`);
            process.exit(1);
        }
        console.log(typeof val === 'string' ? val : JSON.stringify(val));
        process.exit(0);
    }

    if (!targetAsar) {
        console.error(`操作 ${action} 需要提供目标 app.asar 路径`);
        process.exit(1);
    }

    const parsed = parseAsar(targetAsar);
    const hasV1Hook = parsed.content.includes(HOOK_START) && parsed.content.includes(HOOK_END);
    const hasLegacyHook = parsed.content.includes(LEGACY_MARKER);
    const matchedAnchor = findAnchor(parsed.content);
    const hasAnchor = Boolean(matchedAnchor);

    if (action === 'inspect') {
        if (!hasAnchor) {
            console.error('ANCHOR_MISSING');
            process.exit(2);
        }
        if (hasV1Hook) {
            console.log('PATCHED_V1');
        } else if (hasLegacyHook) {
            console.log('PATCHED_LEGACY');
        } else {
            console.log('CLEAN');
        }
        process.exit(0);
    }

    if (action === 'doctor') {
        const integrityOk = verifyNodeIntegrity(parsed.buf, parsed.dataStart, parsed.utilsNode);
        const boundsOk = verifyAllBounds(parsed.buf, parsed.dataStart, parsed.tree);
        const status = !hasAnchor
            ? 'ANCHOR_MISSING'
            : hasV1Hook
                ? 'PATCHED_V1'
                : hasLegacyHook
                    ? 'PATCHED_LEGACY'
                    : 'CLEAN';
        const report = {
            manifestVersion: MANIFEST.version,
            repo: MANIFEST.repo,
            hookVersion: HOOK_VERSION,
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            asarSize: parsed.buf.length,
            asarSha256: crypto.createHash('sha256').update(parsed.buf).digest('hex').slice(0, 16),
            utilsPath: parsed.utilsPath,
            utilsSize: parsed.size,
            status,
            matchedAnchor: matchedAnchor || null,
            hasV1Hook,
            hasLegacyHook,
            integrityOk,
            boundsOk
        };
        if (outputAsar === '--json') {
            console.log(JSON.stringify(report, null, 2));
        } else {
            console.log('--- Antigravity Theme Doctor ---');
            console.log(`Theme Version  : ${report.manifestVersion} (${report.repo})`);
            console.log(`Platform       : ${report.platform}/${report.arch} (Node ${report.nodeVersion})`);
            console.log(`ASAR Size      : ${report.asarSize} bytes (sha256:${report.asarSha256}...)`);
            console.log(`Utils Entry    : ${report.utilsPath} (${report.utilsSize} bytes)`);
            console.log(`Patch Status   : ${report.status}`);
            console.log(`Matched Anchor : ${report.matchedAnchor || '<NONE>'}`);
            console.log(`Integrity OK   : ${report.integrityOk}`);
            console.log(`Bounds OK      : ${report.boundsOk}`);
            console.log('--------------------------------');
        }
        process.exit(hasAnchor && integrityOk && boundsOk ? 0 : 2);
    }

    if (action === 'verify-patched') {
        const integrityOk = verifyNodeIntegrity(parsed.buf, parsed.dataStart, parsed.utilsNode);
        const boundsOk = verifyAllBounds(parsed.buf, parsed.dataStart, parsed.tree);
        const hasCandidates =
            parsed.content.includes('_ctCandidates') &&
            parsed.content.includes("require('path')") &&
            parsed.content.includes("app.getPath('userData')");
        if (hasV1Hook && hasAnchor && hasCandidates && integrityOk && boundsOk) {
            console.log('VERIFY_OK');
            process.exit(0);
        }
        console.error(
            `VERIFY_FAILED: hook=${hasV1Hook} anchor=${hasAnchor} candidates=${hasCandidates} integrity=${integrityOk} bounds=${boundsOk}`
        );
        process.exit(1);
    }

    if (action === 'verify-clean') {
        const integrityOk = verifyNodeIntegrity(parsed.buf, parsed.dataStart, parsed.utilsNode);
        const boundsOk = verifyAllBounds(parsed.buf, parsed.dataStart, parsed.tree);
        if (!hasV1Hook && !hasLegacyHook && hasAnchor && integrityOk && boundsOk) {
            console.log('CLEAN_OK');
            process.exit(0);
        }
        console.error(
            `CLEAN_VERIFY_FAILED: v1=${hasV1Hook} legacy=${hasLegacyHook} anchor=${hasAnchor} integrity=${integrityOk} bounds=${boundsOk}`
        );
        process.exit(1);
    }

    if (action === 'strip') {
        if (!outputAsar) throw new Error('strip 需要提供输出文件路径');
        const cleanUtils = stripHooksFromText(parsed.content);
        if (cleanUtils.includes(HOOK_START) || cleanUtils.includes(LEGACY_MARKER)) {
            throw new Error('剥离旧版钩子失败，内容仍有残留标记');
        }
        const outBuf = rebuildAsarWithNewUtils(parsed, cleanUtils);
        fs.writeFileSync(outputAsar, outBuf);
        const check = parseAsar(outputAsar);
        if (
            !verifyNodeIntegrity(check.buf, check.dataStart, check.utilsNode) ||
            !verifyAllBounds(check.buf, check.dataStart, check.tree)
        ) {
            throw new Error('剥离后的 ASAR 完整性校验未通过');
        }
        console.log('STRIP_OK');
        process.exit(0);
    }

    if (action === 'inject') {
        if (!outputAsar) throw new Error('inject 需要提供输出文件路径');
        const cleanUtils = stripHooksFromText(parsed.content);
        const anchorToUse = findAnchor(cleanUtils);
        if (!anchorToUse) {
            throw new Error('未找到注入锚点（loadHubWindowUrl / win.loadURL）');
        }
        const newUtils = cleanUtils.replace(anchorToUse, anchorToUse + HOOK_BLOCK);
        const outBuf = rebuildAsarWithNewUtils(parsed, newUtils);
        fs.writeFileSync(outputAsar, outBuf);
        const check = parseAsar(outputAsar);
        if (
            !check.content.includes(HOOK_START) ||
            !verifyNodeIntegrity(check.buf, check.dataStart, check.utilsNode) ||
            !verifyAllBounds(check.buf, check.dataStart, check.tree)
        ) {
            throw new Error('注入后的临时 ASAR 完整性校验未通过');
        }
        console.log(`INJECT_OK:${outBuf.length - parsed.buf.length}`);
        process.exit(0);
    }

    throw new Error(`未知操作: ${action}`);
}

try {
    main();
} catch (err) {
    console.error(err && err.message ? err.message : String(err));
    process.exit(1);
}
