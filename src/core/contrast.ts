import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { blendOver, hexToRgb } from './color.js';

function srgbToRelativeLuminance(channel8Bit: number): number {
  const srgb = channel8Bit / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function assertOpaqueBackground(bgHex: string, fnName: string): void {
  if (hexToRgb(bgHex).a < 1) {
    throw new Error(
      `${fnName} requires an opaque background (#rrggbb); received translucent "${bgHex}". Call blendOver() first.`,
    );
  }
}

/**
 * Computes the WCAG 2.1 contrast ratio (1.0 to 21.0) against an opaque background.
 * If the foreground contains alpha, it is composited over the opaque background first.
 */
export function wcagContrast(fgHex: string, bgHex: string): number {
  assertOpaqueBackground(bgHex, 'wcagContrast');
  const fgOpaque = hexToRgb(fgHex).a < 1 ? blendOver(fgHex, bgHex) : fgHex;

  const fg = hexToRgb(fgOpaque);
  const bg = hexToRgb(bgHex);

  const lFg =
    0.2126 * srgbToRelativeLuminance(fg.r) +
    0.7152 * srgbToRelativeLuminance(fg.g) +
    0.0722 * srgbToRelativeLuminance(fg.b);
  const lBg =
    0.2126 * srgbToRelativeLuminance(bg.r) +
    0.7152 * srgbToRelativeLuminance(bg.g) +
    0.0722 * srgbToRelativeLuminance(bg.b);

  const lighter = Math.max(lFg, lBg);
  const darker = Math.min(lFg, lBg);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Computes signed APCA Lightness Contrast (Lc) via apca-w3 against an opaque background.
 * Positive values indicate dark text on light background; negative values indicate light text on dark background.
 */
export function apcaContrast(fgHex: string, bgHex: string): number {
  assertOpaqueBackground(bgHex, 'apcaContrast');
  const fgOpaque = hexToRgb(fgHex).a < 1 ? blendOver(fgHex, bgHex) : fgHex;

  const fg = hexToRgb(fgOpaque);
  const bg = hexToRgb(bgHex);

  const fgY = sRGBtoY([fg.r, fg.g, fg.b]);
  const bgY = sRGBtoY([bg.r, bg.g, bg.b]);
  return APCAcontrast(fgY, bgY);
}

export interface WorstCaseGlassResult {
  readonly overWhiteBg: string;
  readonly overBlackBg: string;
  /** Signed APCA Lc over pure white (#ffffff). */
  readonly overWhiteApca: number;
  /** Signed APCA Lc over pure black (#000000). */
  readonly overBlackApca: number;
  readonly polarityCrossesZero: boolean;
  readonly minAbsApca: number;
  readonly overWhiteWcag: number;
  readonly overBlackWcag: number;
  readonly minWcag: number;
}

/**
 * Evaluates worst-case wallpaper compositing for a frosted glass surface against pure white (#ffffff)
 * and pure black (#000000) desktop backdrops, guarding against intermediate-gray zero-crossings.
 */
export function worstCaseGlassContrast(
  fgHex: string,
  glassHexWithAlpha: string,
): WorstCaseGlassResult {
  const overWhiteBg = blendOver(glassHexWithAlpha, '#ffffff');
  const overBlackBg = blendOver(glassHexWithAlpha, '#000000');

  const overWhiteApca = apcaContrast(fgHex, overWhiteBg);
  const overBlackApca = apcaContrast(fgHex, overBlackBg);
  const overWhiteWcag = wcagContrast(fgHex, overWhiteBg);
  const overBlackWcag = wcagContrast(fgHex, overBlackBg);

  const polarityCrossesZero =
    overWhiteApca !== 0 &&
    overBlackApca !== 0 &&
    Math.sign(overWhiteApca) !== Math.sign(overBlackApca);

  return {
    overWhiteBg,
    overBlackBg,
    overWhiteApca,
    overBlackApca,
    polarityCrossesZero,
    minAbsApca: polarityCrossesZero
      ? 0
      : Math.min(Math.abs(overWhiteApca), Math.abs(overBlackApca)),
    overWhiteWcag,
    overBlackWcag,
    minWcag: polarityCrossesZero ? 1.0 : Math.min(overWhiteWcag, overBlackWcag),
  };
}
