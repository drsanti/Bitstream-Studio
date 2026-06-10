import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyMarkdownToolbarAction,
  MARKDOWN_TOOLBAR_ACTION_META,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorActions";
import {
  countWords,
  cursorLineColumn,
  findNext,
  findPrevious,
  wrapRange,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorSelection";
import {
  defaultMarkdownToolbarPrefs,
  moveToolbarAction,
  normalizeMarkdownToolbarPrefs,
  setToolbarActionVisible,
  visibleMarkdownToolbarActions,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorToolbarPersistence";

describe("markdownEditorSelection", () => {
  it("wraps selection with markers", () => {
    const result = wrapRange("hello world", { start: 6, end: 11 }, "**", "**");
    assert.equal(result.text, "hello **world**");
    assert.deepEqual(result.selection, { start: 8, end: 13 });
  });

  it("counts words and reports cursor position", () => {
    assert.equal(countWords("one two\nthree"), 3);
    assert.deepEqual(cursorLineColumn("abc\ndef", 5), { line: 2, column: 2 });
  });

  it("finds next occurrence with wrap", () => {
    const text = "abc abc";
    assert.equal(findNext(text, "abc", 4, { caseSensitive: true, useRegex: false }), 4);
    assert.equal(findNext(text, "abc", 5, { caseSensitive: true, useRegex: false }), 0);
  });

  it("finds regex matches", () => {
    const text = "foo123 bar456";
    assert.equal(
      findNext(text, "\\d+", 0, { caseSensitive: false, useRegex: true }),
      3,
    );
  });

  it("finds previous match with wrap", () => {
    const text = "abc abc";
    assert.equal(
      findPrevious(text, "abc", 4, { caseSensitive: true, useRegex: false }),
      0,
    );
    assert.equal(
      findPrevious(text, "abc", 0, { caseSensitive: true, useRegex: false }),
      4,
    );
  });
});

import { offsetAtLine } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorScroll";
import { markdownSyntaxHighlightHtml } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownSyntaxHighlightHtml";
import { MARKDOWN_EDITOR_SNIPPETS } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorSnippets";

describe("markdownEditorScroll", () => {
  it("maps 1-based line numbers to offsets", () => {
    assert.equal(offsetAtLine("a\nb\nc", 1), 0);
    assert.equal(offsetAtLine("a\nb\nc", 2), 2);
    assert.equal(offsetAtLine("a\nb\nc", 3), 4);
  });
});

describe("markdownSyntaxHighlightHtml", () => {
  it("highlights headings and fences", () => {
    const html = markdownSyntaxHighlightHtml("# Title\n```\ncode\n```");
    assert.match(html, /course-md-hl-heading-mark/);
    assert.match(html, /course-md-hl-fence/);
  });

  it("preserves trailing newline for caret alignment", () => {
    const html = markdownSyntaxHighlightHtml("line\n");
    assert.ok(html.endsWith("\n"));
  });
});

describe("markdownEditorSnippets", () => {
  it("includes mermaid templates", () => {
    assert.ok(MARKDOWN_EDITOR_SNIPPETS.some((entry) => entry.id === "mermaid-flow"));
  });
});

describe("markdownEditorActions", () => {
  it("includes emoji in default toolbar order", () => {
    const prefs = defaultMarkdownToolbarPrefs();
    assert.ok(visibleMarkdownToolbarActions(prefs).includes("emoji"));
    assert.equal(MARKDOWN_TOOLBAR_ACTION_META.emoji.label, "Emoji");
  });

  it("inserts admonition template", () => {
    const outcome = applyMarkdownToolbarAction("admonition", {
      text: "",
      selection: { start: 0, end: 0 },
      admonitionVariant: "Warning",
    });
    assert.equal(outcome.kind, "edit");
    if (outcome.kind === "edit") {
      assert.match(outcome.result.text, /> \*\*Warning:\*\*/);
    }
  });
});

import {
  clampMarkdownEditorZoom,
  markdownEditorFontSizeRem,
  nextMarkdownEditorZoom,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorZoom";

describe("markdownEditorZoom", () => {
  it("clamps and steps zoom percent", () => {
    assert.equal(clampMarkdownEditorZoom(72), 75);
    assert.equal(clampMarkdownEditorZoom(203), 200);
    assert.equal(nextMarkdownEditorZoom(100, -1), 110);
    assert.equal(nextMarkdownEditorZoom(100, 1), 90);
    assert.equal(markdownEditorFontSizeRem(100), 0.875);
    assert.equal(markdownEditorFontSizeRem(120), 1.05);
  });
});

import {
  isAlreadyMathDelimited,
  looksLikeRawLatex,
  wrapPastedLatexForMarkdown,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorPasteMath";

describe("markdownEditorPasteMath", () => {
  it("wraps raw LaTeX pasted without delimiters", () => {
    const raw = String.raw`\mathbf{a} = \sqrt{a_x^2 + a_y^2 + a_z^2}`;
    assert.equal(looksLikeRawLatex(raw), true);
    assert.match(wrapPastedLatexForMarkdown(raw), /^\n\$\$\n/);
    assert.match(wrapPastedLatexForMarkdown(raw), /\n\$\$\n$/);
  });

  it("leaves already delimited and plain text unchanged", () => {
    assert.equal(isAlreadyMathDelimited("$x$"), true);
    assert.equal(wrapPastedLatexForMarkdown("$x$"), "$x$");
    assert.equal(wrapPastedLatexForMarkdown("plain sentence"), "plain sentence");
    assert.equal(wrapPastedLatexForMarkdown("https://example.com"), "https://example.com");
  });

  it("uses inline $ for short single-line LaTeX", () => {
    const raw = String.raw`\alpha + \beta`;
    assert.equal(wrapPastedLatexForMarkdown(raw), `$${raw}$`);
  });
});

describe("markdownEditorToolbarPersistence", () => {
  it("keeps unknown ids out and preserves defaults", () => {
    const normalized = normalizeMarkdownToolbarPrefs({
      order: ["bold", "not-real", "italic"],
      hidden: ["find", "nope"],
    });
    assert.deepEqual(normalized.order.slice(0, 3), ["bold", "italic", "undo"]);
    assert.deepEqual(normalized.hidden, ["find"]);
  });

  it("moves and toggles visibility", () => {
    const base = defaultMarkdownToolbarPrefs();
    const moved = moveToolbarAction(base, "bold", -1);
    assert.ok(moved.order.indexOf("bold") < base.order.indexOf("bold"));
    const hidden = setToolbarActionVisible(base, "find", false);
    assert.ok(!visibleMarkdownToolbarActions(hidden).includes("find"));
  });
});

import {
  clampMarkdownEditorEmbeddedHeightPx,
  MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX,
  MARKDOWN_EDITOR_EMBEDDED_MAX_HEIGHT_PX,
  MARKDOWN_EDITOR_EMBEDDED_MIN_HEIGHT_PX,
  nextMarkdownEditorEmbeddedHeightPx,
} from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorEmbeddedSize";

describe("markdownEditorEmbeddedSize", () => {
  it("clamps embedded shell height", () => {
    assert.equal(
      clampMarkdownEditorEmbeddedHeightPx(MARKDOWN_EDITOR_EMBEDDED_DEFAULT_HEIGHT_PX),
      192,
    );
    assert.equal(
      clampMarkdownEditorEmbeddedHeightPx(MARKDOWN_EDITOR_EMBEDDED_MIN_HEIGHT_PX - 1),
      MARKDOWN_EDITOR_EMBEDDED_MIN_HEIGHT_PX,
    );
    assert.equal(
      clampMarkdownEditorEmbeddedHeightPx(MARKDOWN_EDITOR_EMBEDDED_MAX_HEIGHT_PX + 100),
      MARKDOWN_EDITOR_EMBEDDED_MAX_HEIGHT_PX,
    );
  });

  it("applies vertical drag delta", () => {
    assert.equal(nextMarkdownEditorEmbeddedHeightPx(192, 40), 232);
    assert.equal(nextMarkdownEditorEmbeddedHeightPx(192, -80), 128);
  });
});

import { continueMarkdownBlockOnEnter, handleMarkdownTableTab } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorBlockContinuation";
import { parseMarkdownHeadings, resolveActiveMarkdownHeadingLine } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownEditorOutline";
import { buildMarkdownFindHighlight } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownSyntaxHighlightHtml";
import {
  patchMarkdownBlockSourceMode,
  resolveMarkdownBlockSourceMode,
} from "../../src/webview/course-studio/maintainer/markdownBlockSource";
import { resolveMarkdownBlockMermaidTheme } from "../../src/webview/course-studio/schemas/markdownBlockColors";

describe("markdownEditorBlockContinuation", () => {
  it("continues bullet lists on Enter", () => {
    const text = "- item one";
    const result = continueMarkdownBlockOnEnter(text, text.length);
    assert.ok(result != null);
    assert.match(result.text, /- item one\n- /);
  });

  it("exits empty list item on Enter", () => {
    const text = "- \n";
    const result = continueMarkdownBlockOnEnter(text, 2);
    assert.ok(result != null);
    assert.equal(result.text, "");
  });

  it("moves to next table cell on Tab", () => {
    const text = "| a | b | c |";
    const range = handleMarkdownTableTab(text, 3, false);
    assert.deepEqual(range, { start: 5, end: 5 });
  });

  it("moves to previous table cell on Shift+Tab", () => {
    const text = "| a | b | c |";
    const range = handleMarkdownTableTab(text, 5, true);
    assert.deepEqual(range, { start: 1, end: 1 });
  });
});

describe("markdownEditorOutline", () => {
  it("parses ATX headings", () => {
    const headings = parseMarkdownHeadings("# One\n\n## Two");
    assert.equal(headings.length, 2);
    assert.equal(headings[0]?.title, "One");
    assert.equal(headings[1]?.level, 2);
  });

  it("resolves active heading from cursor line", () => {
    const headings = parseMarkdownHeadings("# One\n\n## Two\n\nbody");
    assert.equal(resolveActiveMarkdownHeadingLine(headings, 1), 1);
    assert.equal(resolveActiveMarkdownHeadingLine(headings, 3), 3);
    assert.equal(resolveActiveMarkdownHeadingLine(headings, 5), 3);
  });
});

describe("markdownFindHighlight", () => {
  it("marks find matches in syntax html", () => {
    const find = buildMarkdownFindHighlight("foo", { caseSensitive: false, useRegex: false }, 0);
    const html = markdownSyntaxHighlightHtml("foo bar foo", { find });
    assert.match(html, /course-md-hl-find--active/);
    assert.match(html, /course-md-hl-find/);
  });
});

describe("markdownBlockSource", () => {
  it("resolves source mode from block fields", () => {
    assert.equal(resolveMarkdownBlockSourceMode({ src: "a.md" }), "file");
    assert.equal(resolveMarkdownBlockSourceMode({ url: "https://x" }), "url");
    assert.equal(resolveMarkdownBlockSourceMode({ markdown: "x" }), "inline");
  });

  it("patches block when switching source mode", () => {
    const block = { kind: "markdown" as const, id: "b1", markdown: "hello" };
    const patched = patchMarkdownBlockSourceMode(block, "file");
    assert.equal(patched.src, "lesson.theory.md");
    assert.equal(patched.markdown, undefined);
  });
});

describe("markdownBlockMermaidTheme", () => {
  it("picks light theme for bright backgrounds", () => {
    assert.equal(resolveMarkdownBlockMermaidTheme({ background: "#fafafa" }), "default");
    assert.equal(resolveMarkdownBlockMermaidTheme({ background: "#18181b" }), "dark");
  });
});

import { listMarkdownLinkTargets, slugifyMarkdownHeading } from "../../src/webview/course-studio/maintainer/markdown-editor/markdownLinkTargets";

describe("markdownLinkTargets", () => {
  it("includes in-document heading anchors", () => {
    const targets = listMarkdownLinkTargets(null, "# Intro\n\n## Next section");
    assert.ok(targets.some((target) => target.href === "#intro"));
    assert.ok(targets.some((target) => target.href === "#next-section"));
  });

  it("slugifies heading titles for anchors", () => {
    assert.equal(slugifyMarkdownHeading("Hello World!"), "hello-world");
  });
});
