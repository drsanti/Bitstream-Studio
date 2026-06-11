import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  formatMarkdownBlockColorDisplay,
  markdownBlockColorsToStyle,
  MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS,
  patchMarkdownBlockCodeSyntaxTheme,
  patchMarkdownBlockColor,
  resolveMarkdownBlockCodeSyntaxTheme,
  stripEmptyMarkdownBlockColors,
} from "../../src/webview/course-studio/schemas/markdownBlockColors";

describe("markdownBlockColors", () => {
  it("parsePageV1 accepts markdown block colors", () => {
    const page = parsePageV1({
      version: 1,
      id: "md-colors",
      title: "Colors",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "md-1",
          kind: "markdown",
          placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          markdown: "# Hello",
          colors: {
            background: "#112233",
            h1: "#aabbcc",
            inlineCode: "#00ffaa",
          },
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "markdown");
    if (block.kind === "markdown") {
      assert.deepEqual(block.colors, {
        background: "#112233",
        h1: "#aabbcc",
        inlineCode: "#00ffaa",
      });
    }
  });

  it("maps colors to CSS variables", () => {
    assert.deepEqual(
      markdownBlockColorsToStyle({
        background: "#112233",
        body: "#ccddee",
        h1: "#111111",
        h2: "#222222",
        h3: "#333333",
        h4: "#444444",
        strong: "#555555",
        link: "#666666",
        inlineCode: "#777777",
        inlineCodeBackground: "#888888",
        blockCode: "#999999",
        blockCodeBackground: "#aaaaaa",
      }),
      {
        "--course-md-bg": "#112233",
        "--course-md-body": "#ccddee",
        "--course-md-h1": "#111111",
        "--course-md-h2": "#222222",
        "--course-md-h3": "#333333",
        "--course-md-h4": "#444444",
        "--course-md-strong": "#555555",
        "--course-md-link": "#666666",
        "--course-md-inline-code": "#777777",
        "--course-md-inline-code-bg": "#888888",
        "--course-md-block-code": "#999999",
        "--course-md-block-code-bg": "#aaaaaa",
      },
    );
  });

  it("patches and strips empty color objects", () => {
    const next = patchMarkdownBlockColor(undefined, "link", "#22d3ee");
    assert.deepEqual(next, { link: "#22d3ee" });
    const cleared = patchMarkdownBlockColor(next, "link", undefined);
    assert.equal(stripEmptyMarkdownBlockColors(cleared), undefined);
  });

  it("groups inspector rows for compact UI sections", () => {
    assert.equal(MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS.length, 3);
    assert.equal(formatMarkdownBlockColorDisplay(undefined), "Default");
    assert.equal(formatMarkdownBlockColorDisplay("#AABBCC"), "#aabbcc");
  });

  it("resolves and patches code syntax theme", () => {
    assert.equal(resolveMarkdownBlockCodeSyntaxTheme(undefined), "nord");
    assert.equal(
      resolveMarkdownBlockCodeSyntaxTheme({ codeSyntaxTheme: "dracula" }),
      "dracula",
    );

    const patched = patchMarkdownBlockCodeSyntaxTheme(undefined, "dracula");
    assert.deepEqual(patched, { codeSyntaxTheme: "dracula" });

    const cleared = patchMarkdownBlockCodeSyntaxTheme(patched, undefined);
    assert.equal(stripEmptyMarkdownBlockColors(cleared), undefined);
  });

  it("stripEmptyMarkdownBlockColors keeps codeSyntaxTheme without hex colors", () => {
    assert.deepEqual(stripEmptyMarkdownBlockColors({ codeSyntaxTheme: "nord" }), {
      codeSyntaxTheme: "nord",
    });
  });
});
