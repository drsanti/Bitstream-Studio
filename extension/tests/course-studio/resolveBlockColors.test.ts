import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveCardBlockEffectiveColors,
  resolveMarkdownBlockEffectiveColors,
} from "../../src/webview/course-studio/runtime/resolveBlockColors";
import { applyCardColorsToPageBlocks } from "../../src/webview/course-studio/maintainer/pageBlockColorActions";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { slugifyCourseThemePresetId } from "../../src/webview/course-studio/schemas/courseThemes.v1";

describe("resolveBlockColors", () => {
  it("cascades card colors preset → page → block", () => {
    const effective = resolveCardBlockEffectiveColors(
      { title: "#ff0000" },
      {
        cardThemePresetId: "ref",
        cardColors: { background: "#111111" },
      },
      {
        card: [{ id: "ref", title: "Ref", colors: { body: "#222222" } }],
      },
    );
    assert.deepEqual(effective, {
      background: "#111111",
      title: "#ff0000",
      body: "#222222",
    });
  });

  it("cascades markdown syntax theme", () => {
    const effective = resolveMarkdownBlockEffectiveColors(
      undefined,
      {
        markdownThemePresetId: "body",
        markdownColors: { codeSyntaxTheme: "nord" },
      },
      {
        markdown: [
          { id: "body", title: "Body", colors: { codeSyntaxTheme: "dracula", body: "#ccc" } },
        ],
      },
    );
    assert.equal(effective?.codeSyntaxTheme, "nord");
    assert.equal(effective?.body, "#ccc");
  });

  it("applyCardColorsToPageBlocks replaces all card blocks", () => {
    const page = parsePageV1({
      version: 1,
      id: "p",
      title: "P",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "c1",
          kind: "card",
          placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
          body: "A",
        },
        {
          id: "md",
          kind: "markdown",
          placement: { column: 5, row: 1, columnSpan: 4, rowSpan: 2 },
          markdown: "x",
        },
        {
          id: "c2",
          kind: "card",
          placement: { column: 9, row: 1, columnSpan: 4, rowSpan: 2 },
          body: "B",
          colors: { title: "#aabbcc" },
        },
      ],
    });
    const next = applyCardColorsToPageBlocks(
      page,
      { background: "#abc", title: "#def" },
      "replace",
    );
    const c1 = next.find((b) => b.id === "c1");
    const c2 = next.find((b) => b.id === "c2");
    const md = next.find((b) => b.id === "md");
    assert.equal(c1?.kind, "card");
    assert.equal(c2?.kind, "card");
    if (c1?.kind === "card") {
      assert.deepEqual(c1.colors, { background: "#abc", title: "#def" });
    }
    if (c2?.kind === "card") {
      assert.deepEqual(c2.colors, { background: "#abc", title: "#def" });
    }
    assert.equal(md?.kind, "markdown");
  });

  it("slugifyCourseThemePresetId", () => {
    assert.equal(slugifyCourseThemePresetId("BMI270 Reference Card"), "bmi270-reference-card");
  });
});
