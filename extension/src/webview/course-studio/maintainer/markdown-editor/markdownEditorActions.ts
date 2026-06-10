import type { TextEditResult, TextRange } from "./markdownEditorSelection";
import { COURSE_MARKDOWN_MATH_DELIMITERS } from "../../../presentation/shared/presentationMarkdownPipeline";
import {
  insertSnippet,
  prefixLines,
  setLineHeading,
  wrapRange,
} from "./markdownEditorSelection";

export const MARKDOWN_TOOLBAR_ACTION_IDS = [
  "undo",
  "redo",
  "bold",
  "italic",
  "heading",
  "strikethrough",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "inlineCode",
  "codeFence",
  "table",
  "link",
  "image",
  "emoji",
  "horizontalRule",
  "mathInline",
  "mathBlock",
  "admonition",
  "find",
] as const;

export type MarkdownToolbarActionId = (typeof MARKDOWN_TOOLBAR_ACTION_IDS)[number];

export type MarkdownToolbarActionMeta = {
  id: MarkdownToolbarActionId;
  label: string;
  hint: string;
  group: "history" | "inline" | "structure" | "blocks" | "course" | "utility";
};

export const MARKDOWN_TOOLBAR_ACTION_META: Record<
  MarkdownToolbarActionId,
  MarkdownToolbarActionMeta
> = {
  undo: {
    id: "undo",
    label: "Undo",
    hint: "Undo last toolbar edit (Ctrl+Z also works while typing).",
    group: "history",
  },
  redo: {
    id: "redo",
    label: "Redo",
    hint: "Redo last undone toolbar edit.",
    group: "history",
  },
  bold: {
    id: "bold",
    label: "Bold",
    hint: "Wrap selection with **bold** (Ctrl+B).",
    group: "inline",
  },
  italic: {
    id: "italic",
    label: "Italic",
    hint: "Wrap selection with *italic* (Ctrl+I).",
    group: "inline",
  },
  heading: {
    id: "heading",
    label: "Heading",
    hint: "Apply heading level to the current line.",
    group: "inline",
  },
  strikethrough: {
    id: "strikethrough",
    label: "Strikethrough",
    hint: "Wrap selection with ~~strikethrough~~.",
    group: "inline",
  },
  bulletList: {
    id: "bulletList",
    label: "Bullet list",
    hint: "Prefix selected lines with -.",
    group: "structure",
  },
  orderedList: {
    id: "orderedList",
    label: "Numbered list",
    hint: "Prefix selected lines with 1.",
    group: "structure",
  },
  taskList: {
    id: "taskList",
    label: "Task list",
    hint: "Prefix selected lines with - [ ].",
    group: "structure",
  },
  blockquote: {
    id: "blockquote",
    label: "Blockquote",
    hint: "Prefix selected lines with >.",
    group: "structure",
  },
  inlineCode: {
    id: "inlineCode",
    label: "Inline code",
    hint: "Wrap selection with `inline code`.",
    group: "blocks",
  },
  codeFence: {
    id: "codeFence",
    label: "Code block",
    hint: "Insert a fenced code block.",
    group: "blocks",
  },
  table: {
    id: "table",
    label: "Table",
    hint: "Insert a 3×3 GFM table skeleton.",
    group: "blocks",
  },
  link: {
    id: "link",
    label: "Link",
    hint: "Insert [label](https://) (Ctrl+K).",
    group: "blocks",
  },
  image: {
    id: "image",
    label: "Image",
    hint: "Insert image via URL, file picker, or paste from clipboard.",
    group: "blocks",
  },
  emoji: {
    id: "emoji",
    label: "Emoji",
    hint: "Insert an emoji at the text cursor.",
    group: "blocks",
  },
  horizontalRule: {
    id: "horizontalRule",
    label: "Horizontal rule",
    hint: "Insert --- on its own line.",
    group: "structure",
  },
  mathInline: {
    id: "mathInline",
    label: "Math inline",
    hint: `Wrap with ${COURSE_MARKDOWN_MATH_DELIMITERS.inline} (StackEdit / Obsidian · KaTeX).`,
    group: "course",
  },
  mathBlock: {
    id: "mathBlock",
    label: "Math block",
    hint: `Insert ${COURSE_MARKDOWN_MATH_DELIMITERS.block} display math (StackEdit / Obsidian · KaTeX).`,
    group: "course",
  },
  admonition: {
    id: "admonition",
    label: "Callout",
    hint: "Insert a Note / Tip / Warning / Danger callout.",
    group: "course",
  },
  find: {
    id: "find",
    label: "Find",
    hint: "Find and replace in the document (Ctrl+F).",
    group: "utility",
  },
};

export const DEFAULT_MARKDOWN_TOOLBAR_ORDER: MarkdownToolbarActionId[] = [
  ...MARKDOWN_TOOLBAR_ACTION_IDS,
];

export type MarkdownToolbarApplyContext = {
  text: string;
  selection: TextRange;
  headingLevel?: 1 | 2 | 3 | 4;
  admonitionVariant?: "Note" | "Tip" | "Warning" | "Danger";
};

export type MarkdownToolbarApplyResult =
  | { kind: "edit"; result: TextEditResult }
  | { kind: "ui"; action: "find" | "undo" | "redo" | "link" };

const TABLE_TEMPLATE = `| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Cell | Cell | Cell |
| Cell | Cell | Cell |
`;

export function applyMarkdownToolbarAction(
  actionId: MarkdownToolbarActionId,
  ctx: MarkdownToolbarApplyContext,
): MarkdownToolbarApplyResult {
  const { text, selection } = ctx;

  switch (actionId) {
    case "undo":
    case "redo":
    case "find":
      return { kind: "ui", action: actionId };
    case "bold":
      return { kind: "edit", result: wrapRange(text, selection, "**", "**") };
    case "italic":
      return { kind: "edit", result: wrapRange(text, selection, "*", "*") };
    case "strikethrough":
      return { kind: "edit", result: wrapRange(text, selection, "~~", "~~") };
    case "inlineCode":
      return { kind: "edit", result: wrapRange(text, selection, "`", "`", "code") };
    case "link":
      return { kind: "ui", action: "link" };
    case "image":
      return {
        kind: "edit",
        result: insertSnippet(text, selection, "![alt](https://)", { start: 2, end: 5 }),
      };
    case "mathInline":
      return { kind: "edit", result: wrapRange(text, selection, "$", "$", "x") };
    case "mathBlock": {
      const snippet = "\n$$\n\n$$\n";
      return {
        kind: "edit",
        result: insertSnippet(text, selection, snippet, {
          start: selection.start + 3,
          end: selection.start + 3,
        }),
      };
    }
    case "codeFence": {
      const snippet = "\n```\n\n```\n";
      return {
        kind: "edit",
        result: insertSnippet(text, selection, snippet, {
          start: selection.start + 4,
          end: selection.start + 4,
        }),
      };
    }
    case "table":
      return { kind: "edit", result: insertSnippet(text, selection, `\n${TABLE_TEMPLATE}\n`) };
    case "horizontalRule":
      return { kind: "edit", result: insertSnippet(text, selection, "\n---\n") };
    case "bulletList":
      return { kind: "edit", result: prefixLines(text, selection, "- ") };
    case "orderedList":
      return { kind: "edit", result: prefixLines(text, selection, "1. ") };
    case "taskList":
      return { kind: "edit", result: prefixLines(text, selection, "- [ ] ") };
    case "blockquote":
      return { kind: "edit", result: prefixLines(text, selection, "> ") };
    case "heading": {
      const level = ctx.headingLevel ?? 2;
      return { kind: "edit", result: setLineHeading(text, selection, level) };
    }
    case "admonition": {
      const label = ctx.admonitionVariant ?? "Note";
      const snippet = `\n> **${label}:** Body text\n\n`;
      return {
        kind: "edit",
        result: insertSnippet(text, selection, snippet, {
          start: selection.start + `> **${label}:** `.length,
          end: selection.start + snippet.length - 2,
        }),
      };
    }
    default:
      return { kind: "ui", action: "find" };
  }
}
