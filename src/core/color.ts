import { toGamut, type Rgb } from 'culori';
import type { GlassShadowSpec, OklchColor, ResolvedShadow } from './types.js';

// Strict perceptual constant-L/H chroma reduction (jnd = 0) into sRGB
const mapToSrgb = toGamut('rgb', 'oklch', null, 0);

function assertOklchRange(l: number, c: number, h: number, alpha?: number): void {
  if (!Number.isFinite(l) || l < 0 || l > 1) {
    throw new Error(`Invalid OKLCH lightness l=${l}; expected finite value in [0, 1].`);
  }
  if (!Number.isFinite(c) || c < 0) {
    throw new Error(`Invalid OKLCH chroma c=${c}; expected finite value >= 0.`);
  }
  if (!Number.isFinite(h)) {
    throw new Error(`Invalid OKLCH hue h=${h}; expected finite angle.`);
  }
  if (alpha !== undefined && (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)) {
    throw new Error(`Invalid OKLCH alpha=${alpha}; expected finite value in [0, 1].`);
  }
}

/**
 * Constructs a validated typed OKLCH color value.
 */
export function oklch(l: number, c: number, h: number, alpha?: number): OklchColor {
  assertOklchRange(l, c, h, alpha);
  return alpha === undefined ? { l, c, h } : { l, c, h, alpha };
}

/**
 * Returns a copy of an OKLCH color with a validated alpha channel in [0, 1].
 */
export function withAlpha(color: OklchColor, alpha: number): OklchColor {
  assertOklchRange(color.l, color.c, color.h, alpha);
  return { l: color.l, c: color.c, h: color.h, alpha };
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Non-finite sRGB channel value encountered: ${value}`);
  }
  return Math.min(1, Math.max(0, value));
}

function toByteHex(byte: number): string {
  return Math.min(255, Math.max(0, byte)).toString(16).padStart(2, '0');
}

function toRgbChannels(color: OklchColor): { r: number; g: number; b: number; a: number } {
  assertOklchRange(color.l, color.c, color.h, color.alpha);
  const mapped: Rgb = mapToSrgb({
    mode: 'oklch',
    l: color.l,
    c: color.c,
    h: color.h,
    alpha: color.alpha,
  });

  const r = Math.round(clampUnit(mapped.r) * 255);
  const g = Math.round(clampUnit(mapped.g) * 255);
  const b = Math.round(clampUnit(mapped.b) * 255);
  const a = color.alpha === undefined ? 1 : clampUnit(color.alpha);
  return { r, g, b, a };
}

/**
 * Perceptually gamut-maps an OKLCH color into sRGB and returns lowercase #rrggbb or #rrggbbaa.
 * Emits 6-digit hex whenever rounded alpha byte equals 255.
 */
export function oklchToHex(color: OklchColor): string {
  const { r, g, b, a } = toRgbChannels(color);
  const base = `#${toByteHex(r)}${toByteHex(g)}${toByteHex(b)}`;
  const alphaByte = Math.round(a * 255);
  if (alphaByte >= 255) {
    return base;
  }
  return `${base}${toByteHex(alphaByte)}`;
}

/**
 * Perceptually gamut-maps an OKLCH color and formats it as a deterministic CSS rgba(...) string.
 */
export function oklchToCssRgba(color: OklchColor): string {
  const { r, g, b, a } = toRgbChannels(color);
  const alphaStr = Number(a.toFixed(4)).toString();
  return `rgba(${r}, ${g}, ${b}, ${alphaStr})`;
}

/**
 * Formats an OKLCH color's gamut-mapped sRGB channels as a comma-separated "r, g, b" tuple.
 */
export function oklchToRgbTuple(color: OklchColor): string {
  const { r, g, b } = toRgbChannels(color);
  return `${r}, ${g}, ${b}`;
}

/**
 * Formats a hex color string into a comma-separated "r, g, b" tuple.
 */
export function hexToRgbTuple(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Resolves a structured GlassShadowSpec into both DTCG fields and CSS box-shadow string.
 */
export function resolveShadow(shadow: GlassShadowSpec): ResolvedShadow {
  const colorHex = oklchToHex(shadow.color);
  const rgba = oklchToCssRgba(shadow.color);
  const spreadPart = shadow.spread === '0px' || shadow.spread === '0' ? '' : ` ${shadow.spread}`;
  const css = `${shadow.offsetX} ${shadow.offsetY} ${shadow.blur}${spreadPart} ${rgba}`;
  return {
    offsetX: shadow.offsetX,
    offsetY: shadow.offsetY,
    blur: shadow.blur,
    spread: shadow.spread,
    colorHex,
    css,
  };
}

/**
 * Parses a 6-digit or 8-digit hex color string into 0..255 RGB channels and [0, 1] alpha.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!match || !match[1]) {
    throw new Error(`Invalid sRGB hex color: "${hex}"`);
  }
  const rgbHex = match[1];
  const alphaHex = match[2];
  const r = Number.parseInt(rgbHex.slice(0, 2), 16);
  const g = Number.parseInt(rgbHex.slice(2, 4), 16);
  const b = Number.parseInt(rgbHex.slice(4, 6), 16);
  const a = alphaHex ? Number.parseInt(alphaHex, 16) / 255 : 1;
  return { r, g, b, a };
}

/**
 * Composites a translucent foreground hex (#rrggbbaa or #rrggbb) over a strictly opaque
 * background (#rrggbb) using Porter-Duff source-over blending and returns opaque lowercase #rrggbb.
 */
export function blendOver(fgHexWithAlpha: string, bgHex: string): string {
  const fg = hexToRgb(fgHexWithAlpha);
  const bg = hexToRgb(bgHex);

  if (bg.a < 1) {
    throw new Error(
      `blendOver requires an opaque background (#rrggbb), received translucent "${bgHex}".`,
    );
  }

  const blendChannel = (f: number, b: number): string => {
    const val = f * fg.a + b * (1 - fg.a);
    return toByteHex(Math.round(val));
  };

  return `#${blendChannel(fg.r, bg.r)}${blendChannel(fg.g, bg.g)}${blendChannel(fg.b, bg.b)}`;
}
