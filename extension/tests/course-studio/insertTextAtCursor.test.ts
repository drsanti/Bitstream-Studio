import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  insertTextAtCursor,
  readTextControlSelection,
} from "../../src/webview/ui/TRN/insertTextAtCursor";
import { searchTrnEmojiCatalog } from "../../src/webview/ui/TRN/trnEmojiCatalog";

describe("insertTextAtCursor", () => {
  it("inserts at the cursor and places caret after the insertion", () => {
    const result = insertTextAtCursor("hello world", { start: 5, end: 5 }, " 😀");
    assert.equal(result.text, "hello 😀 world");
    assert.deepEqual(result.selection, { start: 8, end: 8 });
  });

  it("replaces the selected range", () => {
    const result = insertTextAtCursor("abc def", { start: 0, end: 3 }, "xyz");
    assert.equal(result.text, "xyz def");
    assert.deepEqual(result.selection, { start: 3, end: 3 });
  });

  it("falls back to end of text when control is null", () => {
    assert.deepEqual(readTextControlSelection(null, 12), { start: 12, end: 12 });
  });
});

describe("searchTrnEmojiCatalog", () => {
  it("matches emoji name and keyword fields", () => {
    const results = searchTrnEmojiCatalog("smile");
    assert.ok(results.length > 0);
    assert.ok(
      results.some(
        (entry) =>
          entry.name.toLowerCase().includes("smile") ||
          entry.keywords?.some((keyword) => keyword.includes("smile")),
      ),
    );
  });

  it("returns empty list for blank query", () => {
    assert.deepEqual(searchTrnEmojiCatalog("   "), []);
  });
});
