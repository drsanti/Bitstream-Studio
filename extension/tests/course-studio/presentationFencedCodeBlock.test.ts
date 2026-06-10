import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizePrismLanguage } from "../../src/webview/presentation/components/PresentationFencedCodeBlock";

describe("normalizePrismLanguage", () => {
  it("maps common aliases", () => {
    assert.equal(normalizePrismLanguage("ts"), "typescript");
    assert.equal(normalizePrismLanguage("py"), "python");
    assert.equal(normalizePrismLanguage("typescript"), "typescript");
  });

  it("falls back to text for empty language", () => {
    assert.equal(normalizePrismLanguage(null), "text");
    assert.equal(normalizePrismLanguage(""), "text");
  });
});
