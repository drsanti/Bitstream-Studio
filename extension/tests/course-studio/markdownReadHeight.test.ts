import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MARKDOWN_READ_HEIGHT,
  markdownShellHeightForRead,
  resolveMarkdownReadHeight,
} from "../../src/webview/course-studio/schemas/markdownReadHeight.ts";

describe("markdownReadHeight", () => {
  it("defaults to content (auto height in read mode)", () => {
    assert.equal(resolveMarkdownReadHeight({}), DEFAULT_MARKDOWN_READ_HEIGHT);
    assert.equal(DEFAULT_MARKDOWN_READ_HEIGHT, "content");
  });

  it("honors explicit grid override", () => {
    assert.equal(resolveMarkdownReadHeight({ readHeight: "grid" }), "grid");
  });

  it("maps read height to shell sizing", () => {
    assert.equal(markdownShellHeightForRead("content"), "content");
    assert.equal(markdownShellHeightForRead("grid"), "fill");
  });
});
