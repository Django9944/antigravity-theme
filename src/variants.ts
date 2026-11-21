import { darkVariant } from './palettes/dark.js';
import { AURORA_VARIANTS } from './palettes/families.js';
import { lightVariant } from './palettes/light.js';
import type { ThemeFamilyId, VariantDefinition } from './core/types.js';

export interface ThemeFamilySummary {
  readonly family: ThemeFamilyId;
  readonly familyName: string;
  readonly darkId: string;
  readonly lightId: string;
  readonly nameZhDark: string;
  readonly nameZhLight: string;
  readonly iconSvg: string;
}

/**
 * Canonical registry of compiled theme variants (7 families × Dark/Light = 14 variants).
 * Flagship Orbital keeps `antigravity-dark` / `antigravity-light` for backward compatibility.
 */
export const VARIANTS: readonly VariantDefinition[] = [
  darkVariant,
  lightVariant,
  ...AURORA_VARIANTS,
];

export const THEME_FAMILIES: readonly ThemeFamilySummary[] = (() => {
  const byFamily = new Map<ThemeFamilyId, { dark?: VariantDefinition; light?: VariantDefinition }>();
  for (const v of VARIANTS) {
    const entry = byFamily.get(v.family) ?? {};
    if (v.mode === 'dark' || v.mode === 'hc-dark') entry.dark = v;
    else entry.light = v;
    byFamily.set(v.family, entry);
  }
  const order: readonly ThemeFamilyId[] = [
    'orbital',
    'prism',
    'zenith',
    'lagoon',
    'solar',
    'nova',
    'nebula',
  ];
  return order.map((family) => {
    const entry = byFamily.get(family);
    if (!entry?.dark || !entry.light) {
      throw new Error(`Incomplete dark/light pair for theme family "${family}"`);
    }
    return {
      family,
      familyName: entry.dark.familyName,
      darkId: entry.dark.id,
      lightId: entry.light.id,
      nameZhDark: entry.dark.nameZh,
      nameZhLight: entry.light.nameZh,
      iconSvg: entry.dark.iconSvg,
    };
  });
})();
