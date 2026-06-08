import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseMarkdownAdmonition } from "../../src/webview/presentation/shared/markdownAdmonition";

describe("parseMarkdownAdmonition", () => {
  test("parses note admonition", () => {
    const parsed = parseMarkdownAdmonition("**Note:** Specific force is not velocity.");
    assert.ok(parsed != null);
    assert.equal(parsed.variant, "info");
    assert.equal(parsed.title, "Note");
    assert.equal(parsed.body, "Specific force is not velocity.");
  });

  test("parses warning label", () => {
    const parsed = parseMarkdownAdmonition("**Warning:** Do not confuse g with m/s².");
    assert.ok(parsed != null);
    assert.equal(parsed.variant, "warning");
  });

  test("returns null for plain blockquote", () => {
    assert.equal(parseMarkdownAdmonition("Plain quoted text"), null);
  });
});
