import type { SemanticIR } from '../core/types.js';

function formatSortedVars(entries: ReadonlyArray<readonly [string, string]>, indent = '  '): string[] {
  return [...entries]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${indent}${name}: ${value};`);
}

function toKebabCase(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Emits a deterministic variables.css stylesheet implementing:
 * - All 30 Antigravity host CSS color variables (--color-background/text/border/ring-*) + --font-sans/mono
 * - High-Opacity Matte Frosted Glass material variables (--agy-glass-*, incl. composite --agy-glass-backdrop-*)
 * - Full Antigravity 2.0 Agent Workbench variables (--agy-*, incl. Mermaid, Code Fence, Tables, Diffs, ANSI 16)
 * - Zero-specificity :where(:root:not([data-antigravity-theme])) under @media (prefers-color-scheme)
 * - Mandatory @media (prefers-reduced-transparency: reduce) opaque + backdrop-filter: none fallbacks
 */
export function emitCssVariables(
  ir: SemanticIR,
  packageName = '@django9944/antigravity-theme',
): string {
  const colorScheme = ir.meta.mode === 'light' || ir.meta.mode === 'hc-light' ? 'light' : 'dark';
  const isHighContrast = ir.meta.mode === 'hc-dark' || ir.meta.mode === 'hc-light';

  const hostVars: ReadonlyArray<readonly [string, string]> = [
    ['--color-background-danger', ir.status.danger.bg],
    ['--color-background-disabled', ir.surface.disabled],
    ['--color-background-info', ir.status.info.bg],
    ['--color-background-inverse', ir.surface.inverse],
    ['--color-background-primary', ir.surface.canvas],
    ['--color-background-secondary', ir.surface.shell],
    ['--color-background-success', ir.status.success.bg],
    ['--color-background-tertiary', ir.surface.card],
    ['--color-background-warning', ir.status.warning.bg],
    ['--color-border-danger', ir.status.danger.border],
    ['--color-border-info', ir.status.info.border],
    ['--color-border-inverse', ir.border.inverse],
    ['--color-border-primary', ir.border.default],
    ['--color-border-secondary', ir.border.subtle],
    ['--color-border-success', ir.status.success.border],
    ['--color-border-warning', ir.status.warning.border],
    ['--color-ring-danger', ir.status.danger.ring],
    ['--color-ring-info', ir.status.info.ring],
    ['--color-ring-primary', ir.border.focusRing],
    ['--color-ring-success', ir.status.success.ring],
    ['--color-ring-warning', ir.status.warning.ring],
    ['--color-text-danger', ir.status.danger.text],
    ['--color-text-disabled', ir.fg.disabled],
    ['--color-text-info', ir.status.info.text],
    ['--color-text-inverse', ir.fg.inverse],
    ['--color-text-primary', ir.fg.primary],
    ['--color-text-secondary', ir.fg.secondary],
    ['--color-text-success', ir.status.success.text],
    ['--color-text-tertiary', ir.fg.muted],
    ['--color-text-warning', ir.status.warning.text],
    ['--font-mono', '"SF Mono", "JetBrains Mono", "Fira Code", ui-monospace, monospace'],
    ['--font-sans', '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif'],
  ];

  const glassVars: ReadonlyArray<readonly [string, string]> = [
    ['--agy-glass-backdrop-canvas', ir.glass.backdropCanvas],
    ['--agy-glass-backdrop-popover', ir.glass.backdropPopover],
    ['--agy-glass-backdrop-shell', ir.glass.backdropShell],
    ['--agy-glass-bg-canvas', ir.glass.canvasBg],
    ['--agy-glass-bg-card', ir.glass.cardBg],
    ['--agy-glass-bg-popover', ir.glass.popoverBg],
    ['--agy-glass-bg-shell', ir.glass.shellBg],
    ['--agy-glass-blur-lg', ir.glass.blurLg],
    ['--agy-glass-blur-md', ir.glass.blurMd],
    ['--agy-glass-blur-shell', ir.glass.blurShell],
    ['--agy-glass-blur-sm', ir.glass.blurSm],
    ['--agy-glass-rim-border', ir.glass.rimBorder],
    ['--agy-glass-rim-top', ir.glass.rimTop],
    ['--agy-glass-saturate-canvas', ir.glass.saturateCanvas],
    ['--agy-glass-saturate-popover', ir.glass.saturatePopover],
    ['--agy-glass-saturate-shell', ir.glass.saturateShell],
    ['--agy-glass-shadow-card', ir.glass.shadowCard],
    ['--agy-glass-shadow-popover', ir.glass.shadowPopover],
  ];

  const codeVars: ReadonlyArray<readonly [string, string]> = Object.entries(ir.code).map(
    ([role, hex]) => [`--agy-code-${toKebabCase(role)}`, hex] as const,
  );

  const agentVars: ReadonlyArray<readonly [string, string]> = [
    ['--agy-alert-caution-bar', ir.artifact.alertCaution.accentBar],
    ['--agy-alert-caution-bg', ir.artifact.alertCaution.bg],
    ['--agy-alert-caution-border', ir.artifact.alertCaution.border],
    ['--agy-alert-caution-fg', ir.artifact.alertCaution.fg],
    ['--agy-alert-important-bar', ir.artifact.alertImportant.accentBar],
    ['--agy-alert-important-bg', ir.artifact.alertImportant.bg],
    ['--agy-alert-important-border', ir.artifact.alertImportant.border],
    ['--agy-alert-important-fg', ir.artifact.alertImportant.fg],
    ['--agy-alert-note-bar', ir.artifact.alertNote.accentBar],
    ['--agy-alert-note-bg', ir.artifact.alertNote.bg],
    ['--agy-alert-note-border', ir.artifact.alertNote.border],
    ['--agy-alert-note-fg', ir.artifact.alertNote.fg],
    ['--agy-alert-tip-bar', ir.artifact.alertTip.accentBar],
    ['--agy-alert-tip-bg', ir.artifact.alertTip.bg],
    ['--agy-alert-tip-border', ir.artifact.alertTip.border],
    ['--agy-alert-tip-fg', ir.artifact.alertTip.fg],
    ['--agy-alert-warning-bar', ir.artifact.alertWarning.accentBar],
    ['--agy-alert-warning-bg', ir.artifact.alertWarning.bg],
    ['--agy-alert-warning-border', ir.artifact.alertWarning.border],
    ['--agy-alert-warning-fg', ir.artifact.alertWarning.fg],
    ['--agy-approval-bg', ir.agent.approvalBg],
    ['--agy-approval-border', ir.agent.approvalBorder],
    ['--agy-approval-fg', ir.agent.approvalFg],
    ['--agy-approve-btn-bg', ir.agent.approveBtnBg],
    ['--agy-approve-btn-fg', ir.agent.approveBtnFg],
    ['--agy-blockquote-bg', ir.artifact.blockquoteBg],
    ['--agy-blockquote-border', ir.artifact.blockquoteBorder],
    ['--agy-border-strong', ir.border.strong],
    ['--agy-carousel-control-bg', ir.artifact.carouselControlBg],
    ['--agy-carousel-control-fg', ir.artifact.carouselControlFg],
    ['--agy-code-block-bg', ir.artifact.codeBlockBg],
    ['--agy-code-block-border', ir.artifact.codeBlockBorder],
    ['--agy-diff-added-bg', ir.diff.addedBg],
    ['--agy-diff-added-fg', ir.diff.addedFg],
    ['--agy-diff-added-gutter', ir.diff.addedGutter],
    ['--agy-diff-added-word-bg', ir.diff.addedWordBg],
    ['--agy-diff-hunk-header-bg', ir.diff.hunkHeaderBg],
    ['--agy-diff-hunk-header-fg', ir.diff.hunkHeaderFg],
    ['--agy-diff-modified-badge', ir.diff.modifiedBadge],
    ['--agy-diff-removed-bg', ir.diff.removedBg],
    ['--agy-diff-removed-fg', ir.diff.removedFg],
    ['--agy-diff-removed-gutter', ir.diff.removedGutter],
    ['--agy-diff-removed-word-bg', ir.diff.removedWordBg],
    ['--agy-done-accent', ir.agent.doneAccent],
    ['--agy-error-accent', ir.agent.errorAccent],
    ['--agy-fg-accent', ir.fg.accent],
    ['--agy-fg-link', ir.fg.link],
    ['--agy-inline-code-bg', ir.artifact.inlineCodeBg],
    ['--agy-inline-code-fg', ir.artifact.inlineCodeFg],
    ['--agy-katex-fg', ir.artifact.katexFg],
    ['--agy-mermaid-edge-color', ir.artifact.mermaid.edgeColor],
    ['--agy-mermaid-label-bg', ir.artifact.mermaid.labelBg],
    ['--agy-mermaid-node-bg', ir.artifact.mermaid.nodeBg],
    ['--agy-mermaid-node-border', ir.artifact.mermaid.nodeBorder],
    ['--agy-mermaid-node-text', ir.artifact.mermaid.nodeText],
    ['--agy-mermaid-secondary-bg', ir.artifact.mermaid.secondaryBg],
    ['--agy-mermaid-tertiary-bg', ir.artifact.mermaid.tertiaryBg],
    ['--agy-running-accent', ir.agent.runningAccent],
    ['--agy-status-danger-on-solid', ir.status.danger.onSolid],
    ['--agy-status-danger-solid', ir.status.danger.solid],
    ['--agy-status-info-on-solid', ir.status.info.onSolid],
    ['--agy-status-info-solid', ir.status.info.solid],
    ['--agy-status-success-on-solid', ir.status.success.onSolid],
    ['--agy-status-success-solid', ir.status.success.solid],
    ['--agy-status-warning-on-solid', ir.status.warning.onSolid],
    ['--agy-status-warning-solid', ir.status.warning.solid],
    ['--agy-subagent-done', ir.agent.subagentDone],
    ['--agy-subagent-killed', ir.agent.subagentKilled],
    ['--agy-subagent-waiting', ir.agent.subagentWaiting],
    ['--agy-subagent-working', ir.agent.subagentWorking],
    ['--agy-surface-aux-pane', ir.surface.auxPane],
    ['--agy-surface-elevated', ir.surface.elevated],
    ['--agy-surface-hover', ir.surface.hover],
    ['--agy-surface-input', ir.surface.input],
    ['--agy-surface-selected', ir.surface.selected],
    ['--agy-table-border', ir.artifact.tableBorder],
    ['--agy-table-header-bg', ir.artifact.tableHeaderBg],
    ['--agy-table-stripe-bg', ir.artifact.tableStripeBg],
    ['--agy-terminal-ansi-black', ir.terminal.ansi.black],
    ['--agy-terminal-ansi-blue', ir.terminal.ansi.blue],
    ['--agy-terminal-ansi-bright-black', ir.terminal.ansi.brightBlack],
    ['--agy-terminal-ansi-bright-blue', ir.terminal.ansi.brightBlue],
    ['--agy-terminal-ansi-bright-cyan', ir.terminal.ansi.brightCyan],
    ['--agy-terminal-ansi-bright-green', ir.terminal.ansi.brightGreen],
    ['--agy-terminal-ansi-bright-magenta', ir.terminal.ansi.brightMagenta],
    ['--agy-terminal-ansi-bright-red', ir.terminal.ansi.brightRed],
    ['--agy-terminal-ansi-bright-white', ir.terminal.ansi.brightWhite],
    ['--agy-terminal-ansi-bright-yellow', ir.terminal.ansi.brightYellow],
    ['--agy-terminal-ansi-cyan', ir.terminal.ansi.cyan],
    ['--agy-terminal-ansi-green', ir.terminal.ansi.green],
    ['--agy-terminal-ansi-magenta', ir.terminal.ansi.magenta],
    ['--agy-terminal-ansi-red', ir.terminal.ansi.red],
    ['--agy-terminal-ansi-white', ir.terminal.ansi.white],
    ['--agy-terminal-ansi-yellow', ir.terminal.ansi.yellow],
    ['--agy-terminal-bg', ir.terminal.background],
    ['--agy-terminal-cursor', ir.terminal.cursor],
    ['--agy-terminal-fg', ir.terminal.foreground],
    ['--agy-terminal-selection', ir.terminal.selectionBackground],
    ['--agy-thinking-bg', ir.agent.thinkingBg],
    ['--agy-thinking-border', ir.agent.thinkingBorder],
    ['--agy-thinking-fg', ir.agent.thinkingFg],
    ['--agy-tool-card-bg', ir.agent.toolCardBg],
    ['--agy-tool-card-border', ir.agent.toolCardBorder],
    ['--agy-user-bubble-bg', ir.agent.userBubbleBg],
    ['--agy-user-bubble-border', ir.agent.userBubbleBorder],
    ...codeVars,
  ];

  const reducedTransparencyVars: ReadonlyArray<readonly [string, string]> = [
    ['--agy-glass-backdrop-canvas', 'none'],
    ['--agy-glass-backdrop-popover', 'none'],
    ['--agy-glass-backdrop-shell', 'none'],
    ['--agy-glass-bg-canvas', ir.glass.opaqueFallback.canvas],
    ['--agy-glass-bg-card', ir.glass.opaqueFallback.card],
    ['--agy-glass-bg-popover', ir.glass.opaqueFallback.popover],
    ['--agy-glass-bg-shell', ir.glass.opaqueFallback.shell],
    ['--agy-glass-blur-lg', '0px'],
    ['--agy-glass-blur-md', '0px'],
    ['--agy-glass-blur-shell', '0px'],
    ['--agy-glass-blur-sm', '0px'],
    ['--agy-glass-saturate-canvas', '100%'],
    ['--agy-glass-saturate-popover', '100%'],
    ['--agy-glass-saturate-shell', '100%'],
  ];

  const buildRuleBlock = (selector: string, indent = ''): string[] => [
    `${indent}${selector} {`,
    `${indent}  color-scheme: ${colorScheme};`,
    '',
    `${indent}  /* Antigravity Host CSS Variables */`,
    ...formatSortedVars(hostVars, `${indent}  `),
    '',
    `${indent}  /* High-Opacity Matte Frosted Glass Material Tokens */`,
    ...formatSortedVars(glassVars, `${indent}  `),
    '',
    `${indent}  /* Antigravity 2.0 Agent Workbench Tokens */`,
    ...formatSortedVars(agentVars, `${indent}  `),
    `${indent}}`,
  ];

  const autoMediaQuery = isHighContrast
    ? `(prefers-color-scheme: ${colorScheme}) and (prefers-contrast: more)`
    : `(prefers-color-scheme: ${colorScheme})`;

  const lines = [
    `/* Generated by ${packageName} (${ir.meta.displayName} v${ir.meta.version}) — DO NOT EDIT MANUALLY */`,
    ...buildRuleBlock(`[data-antigravity-theme="${ir.meta.id}"]`),
    '',
    `@media ${autoMediaQuery} {`,
    ...buildRuleBlock(':where(:root:not([data-antigravity-theme]))', '  '),
    '}',
    '',
    '@media (prefers-reduced-transparency: reduce) {',
    `  [data-antigravity-theme="${ir.meta.id}"] {`,
    ...formatSortedVars(reducedTransparencyVars, '    '),
    '  }',
    '',
    `  @media ${autoMediaQuery} {`,
    '    :where(:root:not([data-antigravity-theme])) {',
    ...formatSortedVars(reducedTransparencyVars, '      '),
    '    }',
    '  }',
    '}',
    '',
  ];

  return lines.join('\n');
}
