import type { ResolvedShadow, SemanticIR } from '../core/types.js';

interface DtcgScalarToken {
  readonly $type: 'color' | 'dimension' | 'number';
  readonly $value: string | number;
  readonly $description?: string;
}

interface DtcgShadowToken {
  readonly $type: 'shadow';
  readonly $value: {
    readonly color: string;
    readonly offsetX: string;
    readonly offsetY: string;
    readonly blur: string;
    readonly spread: string;
  };
  readonly $description?: string;
}

export interface DtcgThemeDocument {
  readonly $extensions: {
    readonly 'com.antigravity-theme': {
      readonly id: string;
      readonly displayName: string;
      readonly description: string;
      readonly mode: string;
      readonly version: string;
      readonly targetSoftware: string;
    };
  };
  readonly surface: Record<string, DtcgScalarToken>;
  readonly glass: Record<string, DtcgScalarToken | DtcgShadowToken>;
  readonly fg: Record<string, DtcgScalarToken>;
  readonly border: Record<string, DtcgScalarToken>;
  readonly status: Record<string, Record<string, DtcgScalarToken>>;
  readonly agent: Record<string, DtcgScalarToken>;
  readonly artifact: {
    readonly alerts: Record<string, Record<string, DtcgScalarToken>>;
    readonly mermaid: Record<string, DtcgScalarToken>;
    readonly blockquoteBg: DtcgScalarToken;
    readonly blockquoteBorder: DtcgScalarToken;
    readonly tableHeaderBg: DtcgScalarToken;
    readonly tableStripeBg: DtcgScalarToken;
    readonly tableBorder: DtcgScalarToken;
    readonly codeBlockBg: DtcgScalarToken;
    readonly codeBlockBorder: DtcgScalarToken;
    readonly inlineCodeBg: DtcgScalarToken;
    readonly inlineCodeFg: DtcgScalarToken;
    readonly katexFg: DtcgScalarToken;
    readonly carouselControlBg: DtcgScalarToken;
    readonly carouselControlFg: DtcgScalarToken;
  };
  readonly diff: Record<string, DtcgScalarToken>;
  readonly code: Record<string, DtcgScalarToken>;
  readonly terminal: {
    readonly background: DtcgScalarToken;
    readonly foreground: DtcgScalarToken;
    readonly cursor: DtcgScalarToken;
    readonly selectionBackground: DtcgScalarToken;
    readonly ansi: Record<string, DtcgScalarToken>;
  };
}

function colorToken(value: string, description: string): DtcgScalarToken {
  return { $type: 'color', $value: value, $description: description };
}

function dimensionToken(value: string, description: string): DtcgScalarToken {
  return { $type: 'dimension', $value: value, $description: description };
}

function numberToken(value: number, description: string): DtcgScalarToken {
  return { $type: 'number', $value: value, $description: description };
}

function shadowToken(shadow: ResolvedShadow, description: string): DtcgShadowToken {
  return {
    $type: 'shadow',
    $value: {
      color: shadow.colorHex,
      offsetX: shadow.offsetX,
      offsetY: shadow.offsetY,
      blur: shadow.blur,
      spread: shadow.spread,
    },
    $description: description,
  };
}

/**
 * Compiles a SemanticIR instance into a W3C DTCG-compliant theme.json document
 * tailored to the Antigravity 2.0 Agent Desktop App.
 */
export function emitDtcgThemeJson(ir: SemanticIR): DtcgThemeDocument {
  return {
    $extensions: {
      'com.antigravity-theme': {
        id: ir.meta.id,
        displayName: ir.meta.displayName,
        description: ir.meta.description,
        mode: ir.meta.mode,
        version: ir.meta.version,
        targetSoftware: 'Antigravity 2.0 Agent Desktop App',
      },
    },
    surface: {
      shell: colorToken(ir.surface.shell, 'Elevation 0 recessed sidebar and aux pane shell'),
      canvas: colorToken(ir.surface.canvas, 'Elevation 1 primary chat and artifact canvas'),
      auxPane: colorToken(ir.surface.auxPane, 'Auxiliary pane backdrop'),
      card: colorToken(ir.surface.card, 'Elevation 2 content card surface'),
      elevated: colorToken(ir.surface.elevated, 'Elevation 3 popover and modal surface'),
      input: colorToken(ir.surface.input, 'Composer and code block recessed input surface'),
      hover: colorToken(ir.surface.hover, 'Interactive row hover wash'),
      selected: colorToken(ir.surface.selected, 'Active conversation or tab highlight'),
      disabled: colorToken(ir.surface.disabled, 'Disabled control background'),
      inverse: colorToken(ir.surface.inverse, 'High-contrast inverted surface'),
    },
    glass: {
      shellBg: colorToken(ir.glass.shellHexAlpha, 'High-opacity matte glass shell fill'),
      canvasBg: colorToken(ir.glass.canvasHexAlpha, 'High-opacity matte glass canvas fill'),
      cardBg: colorToken(ir.glass.cardHexAlpha, 'Matte frosted card surface fill'),
      popoverBg: colorToken(ir.glass.popoverHexAlpha, 'Floating popover frosted fill'),
      opaqueFallbackShell: colorToken(
        ir.glass.opaqueFallback.shell,
        'Reduced-transparency opaque fallback for shell',
      ),
      opaqueFallbackCanvas: colorToken(
        ir.glass.opaqueFallback.canvas,
        'Reduced-transparency opaque fallback for canvas',
      ),
      opaqueFallbackCard: colorToken(
        ir.glass.opaqueFallback.card,
        'Reduced-transparency opaque fallback for cards',
      ),
      opaqueFallbackPopover: colorToken(
        ir.glass.opaqueFallback.popover,
        'Reduced-transparency opaque fallback for popovers',
      ),
      blurSm: dimensionToken(ir.glass.blurSm, 'Small backdrop blur radius'),
      blurMd: dimensionToken(ir.glass.blurMd, 'Medium backdrop blur radius'),
      blurShell: dimensionToken(ir.glass.blurShell, 'Shell backdrop blur radius'),
      blurLg: dimensionToken(ir.glass.blurLg, 'Large backdrop blur radius'),
      saturateShell: numberToken(
        Number.parseFloat(ir.glass.saturateShell),
        'Backdrop saturation percentage for shell',
      ),
      saturateCanvas: numberToken(
        Number.parseFloat(ir.glass.saturateCanvas),
        'Backdrop saturation percentage for canvas',
      ),
      saturatePopover: numberToken(
        Number.parseFloat(ir.glass.saturatePopover),
        'Backdrop saturation percentage for popovers',
      ),
      rimTop: colorToken(ir.glass.rimTopHexAlpha, '1px top directional specular rim highlight'),
      rimBorder: colorToken(ir.glass.rimBorderHexAlpha, 'Outer frosted glass border'),
      shadowCard: shadowToken(ir.glass.shadowCardObj, 'Diffused elevation 2 card shadow'),
      shadowPopover: shadowToken(ir.glass.shadowPopoverObj, 'Diffused elevation 3 popover shadow'),
    },
    fg: {
      primary: colorToken(ir.fg.primary, 'L1 primary prose and chat message foreground'),
      secondary: colorToken(ir.fg.secondary, 'Secondary labels and headings'),
      muted: colorToken(ir.fg.muted, 'L3 muted metadata and timestamps'),
      disabled: colorToken(ir.fg.disabled, 'Disabled control foreground'),
      inverse: colorToken(ir.fg.inverse, 'Foreground rendered on inverse surfaces'),
      accent: colorToken(ir.fg.accent, 'Primary Weightless Cobalt accent foreground'),
      link: colorToken(ir.fg.link, 'Interactive hyperlink foreground'),
    },
    border: {
      subtle: colorToken(ir.border.subtle, 'Hairline pane and card separator'),
      default: colorToken(ir.border.default, 'Standard input and control border'),
      strong: colorToken(ir.border.strong, 'Emphasized border'),
      inverse: colorToken(ir.border.inverse, 'Inverse border'),
      focusRing: colorToken(ir.border.focusRing, 'Keyboard focus ring accent'),
    },
    status: Object.fromEntries(
      (['info', 'success', 'warning', 'danger'] as const).map((level) => [
        level,
        {
          bg: colorToken(ir.status[level].bg, `Translucent ${level} surface tint`),
          text: colorToken(ir.status[level].text, `Accessible ${level} text foreground`),
          border: colorToken(ir.status[level].border, `Semantic ${level} border`),
          ring: colorToken(ir.status[level].ring, `Semantic ${level} focus ring`),
          solid: colorToken(ir.status[level].solid, `Solid ${level} badge or button background`),
          onSolid: colorToken(ir.status[level].onSolid, `Foreground label over solid ${level}`),
        },
      ]),
    ),
    agent: {
      userBubbleBg: colorToken(ir.agent.userBubbleBg, 'User prompt card surface'),
      userBubbleBorder: colorToken(ir.agent.userBubbleBorder, 'User prompt card border'),
      thinkingBg: colorToken(ir.agent.thinkingBg, 'Collapsible Thinking trace backdrop'),
      thinkingBorder: colorToken(ir.agent.thinkingBorder, 'Thinking trace left accent rule'),
      thinkingFg: colorToken(ir.agent.thinkingFg, 'Thinking trace body foreground'),
      toolCardBg: colorToken(ir.agent.toolCardBg, 'Tool execution card background'),
      toolCardBorder: colorToken(ir.agent.toolCardBorder, 'Tool execution card border'),
      approvalBg: colorToken(ir.agent.approvalBg, 'Needs Approval banner background'),
      approvalBorder: colorToken(ir.agent.approvalBorder, 'Needs Approval banner border'),
      approvalFg: colorToken(ir.agent.approvalFg, 'Needs Approval accent text'),
      approveBtnBg: colorToken(ir.agent.approveBtnBg, 'Primary Approve button fill'),
      approveBtnFg: colorToken(ir.agent.approveBtnFg, 'Primary Approve button label'),
      runningAccent: colorToken(ir.agent.runningAccent, 'Running tool state accent'),
      doneAccent: colorToken(ir.agent.doneAccent, 'Completed tool state accent'),
      errorAccent: colorToken(ir.agent.errorAccent, 'Failed tool state accent'),
      subagentWorking: colorToken(ir.agent.subagentWorking, 'Subagent working badge color'),
      subagentWaiting: colorToken(ir.agent.subagentWaiting, 'Subagent waiting badge color'),
      subagentDone: colorToken(ir.agent.subagentDone, 'Subagent done badge color'),
      subagentKilled: colorToken(ir.agent.subagentKilled, 'Subagent stopped/killed badge color'),
    },
    artifact: {
      alerts: {
        note: {
          bg: colorToken(ir.artifact.alertNote.bg, 'NOTE alert background wash'),
          border: colorToken(ir.artifact.alertNote.border, 'NOTE alert outline'),
          fg: colorToken(ir.artifact.alertNote.fg, 'NOTE alert heading color'),
          accentBar: colorToken(ir.artifact.alertNote.accentBar, 'NOTE alert 3px left bar'),
        },
        tip: {
          bg: colorToken(ir.artifact.alertTip.bg, 'TIP alert background wash'),
          border: colorToken(ir.artifact.alertTip.border, 'TIP alert outline'),
          fg: colorToken(ir.artifact.alertTip.fg, 'TIP alert heading color'),
          accentBar: colorToken(ir.artifact.alertTip.accentBar, 'TIP alert 3px left bar'),
        },
        important: {
          bg: colorToken(ir.artifact.alertImportant.bg, 'IMPORTANT alert background wash'),
          border: colorToken(ir.artifact.alertImportant.border, 'IMPORTANT alert outline'),
          fg: colorToken(ir.artifact.alertImportant.fg, 'IMPORTANT alert heading color'),
          accentBar: colorToken(
            ir.artifact.alertImportant.accentBar,
            'IMPORTANT alert 3px left bar',
          ),
        },
        warning: {
          bg: colorToken(ir.artifact.alertWarning.bg, 'WARNING alert background wash'),
          border: colorToken(ir.artifact.alertWarning.border, 'WARNING alert outline'),
          fg: colorToken(ir.artifact.alertWarning.fg, 'WARNING alert heading color'),
          accentBar: colorToken(ir.artifact.alertWarning.accentBar, 'WARNING alert 3px left bar'),
        },
        caution: {
          bg: colorToken(ir.artifact.alertCaution.bg, 'CAUTION alert background wash'),
          border: colorToken(ir.artifact.alertCaution.border, 'CAUTION alert outline'),
          fg: colorToken(ir.artifact.alertCaution.fg, 'CAUTION alert heading color'),
          accentBar: colorToken(ir.artifact.alertCaution.accentBar, 'CAUTION alert 3px left bar'),
        },
      },
      mermaid: {
        nodeBg: colorToken(ir.artifact.mermaid.nodeBg, 'Mermaid primary node background'),
        nodeBorder: colorToken(ir.artifact.mermaid.nodeBorder, 'Mermaid primary node border'),
        nodeText: colorToken(ir.artifact.mermaid.nodeText, 'Mermaid node label foreground'),
        secondaryBg: colorToken(ir.artifact.mermaid.secondaryBg, 'Mermaid secondary node fill'),
        tertiaryBg: colorToken(ir.artifact.mermaid.tertiaryBg, 'Mermaid tertiary/cluster fill'),
        edgeColor: colorToken(ir.artifact.mermaid.edgeColor, 'Mermaid connector arrow color'),
        labelBg: colorToken(ir.artifact.mermaid.labelBg, 'Mermaid edge label backdrop'),
      },
      blockquoteBg: colorToken(ir.artifact.blockquoteBg, 'Markdown blockquote surface'),
      blockquoteBorder: colorToken(ir.artifact.blockquoteBorder, 'Markdown blockquote rule'),
      tableHeaderBg: colorToken(ir.artifact.tableHeaderBg, 'Markdown table header fill'),
      tableStripeBg: colorToken(ir.artifact.tableStripeBg, 'Markdown table alternating row fill'),
      tableBorder: colorToken(ir.artifact.tableBorder, 'Markdown table grid border'),
      codeBlockBg: colorToken(ir.artifact.codeBlockBg, 'Fenced code block backdrop'),
      codeBlockBorder: colorToken(ir.artifact.codeBlockBorder, 'Fenced code block border'),
      inlineCodeBg: colorToken(ir.artifact.inlineCodeBg, 'Inline code pill background'),
      inlineCodeFg: colorToken(ir.artifact.inlineCodeFg, 'Inline code pill foreground'),
      katexFg: colorToken(ir.artifact.katexFg, 'KaTeX math expression color'),
      carouselControlBg: colorToken(ir.artifact.carouselControlBg, 'Carousel navigation button fill'),
      carouselControlFg: colorToken(ir.artifact.carouselControlFg, 'Carousel navigation icon color'),
    },
    diff: {
      addedBg: colorToken(ir.diff.addedBg, 'Added line translucent background wash'),
      addedWordBg: colorToken(ir.diff.addedWordBg, 'Added character/word emphasis fill'),
      addedFg: colorToken(ir.diff.addedFg, 'Added sign/counter foreground'),
      addedGutter: colorToken(ir.diff.addedGutter, 'Added line gutter bar'),
      removedBg: colorToken(ir.diff.removedBg, 'Removed line translucent background wash'),
      removedWordBg: colorToken(ir.diff.removedWordBg, 'Removed character/word emphasis fill'),
      removedFg: colorToken(ir.diff.removedFg, 'Removed sign/counter foreground'),
      removedGutter: colorToken(ir.diff.removedGutter, 'Removed line gutter bar'),
      modifiedBadge: colorToken(ir.diff.modifiedBadge, 'Modified file badge'),
      hunkHeaderBg: colorToken(ir.diff.hunkHeaderBg, 'Unified diff hunk header fill'),
      hunkHeaderFg: colorToken(ir.diff.hunkHeaderFg, 'Unified diff hunk header text'),
    },
    code: Object.fromEntries(
      Object.entries(ir.code).map(([role, hex]) => [
        role,
        colorToken(hex, `Embedded code-fence token color for ${role}`),
      ]),
    ),
    terminal: {
      background: colorToken(ir.terminal.background, 'Integrated terminal backdrop'),
      foreground: colorToken(ir.terminal.foreground, 'Integrated terminal default text'),
      cursor: colorToken(ir.terminal.cursor, 'Integrated terminal cursor'),
      selectionBackground: colorToken(
        ir.terminal.selectionBackground,
        'Integrated terminal text selection highlight',
      ),
      ansi: Object.fromEntries(
        Object.entries(ir.terminal.ansi).map(([slot, hex]) => [
          slot,
          colorToken(hex, `Terminal ANSI ${slot}`),
        ]),
      ),
    },
  };
}
