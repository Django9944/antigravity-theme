import {
  oklchToCssRgba,
  oklchToHex,
  resolveShadow,
  withAlpha,
} from '../core/color.js';
import type {
  AlertTokenSet,
  ChromaticGrade,
  OklchColor,
  SemanticIR,
  StatusTokenSet,
  VariantDefinition,
} from '../core/types.js';

function buildStatusSet(
  grade: ChromaticGrade,
  tintAlpha: number,
  borderAlpha: number,
  ringAlpha: number,
  solidColor: OklchColor,
  onSolidColor: OklchColor,
): StatusTokenSet {
  return {
    bg: oklchToHex(withAlpha(grade.tint, tintAlpha)),
    text: oklchToHex(grade.default),
    border: oklchToHex(withAlpha(grade.default, borderAlpha)),
    ring: oklchToHex(withAlpha(grade.default, ringAlpha)),
    solid: oklchToHex(solidColor),
    onSolid: oklchToHex(onSolidColor),
  };
}

function buildAlertSet(
  grade: ChromaticGrade,
  tintAlpha: number,
  borderAlpha: number,
): AlertTokenSet {
  return {
    bg: oklchToHex(withAlpha(grade.tint, tintAlpha)),
    border: oklchToHex(withAlpha(grade.default, borderAlpha)),
    fg: oklchToHex(grade.default),
    accentBar: oklchToHex(grade.default),
  };
}

/**
 * Deterministically compiles a Layer 1 PrimitivePalette into the Layer 2 SemanticIR.
 * Handles dark, light, hc-dark, and hc-light modes via palette-driven parameters.
 */
export function resolveSemanticIR(
  variant: VariantDefinition,
  version: string,
): SemanticIR {
  const { palette, mode } = variant;
  const { neutral, chromatic, solidColors, glass, alphas } = palette;
  const isDark = mode === 'dark' || mode === 'hc-dark';
  const isHighContrast = mode === 'hc-dark' || mode === 'hc-light';

  // Elevation surfaces (opaque anchors)
  const shellHex = oklchToHex(neutral.bgShell);
  const canvasHex = oklchToHex(neutral.bgCanvas);
  const cardHex = oklchToHex(neutral.bgSurface);
  const popoverHex = oklchToHex(neutral.bgElevated);

  // High-contrast variants enforce opaque surfaces for maximum readability
  const shellAlpha = isHighContrast ? 1.0 : glass.shellAlpha;
  const canvasAlpha = isHighContrast ? 1.0 : glass.canvasAlpha;
  const cardAlpha = isHighContrast ? 1.0 : glass.cardAlpha;
  const popoverAlpha = isHighContrast ? 1.0 : glass.popoverAlpha;

  const shellGlassColor = withAlpha(neutral.bgShell, shellAlpha);
  const canvasGlassColor = withAlpha(neutral.bgCanvas, canvasAlpha);
  const cardGlassColor = withAlpha(neutral.bgSurface, cardAlpha);
  const popoverGlassColor = withAlpha(neutral.bgElevated, popoverAlpha);

  const shadowCardObj = resolveShadow(glass.shadowCard);
  const shadowPopoverObj = resolveShadow(glass.shadowPopover);

  const thinkingBgColor = isDark
    ? withAlpha(neutral.bgDeep, alphas.thinkingBg)
    : withAlpha(neutral.bgSurface, alphas.thinkingBg);

  // Light mode uses recessed darker neutral (bgDeep) so inline code and quotes stay visible on porcelain canvas
  const blockquoteBgColor = isDark
    ? withAlpha(neutral.bgElevated, alphas.blockquoteBg)
    : withAlpha(neutral.bgDeep, alphas.blockquoteBg);
  const inlineCodeBgColor = isDark
    ? withAlpha(neutral.bgOverlay, alphas.inlineCodeBg)
    : withAlpha(neutral.bgDeep, alphas.inlineCodeBg);
  const codeBlockBgHex = isDark ? oklchToHex(neutral.bgDeep) : cardHex;

  const disabledFg = oklchToHex(withAlpha(neutral.fgMuted, alphas.disabledFg));

  return {
    meta: {
      id: variant.id,
      displayName: variant.displayName,
      description: variant.description,
      mode: variant.mode,
      version,
    },
    surface: {
      shell: shellHex,
      canvas: canvasHex,
      auxPane: shellHex,
      card: cardHex,
      elevated: popoverHex,
      input: oklchToHex(neutral.bgDeep),
      hover: oklchToHex(withAlpha(neutral.bgHover, alphas.hover)),
      selected: oklchToHex(withAlpha(chromatic.blue.tint, alphas.selected)),
      disabled: oklchToHex(neutral.bgSurface),
      inverse: oklchToHex(neutral.fgPrimary),
    },
    glass: {
      shellBg: oklchToCssRgba(shellGlassColor),
      canvasBg: oklchToCssRgba(canvasGlassColor),
      cardBg: oklchToCssRgba(cardGlassColor),
      popoverBg: oklchToCssRgba(popoverGlassColor),
      shellHexAlpha: oklchToHex(shellGlassColor),
      canvasHexAlpha: oklchToHex(canvasGlassColor),
      cardHexAlpha: oklchToHex(cardGlassColor),
      popoverHexAlpha: oklchToHex(popoverGlassColor),
      opaqueFallback: {
        shell: shellHex,
        canvas: canvasHex,
        card: cardHex,
        popover: popoverHex,
      },
      blurSm: glass.blurSm,
      blurMd: glass.blurMd,
      blurShell: glass.blurShell,
      blurLg: glass.blurLg,
      saturateShell: glass.saturateShell,
      saturateCanvas: glass.saturateCanvas,
      saturatePopover: glass.saturatePopover,
      backdropShell: isHighContrast
        ? 'none'
        : `blur(${glass.blurShell}) saturate(${glass.saturateShell})`,
      backdropCanvas: isHighContrast
        ? 'none'
        : `blur(${glass.blurMd}) saturate(${glass.saturateCanvas})`,
      backdropPopover: isHighContrast
        ? 'none'
        : `blur(${glass.blurLg}) saturate(${glass.saturatePopover})`,
      rimTop: oklchToCssRgba(glass.rimTop),
      rimBorder: oklchToCssRgba(glass.rimBorder),
      rimTopHexAlpha: oklchToHex(glass.rimTop),
      rimBorderHexAlpha: oklchToHex(glass.rimBorder),
      shadowCard: shadowCardObj.css,
      shadowPopover: shadowPopoverObj.css,
      shadowCardObj,
      shadowPopoverObj,
    },
    fg: {
      primary: oklchToHex(neutral.fgPrimary),
      secondary: oklchToHex(neutral.fgSecondary),
      muted: oklchToHex(neutral.fgMuted),
      disabled: disabledFg,
      inverse: oklchToHex(neutral.fgInverse),
      accent: oklchToHex(chromatic.blue.default),
      link: oklchToHex(chromatic.blue.bright),
    },
    border: {
      subtle: oklchToHex(neutral.borderSubtle),
      default: oklchToHex(neutral.borderStrong),
      strong: oklchToHex(neutral.fgMuted),
      inverse: oklchToHex(neutral.fgInverse),
      focusRing: oklchToHex(chromatic.blue.default),
    },
    status: {
      info: buildStatusSet(
        chromatic.blue,
        alphas.tintBg,
        alphas.statusBorder,
        alphas.statusRing,
        solidColors.infoSolid,
        solidColors.onSolid,
      ),
      success: buildStatusSet(
        chromatic.green,
        alphas.tintBg,
        alphas.statusBorder,
        alphas.statusRing,
        solidColors.successSolid,
        solidColors.onSolid,
      ),
      warning: buildStatusSet(
        chromatic.amber,
        alphas.tintBg,
        alphas.statusBorder,
        alphas.statusRing,
        solidColors.warningSolid,
        solidColors.onSolid,
      ),
      danger: buildStatusSet(
        chromatic.red,
        alphas.tintBg,
        alphas.statusBorder,
        alphas.statusRing,
        solidColors.dangerSolid,
        solidColors.onSolid,
      ),
    },
    agent: {
      userBubbleBg: oklchToHex(neutral.bgSurface),
      userBubbleBorder: oklchToHex(neutral.borderSubtle),
      thinkingBg: oklchToHex(thinkingBgColor),
      thinkingBorder: oklchToHex(neutral.borderStrong),
      thinkingFg: oklchToHex(neutral.fgMuted),
      toolCardBg: oklchToHex(neutral.bgSurface),
      toolCardBorder: oklchToHex(neutral.borderSubtle),
      approvalBg: oklchToHex(withAlpha(chromatic.amber.tint, alphas.approvalBg)),
      approvalBorder: oklchToHex(withAlpha(chromatic.amber.default, alphas.approvalBorder)),
      approvalFg: oklchToHex(chromatic.amber.default),
      approveBtnBg: oklchToHex(solidColors.approveBtnBg),
      approveBtnFg: oklchToHex(solidColors.approveBtnFg),
      runningAccent: oklchToHex(chromatic.cyan.default),
      doneAccent: oklchToHex(chromatic.green.default),
      errorAccent: oklchToHex(chromatic.red.default),
      subagentWorking: oklchToHex(chromatic.cyan.default),
      subagentWaiting: oklchToHex(chromatic.violet.default),
      subagentDone: oklchToHex(chromatic.green.default),
      subagentKilled: oklchToHex(neutral.fgMuted),
    },
    artifact: {
      alertNote: buildAlertSet(chromatic.blue, alphas.alertBg, alphas.alertBorder),
      alertTip: buildAlertSet(chromatic.green, alphas.alertBg, alphas.alertBorder),
      alertImportant: buildAlertSet(chromatic.violet, alphas.alertBg, alphas.alertBorder),
      alertWarning: buildAlertSet(chromatic.amber, alphas.alertBg, alphas.alertBorder),
      alertCaution: buildAlertSet(chromatic.red, alphas.alertBg, alphas.alertBorder),
      blockquoteBg: oklchToHex(blockquoteBgColor),
      blockquoteBorder: oklchToHex(chromatic.blue.default),
      tableHeaderBg: oklchToHex(neutral.bgElevated),
      tableStripeBg: oklchToHex(withAlpha(neutral.bgSurface, alphas.tableStripeBg)),
      tableBorder: oklchToHex(neutral.borderSubtle),
      codeBlockBg: codeBlockBgHex,
      codeBlockBorder: oklchToHex(neutral.borderSubtle),
      inlineCodeBg: oklchToHex(inlineCodeBgColor),
      inlineCodeFg: oklchToHex(chromatic.violet.default),
      mermaid: {
        nodeBg: cardHex,
        nodeBorder: oklchToHex(chromatic.blue.default),
        nodeText: oklchToHex(neutral.fgPrimary),
        secondaryBg: popoverHex,
        tertiaryBg: shellHex,
        edgeColor: oklchToHex(neutral.fgMuted),
        labelBg: canvasHex,
      },
      katexFg: oklchToHex(neutral.fgPrimary),
      carouselControlBg: popoverHex,
      carouselControlFg: oklchToHex(neutral.fgPrimary),
    },
    diff: {
      addedBg: oklchToHex(withAlpha(chromatic.green.tint, alphas.diffLine)),
      addedWordBg: oklchToHex(withAlpha(chromatic.green.tint, alphas.diffWord)),
      addedFg: oklchToHex(chromatic.green.default),
      addedGutter: oklchToHex(chromatic.green.default),
      removedBg: oklchToHex(withAlpha(chromatic.red.tint, alphas.diffLine)),
      removedWordBg: oklchToHex(withAlpha(chromatic.red.tint, alphas.diffWord)),
      removedFg: oklchToHex(chromatic.red.default),
      removedGutter: oklchToHex(chromatic.red.default),
      modifiedBadge: oklchToHex(chromatic.amber.default),
      hunkHeaderBg: oklchToHex(withAlpha(chromatic.blue.tint, alphas.tintBg)),
      hunkHeaderFg: oklchToHex(chromatic.blue.default),
    },
    code: {
      plain: oklchToHex(neutral.fgPrimary),
      comment: oklchToHex(neutral.fgMuted),
      keyword: oklchToHex(chromatic.violet.default),
      controlFlow: oklchToHex(chromatic.magenta.default),
      function: oklchToHex(chromatic.blue.default),
      type: oklchToHex(chromatic.cyan.default),
      variable: oklchToHex(neutral.fgPrimary),
      parameter: oklchToHex(chromatic.orange.default),
      property: oklchToHex(chromatic.blue.bright),
      string: oklchToHex(chromatic.green.default),
      number: oklchToHex(chromatic.orange.default),
      constant: oklchToHex(chromatic.amber.default),
      operator: oklchToHex(chromatic.cyan.bright),
      punctuation: oklchToHex(neutral.fgSecondary),
      decorator: oklchToHex(chromatic.magenta.bright),
      tag: oklchToHex(chromatic.red.default),
      attribute: oklchToHex(chromatic.amber.default),
      regex: oklchToHex(chromatic.cyan.default),
      heading: oklchToHex(chromatic.blue.bright),
      link: oklchToHex(chromatic.cyan.default),
      diffInserted: oklchToHex(chromatic.green.default),
      diffDeleted: oklchToHex(chromatic.red.default),
    },
    terminal: {
      background: oklchToHex(neutral.bgDeep),
      foreground: oklchToHex(neutral.fgPrimary),
      cursor: oklchToHex(chromatic.blue.default),
      selectionBackground: oklchToHex(withAlpha(chromatic.blue.tint, alphas.terminalSelection)),
      ansi: {
        black: oklchToHex(isDark ? neutral.bgSurface : neutral.fgPrimary),
        red: oklchToHex(chromatic.red.default),
        green: oklchToHex(chromatic.green.default),
        yellow: oklchToHex(chromatic.amber.default),
        blue: oklchToHex(chromatic.blue.default),
        magenta: oklchToHex(chromatic.magenta.default),
        cyan: oklchToHex(chromatic.cyan.default),
        white: oklchToHex(isDark ? neutral.fgSecondary : neutral.bgShell),
        brightBlack: oklchToHex(isDark ? neutral.fgMuted : neutral.fgSecondary),
        brightRed: oklchToHex(chromatic.red.bright),
        brightGreen: oklchToHex(chromatic.green.bright),
        brightYellow: oklchToHex(chromatic.amber.bright),
        brightBlue: oklchToHex(chromatic.blue.bright),
        brightMagenta: oklchToHex(chromatic.magenta.bright),
        brightCyan: oklchToHex(chromatic.cyan.bright),
        brightWhite: oklchToHex(isDark ? neutral.fgPrimary : neutral.bgElevated),
      },
    },
  };
}
