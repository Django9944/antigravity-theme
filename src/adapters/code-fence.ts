import type { SemanticIR } from '../core/types.js';

export interface TextMateTokenRule {
  readonly name: string;
  readonly scope: string | readonly string[];
  readonly settings: {
    readonly foreground?: string;
    readonly fontStyle?: string;
  };
}

export interface CodeFenceThemeDocument {
  readonly name: string;
  readonly displayName: string;
  readonly type: 'dark' | 'light';
  readonly fg: string;
  readonly bg: string;
  readonly semanticHighlighting: boolean;
  readonly colors: Readonly<Record<string, string>>;
  readonly tokenColors: readonly TextMateTokenRule[];
}

/**
 * Emits a Shiki-compatible syntax highlighting theme for fenced code blocks
 * rendered inside Antigravity 2.0 Chat Canvas, Artifacts, and Files Changed Diffs.
 */
export function emitCodeFenceTheme(ir: SemanticIR): CodeFenceThemeDocument {
  const isLight = ir.meta.mode === 'light' || ir.meta.mode === 'hc-light';

  const tokenColors: readonly TextMateTokenRule[] = [
    {
      name: 'Comments & Docstrings',
      scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'],
      settings: { foreground: ir.code.comment, fontStyle: 'italic' },
    },
    {
      name: 'Keywords & Storage',
      scope: [
        'keyword',
        'storage.type',
        'storage.modifier',
        'keyword.other.fn',
        'keyword.other.rust',
      ],
      settings: { foreground: ir.code.keyword },
    },
    {
      name: 'Control Flow & Async',
      scope: [
        'keyword.control',
        'keyword.control.flow',
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.return',
        'keyword.control.trycatch',
      ],
      settings: { foreground: ir.code.controlFlow },
    },
    {
      name: 'Operators & Logical Punctuation',
      scope: [
        'keyword.operator',
        'keyword.operator.assignment',
        'keyword.operator.comparison',
        'keyword.operator.logical',
        'punctuation.accessor',
      ],
      settings: { foreground: ir.code.operator },
    },
    {
      name: 'Functions & Methods',
      scope: [
        'entity.name.function',
        'meta.function-call.generic',
        'support.function',
        'entity.name.function.macro',
      ],
      settings: { foreground: ir.code.function },
    },
    {
      name: 'Types, Classes, Interfaces & Lifetimes',
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.name.struct',
        'entity.name.interface',
        'entity.name.namespace',
        'support.type',
        'support.class',
        'storage.modifier.lifetime',
        'entity.name.lifetime',
      ],
      settings: { foreground: ir.code.type },
    },
    {
      name: 'Variables & Identifiers',
      scope: ['variable', 'variable.other.readwrite', 'meta.definition.variable'],
      settings: { foreground: ir.code.variable },
    },
    {
      name: 'Parameters & Self/This',
      scope: [
        'variable.parameter',
        'variable.language.this',
        'variable.language.self',
        'variable.language.super',
      ],
      settings: { foreground: ir.code.parameter },
    },
    {
      name: 'Object Properties & JSON/YAML/TOML Keys',
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'support.type.property-name',
        'entity.name.tag.yaml',
        'variable.other.key.toml',
        'support.type.property-name.toml',
        'meta.object-literal.key',
      ],
      settings: { foreground: ir.code.property },
    },
    {
      name: 'TOML Section Headers',
      scope: ['entity.name.section.toml', 'punctuation.definition.table.toml'],
      settings: { foreground: ir.code.heading, fontStyle: 'bold' },
    },
    {
      name: 'Strings, Quotes & Template Literals',
      scope: [
        'string',
        'string.quoted',
        'string.template',
        'punctuation.definition.string',
        'punctuation.definition.string.begin',
        'punctuation.definition.string.end',
      ],
      settings: { foreground: ir.code.string },
    },
    {
      name: 'Template Interpolation Punctuation',
      scope: [
        'punctuation.definition.template-expression',
        'punctuation.section.embedded',
      ],
      settings: { foreground: ir.code.controlFlow },
    },
    {
      name: 'Regex & Escape Sequences',
      scope: ['string.regexp', 'constant.character.escape'],
      settings: { foreground: ir.code.regex },
    },
    {
      name: 'Numbers, Decimal Dots & CSS Units',
      scope: [
        'constant.numeric',
        'punctuation.separator.dot.decimal',
        'keyword.other.unit',
      ],
      settings: { foreground: ir.code.number },
    },
    {
      name: 'Constants, Booleans & Null',
      scope: [
        'constant.language',
        'constant.other',
        'variable.other.constant',
        'entity.name.type.enum-member',
      ],
      settings: { foreground: ir.code.constant },
    },
    {
      name: 'Decorators, Annotations & Attributes',
      scope: [
        'meta.decorator',
        'punctuation.decorator',
        'punctuation.definition.decorator',
        'entity.name.function.decorator',
        'storage.type.annotation',
        'meta.attribute.rust',
      ],
      settings: { foreground: ir.code.decorator },
    },
    {
      name: 'HTML/JSX Tags & Punctuation',
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: ir.code.tag },
    },
    {
      name: 'JSX Custom Components',
      scope: ['support.class.component'],
      settings: { foreground: ir.code.type },
    },
    {
      name: 'HTML/JSX Attributes & CSS Selectors',
      scope: [
        'entity.other.attribute-name',
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
        'entity.other.attribute-name.pseudo-class.css',
      ],
      settings: { foreground: ir.code.attribute },
    },
    {
      name: 'Separators, Terminators & Brackets',
      scope: [
        'punctuation.separator',
        'punctuation.terminator',
        'punctuation.section.brackets',
        'punctuation.section.parens',
        'punctuation.section.braces',
        'meta.brace',
      ],
      settings: { foreground: ir.code.punctuation },
    },
    {
      name: 'Markdown Headings',
      scope: [
        'markup.heading',
        'entity.name.section.markdown',
        'punctuation.definition.heading.markdown',
      ],
      settings: { foreground: ir.code.heading, fontStyle: 'bold' },
    },
    {
      name: 'Markdown Bold',
      scope: ['markup.bold'],
      settings: { foreground: ir.code.plain, fontStyle: 'bold' },
    },
    {
      name: 'Markdown Italic',
      scope: ['markup.italic'],
      settings: { foreground: ir.code.plain, fontStyle: 'italic' },
    },
    {
      name: 'Markdown Links',
      scope: ['markup.underline.link', 'string.other.link'],
      settings: { foreground: ir.code.link },
    },
    {
      name: 'Markdown Inline Code',
      scope: ['markup.inline.raw', 'markup.raw.inline'],
      settings: { foreground: ir.artifact.inlineCodeFg },
    },
    {
      name: 'Markdown Quotes',
      scope: ['markup.quote', 'punctuation.definition.quote.begin.markdown'],
      settings: { foreground: ir.fg.secondary, fontStyle: 'italic' },
    },
    {
      name: 'Diff Inserted',
      scope: ['markup.inserted', 'punctuation.definition.inserted.diff'],
      settings: { foreground: ir.code.diffInserted },
    },
    {
      name: 'Diff Deleted',
      scope: ['markup.deleted', 'punctuation.definition.deleted.diff'],
      settings: { foreground: ir.code.diffDeleted },
    },
    {
      name: 'Diff Headers & Hunks',
      scope: [
        'meta.diff.header',
        'meta.diff.range',
        'punctuation.definition.range.diff',
        'punctuation.definition.from-file.diff',
        'punctuation.definition.to-file.diff',
      ],
      settings: { foreground: ir.code.function },
    },
  ];

  return {
    name: ir.meta.id,
    displayName: ir.meta.displayName,
    type: isLight ? 'light' : 'dark',
    fg: ir.code.plain,
    bg: ir.artifact.codeBlockBg,
    semanticHighlighting: true,
    colors: {
      'editor.background': ir.artifact.codeBlockBg,
      'editor.foreground': ir.code.plain,
      'editorLineNumber.foreground': ir.fg.muted,
      'editor.selectionBackground': ir.surface.selected,
      'diffEditor.insertedTextBackground': ir.diff.addedBg,
      'diffEditor.removedTextBackground': ir.diff.removedBg,
    },
    tokenColors,
  };
}
