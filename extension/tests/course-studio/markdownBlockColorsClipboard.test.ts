import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cloneMarkdownBlockColors,
  parseMarkdownBlockColorFieldPaste,
  parseMarkdownBlockColorsClipboard,
  serializeMarkdownBlockColorsClipboard,
  useMarkdownBlockColorsClipboardStore,
} from "../../src/webview/course-studio/schemas/markdownBlockColorsClipboard";

describe("markdownBlockColorsClipboard", () => {
  it("round-trips colors through JSON envelope", () => {
    const colors = { background: "#112233", link: "#2cf27a80" };
    const raw = serializeMarkdownBlockColorsClipboard(colors);
    assert.deepEqual(parseMarkdownBlockColorsClipboard(raw), colors);
  });

  it("supports copy of theme-default (empty) styles", () => {
    const raw = serializeMarkdownBlockColorsClipboard(undefined);
    assert.equal(parseMarkdownBlockColorsClipboard(raw), undefined);
  });

  it("rejects invalid clipboard payloads", () => {
    assert.equal(parseMarkdownBlockColorsClipboard("{}"), null);
    assert.equal(parseMarkdownBlockColorsClipboard("not-json"), null);
  });

  it("stores copied colors in session clipboard", () => {
    useMarkdownBlockColorsClipboardStore.getState().copyColors({ h1: "#ffffff" });
    assert.equal(useMarkdownBlockColorsClipboardStore.getState().hasClipboard, true);
    assert.deepEqual(cloneMarkdownBlockColors(useMarkdownBlockColorsClipboardStore.getState().copiedColors), {
      h1: "#ffffff",
    });
  });

  it("parses single-field paste from plain hex", () => {
    assert.equal(parseMarkdownBlockColorFieldPaste("#aabbcc", "background"), "#aabbcc");
    assert.equal(parseMarkdownBlockColorFieldPaste("aabbcc", "link"), "#aabbcc");
  });

  it("parses single-field paste from full colors envelope", () => {
    const raw = serializeMarkdownBlockColorsClipboard({ background: "#112233", link: "#445566" });
    assert.equal(parseMarkdownBlockColorFieldPaste(raw, "background"), "#112233");
    assert.equal(parseMarkdownBlockColorFieldPaste(raw, "body"), null);
  });
});
