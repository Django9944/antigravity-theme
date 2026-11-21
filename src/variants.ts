import { darkVariant } from './palettes/dark.js';
import { lightVariant } from './palettes/light.js';
import type { VariantDefinition } from './core/types.js';

/**
 * Canonical registry of compiled theme variants.
 * To add a new flavor (e.g. High Contrast or Soft Dim), define a palette module and append it here.
 */
export const VARIANTS: readonly VariantDefinition[] = [darkVariant, lightVariant];
