import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG_URL = 'https://antigravity.google/docs/changelog.md';

export interface UpstreamBaseline {
  readonly sourceUrl: string;
  readonly hostCssSpecUrl?: string;
  readonly lastSeenHeading: string | null;
  readonly knownHostCssVariables: readonly string[];
}

export interface UpstreamCheckReport {
  readonly mode: 'online' | 'offline';
  readonly hasChanges: boolean;
  readonly baselineHeading: string | null;
  readonly latestHeading: string | null;
  readonly addedEntries: readonly string[];
  readonly addedHostVariables: readonly string[];
  readonly observedHostVariablesCount: number;
}

/**
 * Extracts release headings underneath `## Antigravity App` while ignoring fenced code blocks.
 */
export function extractAntigravityAppEntries(markdown: string): string[] {
  const cleanMd = markdown.replace(/^\uFEFF/, '');
  const lines = cleanMd.split(/\r?\n/);
  const entries: string[] = [];
  let inAppSection = false;
  let activeFence: string | null = null;

  for (const line of lines) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch && fenceMatch[1]) {
      const fenceToken = fenceMatch[1];
      if (activeFence === null) {
        activeFence = fenceToken[0]!;
      } else if (fenceToken[0] === activeFence && fenceToken.length >= 3) {
        activeFence = null;
      }
      continue;
    }

    if (activeFence !== null) {
      continue;
    }

    if (/^##\s+Antigravity App\b/i.test(line)) {
      inAppSection = true;
      continue;
    }
    if (inAppSection && /^##\s+/.test(line)) {
      break;
    }
    if (inAppSection && /^###\s+/.test(line)) {
      const heading = line
        .replace(/^###\s+/, '')
        .replace(/\s+#+\s*$/, '')
        .trim();
      if (heading.length > 0) {
        entries.push(heading);
      }
    }
  }
  return entries;
}

/**
 * Extracts documented Antigravity host CSS color variables (`--color-{background,text,border,ring}-*`).
 */
export function extractHostCssVariables(markdown: string): string[] {
  const matches = markdown.match(/--color-(?:background|text|border|ring)-[a-z0-9-]+/g) ?? [];
  return [...new Set(matches)].sort();
}

/**
 * Diffs extracted Antigravity App entries & host CSS variables against the stored baseline.
 */
export function diffUpstreamState(
  baseline: UpstreamBaseline,
  entries: readonly string[],
  observedHostVars: readonly string[] = [],
  mode: 'online' | 'offline' = 'online',
): UpstreamCheckReport {
  const knownHostSet = new Set(baseline.knownHostCssVariables);
  const addedHostVariables = observedHostVars.filter((v) => !knownHostSet.has(v)).sort();
  const latestHeading = entries[0] ?? null;

  if (!latestHeading) {
    return {
      mode,
      hasChanges: addedHostVariables.length > 0,
      baselineHeading: baseline.lastSeenHeading,
      latestHeading: null,
      addedEntries: [],
      addedHostVariables,
      observedHostVariablesCount: observedHostVars.length,
    };
  }

  let addedEntries: readonly string[];
  if (baseline.lastSeenHeading === null) {
    addedEntries = entries.slice(0, 5);
  } else {
    const idx = entries.indexOf(baseline.lastSeenHeading);
    addedEntries = idx === -1 ? entries.slice(0, 5) : entries.slice(0, idx);
  }

  return {
    mode,
    hasChanges: addedEntries.length > 0 || addedHostVariables.length > 0,
    baselineHeading: baseline.lastSeenHeading,
    latestHeading,
    addedEntries,
    addedHostVariables,
    observedHostVariablesCount: observedHostVars.length,
  };
}

/**
 * Produces an updated UpstreamBaseline merging the newly observed release heading and `--color-*` host variables.
 */
export function applyUpstreamBaselineUpdate(
  baseline: UpstreamBaseline,
  report: UpstreamCheckReport,
): UpstreamBaseline {
  if (!report.hasChanges) {
    return baseline;
  }
  const mergedHostVars = [
    ...new Set([...baseline.knownHostCssVariables, ...report.addedHostVariables]),
  ];
  const next: UpstreamBaseline = {
    sourceUrl: baseline.sourceUrl,
    ...(baseline.hostCssSpecUrl ? { hostCssSpecUrl: baseline.hostCssSpecUrl } : {}),
    lastSeenHeading: report.latestHeading ?? baseline.lastSeenHeading,
    knownHostCssVariables: mergedHostVars,
  };
  return next;
}

async function fetchTextGuarded(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: 'text/markdown, text/plain;q=0.9' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();
  if (
    contentType.toLowerCase().includes('text/html') ||
    /^\s*(?:<!doctype\s+html|<html\b)/i.test(body)
  ) {
    throw new Error(`Unexpected HTML response received from ${url} instead of Markdown`);
  }
  return body;
}

async function runCli(): Promise<void> {
  const offline = process.argv.includes('--offline');
  const applyUpdate = process.argv.includes('--apply');
  const baselinePath = resolve(ROOT_DIR, '.upstream-baseline.json');
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as UpstreamBaseline;

  if (offline) {
    const sampleMd = [
      '## Antigravity App',
      '### Initial Offline Baseline',
      'Uses `--color-background-primary` and `--color-ring-primary`.',
    ].join('\n');
    const entries = extractAntigravityAppEntries(sampleMd);
    const hostVars = extractHostCssVariables(sampleMd);
    const report = diffUpstreamState(baseline, entries, hostVars, 'offline');
    if (applyUpdate && report.hasChanges) {
      const updated = applyUpstreamBaselineUpdate(baseline, report);
      writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const targetUrl = baseline.sourceUrl || CHANGELOG_URL;
  const markdown = await fetchTextGuarded(targetUrl);
  const entries = extractAntigravityAppEntries(markdown);
  if (entries.length === 0) {
    throw new Error(
      `No entries parsed under "## Antigravity App" from ${targetUrl}; upstream heading structure may have changed.`,
    );
  }

  const hostVarSources = [markdown];
  if (baseline.hostCssSpecUrl) {
    hostVarSources.push(await fetchTextGuarded(baseline.hostCssSpecUrl));
  }
  const hostVars = extractHostCssVariables(hostVarSources.join('\n'));

  const report = diffUpstreamState(baseline, entries, hostVars, 'online');
  if (applyUpdate && report.hasChanges) {
    const updated = applyUpstreamBaselineUpdate(baseline, report);
    writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify(report, null, 2));
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
  runCli().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
