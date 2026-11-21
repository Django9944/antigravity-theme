#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PATCHER = path.join(ROOT, 'core', 'asar-patcher.js');

function detectAsarPath(customPath) {
    if (customPath) {
        const clean = customPath.trim().replace(/^["']|["']$/g, '');
        const tries = [
            clean,
            path.join(clean, 'app.asar'),
            path.join(clean, 'resources', 'app.asar'),
            path.join(clean, 'Contents', 'Resources', 'app.asar')
        ];
        for (const p of tries) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
        }
        return null;
    }

    const candidates = [];
    if (process.platform === 'darwin') {
        candidates.push(
            '/Applications/Antigravity.app/Contents/Resources/app.asar',
            path.join(os.homedir(), 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar')
        );
    } else if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFiles = process.env.ProgramFiles || '';
        candidates.push(
            path.join(localAppData, 'Programs', 'Antigravity', 'resources', 'app.asar'),
            path.join(programFiles, 'Antigravity', 'resources', 'app.asar')
        );
    }

    for (const p of candidates) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

const customArg = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : '';
const asJson = process.argv.includes('--json');
const asarPath = detectAsarPath(customArg);

if (!asarPath) {
    console.error('[X] 未在本机默认路径检测到 Antigravity app.asar。可传入路径参数：node scripts/check-host-compat.mjs <path>');
    process.exit(1);
}

const res = spawnSync(process.execPath, [PATCHER, 'doctor', asarPath, '--json'], {
    encoding: 'utf8',
    env: { ...process.env, ELECTRON_NO_ASAR: '1' }
});

if (!res.stdout) {
    console.error('[X] 诊断执行失败：', res.stderr || `exit=${res.status}`);
    process.exit(res.status || 1);
}

const report = JSON.parse(res.stdout);
report.asarPath = asarPath;

if (asJson) {
    console.log(JSON.stringify(report, null, 2));
} else {
    console.log('=== Antigravity Host Compatibility Probe ===');
    console.log(`ASAR Path      : ${report.asarPath}`);
    console.log(`Theme Version  : ${report.manifestVersion} (${report.repo})`);
    console.log(`Patch Status   : ${report.status}`);
    console.log(`Matched Anchor : ${report.matchedAnchor || '<NONE - NEEDS ADAPTATION>'}`);
    console.log(`Integrity OK   : ${report.integrityOk}`);
    console.log(`Bounds OK      : ${report.boundsOk}`);
    console.log(`ASAR SHA256    : ${report.asarSha256}... (${report.asarSize} bytes)`);
    console.log('============================================');
    if (report.status === 'ANCHOR_MISSING') {
        console.error('[!] 警告：宿主 Antigravity 注入锚点已变更，请更新 manifest.json 中的 anchors 配置！');
    } else if (report.status === 'CLEAN') {
        console.log('[*] 宿主兼容且当前处于原厂状态（如刚升级完 Antigravity，重新运行安装脚本即可恢复主题）。');
    } else {
        console.log('[OK] 宿主兼容且主题钩子状态正常。');
    }
}

process.exit(res.status ?? 0);
