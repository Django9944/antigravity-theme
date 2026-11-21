import { oklch } from '../core/color.js';
import type { VariantDefinition } from '../core/types.js';

export const ORBITAL_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-orbital" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#86C1FF"/><stop offset="55%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#6366F1"/></linearGradient></defs><ellipse cx="8" cy="8" rx="6.2" ry="2.7" transform="rotate(-28 8 8)" stroke="url(#ag-svg-orbital)" stroke-width="1.45"/><circle cx="8" cy="8" r="2.3" fill="url(#ag-svg-orbital)"/><circle cx="12.5" cy="5.5" r="1.1" fill="#5CD0DC"/></svg>';

/**
 * Antigravity Dark — Orbital Slate Matte Glass (ADR-006).
 * Cool deep slate-blue base with Weightless Cobalt accent and high-opacity matte glass surfaces.
 */
export const darkVariant: VariantDefinition = {
  id: 'antigravity-dark',
  family: 'orbital',
  familyName: 'Orbital',
  nameZh: '星轨岩板',
  displayName: 'Antigravity Dark',
  description:
    'Orbital Slate Matte Glass — cool slate-blue dark theme with Weightless Cobalt accents and high-opacity frosted surfaces for Antigravity 2.0.',
  mode: 'dark',
  accentRole: 'blue',
  inlineCodeRole: 'blue',
  iconSvg: ORBITAL_ICON_SVG,
  aurora: {
    titlebarTint: oklch(0.195, 0.015, 255),
    titlebarSymbol: oklch(0.915, 0.010, 250),
    topCapBlend: true,
    linearAngle: '135deg',
    linearStops: [
      { color: oklch(0.165, 0.014, 255), pos: '0%' },
      { color: oklch(0.195, 0.015, 255), pos: '50%' },
      { color: oklch(0.220, 0.016, 255), pos: '100%' },
    ],
    glows: [
      { x: '18%', y: '18%', radius: '48%', color: oklch(0.60, 0.14, 250, 0.18) },
      { x: '82%', y: '16%', radius: '44%', color: oklch(0.62, 0.12, 205, 0.12) },
      { x: '84%', y: '82%', radius: '50%', color: oklch(0.56, 0.14, 290, 0.14) },
    ],
    sidebarTint: oklch(0.180, 0.015, 255, 0.35),
    scrollbarStops: [
      oklch(0.795, 0.120, 250, 0.92),
      oklch(0.795, 0.105, 205, 0.92),
      oklch(0.802, 0.120, 290, 0.92),
    ],
    spinnerDots: [
      oklch(0.795, 0.120, 250),
      oklch(0.795, 0.105, 205),
      oklch(0.802, 0.120, 290),
      oklch(0.790, 0.122, 154),
    ],
    mediaModalBg: oklch(0.145, 0.014, 255),
    userBubbleSolid: oklch(0.240, 0.018, 255),
  },
  palette: {
    neutral: {
      bgDeep: oklch(0.175, 0.014, 255),
      bgShell: oklch(0.195, 0.015, 255), // Elevation 0: L_canvas - 0.025
      bgCanvas: oklch(0.220, 0.016, 255), // Elevation 1: ADR-006 dark anchor (0.20-0.23)
      bgSurface: oklch(0.250, 0.016, 255), // Elevation 2: +0.030 cards
      bgElevated: oklch(0.275, 0.017, 255), // Elevation 3: +0.055 floating popovers
      bgOverlay: oklch(0.305, 0.017, 255),
      bgHover: oklch(0.335, 0.018, 255),
      borderSubtle: oklch(0.512, 0.014, 255), // L5 hairline divider >= 20 APCA on canvas
      borderStrong: oklch(0.585, 0.016, 255), // L5 control border >= 30 APCA on canvas
      fgMuted: oklch(0.715, 0.014, 250), // L3 Thinking / metadata (APCA >= 50, WCAG >= 3.0)
      fgSecondary: oklch(0.850, 0.012, 250), // L1/L2 secondary labels >= 75 APCA on canvas
      fgPrimary: oklch(0.915, 0.010, 250), // L1 cool off-white
      fgInverse: oklch(0.195, 0.015, 255),
    },
    chromatic: {
      // Weightless Cobalt primary accent (H ~ 250, C <= 0.135)
      blue: {
        default: oklch(0.795, 0.120, 250),
        bright: oklch(0.848, 0.115, 248),
        tint: oklch(0.500, 0.120, 250),
      },
      // Cyan (Running / Terminal / Functions)
      cyan: {
        default: oklch(0.795, 0.105, 205),
        bright: oklch(0.848, 0.105, 205),
        tint: oklch(0.530, 0.105, 205),
      },
      // Soft atmospheric violet (Important / Subagent Waiting / Keywords)
      violet: {
        default: oklch(0.802, 0.120, 290),
        bright: oklch(0.850, 0.118, 290),
        tint: oklch(0.500, 0.120, 290),
      },
      // Semantic emerald green (Success / Tip / Diff Added)
      green: {
        default: oklch(0.790, 0.122, 154),
        bright: oklch(0.842, 0.120, 154),
        tint: oklch(0.475, 0.118, 154),
      },
      // Warm amber (Warning / Needs Approval / Constants)
      amber: {
        default: oklch(0.810, 0.122, 78),
        bright: oklch(0.858, 0.118, 78),
        tint: oklch(0.540, 0.118, 78),
      },
      // Soft coral orange (Numbers / Operators)
      orange: {
        default: oklch(0.790, 0.126, 50),
        bright: oklch(0.840, 0.122, 50),
        tint: oklch(0.530, 0.118, 50),
      },
      // Restrained crimson (Error / Caution / Diff Removed)
      red: {
        default: oklch(0.800, 0.126, 22),
        bright: oklch(0.848, 0.122, 22),
        tint: oklch(0.455, 0.118, 22),
      },
      // Soft rose magenta (Regex / Decorators / ANSI Magenta)
      magenta: {
        default: oklch(0.795, 0.122, 335),
        bright: oklch(0.842, 0.118, 335),
        tint: oklch(0.495, 0.118, 335),
      },
    },
    solidColors: {
      approveBtnBg: oklch(0.495, 0.132, 250),
      approveBtnFg: oklch(0.988, 0.003, 250),
      infoSolid: oklch(0.500, 0.130, 250),
      successSolid: oklch(0.495, 0.125, 154),
      warningSolid: oklch(0.510, 0.125, 78),
      dangerSolid: oklch(0.495, 0.132, 22),
      onSolid: oklch(0.988, 0.003, 250),
    },
    glass: {
      shellAlpha: 0.86, // ADR-006: 0.84-0.88
      canvasAlpha: 0.94, // ADR-006: 0.92-0.96
      cardAlpha: 0.82, // 0.78-0.86
      popoverAlpha: 0.91, // 0.88-0.93
      blurSm: '16px',
      blurMd: '24px',
      blurShell: '28px',
      blurLg: '32px',
      saturateShell: '130%',
      saturateCanvas: '115%',
      saturatePopover: '145%',
      rimTop: oklch(0.990, 0.002, 250, 0.085),
      rimBorder: oklch(0.990, 0.002, 250, 0.095),
      shadowCard: {
        offsetX: '0px',
        offsetY: '4px',
        blur: '18px',
        spread: '0px',
        color: oklch(0.100, 0.015, 255, 0.28),
      },
      shadowPopover: {
        offsetX: '0px',
        offsetY: '16px',
        blur: '42px',
        spread: '0px',
        color: oklch(0.080, 0.015, 255, 0.46),
      },
    },
    alphas: {
      hover: 0.45,
      selected: 0.20,
      tintBg: 0.14,
      alertBg: 0.13,
      alertBorder: 0.30,
      statusBorder: 0.36,
      statusRing: 0.88,
      thinkingBg: 0.72,
      approvalBg: 0.12,
      approvalBorder: 0.44,
      blockquoteBg: 0.50,
      inlineCodeBg: 0.14,
      tableStripeBg: 0.55,
      disabledFg: 0.65,
      terminalSelection: 0.28,
      diffLine: 0.14,
      diffWord: 0.26,
    },
  },
};
