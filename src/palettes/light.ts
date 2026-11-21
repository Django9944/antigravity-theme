import { oklch } from '../core/color.js';
import type { VariantDefinition } from '../core/types.js';

/**
 * Antigravity Light — Orbital Cloud Matte Glass (ADR-006).
 * Airy cloud-porcelain base with charcoal-slate prose, tightened chroma, and high-opacity frosted surfaces.
 */
export const lightVariant: VariantDefinition = {
  id: 'antigravity-light',
  displayName: 'Antigravity Light',
  description:
    'Orbital Cloud Matte Glass — airy cloud-porcelain light theme with Weightless Cobalt accents and editorial reading comfort for Antigravity 2.0.',
  mode: 'light',
  palette: {
    neutral: {
      bgDeep: oklch(0.922, 0.010, 245),
      bgShell: oklch(0.955, 0.008, 245), // Elevation 0: L_canvas - 0.025
      bgCanvas: oklch(0.980, 0.006, 245), // Elevation 1: ADR-006 light anchor (0.975-0.985)
      bgSurface: oklch(0.962, 0.007, 245), // Elevation 2: L_canvas - 0.018 card surface
      bgElevated: oklch(0.992, 0.004, 245), // Elevation 3: crisp matte white popover
      bgOverlay: oklch(0.996, 0.003, 245),
      bgHover: oklch(0.930, 0.011, 245),
      borderSubtle: oklch(0.812, 0.012, 245), // L5 hairline divider >= 20 APCA on canvas
      borderStrong: oklch(0.700, 0.014, 245), // L5 control border >= 30 APCA on canvas
      fgMuted: oklch(0.495, 0.014, 248), // L3 Thinking / metadata (APCA >= 50, WCAG >= 3.0)
      fgSecondary: oklch(0.365, 0.016, 250),
      fgPrimary: oklch(0.240, 0.018, 252), // L1 charcoal-slate
      fgInverse: oklch(0.988, 0.003, 245),
    },
    chromatic: {
      // Weightless Cobalt (tightened chroma <= 0.145 for light paper clarity)
      blue: {
        default: oklch(0.448, 0.140, 250),
        bright: oklch(0.398, 0.142, 250),
        tint: oklch(0.690, 0.102, 250),
      },
      // Deep studio teal/cyan
      cyan: {
        default: oklch(0.442, 0.105, 205),
        bright: oklch(0.392, 0.105, 205),
        tint: oklch(0.700, 0.085, 205),
      },
      // Atmospheric deep violet
      violet: {
        default: oklch(0.445, 0.140, 290),
        bright: oklch(0.395, 0.142, 290),
        tint: oklch(0.700, 0.102, 290),
      },
      // Deep forest emerald
      green: {
        default: oklch(0.438, 0.128, 152),
        bright: oklch(0.385, 0.130, 152),
        tint: oklch(0.720, 0.102, 152),
      },
      // Rich bronze amber (high contrast on light backgrounds)
      amber: {
        default: oklch(0.452, 0.120, 68),
        bright: oklch(0.402, 0.122, 68),
        tint: oklch(0.760, 0.112, 76),
      },
      // Terracotta orange
      orange: {
        default: oklch(0.458, 0.135, 45),
        bright: oklch(0.408, 0.135, 45),
        tint: oklch(0.730, 0.112, 48),
      },
      // Studio crimson
      red: {
        default: oklch(0.455, 0.142, 24),
        bright: oklch(0.402, 0.144, 24),
        tint: oklch(0.730, 0.115, 24),
      },
      // Plum magenta
      magenta: {
        default: oklch(0.448, 0.138, 335),
        bright: oklch(0.398, 0.140, 335),
        tint: oklch(0.710, 0.108, 335),
      },
    },
    solidColors: {
      approveBtnBg: oklch(0.448, 0.142, 250),
      approveBtnFg: oklch(0.988, 0.003, 245),
      infoSolid: oklch(0.448, 0.140, 250),
      successSolid: oklch(0.438, 0.128, 152),
      warningSolid: oklch(0.452, 0.120, 68),
      dangerSolid: oklch(0.455, 0.142, 24),
      onSolid: oklch(0.988, 0.003, 245),
    },
    glass: {
      shellAlpha: 0.88, // ADR-006: 0.86-0.90
      canvasAlpha: 0.95, // ADR-006: 0.94-0.97
      cardAlpha: 0.86, // 0.84-0.90
      popoverAlpha: 0.93, // 0.90-0.95
      blurSm: '16px',
      blurMd: '24px',
      blurShell: '28px',
      blurLg: '32px',
      saturateShell: '135%',
      saturateCanvas: '120%',
      saturatePopover: '145%',
      rimTop: oklch(1.0, 0.0, 245, 0.78),
      rimBorder: oklch(0.200, 0.025, 255, 0.085),
      shadowCard: {
        offsetX: '0px',
        offsetY: '3px',
        blur: '14px',
        spread: '0px',
        color: oklch(0.180, 0.025, 255, 0.06),
      },
      shadowPopover: {
        offsetX: '0px',
        offsetY: '14px',
        blur: '38px',
        spread: '0px',
        color: oklch(0.180, 0.025, 255, 0.12),
      },
    },
    alphas: {
      hover: 0.55,
      selected: 0.14,
      tintBg: 0.13,
      alertBg: 0.12,
      alertBorder: 0.24,
      statusBorder: 0.30,
      statusRing: 0.88,
      thinkingBg: 0.90,
      approvalBg: 0.11,
      approvalBorder: 0.36,
      blockquoteBg: 0.55,
      inlineCodeBg: 0.72,
      tableStripeBg: 0.55,
      disabledFg: 0.65,
      terminalSelection: 0.28,
      diffLine: 0.12,
      diffWord: 0.22,
    },
  },
};
