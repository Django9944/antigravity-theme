import { oklch } from '../core/color.js';
import type {
  AuroraMeshSpec,
  ChromaticPalette,
  OklchColor,
  PrimitivePalette,
  ThemeFamilyId,
  VariantDefinition,
} from '../core/types.js';
import { darkVariant } from './dark.js';
import { lightVariant } from './light.js';

interface FamilySpec {
  readonly family: Exclude<ThemeFamilyId, 'orbital'>;
  readonly familyName: string;
  readonly darkId: string;
  readonly lightId: string;
  readonly darkName: string;
  readonly lightName: string;
  readonly darkNameZh: string;
  readonly lightNameZh: string;
  readonly darkDesc: string;
  readonly lightDesc: string;
  readonly neutralHue: number;
  readonly accentRole: keyof ChromaticPalette;
  readonly inlineCodeRole: keyof ChromaticPalette;
  readonly accentHue: number;
  readonly iconSvg: string;
  readonly darkAurora: AuroraMeshSpec;
  readonly lightAurora: AuroraMeshSpec;
}

const PRISM_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-prism" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#4285F4"/><stop offset="35%" stop-color="#8B5CF6"/><stop offset="70%" stop-color="#EC4899"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M8 1C8 4.866 4.866 8 1 8C4.866 8 8 11.134 8 15C8 11.134 11.134 8 15 8C11.134 8 8 4.866 8 1Z" fill="url(#ag-svg-prism)"/><circle cx="8" cy="8" r="1.6" fill="#FFFFFF" fill-opacity="0.95"/></svg>';

const ZENITH_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-zenith-sun" x1="4" y1="4" x2="12" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#EA580C"/></linearGradient><linearGradient id="ag-svg-zenith-ray" x1="8" y1="1" x2="8" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><circle cx="8" cy="8" r="3.4" fill="url(#ag-svg-zenith-sun)"/><path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M3.4 12.6L4.5 11.5M11.5 4.5L12.6 3.4" stroke="url(#ag-svg-zenith-ray)" stroke-width="1.6" stroke-linecap="round"/></svg>';

const LAGOON_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-lagoon-crest" x1="1" y1="2" x2="15" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#34D399"/><stop offset="60%" stop-color="#059669"/><stop offset="100%" stop-color="#0D9488"/></linearGradient><linearGradient id="ag-svg-lagoon-wave" x1="2" y1="13" x2="14" y2="13" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#10B981"/></linearGradient></defs><path d="M14 2C10.5 2 6 4 4 8C2.5 11 3.5 13 4.5 13C6.5 13 11 11.5 13 8C14 6 14 3.5 14 2Z" fill="url(#ag-svg-lagoon-crest)"/><path d="M4 8C7 7.5 10 5.5 12 3" stroke="#A7F3D0" stroke-width="1.2" stroke-linecap="round"/><path d="M2 13.5C4 12 6.5 12 8.5 13.5C10.5 15 13 15 15 13.5" stroke="url(#ag-svg-lagoon-wave)" stroke-width="1.5" stroke-linecap="round"/></svg>';

const SOLAR_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-solar" x1="8" y1="3" x2="8" y2="9.5" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FBBF24"/><stop offset="60%" stop-color="#F97316"/><stop offset="100%" stop-color="#E11D48"/></linearGradient><linearGradient id="ag-svg-solar-horizon" x1="2" y1="10" x2="14" y2="14.5" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#EA580C"/><stop offset="50%" stop-color="#FB923C"/><stop offset="100%" stop-color="#FBBF24"/></linearGradient></defs><path d="M3.5 9.5C3.5 7 5.5 5 8 5C10.5 5 12.5 7 12.5 9.5H3.5Z" fill="url(#ag-svg-solar)"/><path d="M8 2.5V3.8M4.2 4.2L5.1 5.1M11.8 4.2L10.9 5.1" stroke="#FBBF24" stroke-width="1.3" stroke-linecap="round"/><path d="M2 10.5H14M3.5 12.5H12.5M5.5 14.5H10.5" stroke="url(#ag-svg-solar-horizon)" stroke-width="1.4" stroke-linecap="round"/></svg>';

const NOVA_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-nova-petal" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FB7185"/><stop offset="50%" stop-color="#E11D48"/><stop offset="100%" stop-color="#BE123C"/></linearGradient><radialGradient id="ag-svg-nova-core" cx="8" cy="8" r="2.2" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#F59E0B"/></radialGradient></defs><circle cx="8" cy="4.8" r="2.7" fill="url(#ag-svg-nova-petal)"/><circle cx="11.2" cy="7.1" r="2.7" fill="url(#ag-svg-nova-petal)"/><circle cx="10" cy="11" r="2.7" fill="url(#ag-svg-nova-petal)"/><circle cx="6" cy="11" r="2.7" fill="url(#ag-svg-nova-petal)"/><circle cx="4.8" cy="7.1" r="2.7" fill="url(#ag-svg-nova-petal)"/><circle cx="8" cy="8" r="2.2" fill="url(#ag-svg-nova-core)"/><circle cx="8" cy="8" r="0.8" fill="#FFFBEB"/></svg>';

const NEBULA_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-svg-nebula" x1="3" y1="2" x2="13" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#C4B5FD"/><stop offset="46%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#5B21B6"/></linearGradient><linearGradient id="ag-svg-nebula-spark" x1="11" y1="1.9" x2="15" y2="5.8" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#C084FC"/></linearGradient></defs><g><ellipse cx="8" cy="5.15" rx="2.05" ry="3.1" transform="rotate(0 8 8.6)" fill="url(#ag-svg-nebula)"/><ellipse cx="8" cy="5.15" rx="2.05" ry="3.1" transform="rotate(72 8 8.6)" fill="url(#ag-svg-nebula)"/><ellipse cx="8" cy="5.15" rx="2.05" ry="3.1" transform="rotate(144 8 8.6)" fill="url(#ag-svg-nebula)"/><ellipse cx="8" cy="5.15" rx="2.05" ry="3.1" transform="rotate(216 8 8.6)" fill="url(#ag-svg-nebula)"/><ellipse cx="8" cy="5.15" rx="2.05" ry="3.1" transform="rotate(288 8 8.6)" fill="url(#ag-svg-nebula)"/><circle cx="8" cy="8.6" r="1.5" fill="#F5E9FF" fill-opacity="0.96"/><circle cx="8" cy="8.6" r="0.55" fill="#6D28D9"/><path d="M8 3.15V6.4" stroke="#F3E8FF" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.8"/></g><path d="M13.05 1.9L13.55 3.35L15 3.85L13.55 4.35L13.05 5.8L12.55 4.35L11.1 3.85L12.55 3.35Z" fill="url(#ag-svg-nebula-spark)"/></svg>';

function rehueColor(c: OklchColor, h: number): OklchColor {
  return c.alpha === undefined ? oklch(c.l, c.c, h) : oklch(c.l, c.c, h, c.alpha);
}

function buildDarkPalette(spec: FamilySpec): PrimitivePalette {
  const base = darkVariant.palette;
  const h = spec.neutralHue;
  const chromatic: Record<keyof ChromaticPalette, ChromaticPalette[keyof ChromaticPalette]> = {
    ...base.chromatic,
  };
  const baseGrade = base.chromatic[spec.accentRole];
  chromatic[spec.accentRole] = {
    default: oklch(Math.max(baseGrade.default.l, 0.805), baseGrade.default.c, spec.accentHue),
    bright: rehueColor(baseGrade.bright, spec.accentHue),
    tint: rehueColor(baseGrade.tint, spec.accentHue),
  };

  return {
    neutral: {
      bgDeep: rehueColor(base.neutral.bgDeep, h),
      bgShell: rehueColor(base.neutral.bgShell, h),
      bgCanvas: rehueColor(base.neutral.bgCanvas, h),
      bgSurface: rehueColor(base.neutral.bgSurface, h),
      bgElevated: rehueColor(base.neutral.bgElevated, h),
      bgOverlay: rehueColor(base.neutral.bgOverlay, h),
      bgHover: rehueColor(base.neutral.bgHover, h),
      borderSubtle: rehueColor(base.neutral.borderSubtle, h),
      borderStrong: rehueColor(base.neutral.borderStrong, h),
      fgMuted: rehueColor(base.neutral.fgMuted, h),
      fgSecondary: oklch(0.856, base.neutral.fgSecondary.c, h),
      fgPrimary: rehueColor(base.neutral.fgPrimary, h),
      fgInverse: rehueColor(base.neutral.fgInverse, h),
    },
    chromatic,
    solidColors: {
      ...base.solidColors,
      approveBtnBg: oklch(0.495, 0.132, spec.accentHue),
    },
    glass: {
      ...base.glass,
      shadowCard: {
        ...base.glass.shadowCard,
        color: rehueColor(base.glass.shadowCard.color, h),
      },
      shadowPopover: {
        ...base.glass.shadowPopover,
        color: rehueColor(base.glass.shadowPopover.color, h),
      },
    },
    alphas: base.alphas,
  };
}

function buildLightPalette(spec: FamilySpec): PrimitivePalette {
  const base = lightVariant.palette;
  const h = spec.neutralHue;
  const chromatic: Record<keyof ChromaticPalette, ChromaticPalette[keyof ChromaticPalette]> = {
    ...base.chromatic,
  };
  const baseGrade = base.chromatic[spec.accentRole];
  chromatic[spec.accentRole] = {
    default: rehueColor(baseGrade.default, spec.accentHue),
    bright: rehueColor(baseGrade.bright, spec.accentHue),
    tint: rehueColor(baseGrade.tint, spec.accentHue),
  };

  return {
    neutral: {
      bgDeep: rehueColor(base.neutral.bgDeep, h),
      bgShell: rehueColor(base.neutral.bgShell, h),
      bgCanvas: rehueColor(base.neutral.bgCanvas, h),
      bgSurface: rehueColor(base.neutral.bgSurface, h),
      bgElevated: rehueColor(base.neutral.bgElevated, h),
      bgOverlay: rehueColor(base.neutral.bgOverlay, h),
      bgHover: rehueColor(base.neutral.bgHover, h),
      borderSubtle: rehueColor(base.neutral.borderSubtle, h),
      borderStrong: rehueColor(base.neutral.borderStrong, h),
      fgMuted: rehueColor(base.neutral.fgMuted, h),
      fgSecondary: rehueColor(base.neutral.fgSecondary, h),
      fgPrimary: rehueColor(base.neutral.fgPrimary, h),
      fgInverse: rehueColor(base.neutral.fgInverse, h),
    },
    chromatic,
    solidColors: {
      ...base.solidColors,
      approveBtnBg: oklch(0.448, 0.138, spec.accentHue),
    },
    glass: {
      ...base.glass,
      rimTop: rehueColor(base.glass.rimTop, h),
      rimBorder: rehueColor(base.glass.rimBorder, h),
      shadowCard: {
        ...base.glass.shadowCard,
        color: rehueColor(base.glass.shadowCard.color, h),
      },
      shadowPopover: {
        ...base.glass.shadowPopover,
        color: rehueColor(base.glass.shadowPopover.color, h),
      },
    },
    alphas: base.alphas,
  };
}

const FAMILY_SPECS: readonly FamilySpec[] = [
  {
    family: 'prism',
    familyName: 'Prism',
    darkId: 'antigravity-prism-dark',
    lightId: 'antigravity-prism-light',
    darkName: 'Antigravity Prism Dark',
    lightName: 'Antigravity Prism Light',
    darkNameZh: '暗夜棱光',
    lightNameZh: '流光棱镜',
    darkDesc: 'Dark Prism matte glass — deep indigo slate with four-point spectral aurora glows.',
    lightDesc: 'Spectral Prism matte glass — luminous porcelain base with four-point pastel aurora glows.',
    neutralHue: 258,
    accentRole: 'blue',
    inlineCodeRole: 'blue',
    accentHue: 256,
    iconSvg: PRISM_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.198, 0.028, 260),
      titlebarSymbol: oklch(0.918, 0.012, 255),
      topCapBlend: true,
      linearAngle: '135deg',
      linearStops: [
        { color: oklch(0.155, 0.025, 262), pos: '0%' },
        { color: oklch(0.185, 0.028, 258), pos: '50%' },
        { color: oklch(0.215, 0.032, 256), pos: '100%' },
      ],
      glows: [
        { x: '18%', y: '20%', radius: '48%', color: oklch(0.62, 0.17, 258, 0.22) },
        { x: '82%', y: '18%', radius: '45%', color: oklch(0.62, 0.18, 22, 0.14) },
        { x: '14%', y: '78%', radius: '46%', color: oklch(0.65, 0.16, 150, 0.13) },
        { x: '86%', y: '82%', radius: '50%', color: oklch(0.60, 0.19, 298, 0.18) },
      ],
      sidebarTint: oklch(0.165, 0.025, 260, 0.35),
      scrollbarStops: [
        oklch(0.75, 0.14, 255, 0.92),
        oklch(0.76, 0.15, 298, 0.92),
        oklch(0.75, 0.15, 20, 0.92),
      ],
      spinnerDots: [
        oklch(0.75, 0.15, 255),
        oklch(0.76, 0.16, 295),
        oklch(0.84, 0.14, 82),
        oklch(0.75, 0.16, 22),
      ],
      mediaModalBg: oklch(0.145, 0.022, 260),
      userBubbleSolid: oklch(0.245, 0.030, 258),
    },
    lightAurora: {
      titlebarTint: oklch(0.950, 0.018, 256),
      titlebarSymbol: oklch(0.245, 0.032, 258),
      topCapBlend: true,
      linearAngle: '135deg',
      linearStops: [
        { color: oklch(0.985, 0.008, 255), pos: '0%' },
        { color: oklch(0.966, 0.012, 255), pos: '50%' },
        { color: oklch(0.946, 0.016, 255), pos: '100%' },
      ],
      glows: [
        { x: '18%', y: '18%', radius: '48%', color: oklch(0.66, 0.17, 258, 0.22) },
        { x: '82%', y: '16%', radius: '45%', color: oklch(0.66, 0.18, 22, 0.15) },
        { x: '14%', y: '78%', radius: '45%', color: oklch(0.68, 0.16, 150, 0.14) },
        { x: '86%', y: '82%', radius: '50%', color: oklch(0.64, 0.19, 298, 0.18) },
      ],
      sidebarTint: oklch(0.948, 0.020, 256, 0.35),
      scrollbarStops: [
        oklch(0.56, 0.16, 256, 0.88),
        oklch(0.56, 0.16, 298, 0.88),
        oklch(0.58, 0.16, 20, 0.88),
      ],
      spinnerDots: [
        oklch(0.58, 0.17, 256),
        oklch(0.58, 0.17, 298),
        oklch(0.80, 0.15, 82),
        oklch(0.58, 0.18, 22),
      ],
      mediaModalBg: oklch(0.900, 0.014, 265),
      userBubbleSolid: oklch(0.996, 0.003, 255),
    },
  },
  {
    family: 'zenith',
    familyName: 'Zenith',
    darkId: 'antigravity-zenith-dark',
    lightId: 'antigravity-zenith-light',
    darkName: 'Antigravity Zenith Dark',
    lightName: 'Antigravity Zenith Light',
    darkNameZh: '天穹深蓝',
    lightNameZh: '天穹澄蓝',
    darkDesc: 'Deep Zenith matte glass — tranquil cerulean abyss with luminous sky-blue frosted highlights.',
    lightDesc: 'Clear Zenith matte glass — bright azure top-fade into crisp cloud porcelain.',
    neutralHue: 236,
    accentRole: 'blue',
    inlineCodeRole: 'cyan',
    accentHue: 236,
    iconSvg: ZENITH_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.200, 0.032, 238),
      titlebarSymbol: oklch(0.930, 0.025, 232),
      topCapBlend: true,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.175, 0.028, 238), pos: '0%' },
        { color: oklch(0.210, 0.035, 238), pos: '55%' },
        { color: oklch(0.245, 0.042, 238), pos: '100%' },
      ],
      glows: [
        { x: '20%', y: '22%', radius: '50%', color: oklch(0.74, 0.13, 228, 0.22) },
        { x: '82%', y: '24%', radius: '48%', color: oklch(0.66, 0.14, 236, 0.16) },
        { x: '50%', y: '85%', radius: '55%', color: oklch(0.58, 0.14, 240, 0.15) },
      ],
      sidebarTint: oklch(0.180, 0.030, 238, 0.35),
      scrollbarStops: [
        oklch(0.76, 0.13, 228, 0.92),
        oklch(0.66, 0.14, 236, 0.92),
        oklch(0.58, 0.14, 242, 0.92),
      ],
      spinnerDots: [
        oklch(0.76, 0.13, 228),
        oklch(0.68, 0.14, 236),
        oklch(0.62, 0.14, 244),
        oklch(0.79, 0.11, 205),
      ],
      mediaModalBg: oklch(0.150, 0.026, 238),
      userBubbleSolid: oklch(0.250, 0.036, 238),
    },
    lightAurora: {
      titlebarTint: oklch(0.800, 0.092, 232),
      titlebarSymbol: oklch(0.240, 0.040, 238),
      topCapBlend: false,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.800, 0.092, 232), pos: '0px' },
        { color: oklch(0.800, 0.092, 232), pos: '34px' },
        { color: oklch(0.865, 0.068, 230), pos: '25%' },
        { color: oklch(0.920, 0.044, 228), pos: '50%' },
        { color: oklch(0.955, 0.024, 228), pos: '72%' },
        { color: oklch(0.978, 0.012, 228), pos: '88%' },
        { color: oklch(0.990, 0.006, 228), pos: '100%' },
      ],
      glows: [],
      sidebarTint: oklch(0.785, 0.090, 232, 0.22),
      scrollbarStops: [
        oklch(0.58, 0.13, 236, 0.88),
        oklch(0.64, 0.12, 224, 0.88),
        oklch(0.55, 0.14, 244, 0.88),
      ],
      spinnerDots: [
        oklch(0.58, 0.14, 236),
        oklch(0.64, 0.12, 220),
        oklch(0.54, 0.14, 248),
        oklch(0.62, 0.11, 205),
      ],
      mediaModalBg: oklch(0.935, 0.018, 236),
      userBubbleSolid: oklch(0.996, 0.004, 236),
    },
  },
  {
    family: 'lagoon',
    familyName: 'Lagoon',
    darkId: 'antigravity-lagoon-dark',
    lightId: 'antigravity-lagoon-light',
    darkName: 'Antigravity Lagoon Dark',
    lightName: 'Antigravity Lagoon Light',
    darkNameZh: '沧澜暗青',
    lightNameZh: '沧澜青瓷',
    darkDesc: 'Deep Lagoon matte glass — calm emerald-teal dark surfaces crafted for glare-free long sessions.',
    lightDesc: 'Aqua Lagoon matte glass — translucent mineral teal top-wash over soft porcelain surfaces.',
    neutralHue: 186,
    accentRole: 'cyan',
    inlineCodeRole: 'cyan',
    accentHue: 184,
    iconSvg: LAGOON_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.205, 0.030, 184),
      titlebarSymbol: oklch(0.945, 0.032, 178),
      topCapBlend: true,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.180, 0.025, 184), pos: '0%' },
        { color: oklch(0.215, 0.032, 184), pos: '55%' },
        { color: oklch(0.250, 0.038, 184), pos: '100%' },
      ],
      glows: [
        { x: '20%', y: '22%', radius: '50%', color: oklch(0.76, 0.12, 180, 0.20) },
        { x: '82%', y: '25%', radius: '48%', color: oklch(0.70, 0.14, 162, 0.15) },
        { x: '50%', y: '82%', radius: '55%', color: oklch(0.68, 0.12, 184, 0.15) },
      ],
      sidebarTint: oklch(0.180, 0.026, 184, 0.35),
      scrollbarStops: [
        oklch(0.78, 0.12, 180, 0.92),
        oklch(0.70, 0.13, 162, 0.92),
        oklch(0.66, 0.12, 192, 0.92),
      ],
      spinnerDots: [
        oklch(0.78, 0.12, 180),
        oklch(0.72, 0.14, 162),
        oklch(0.70, 0.11, 200),
        oklch(0.79, 0.12, 154),
      ],
      mediaModalBg: oklch(0.155, 0.022, 184),
      userBubbleSolid: oklch(0.250, 0.032, 184),
    },
    lightAurora: {
      titlebarTint: oklch(0.805, 0.095, 180),
      titlebarSymbol: oklch(0.260, 0.045, 182),
      topCapBlend: false,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.805, 0.095, 180), pos: '0px' },
        { color: oklch(0.805, 0.095, 180), pos: '34px' },
        { color: oklch(0.870, 0.068, 178), pos: '25%' },
        { color: oklch(0.922, 0.044, 178), pos: '50%' },
        { color: oklch(0.958, 0.024, 178), pos: '72%' },
        { color: oklch(0.978, 0.012, 178), pos: '88%' },
        { color: oklch(0.990, 0.006, 178), pos: '100%' },
      ],
      glows: [],
      sidebarTint: oklch(0.805, 0.095, 180, 0.22),
      scrollbarStops: [
        oklch(0.55, 0.11, 184, 0.88),
        oklch(0.58, 0.12, 162, 0.88),
        oklch(0.55, 0.11, 198, 0.88),
      ],
      spinnerDots: [
        oklch(0.55, 0.11, 184),
        oklch(0.58, 0.13, 162),
        oklch(0.56, 0.11, 200),
        oklch(0.52, 0.13, 152),
      ],
      mediaModalBg: oklch(0.955, 0.018, 178),
      userBubbleSolid: oklch(0.996, 0.004, 184),
    },
  },
  {
    family: 'solar',
    familyName: 'Solar',
    darkId: 'antigravity-solar-dark',
    lightId: 'antigravity-solar-light',
    darkName: 'Antigravity Solar Dark',
    lightName: 'Antigravity Solar Light',
    darkNameZh: '日珥暮橙',
    lightNameZh: '曦光暖橙',
    darkDesc: 'Solar Flare matte glass — obsidian warmth with amber-copper highlights and high-legibility prose.',
    lightDesc: 'Solar Horizon matte glass — warm apricot horizon gradient fading into soft warm porcelain.',
    neutralHue: 44,
    accentRole: 'orange',
    inlineCodeRole: 'orange',
    accentHue: 42,
    iconSvg: SOLAR_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.205, 0.028, 42),
      titlebarSymbol: oklch(0.945, 0.032, 62),
      topCapBlend: true,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.175, 0.022, 42), pos: '0%' },
        { color: oklch(0.205, 0.028, 42), pos: '55%' },
        { color: oklch(0.240, 0.034, 42), pos: '100%' },
      ],
      glows: [
        { x: '22%', y: '20%', radius: '50%', color: oklch(0.74, 0.15, 50, 0.20) },
        { x: '80%', y: '24%', radius: '46%', color: oklch(0.64, 0.18, 16, 0.13) },
        { x: '50%', y: '84%', radius: '52%', color: oklch(0.66, 0.15, 68, 0.15) },
      ],
      sidebarTint: oklch(0.180, 0.024, 42, 0.35),
      scrollbarStops: [
        oklch(0.76, 0.14, 50, 0.92),
        oklch(0.78, 0.14, 74, 0.92),
        oklch(0.72, 0.15, 24, 0.92),
      ],
      spinnerDots: [
        oklch(0.76, 0.14, 50),
        oklch(0.80, 0.13, 76),
        oklch(0.72, 0.15, 24),
        oklch(0.79, 0.12, 154),
      ],
      mediaModalBg: oklch(0.150, 0.020, 42),
      userBubbleSolid: oklch(0.250, 0.030, 42),
    },
    lightAurora: {
      titlebarTint: oklch(0.785, 0.118, 46),
      titlebarSymbol: oklch(0.280, 0.055, 42),
      topCapBlend: false,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.785, 0.118, 46), pos: '0px' },
        { color: oklch(0.785, 0.118, 46), pos: '34px' },
        { color: oklch(0.840, 0.088, 48), pos: '25%' },
        { color: oklch(0.900, 0.056, 50), pos: '50%' },
        { color: oklch(0.945, 0.030, 52), pos: '72%' },
        { color: oklch(0.972, 0.015, 52), pos: '88%' },
        { color: oklch(0.990, 0.006, 52), pos: '100%' },
      ],
      glows: [],
      sidebarTint: oklch(0.785, 0.118, 46, 0.22),
      scrollbarStops: [
        oklch(0.56, 0.15, 44, 0.88),
        oklch(0.62, 0.14, 68, 0.88),
        oklch(0.55, 0.16, 22, 0.88),
      ],
      spinnerDots: [
        oklch(0.56, 0.15, 44),
        oklch(0.62, 0.14, 68),
        oklch(0.56, 0.16, 22),
        oklch(0.52, 0.13, 152),
      ],
      mediaModalBg: oklch(0.955, 0.022, 48),
      userBubbleSolid: oklch(0.996, 0.004, 48),
    },
  },
  {
    family: 'nova',
    familyName: 'Nova',
    darkId: 'antigravity-nova-dark',
    lightId: 'antigravity-nova-light',
    darkName: 'Antigravity Nova Dark',
    lightName: 'Antigravity Nova Light',
    darkNameZh: '绯星绛夜',
    lightNameZh: '绯星初霞',
    darkDesc: 'Deep Nova matte glass — rich burgundy dark base with restrained rose-coral accents.',
    lightDesc: 'Rose Nova matte glass — delicate blush rose top-wash transitioning into clean ivory.',
    neutralHue: 14,
    accentRole: 'red',
    inlineCodeRole: 'red',
    accentHue: 16,
    iconSvg: NOVA_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.200, 0.032, 10),
      titlebarSymbol: oklch(0.938, 0.028, 12),
      topCapBlend: true,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.172, 0.026, 10), pos: '0%' },
        { color: oklch(0.205, 0.034, 10), pos: '55%' },
        { color: oklch(0.240, 0.042, 10), pos: '100%' },
      ],
      glows: [
        { x: '20%', y: '22%', radius: '50%', color: oklch(0.70, 0.16, 16, 0.20) },
        { x: '82%', y: '22%', radius: '48%', color: oklch(0.62, 0.18, 12, 0.15) },
        { x: '50%', y: '84%', radius: '52%', color: oklch(0.58, 0.17, 355, 0.15) },
      ],
      sidebarTint: oklch(0.178, 0.028, 10, 0.35),
      scrollbarStops: [
        oklch(0.76, 0.14, 16, 0.92),
        oklch(0.74, 0.14, 345, 0.92),
        oklch(0.78, 0.13, 50, 0.92),
      ],
      spinnerDots: [
        oklch(0.76, 0.14, 16),
        oklch(0.76, 0.13, 340),
        oklch(0.80, 0.12, 76),
        oklch(0.79, 0.12, 154),
      ],
      mediaModalBg: oklch(0.148, 0.022, 10),
      userBubbleSolid: oklch(0.245, 0.034, 12),
    },
    lightAurora: {
      titlebarTint: oklch(0.735, 0.128, 14),
      titlebarSymbol: oklch(0.260, 0.065, 14),
      topCapBlend: false,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.735, 0.128, 14), pos: '0px' },
        { color: oklch(0.735, 0.128, 14), pos: '34px' },
        { color: oklch(0.800, 0.095, 14), pos: '25%' },
        { color: oklch(0.875, 0.060, 14), pos: '50%' },
        { color: oklch(0.935, 0.030, 14), pos: '72%' },
        { color: oklch(0.968, 0.015, 14), pos: '88%' },
        { color: oklch(0.988, 0.006, 14), pos: '100%' },
      ],
      glows: [],
      sidebarTint: oklch(0.735, 0.128, 14, 0.22),
      scrollbarStops: [
        oklch(0.55, 0.16, 16, 0.88),
        oklch(0.56, 0.15, 345, 0.88),
        oklch(0.60, 0.14, 42, 0.88),
      ],
      spinnerDots: [
        oklch(0.55, 0.16, 16),
        oklch(0.56, 0.15, 345),
        oklch(0.60, 0.14, 42),
        oklch(0.52, 0.13, 152),
      ],
      mediaModalBg: oklch(0.955, 0.018, 14),
      userBubbleSolid: oklch(0.996, 0.004, 14),
    },
  },
  {
    family: 'nebula',
    familyName: 'Nebula',
    darkId: 'antigravity-nebula-dark',
    lightId: 'antigravity-nebula-light',
    darkName: 'Antigravity Nebula Dark',
    lightName: 'Antigravity Nebula Light',
    darkNameZh: '星云夜紫',
    lightNameZh: '星云霞紫',
    darkDesc: 'Night Nebula matte glass — deep twilight plum with radiant violet-indigo aurora accents.',
    lightDesc: 'Soft Nebula matte glass — translucent lavender gradient softening into crisp editorial white.',
    neutralHue: 294,
    accentRole: 'violet',
    inlineCodeRole: 'magenta',
    accentHue: 294,
    iconSvg: NEBULA_ICON_SVG,
    darkAurora: {
      titlebarTint: oklch(0.200, 0.042, 296),
      titlebarSymbol: oklch(0.945, 0.025, 294),
      topCapBlend: true,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.165, 0.036, 296), pos: '0%' },
        { color: oklch(0.198, 0.042, 296), pos: '55%' },
        { color: oklch(0.235, 0.048, 296), pos: '100%' },
      ],
      glows: [
        { x: '18%', y: '20%', radius: '50%', color: oklch(0.64, 0.19, 298, 0.22) },
        { x: '82%', y: '24%', radius: '48%', color: oklch(0.58, 0.18, 276, 0.16) },
        { x: '50%', y: '84%', radius: '55%', color: oklch(0.56, 0.20, 290, 0.17) },
      ],
      sidebarTint: oklch(0.180, 0.038, 296, 0.35),
      scrollbarStops: [
        oklch(0.75, 0.16, 298, 0.92),
        oklch(0.74, 0.15, 276, 0.92),
        oklch(0.76, 0.14, 330, 0.92),
      ],
      spinnerDots: [
        oklch(0.75, 0.16, 298),
        oklch(0.76, 0.15, 276),
        oklch(0.78, 0.14, 330),
        oklch(0.79, 0.11, 205),
      ],
      mediaModalBg: oklch(0.145, 0.030, 296),
      userBubbleSolid: oklch(0.245, 0.044, 296),
    },
    lightAurora: {
      titlebarTint: oklch(0.700, 0.142, 290),
      titlebarSymbol: oklch(0.240, 0.085, 292),
      topCapBlend: false,
      linearAngle: '180deg',
      linearStops: [
        { color: oklch(0.700, 0.142, 290), pos: '0px' },
        { color: oklch(0.700, 0.142, 290), pos: '34px' },
        { color: oklch(0.790, 0.105, 292), pos: '25%' },
        { color: oklch(0.840, 0.085, 292), pos: '50%' },
        { color: oklch(0.905, 0.048, 292), pos: '72%' },
        { color: oklch(0.955, 0.024, 292), pos: '88%' },
        { color: oklch(0.985, 0.008, 292), pos: '100%' },
      ],
      glows: [],
      sidebarTint: oklch(0.700, 0.142, 290, 0.22),
      scrollbarStops: [
        oklch(0.56, 0.17, 292, 0.88),
        oklch(0.58, 0.15, 274, 0.88),
        oklch(0.58, 0.16, 330, 0.88),
      ],
      spinnerDots: [
        oklch(0.56, 0.17, 292),
        oklch(0.58, 0.15, 274),
        oklch(0.58, 0.16, 330),
        oklch(0.54, 0.14, 250),
      ],
      mediaModalBg: oklch(0.945, 0.025, 292),
      userBubbleSolid: oklch(0.996, 0.004, 292),
    },
  },
];

export const AURORA_VARIANTS: readonly VariantDefinition[] = FAMILY_SPECS.flatMap((spec) => [
  {
    id: spec.darkId,
    family: spec.family,
    familyName: spec.familyName,
    nameZh: spec.darkNameZh,
    displayName: spec.darkName,
    description: spec.darkDesc,
    mode: 'dark' as const,
    accentRole: spec.accentRole,
    inlineCodeRole: spec.inlineCodeRole,
    iconSvg: spec.iconSvg,
    aurora: spec.darkAurora,
    palette: buildDarkPalette(spec),
  },
  {
    id: spec.lightId,
    family: spec.family,
    familyName: spec.familyName,
    nameZh: spec.lightNameZh,
    displayName: spec.lightName,
    description: spec.lightDesc,
    mode: 'light' as const,
    accentRole: spec.accentRole,
    inlineCodeRole: spec.inlineCodeRole,
    iconSvg: spec.iconSvg,
    aurora: spec.lightAurora,
    palette: buildLightPalette(spec),
  },
]);
