import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { blendOver } from '../src/core/color.js';
import {
  apcaContrast,
  wcagContrast,
  worstCaseGlassContrast,
} from '../src/core/contrast.js';
import { VARIANTS } from '../src/variants.js';
import { parseCssVariableBlocks } from './schema.test.js';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');

interface TokenNode {
  readonly $value: string;
}

interface CompiledThemeJson {
  readonly surface: Record<string, TokenNode>;
  readonly glass: Record<string, TokenNode>;
  readonly fg: Record<string, TokenNode>;
  readonly border: Record<string, TokenNode>;
  readonly status: Record<string, Record<string, TokenNode>>;
  readonly agent: Record<string, TokenNode>;
  readonly artifact: {
    readonly alerts: Record<string, Record<string, TokenNode>>;
    readonly mermaid: Record<string, TokenNode>;
    readonly codeBlockBg: TokenNode;
    readonly inlineCodeBg: TokenNode;
    readonly inlineCodeFg: TokenNode;
  };
  readonly diff: Record<string, TokenNode>;
  readonly code: Record<string, TokenNode>;
  readonly terminal: {
    readonly background: TokenNode;
    readonly foreground: TokenNode;
    readonly cursor: TokenNode;
    readonly selectionBackground: TokenNode;
    readonly ansi: Record<string, TokenNode>;
  };
}

function val(group: Record<string, TokenNode>, key: string): string {
  const token = group[key];
  if (!token || typeof token.$value !== 'string') {
    throw new Error(`Missing compiled token "${key}" in theme.json`);
  }
  return token.$value;
}

function assertSignedApca(
  fgHex: string,
  bgHex: string,
  minAbsLc: number,
  isDark: boolean,
  label: string,
): number {
  const signed = apcaContrast(fgHex, bgHex);
  const abs = Math.abs(signed);
  if (isDark) {
    expect(signed, `${label} expected light-on-dark (<0), got ${signed.toFixed(1)}`).toBeLessThan(0);
  } else {
    expect(
      signed,
      `${label} expected dark-on-light (>0), got ${signed.toFixed(1)}`,
    ).toBeGreaterThan(0);
  }
  expect(abs, `${label} |APCA|=${abs.toFixed(1)} < ${minAbsLc}`).toBeGreaterThanOrEqual(minAbsLc);
  return abs;
}

describe('Accessibility & High-Opacity Matte Glass Contrast Gates on dist/ (Layer 2)', () => {
  for (const variant of VARIANTS) {
    const isDark = variant.mode === 'dark' || variant.mode === 'hc-dark';
    const variantDir = resolve(DIST_DIR, variant.id);
    const theme = JSON.parse(
      readFileSync(resolve(variantDir, 'theme.json'), 'utf8'),
    ) as CompiledThemeJson;
    const css = readFileSync(resolve(variantDir, 'variables.css'), 'utf8');
    const { baseVars, reducedVars } = parseCssVariableBlocks(css, variant.id);
    const mermaid = JSON.parse(readFileSync(resolve(variantDir, 'mermaid.json'), 'utf8')) as {
      themeVariables: Record<string, string>;
    };

    const canvas = val(theme.surface, 'canvas');
    const shell = val(theme.surface, 'shell');
    const card = val(theme.surface, 'card');
    const elevated = val(theme.surface, 'elevated');
    const fgPrimary = val(theme.fg, 'primary');
    const fgSecondary = val(theme.fg, 'secondary');
    const fgMuted = val(theme.fg, 'muted');
    const fgInverse = val(theme.fg, 'inverse');
    const codeBlockBg = theme.artifact.codeBlockBg.$value;

    describe(`Variant: ${variant.displayName}`, () => {
      it('L1 Primary & Secondary Prose + Reduced-Transparency fallbacks meet APCA >= 75 and WCAG >= 4.5:1', () => {
        const selectedOnShell = blendOver(val(theme.surface, 'selected'), shell);
        const hoverOnShell = blendOver(val(theme.surface, 'hover'), shell);

        const solidBackdrops = [
          ['canvas', canvas],
          ['shell', shell],
          ['card', card],
          ['elevated', elevated],
          ['userBubbleBg', val(theme.agent, 'userBubbleBg')],
          ['selected@shell', selectedOnShell],
          ['hover@shell', hoverOnShell],
          ['reduced.shell', reducedVars.get('--agy-glass-bg-shell')!],
          ['reduced.canvas', reducedVars.get('--agy-glass-bg-canvas')!],
          ['reduced.card', reducedVars.get('--agy-glass-bg-card')!],
          ['reduced.popover', reducedVars.get('--agy-glass-bg-popover')!],
        ] as const;

        for (const [name, bg] of solidBackdrops) {
          assertSignedApca(fgPrimary, bg, 75, isDark, `fg.primary@${name}`);
          expect(wcagContrast(fgPrimary, bg), `WCAG fg.primary@${name}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }

        // Secondary prose on canvas and shell
        assertSignedApca(fgSecondary, canvas, 75, isDark, 'fg.secondary@canvas');
        expect(wcagContrast(fgSecondary, canvas)).toBeGreaterThanOrEqual(4.5);
        assertSignedApca(fgSecondary, shell, 75, isDark, 'fg.secondary@shell');
        expect(wcagContrast(fgSecondary, shell)).toBeGreaterThanOrEqual(4.5);

        // Inverse text over inverse surface (opposite polarity)
        const invApca = Math.abs(apcaContrast(fgInverse, val(theme.surface, 'inverse')));
        expect(invApca).toBeGreaterThanOrEqual(75);
        expect(wcagContrast(fgInverse, val(theme.surface, 'inverse'))).toBeGreaterThanOrEqual(4.5);
      });

      it('Worst-case matte glass over #ffffff/#000000 holds APCA >= 70 (no zero-crossing) and balanced backdrop >= 78', () => {
        const glassLayers = [
          ['shell', val(theme.glass, 'shellBg')],
          ['canvas', val(theme.glass, 'canvasBg')],
          ['card', val(theme.glass, 'cardBg')],
          ['popover', val(theme.glass, 'popoverBg')],
        ] as const;

        const balancedBackdrop = isDark ? '#1d2942' : '#dce6f3';

        for (const [name, glassBg] of glassLayers) {
          const res = worstCaseGlassContrast(fgPrimary, glassBg);
          expect(res.polarityCrossesZero, `${name} polarity zero-crossing`).toBe(false);
          expect(
            res.minAbsApca,
            `${name} worst-case APCA (white=${res.overWhiteApca.toFixed(1)}, black=${res.overBlackApca.toFixed(1)})`,
          ).toBeGreaterThanOrEqual(70);
          expect(res.minWcag, `${name} worst-case WCAG`).toBeGreaterThanOrEqual(4.5);

          const balancedComposite = blendOver(glassBg, balancedBackdrop);
          assertSignedApca(
            fgPrimary,
            balancedComposite,
            78,
            isDark,
            `balanced-${name}@${balancedBackdrop}`,
          );
        }
      });

      it('L2 Accents, Inline Code, All Code Tokens & Mermaid meet APCA >= 60 and WCAG >= 4.5:1', () => {
        for (const [fgName, bgName, bg] of [
          ['fg.accent', 'canvas', canvas],
          ['fg.accent', 'elevated', elevated],
          ['fg.link', 'canvas', canvas],
        ] as const) {
          const fgHex = fgName === 'fg.accent' ? val(theme.fg, 'accent') : val(theme.fg, 'link');
          assertSignedApca(fgHex, bg, 60, isDark, `${fgName}@${bgName}`);
          expect(wcagContrast(fgHex, bg)).toBeGreaterThanOrEqual(4.5);
        }

        // Inline code on canvas and card
        const inlineFg = theme.artifact.inlineCodeFg.$value;
        const inlineBg = theme.artifact.inlineCodeBg.$value;
        for (const [surfaceName, bg] of [
          ['canvas', canvas],
          ['card', card],
        ] as const) {
          const effBg = blendOver(inlineBg, bg);
          assertSignedApca(inlineFg, effBg, 60, isDark, `inlineCode@${surfaceName}`);
          expect(wcagContrast(inlineFg, effBg)).toBeGreaterThanOrEqual(4.5);
        }

        // All non-comment syntax tokens over codeBlockBg
        for (const [role, token] of Object.entries(theme.code)) {
          if (role === 'comment') continue;
          assertSignedApca(token.$value, codeBlockBg, 60, isDark, `code.${role}@codeBlockBg`);
          expect(wcagContrast(token.$value, codeBlockBg)).toBeGreaterThanOrEqual(4.5);
        }

        // Hunk header over card and codeBlockBg
        const hunkFg = val(theme.diff, 'hunkHeaderFg');
        const hunkBgOnCode = blendOver(val(theme.diff, 'hunkHeaderBg'), codeBlockBg);
        const hunkBgOnCard = blendOver(val(theme.diff, 'hunkHeaderBg'), card);
        assertSignedApca(hunkFg, hunkBgOnCode, 60, isDark, 'hunkHeader@codeBlockBg');
        assertSignedApca(hunkFg, hunkBgOnCard, 60, isDark, 'hunkHeader@card');

        // Mermaid node text (>= 65), edges (>= 30), and opaque sequence note text (>= 75)
        assertSignedApca(
          mermaid.themeVariables['primaryTextColor']!,
          mermaid.themeVariables['primaryColor']!,
          65,
          isDark,
          'mermaid.primaryText',
        );
        assertSignedApca(
          mermaid.themeVariables['lineColor']!,
          canvas,
          30,
          isDark,
          'mermaid.lineColor',
        );
        assertSignedApca(
          mermaid.themeVariables['noteTextColor']!,
          mermaid.themeVariables['noteBkgColor']!,
          75,
          isDark,
          'mermaid.noteText',
        );
      });

      it('L3 Thinking trace, comments & muted metadata meet APCA >= 45 and preserve hierarchy', () => {
        const primaryApca = assertSignedApca(fgPrimary, canvas, 75, isDark, 'primary@canvas');

        for (const [name, bg] of [
          ['canvas', canvas],
          ['shell', shell],
          ['card', card],
          ['elevated', elevated],
        ] as const) {
          assertSignedApca(fgMuted, bg, 45, isDark, `fg.muted@${name}`);
          expect(wcagContrast(fgMuted, bg)).toBeGreaterThanOrEqual(3.0);
        }

        assertSignedApca(val(theme.code, 'comment'), codeBlockBg, 45, isDark, 'code.comment');
        expect(wcagContrast(val(theme.code, 'comment'), codeBlockBg)).toBeGreaterThanOrEqual(3.0);

        const compositedThinkingBg = blendOver(val(theme.agent, 'thinkingBg'), canvas);
        const thinkingApca = assertSignedApca(
          val(theme.agent, 'thinkingFg'),
          compositedThinkingBg,
          45,
          isDark,
          'thinkingFg@thinkingBg',
        );
        expect(wcagContrast(val(theme.agent, 'thinkingFg'), compositedThinkingBg)).toBeGreaterThanOrEqual(
          3.0,
        );
        expect(
          primaryApca - thinkingApca,
          'Thinking block must remain visually subordinate to primary prose',
        ).toBeGreaterThanOrEqual(15);
      });

      it('L4 Status badges, solid CTAs, agent/subagent accents & 5-tier Alerts (>= 60) pass', () => {
        for (const level of ['info', 'success', 'warning', 'danger'] as const) {
          const st = theme.status[level]!;
          for (const [bgName, baseBg] of [
            ['canvas', canvas],
            ['card', card],
          ] as const) {
            const compositedBg = blendOver(val(st, 'bg'), baseBg);
            assertSignedApca(val(st, 'text'), compositedBg, 58, isDark, `status.${level}@${bgName}`);
            expect(wcagContrast(val(st, 'text'), compositedBg)).toBeGreaterThanOrEqual(4.5);
          }

          // Solid status pill / button label (always light text on saturated solid dark-mid fill)
          const solidApca = Math.abs(apcaContrast(val(st, 'onSolid'), val(st, 'solid')));
          expect(solidApca, `status.${level}.onSolid`).toBeGreaterThanOrEqual(58);
          expect(wcagContrast(val(st, 'onSolid'), val(st, 'solid'))).toBeGreaterThanOrEqual(4.5);
        }

        // Approve CTA & Needs Approval banner
        expect(
          Math.abs(
            apcaContrast(val(theme.agent, 'approveBtnFg'), val(theme.agent, 'approveBtnBg')),
          ),
        ).toBeGreaterThanOrEqual(58);
        expect(
          wcagContrast(val(theme.agent, 'approveBtnFg'), val(theme.agent, 'approveBtnBg')),
        ).toBeGreaterThanOrEqual(4.5);

        const compositedApproval = blendOver(val(theme.agent, 'approvalBg'), canvas);
        assertSignedApca(val(theme.agent, 'approvalFg'), compositedApproval, 58, isDark, 'approval');
        expect(wcagContrast(val(theme.agent, 'approvalFg'), compositedApproval)).toBeGreaterThanOrEqual(
          4.5,
        );

        // Agent & Subagent badges
        for (const key of [
          'runningAccent',
          'doneAccent',
          'errorAccent',
          'subagentWorking',
          'subagentDone',
        ]) {
          assertSignedApca(val(theme.agent, key), card, 58, isDark, `agent.${key}@card`);
        }
        const importantAlert = theme.artifact.alerts['important']!;
        const waitingCardBg = blendOver(val(importantAlert, 'bg'), card);
        assertSignedApca(
          val(theme.agent, 'subagentWaiting'),
          waitingCardBg,
          58,
          isDark,
          'subagentWaiting@importantCard',
        );

        // 5-tier Artifact Alerts (strict >= 60 title per Doc 05, >= 75 prose)
        for (const alertName of ['note', 'tip', 'important', 'warning', 'caution'] as const) {
          const alert = theme.artifact.alerts[alertName]!;
          const compositedAlertBg = blendOver(val(alert, 'bg'), canvas);
          assertSignedApca(
            val(alert, 'fg'),
            compositedAlertBg,
            60,
            isDark,
            `alert.${alertName}.fg`,
          );
          expect(wcagContrast(val(alert, 'fg'), compositedAlertBg)).toBeGreaterThanOrEqual(4.5);
          assertSignedApca(fgPrimary, compositedAlertBg, 75, isDark, `alert.${alertName}.body`);
        }
      });

      it('L5 Focus Rings (APCA >= 35, WCAG >= 3.0) and Borders (APCA >= 20) meet accessibility gates', () => {
        const focusRings = [
          ['focusRing', baseVars.get('--color-ring-primary')!],
          ['ring-info', baseVars.get('--color-ring-info')!],
          ['ring-success', baseVars.get('--color-ring-success')!],
          ['ring-warning', baseVars.get('--color-ring-warning')!],
          ['ring-danger', baseVars.get('--color-ring-danger')!],
        ] as const;

        for (const [name, ringHex] of focusRings) {
          const composited = blendOver(ringHex, canvas);
          assertSignedApca(composited, canvas, 35, isDark, `L5.${name}@canvas`);
          expect(wcagContrast(composited, canvas), `L5.${name} WCAG`).toBeGreaterThanOrEqual(3.0);
        }

        assertSignedApca(val(theme.border, 'subtle'), canvas, 20, isDark, 'L5.border.subtle@canvas');
        assertSignedApca(val(theme.border, 'default'), canvas, 20, isDark, 'L5.border.default@canvas');
      });

      it('Single-layer AND DOM-stacked Diff washes preserve APCA >= 55 across ALL non-comment code tokens', () => {
        const addedLineBg = blendOver(val(theme.diff, 'addedBg'), codeBlockBg);
        const addedWordSingleBg = blendOver(val(theme.diff, 'addedWordBg'), codeBlockBg);
        const addedWordStackedBg = blendOver(val(theme.diff, 'addedWordBg'), addedLineBg);

        const removedLineBg = blendOver(val(theme.diff, 'removedBg'), codeBlockBg);
        const removedWordSingleBg = blendOver(val(theme.diff, 'removedWordBg'), codeBlockBg);
        const removedWordStackedBg = blendOver(val(theme.diff, 'removedWordBg'), removedLineBg);

        const diffBackdrops = [
          ['addedLine', addedLineBg],
          ['addedWordSingle', addedWordSingleBg],
          ['addedWordStacked', addedWordStackedBg],
          ['removedLine', removedLineBg],
          ['removedWordSingle', removedWordSingleBg],
          ['removedWordStacked', removedWordStackedBg],
        ] as const;

        for (const [diffName, effectiveBg] of diffBackdrops) {
          for (const [role, token] of Object.entries(theme.code)) {
            if (role === 'comment') continue;
            assertSignedApca(token.$value, effectiveBg, 55, isDark, `code.${role}@${diffName}`);
          }
        }
      });

      it('Terminal fg, selection, cursor, 14+ functional ANSI (>= 50) and 12 chromatic ANSI (>= 60) pass', () => {
        const termBg = theme.terminal.background.$value;
        const termFg = theme.terminal.foreground.$value;
        const termSel = blendOver(theme.terminal.selectionBackground.$value, termBg);
        const termCursor = theme.terminal.cursor.$value;

        assertSignedApca(termFg, termBg, 75, isDark, 'terminal.fg@bg');
        expect(wcagContrast(termFg, termBg)).toBeGreaterThanOrEqual(4.5);
        assertSignedApca(termFg, termSel, 70, isDark, 'terminal.fg@selection');
        assertSignedApca(termCursor, termBg, 50, isDark, 'terminal.cursor@bg');

        const chromaticSlots = new Set([
          'red',
          'green',
          'yellow',
          'blue',
          'magenta',
          'cyan',
          'brightRed',
          'brightGreen',
          'brightYellow',
          'brightBlue',
          'brightMagenta',
          'brightCyan',
        ]);
        const anchorSlots = isDark ? ['black'] : ['white', 'brightWhite'];

        let testedSlots = 0;
        for (const [slot, token] of Object.entries(theme.terminal.ansi)) {
          if (anchorSlots.includes(slot)) continue;
          testedSlots += 1;
          const minApca = chromaticSlots.has(slot) ? 60 : 50;
          assertSignedApca(token.$value, termBg, minApca, isDark, `terminal.ansi.${slot}`);
        }
        expect(testedSlots).toBeGreaterThanOrEqual(14);
      });
    });
  }
});
