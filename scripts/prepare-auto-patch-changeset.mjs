#!/usr/bin/env node
'use strict';

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const RELEASABLE_PREFIXES = ['src/', 'core/', 'dist/', 'preview/', 'scripts/'];
const RELEASABLE_FILES = new Set([
    'manifest.json',
    'package.json',
    'install.sh',
    'install.command',
    'uninstall.command',
    '检查更新.command',
    'install.ps1',
    'install.bat',
    'uninstall.bat',
    '检查更新.bat'
]);

/**
 * Increments the patch component of a `X.Y.Z` SemVer string.
 */
export function bumpPatchVersion(version) {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version || '').trim());
    if (!m) {
        throw new Error(`Invalid SemVer version: ${String(version)}`);
    }
    return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

/**
 * Determines whether a commit touching `files` with `subject` warrants an automated patch release.
 */
export function isReleasableCommit(subject, files) {
    const cleanSubject = String(subject || '').trim();
    if (!cleanSubject) return false;
    if (cleanSubject.startsWith('chore(release):') || cleanSubject.includes('[skip release]')) {
        return false;
    }
    if (!Array.isArray(files) || files.length === 0) return false;
    return files.some((file) => {
        const f = String(file || '').replace(/\\/g, '/').trim();
        if (RELEASABLE_FILES.has(f)) return true;
        return RELEASABLE_PREFIXES.some((prefix) => f.startsWith(prefix));
    });
}

/**
 * Renders a Changesets `patch` markdown file summarizing unreleased commits.
 */
export function createPatchChangesetContent(packageName, commits) {
    const summaryLines = commits.map((c) => `${c.subject} (\`${c.shortSha}\`)`).join('; ');
    return `---\n"${packageName}": patch\n---\n\nAutomated patch release: ${summaryLines}\n`;
}

function gitText(rootDir, args) {
    return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
}

function resolveReleaseBaseRef(rootDir, currentVersion) {
    const expectedTag = `v${currentVersion}`;
    try {
        gitText(rootDir, ['rev-parse', '--verify', `refs/tags/${expectedTag}`]);
        return expectedTag;
    } catch {
        try {
            return gitText(rootDir, ['describe', '--tags', '--abbrev=0', '--match', 'v*']);
        } catch {
            return null;
        }
    }
}

export function collectPendingPatchInfo(rootDir = DEFAULT_ROOT) {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const currentVersion = String(pkg.version || '').trim();
    const packageName = String(pkg.name || '').trim();
    const nextPatchVersion = bumpPatchVersion(currentVersion);
    const headSha = gitText(rootDir, ['rev-parse', 'HEAD']);
    const shortHeadSha = headSha.slice(0, 7);

    const changesetDir = path.join(rootDir, '.changeset');
    const pendingChangesets = fs.existsSync(changesetDir)
        ? fs.readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
        : [];
    if (pendingChangesets.length > 0) {
        return {
            shouldRelease: false,
            reason: 'pending_changesets_exist',
            currentVersion,
            nextPatchVersion,
            headSha,
            shortHeadSha,
            baseRef: null,
            commits: []
        };
    }

    const baseRef = resolveReleaseBaseRef(rootDir, currentVersion);
    if (!baseRef) {
        return {
            shouldRelease: false,
            reason: 'no_release_tag_found',
            currentVersion,
            nextPatchVersion,
            headSha,
            shortHeadSha,
            baseRef: null,
            commits: []
        };
    }

    const logRaw = gitText(rootDir, ['log', `${baseRef}..HEAD`, '--format=%H%x09%s']);
    if (!logRaw) {
        return {
            shouldRelease: false,
            reason: 'up_to_date_with_tag',
            currentVersion,
            nextPatchVersion,
            headSha,
            shortHeadSha,
            baseRef,
            commits: []
        };
    }

    const commits = [];
    for (const line of logRaw.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const [sha, ...subjectParts] = line.split('\t');
        const subject = subjectParts.join('\t').trim();
        const filesRaw = gitText(rootDir, ['show', '--name-only', '--format=', sha]);
        const files = filesRaw.split(/\r?\n/).filter(Boolean);
        if (isReleasableCommit(subject, files)) {
            commits.push({
                sha,
                shortSha: sha.slice(0, 7),
                subject,
                files
            });
        }
    }

    return {
        shouldRelease: commits.length > 0,
        reason: commits.length > 0 ? 'releasable_commits_found' : 'no_releasable_commits',
        currentVersion,
        nextPatchVersion,
        headSha,
        shortHeadSha,
        baseRef,
        commits
    };
}

function runCli() {
    const args = process.argv.slice(2);
    const write = args.includes('--write');
    const info = collectPendingPatchInfo(DEFAULT_ROOT);

    let changesetPath = null;
    if (write && info.shouldRelease) {
        const pkg = JSON.parse(fs.readFileSync(path.join(DEFAULT_ROOT, 'package.json'), 'utf8'));
        const fileName = `auto-patch-${info.shortHeadSha}.md`;
        changesetPath = path.join(DEFAULT_ROOT, '.changeset', fileName);
        fs.writeFileSync(changesetPath, createPatchChangesetContent(pkg.name, info.commits), 'utf8');
    }

    console.log(JSON.stringify({ ...info, changesetPath }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    runCli();
}
