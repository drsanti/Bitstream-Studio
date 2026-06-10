import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCardColorPreviewSwatches,
  countSetColorFields,
  pageHasSiblingColorOverrides,
} from "../../src/webview/course-studio/maintainer/inspector/blockColorApplyDialogUtils";
import { CARD_BLOCK_COLOR_THEME_DEFAULTS } from "../../src/webview/course-studio/schemas/cardBlockColors";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

describe("blockColorApplyDialogUtils", () => {
  it("pageHasSiblingColorOverrides ignores current block", () => {
    const page = parsePageV1({
      version: 1,
      id: "p",
      title: "Page",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "c1",
          kind: "card",
          placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
          body: "A",
          colors: { title: "#aabbcc" },
        },
        {
          id: "c2",
          kind: "card",
          placement: { column: 5, row: 1, columnSpan: 4, rowSpan: 2 },
          body: "B",
        },
      ],
    });
    assert.equal(pageHasSiblingColorOverrides(page, "card", "c1"), false);
    assert.equal(pageHasSiblingColorOverrides(page, "card", "c2"), true);
  });

  it("buildCardColorPreviewSwatches uses defaults for unset fields", () => {
    const swatches = buildCardColorPreviewSwatches(
      { title: "#ff0000" },
      CARD_BLOCK_COLOR_THEME_DEFAULTS,
    );
    assert.equal(swatches.find((s) => s.label === "Title")?.value, "#ff0000");
    assert.equal(swatches.find((s) => s.label === "BG")?.value, CARD_BLOCK_COLOR_THEME_DEFAULTS.background);
  });

  it("countSetColorFields", () => {
    assert.equal(countSetColorFields({ background: "#111111", title: "#222222" }), 2);
  });
});
