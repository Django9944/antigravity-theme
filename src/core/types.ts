/**
 * Core type contracts for the Antigravity Theme OKLCH Design Token Compiler.
 * Targets the Antigravity 2.0 Agent Desktop App exclusively (ADR-001 / ADR-006).
 */

export interface OklchColor {
  /** Perceptual lightness in [0.0, 1.0]. */
  readonly l: number;
  /** Perceptual chroma >= 0.0. */
  readonly c: number;
  /** Hue angle in degrees. */
  readonly h: number;
  /** Optional opacity in [0.0, 1.0]. */
  readonly alpha?: number;
}

export type ThemeMode = 'dark' | 'light' | 'hc-dark' | 'hc-light';

export interface ChromaticGrade {
  readonly default: OklchColor;
  readonly bright: OklchColor;
  readonly tint: OklchColor;
}

export interface NeutralRamp {
  readonly bgDeep: OklchColor;
  readonly bgShell: OklchColor;
  readonly bgCanvas: OklchColor;
  readonly bgSurface: OklchColor;
  readonly bgElevated: OklchColor;
  readonly bgOverlay: OklchColor;
  readonly bgHover: OklchColor;
  readonly borderSubtle: OklchColor;
  readonly borderStrong: OklchColor;
  readonly fgMuted: OklchColor;
  readonly fgSecondary: OklchColor;
  readonly fgPrimary: OklchColor;
  readonly fgInverse: OklchColor;
}

export interface ChromaticPalette {
  readonly blue: ChromaticGrade;
  readonly cyan: ChromaticGrade;
  readonly violet: ChromaticGrade;
  readonly green: ChromaticGrade;
  readonly amber: ChromaticGrade;
  readonly orange: ChromaticGrade;
  readonly red: ChromaticGrade;
  readonly magenta: ChromaticGrade;
}

export interface GlassShadowSpec {
  readonly offsetX: string;
  readonly offsetY: string;
  readonly blur: string;
  readonly spread: string;
  readonly color: OklchColor;
}

export interface GlassMaterialConfig {
  /** Opacity for Elevation 0 (Left Sidebar / Aux Pane Shell). */
  readonly shellAlpha: number;
  /** Opacity for Elevation 1 (Primary Chat Canvas / Artifacts). */
  readonly canvasAlpha: number;
  /** Opacity for Elevation 2 (Thinking / Tool / Subagent Cards). */
  readonly cardAlpha: number;
  /** Opacity for Elevation 3 (Slash / @ Popovers / Approval Modals). */
  readonly popoverAlpha: number;
  readonly blurSm: string;
  readonly blurMd: string;
  readonly blurShell: string;
  readonly blurLg: string;
  readonly saturateShell: string;
  readonly saturateCanvas: string;
  readonly saturatePopover: string;
  /** 1px top inner specular highlight color in OKLCH. */
  readonly rimTop: OklchColor;
  /** Outer glass rim border color in OKLCH. */
  readonly rimBorder: OklchColor;
  readonly shadowCard: GlassShadowSpec;
  readonly shadowPopover: GlassShadowSpec;
}

export interface SolidColorSet {
  readonly approveBtnBg: OklchColor;
  readonly approveBtnFg: OklchColor;
  readonly infoSolid: OklchColor;
  readonly successSolid: OklchColor;
  readonly warningSolid: OklchColor;
  readonly dangerSolid: OklchColor;
  readonly onSolid: OklchColor;
}

export interface PaletteAlphas {
  readonly hover: number;
  readonly selected: number;
  readonly tintBg: number;
  readonly alertBg: number;
  readonly alertBorder: number;
  readonly statusBorder: number;
  readonly statusRing: number;
  readonly thinkingBg: number;
  readonly approvalBg: number;
  readonly approvalBorder: number;
  readonly blockquoteBg: number;
  readonly inlineCodeBg: number;
  readonly tableStripeBg: number;
  readonly disabledFg: number;
  readonly terminalSelection: number;
  readonly diffLine: number;
  readonly diffWord: number;
}

export interface PrimitivePalette {
  readonly neutral: NeutralRamp;
  readonly chromatic: ChromaticPalette;
  readonly solidColors: SolidColorSet;
  readonly glass: GlassMaterialConfig;
  readonly alphas: PaletteAlphas;
}

export interface VariantDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly mode: ThemeMode;
  readonly palette: PrimitivePalette;
}

export interface StatusTokenSet {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly ring: string;
  readonly solid: string;
  readonly onSolid: string;
}

export interface AlertTokenSet {
  readonly bg: string;
  readonly border: string;
  readonly fg: string;
  readonly accentBar: string;
}

export interface ResolvedShadow {
  readonly offsetX: string;
  readonly offsetY: string;
  readonly blur: string;
  readonly spread: string;
  readonly colorHex: string;
  readonly css: string;
}

export interface Ansi16Palette {
  readonly black: string;
  readonly red: string;
  readonly green: string;
  readonly yellow: string;
  readonly blue: string;
  readonly magenta: string;
  readonly cyan: string;
  readonly white: string;
  readonly brightBlack: string;
  readonly brightRed: string;
  readonly brightGreen: string;
  readonly brightYellow: string;
  readonly brightBlue: string;
  readonly brightMagenta: string;
  readonly brightCyan: string;
  readonly brightWhite: string;
}

export interface CodeSyntaxTokens {
  readonly plain: string;
  readonly comment: string;
  readonly keyword: string;
  readonly controlFlow: string;
  readonly function: string;
  readonly type: string;
  readonly variable: string;
  readonly parameter: string;
  readonly property: string;
  readonly string: string;
  readonly number: string;
  readonly constant: string;
  readonly operator: string;
  readonly punctuation: string;
  readonly decorator: string;
  readonly tag: string;
  readonly attribute: string;
  readonly regex: string;
  readonly heading: string;
  readonly link: string;
  readonly diffInserted: string;
  readonly diffDeleted: string;
}

export interface SemanticIR {
  readonly meta: {
    readonly id: string;
    readonly displayName: string;
    readonly description: string;
    readonly mode: ThemeMode;
    readonly version: string;
  };
  readonly surface: {
    readonly shell: string;
    readonly canvas: string;
    readonly auxPane: string;
    readonly card: string;
    readonly elevated: string;
    readonly input: string;
    readonly hover: string;
    readonly selected: string;
    readonly disabled: string;
    readonly inverse: string;
  };
  readonly glass: {
    readonly shellBg: string;
    readonly canvasBg: string;
    readonly cardBg: string;
    readonly popoverBg: string;
    readonly shellHexAlpha: string;
    readonly canvasHexAlpha: string;
    readonly cardHexAlpha: string;
    readonly popoverHexAlpha: string;
    readonly opaqueFallback: {
      readonly shell: string;
      readonly canvas: string;
      readonly card: string;
      readonly popover: string;
    };
    readonly blurSm: string;
    readonly blurMd: string;
    readonly blurShell: string;
    readonly blurLg: string;
    readonly saturateShell: string;
    readonly saturateCanvas: string;
    readonly saturatePopover: string;
    readonly backdropShell: string;
    readonly backdropCanvas: string;
    readonly backdropPopover: string;
    readonly rimTop: string;
    readonly rimBorder: string;
    readonly rimTopHexAlpha: string;
    readonly rimBorderHexAlpha: string;
    readonly shadowCard: string;
    readonly shadowPopover: string;
    readonly shadowCardObj: ResolvedShadow;
    readonly shadowPopoverObj: ResolvedShadow;
  };
  readonly fg: {
    readonly primary: string;
    readonly secondary: string;
    readonly muted: string;
    readonly disabled: string;
    readonly inverse: string;
    readonly accent: string;
    readonly link: string;
  };
  readonly border: {
    readonly subtle: string;
    readonly default: string;
    readonly strong: string;
    readonly inverse: string;
    readonly focusRing: string;
  };
  readonly status: {
    readonly info: StatusTokenSet;
    readonly success: StatusTokenSet;
    readonly warning: StatusTokenSet;
    readonly danger: StatusTokenSet;
  };
  readonly agent: {
    readonly userBubbleBg: string;
    readonly userBubbleBorder: string;
    readonly thinkingBg: string;
    readonly thinkingBorder: string;
    readonly thinkingFg: string;
    readonly toolCardBg: string;
    readonly toolCardBorder: string;
    readonly approvalBg: string;
    readonly approvalBorder: string;
    readonly approvalFg: string;
    readonly approveBtnBg: string;
    readonly approveBtnFg: string;
    readonly runningAccent: string;
    readonly doneAccent: string;
    readonly errorAccent: string;
    readonly subagentWorking: string;
    readonly subagentWaiting: string;
    readonly subagentDone: string;
    readonly subagentKilled: string;
  };
  readonly artifact: {
    readonly alertNote: AlertTokenSet;
    readonly alertTip: AlertTokenSet;
    readonly alertImportant: AlertTokenSet;
    readonly alertWarning: AlertTokenSet;
    readonly alertCaution: AlertTokenSet;
    readonly blockquoteBg: string;
    readonly blockquoteBorder: string;
    readonly tableHeaderBg: string;
    readonly tableStripeBg: string;
    readonly tableBorder: string;
    readonly codeBlockBg: string;
    readonly codeBlockBorder: string;
    readonly inlineCodeBg: string;
    readonly inlineCodeFg: string;
    readonly mermaid: {
      readonly nodeBg: string;
      readonly nodeBorder: string;
      readonly nodeText: string;
      readonly secondaryBg: string;
      readonly tertiaryBg: string;
      readonly edgeColor: string;
      readonly labelBg: string;
    };
    readonly katexFg: string;
    readonly carouselControlBg: string;
    readonly carouselControlFg: string;
  };
  readonly diff: {
    readonly addedBg: string;
    readonly addedWordBg: string;
    readonly addedFg: string;
    readonly addedGutter: string;
    readonly removedBg: string;
    readonly removedWordBg: string;
    readonly removedFg: string;
    readonly removedGutter: string;
    readonly modifiedBadge: string;
    readonly hunkHeaderBg: string;
    readonly hunkHeaderFg: string;
  };
  readonly code: CodeSyntaxTokens;
  readonly terminal: {
    readonly background: string;
    readonly foreground: string;
    readonly cursor: string;
    readonly selectionBackground: string;
    readonly ansi: Ansi16Palette;
  };
}
