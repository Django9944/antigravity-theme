import { blendOver } from '../core/color.js';
import type { SemanticIR } from '../core/types.js';

export interface MermaidThemeDocument {
  readonly theme: 'base';
  readonly themeVariables: {
    readonly darkMode: boolean;
    readonly background: string;
    readonly fontFamily: string;
    readonly primaryColor: string;
    readonly primaryTextColor: string;
    readonly primaryBorderColor: string;
    readonly secondaryColor: string;
    readonly secondaryTextColor: string;
    readonly secondaryBorderColor: string;
    readonly tertiaryColor: string;
    readonly tertiaryTextColor: string;
    readonly tertiaryBorderColor: string;
    readonly lineColor: string;
    readonly textColor: string;
    readonly mainBkg: string;
    readonly nodeBorder: string;
    readonly clusterBkg: string;
    readonly clusterBorder: string;
    readonly defaultLinkColor: string;
    readonly edgeLabelBackground: string;
    readonly actorBkg: string;
    readonly actorBorder: string;
    readonly actorTextColor: string;
    readonly signalColor: string;
    readonly signalTextColor: string;
    readonly noteBkgColor: string;
    readonly noteBorderColor: string;
    readonly noteTextColor: string;
  };
}

/**
 * Emits a Mermaid themeVariables configuration matching Antigravity 2.0 Artifacts styling.
 * Pre-composites note fill/border onto canvas so sequence-diagram lifelines never bleed through.
 */
export function emitMermaidTheme(ir: SemanticIR): MermaidThemeDocument {
  const isDark = ir.meta.mode === 'dark' || ir.meta.mode === 'hc-dark';
  const noteBgOpaque = blendOver(ir.artifact.alertNote.bg, ir.surface.canvas);
  const noteBorderOpaque = blendOver(ir.artifact.alertNote.border, ir.surface.canvas);

  return {
    theme: 'base',
    themeVariables: {
      darkMode: isDark,
      background: ir.surface.canvas,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
      primaryColor: ir.artifact.mermaid.nodeBg,
      primaryTextColor: ir.artifact.mermaid.nodeText,
      primaryBorderColor: ir.artifact.mermaid.nodeBorder,
      secondaryColor: ir.artifact.mermaid.secondaryBg,
      secondaryTextColor: ir.fg.primary,
      secondaryBorderColor: ir.border.default,
      tertiaryColor: ir.artifact.mermaid.tertiaryBg,
      tertiaryTextColor: ir.fg.secondary,
      tertiaryBorderColor: ir.border.subtle,
      lineColor: ir.artifact.mermaid.edgeColor,
      textColor: ir.fg.primary,
      mainBkg: ir.artifact.mermaid.nodeBg,
      nodeBorder: ir.artifact.mermaid.nodeBorder,
      clusterBkg: ir.surface.shell,
      clusterBorder: ir.border.subtle,
      defaultLinkColor: ir.artifact.mermaid.edgeColor,
      edgeLabelBackground: ir.artifact.mermaid.labelBg,
      actorBkg: ir.artifact.mermaid.nodeBg,
      actorBorder: ir.artifact.mermaid.nodeBorder,
      actorTextColor: ir.artifact.mermaid.nodeText,
      signalColor: ir.fg.primary,
      signalTextColor: ir.fg.primary,
      noteBkgColor: noteBgOpaque,
      noteBorderColor: noteBorderOpaque,
      noteTextColor: ir.fg.primary,
    },
  };
}
