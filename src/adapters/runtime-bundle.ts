import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SemanticIR, ThemeFamilyId } from '../core/types.js';
import { collectCssVariableGroups } from './css-vars.js';

const RUNTIME_SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../runtime');

const STOCK_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-stock" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#64748B"/></linearGradient></defs><path d="M13.5 6.5C13 4.2 11 2.5 8.5 2.5C5.5 2.5 3 4.8 2.6 7.8M13.5 3V6.5H10" stroke="url(#ag-svg-stock)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 9.5C3 11.8 5 13.5 7.5 13.5C10.5 13.5 13 11.2 13.4 8.2M2.5 13V9.5H6" stroke="url(#ag-svg-stock)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const FAMILY_ORDER: readonly ThemeFamilyId[] = [
  'orbital',
  'prism',
  'zenith',
  'lagoon',
  'solar',
  'nova',
  'nebula',
];

function parseHex6(hex: string): readonly [number, number, number] {
  const clean = hex.trim().replace(/^#/, '').slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Expected 6-digit hex color for popover mixing, got: ${hex}`);
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  ratioB: number,
): readonly [number, number, number] {
  const ratioA = 1 - ratioB;
  return [
    Math.round(a[0] * ratioA + b[0] * ratioB),
    Math.round(a[1] * ratioA + b[1] * ratioB),
    Math.round(a[2] * ratioA + b[2] * ratioB),
  ];
}

function rgbToHex(rgb: readonly [number, number, number]): string {
  return `#${rgb.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')}`;
}

const PREFIXED_CSS_VAR_RE = /--(?:ag|agy)-[a-z0-9-]+/g;

function collectReferencedPrefixedVars(sources: readonly string[]): Set<string> {
  const used = new Set<string>();
  for (const src of sources) {
    for (const match of src.matchAll(PREFIXED_CSS_VAR_RE)) {
      used.add(match[0]);
    }
  }
  return used;
}

function buildRuntimeTokenMap(
  ir: SemanticIR,
  referencedPrefixedVars: ReadonlySet<string>,
): Record<string, string> {
  const isDark = ir.meta.mode === 'dark' || ir.meta.mode === 'hc-dark';
  const { hostVars, glassVars, agentVars } = collectCssVariableGroups(ir);
  const borderHairline = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.35)';

  const popoverRgb = isDark
    ? mixRgb(parseHex6(ir.runtime.titlebarColor), parseHex6(ir.runtime.userBubbleSolid), 0.45)
    : mixRgb(parseHex6(ir.surface.elevated), parseHex6(ir.runtime.titlebarColor), 0.10);
  const popoverOpaqueHex = rgbToHex(popoverRgb);
  const popoverGlassBg = isDark
    ? `rgba(${popoverRgb.join(', ')}, 0.78)`
    : `rgba(${popoverRgb.join(', ')}, 0.88)`;
  const popoverBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.10)';

  const rawEntries: Array<readonly [string, string]> = [
    ...hostVars,
    ...glassVars,
    ...agentVars,
    // Host Tailwind / Radix bridge variables
    ['--ag-mesh', ir.runtime.auroraMesh],
    ['--sidebar-unified-bg', ir.runtime.sidebarUnifiedBg],
    ['--background', 'transparent !important'],
    ['--color-background', 'transparent !important'],
    ['--content', 'transparent !important'],
    ['--color-content', 'transparent !important'],
    ['--card', 'transparent !important'],
    ['--color-card', 'transparent !important'],
    ['--card-border', 'transparent !important'],
    ['--color-card-border', 'transparent !important'],
    ['--muted', 'transparent !important'],
    ['--color-muted', 'transparent !important'],
    ['--secondary', 'transparent !important'],
    ['--color-secondary', 'transparent !important'],
    ['--sidebar-muted', 'transparent !important'],
    ['--color-sidebar-muted', 'transparent !important'],
    ['--sidebar-secondary', 'transparent !important'],
    ['--color-sidebar-secondary', 'transparent !important'],
    ['--popover', `${popoverGlassBg} !important`],
    ['--color-popover', `${popoverGlassBg} !important`],
    ['--popover-foreground', `${ir.fg.primary} !important`],
    ['--color-popover-foreground', `${ir.fg.primary} !important`],
    ['--menu', `${popoverGlassBg} !important`],
    ['--color-menu', `${popoverGlassBg} !important`],
    ['--menu-border', `${popoverBorder} !important`],
    ['--color-menu-border', `${popoverBorder} !important`],
    ['--foreground', `${ir.fg.primary} !important`],
    ['--color-foreground', `${ir.fg.primary} !important`],
    ['--secondary-foreground', `${ir.fg.primary} !important`],
    ['--color-secondary-foreground', `${ir.fg.primary} !important`],
    ['--muted-foreground', `${ir.fg.muted} !important`],
    ['--color-muted-foreground', `${ir.fg.muted} !important`],
    ['--placeholder', `${ir.fg.muted} !important`],
    ['--color-placeholder', `${ir.fg.muted} !important`],
    ['--primary', `${ir.fg.accent} !important`],
    ['--color-primary', `${ir.fg.accent} !important`],
    ['--primary-foreground', `${ir.agent.approveBtnFg} !important`],
    ['--color-primary-foreground', `${ir.agent.approveBtnFg} !important`],
    ['--sidebar', `${ir.runtime.titlebarColor} !important`],
    ['--color-sidebar', `${ir.runtime.titlebarColor} !important`],
    ['--border', `${borderHairline} !important`],
    ['--color-border', `${borderHairline} !important`],
    ['--terminal-bg', `${ir.runtime.baseFallbackBg} !important`],
    ['--selection', `${ir.runtime.selectionBg} !important`],
    ['--media-modal-bg', `${ir.runtime.mediaModalBg} !important`],
    ['--media-capsule-bg', `${ir.runtime.mediaCapsuleBg} !important`],
    ['--media-capsule-border', `${ir.runtime.mediaCapsuleBorder} !important`],
    ['--media-capsule-hover', `${ir.runtime.mediaCapsuleHover} !important`],
    ['--media-capsule-fg', `${ir.runtime.mediaCapsuleFg} !important`],
    // Semantic runtime tokens consumed by host-surfaces.css & host-dark-overrides.css
    ['--ag-base-bg', ir.runtime.baseFallbackBg],
    ['--ag-fg', ir.fg.primary],
    ['--ag-fg-secondary', ir.fg.secondary],
    ['--ag-fg-muted', ir.fg.muted],
    ['--ag-fg-placeholder', ir.fg.muted],
    ['--ag-accent', ir.fg.accent],
    ['--ag-accent-deep', ir.runtime.accentDeep],
    ['--ag-accent-solid', ir.agent.approveBtnBg],
    ['--ag-accent-rgb', ir.runtime.accentRgb],
    ['--ag-accent-gradient', ir.runtime.accentGradient],
    ['--ag-scrollbar-v', ir.runtime.scrollbarGradientV],
    ['--ag-scrollbar-h', ir.runtime.scrollbarGradientH],
    ['--ag-spinner-1', ir.runtime.spinnerDots[0]],
    ['--ag-spinner-2', ir.runtime.spinnerDots[1]],
    ['--ag-spinner-3', ir.runtime.spinnerDots[2]],
    ['--ag-spinner-4', ir.runtime.spinnerDots[3]],
    ['--ag-inline-code-bg', ir.artifact.inlineCodeBg],
    ['--ag-inline-code-fg', ir.artifact.inlineCodeFg],
    ['--ag-inline-code-border', ir.runtime.inlineCodeBorder],
    ['--ag-popover-backdrop', 'blur(24px) saturate(145%)'],
    ['--ag-popover-border', popoverBorder],
    [
      '--ag-shadow-floating',
      isDark
        ? '0 6px 18px rgba(0, 0, 0, 0.52), 0 2px 6px rgba(0, 0, 0, 0.32)'
        : '0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
    ],
    [
      '--ag-shadow-popover',
      isDark
        ? '0 14px 36px rgba(0, 0, 0, 0.62), 0 4px 12px rgba(0, 0, 0, 0.38)'
        : '0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)',
    ],
    [
      '--ag-shadow-tooltip',
      isDark
        ? '0 8px 24px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.34)'
        : '0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
    ],
    ['--ag-surface-popover', popoverGlassBg],
    ['--ag-surface-popover-opaque', popoverOpaqueHex],
    ['--ag-surface-user-bubble', ir.runtime.userBubbleSolid],
    ['--ag-terminal-panel-bg', ir.runtime.terminalPanelBg],
    ['--ag-terminal-cursor', ir.terminal.cursor],
    ['--ag-terminal-selection', ir.terminal.selectionBackground],
    ['--ag-terminal-ansi-0', ir.terminal.ansi.black],
    ['--ag-terminal-ansi-1', ir.terminal.ansi.red],
    ['--ag-terminal-ansi-2', ir.terminal.ansi.green],
    ['--ag-terminal-ansi-3', ir.terminal.ansi.yellow],
    ['--ag-terminal-ansi-4', ir.terminal.ansi.blue],
    ['--ag-terminal-ansi-5', ir.terminal.ansi.magenta],
    ['--ag-terminal-ansi-6', ir.terminal.ansi.cyan],
    ['--ag-terminal-ansi-7', ir.terminal.ansi.white],
    ['--ag-terminal-ansi-8', ir.terminal.ansi.brightBlack],
    ['--ag-terminal-ansi-9', ir.terminal.ansi.brightRed],
    ['--ag-settings-bg', ir.runtime.settingsDialogBg],
    ['--ag-danger', ir.status.danger.solid],
    ['--ag-danger-hover', ir.agent.errorAccent],
    ['--ag-mermaid-viewport-bg', ir.surface.canvas],
  ];

  const prunedEntries = rawEntries.filter(([name]) => {
    if (!name.startsWith('--ag-') && !name.startsWith('--agy-')) return true;
    return referencedPrefixedVars.has(name);
  });
  prunedEntries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.fromEntries(prunedEntries);
}

export interface CompiledRuntimeBundle {
  readonly currentCss: string;
  readonly currentJs: string;
}

/**
 * Compiles all 14 OKLCH SemanticIRs and modular runtime sources into deterministic
 * desktop Electron injection payloads: `dist/runtime/current.css` and `dist/runtime/current.js`.
 */
export function emitDesktopRuntimeBundle(
  irs: readonly SemanticIR[],
  version: string,
  repoSlug = 'Django9944/antigravity-theme',
): CompiledRuntimeBundle {
  const normalizeLf = (s: string): string => s.replace(/\r\n/g, '\n');

  const companionCss = normalizeLf(
    readFileSync(resolve(RUNTIME_SRC_DIR, 'styles/companion.css'), 'utf8'),
  );
  const hostSurfacesCss = normalizeLf(
    readFileSync(resolve(RUNTIME_SRC_DIR, 'styles/host-surfaces.css'), 'utf8'),
  );
  const hostDarkCss = normalizeLf(
    readFileSync(resolve(RUNTIME_SRC_DIR, 'styles/host-dark-overrides.css'), 'utf8'),
  );
  const templateJs = normalizeLf(readFileSync(resolve(RUNTIME_SRC_DIR, 'engine-template.js'), 'utf8'));
  const referencedPrefixedVars = collectReferencedPrefixedVars([
    companionCss,
    hostSurfacesCss,
    hostDarkCss,
    templateJs,
  ]);

  const byFamily = new Map<ThemeFamilyId, { light?: SemanticIR; dark?: SemanticIR }>();
  for (const ir of irs) {
    const slot = byFamily.get(ir.meta.family) ?? {};
    if (ir.meta.mode === 'dark' || ir.meta.mode === 'hc-dark') slot.dark = ir;
    else slot.light = ir;
    byFamily.set(ir.meta.family, slot);
  }

  const rawPairs: Array<{
    family: ThemeFamilyId;
    light: SemanticIR;
    dark: SemanticIR;
    tokens: Record<string, string>;
    tokensDark: Record<string, string>;
  }> = [];
  const tokenKeySet = new Set<string>();

  for (const family of FAMILY_ORDER) {
    const pair = byFamily.get(family);
    if (!pair?.light || !pair.dark) {
      throw new Error(`Missing light/dark pair for runtime family "${family}"`);
    }
    const tokens = buildRuntimeTokenMap(pair.light, referencedPrefixedVars);
    const tokensDark = buildRuntimeTokenMap(pair.dark, referencedPrefixedVars);
    for (const k of Object.keys(tokens)) tokenKeySet.add(k);
    for (const k of Object.keys(tokensDark)) tokenKeySet.add(k);
    rawPairs.push({ family, light: pair.light, dark: pair.dark, tokens, tokensDark });
  }

  const tokenKeys = [...tokenKeySet].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const runtimeThemes: Array<Record<string, unknown>> = rawPairs.map(
    ({ family, light, dark, tokens, tokensDark }) => ({
      id: family,
      variantIdLight: light.meta.id,
      variantIdDark: dark.meta.id,
      name: light.meta.nameZh,
      nameDark: dark.meta.nameZh,
      titlebarColor: light.runtime.titlebarColor,
      titlebarColorDark: dark.runtime.titlebarColor,
      symbolColor: light.runtime.titlebarSymbolColor,
      symbolColorDark: dark.runtime.titlebarSymbolColor,
      icon: light.meta.iconSvg,
      t: tokenKeys.map((k) => tokens[k] ?? ''),
      td: tokenKeys.map((k) => tokensDark[k] ?? ''),
    }),
  );

  runtimeThemes.push({
    id: 'stock',
    name: '官方原版',
    nameDark: '官方原版',
    icon: STOCK_ICON_SVG,
  });

  const versionTag = version.startsWith('v') ? version : `v${version}`;
  const currentJs = templateJs
    .replace('__THEME_PACK_VERSION__', () => JSON.stringify(versionTag))
    .replace('__THEME_PACK_REPO__', () => JSON.stringify(repoSlug))
    .replace('__BASE_CSS__', () => JSON.stringify(hostSurfacesCss))
    .replace('__DARK_DELTA_CSS__', () => JSON.stringify(hostDarkCss))
    .replace('__TOKEN_KEYS_JSON__', () => JSON.stringify(tokenKeys))
    .replace('__THEMES_JSON__', () => JSON.stringify(runtimeThemes));

  return {
    currentCss: companionCss,
    currentJs,
  };
}
