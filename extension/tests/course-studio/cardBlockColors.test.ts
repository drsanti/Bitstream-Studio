import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  cardBlockColorsToStyle,
  patchCardBlockColor,
  stripEmptyCardBlockColors,
} from "../../src/webview/course-studio/schemas/cardBlockColors";

describe("cardBlockColors", () => {
  it("parsePageV1 accepts card block colors", () => {
    const page = parsePageV1({
      version: 1,
      id: "card-colors",
      title: "Card",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "card-1",
          kind: "card",
          placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
          title: "Units",
          body: "Acceleration in g.",
          colors: {
            background: "#112233",
            title: "#ffeeaa",
            body: "#ccddee",
          },
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "card");
    if (block.kind === "card") {
      assert.deepEqual(block.colors, {
        background: "#112233",
        title: "#ffeeaa",
        body: "#ccddee",
      });
    }
  });

  it("maps card colors to CSS variables", () => {
    assert.deepEqual(
      cardBlockColorsToStyle({
        background: "#112233",
        border: "#445566",
        title: "#fafafa",
        icon: "#ffcc00",
        body: "#a1a1aa",
      }),
      {
        "--course-card-bg": "#112233",
        "--course-card-border": "#445566",
        "--course-card-title": "#fafafa",
        "--course-card-icon": "#ffcc00",
        "--course-card-body": "#a1a1aa",
      },
    );
  });

  it("patches and strips empty card color objects", () => {
    const next = patchCardBlockColor(undefined, "title", "#ffeeaa");
    assert.deepEqual(next, { title: "#ffeeaa" });
    const cleared = patchCardBlockColor(next, "title", undefined);
    assert.equal(stripEmptyCardBlockColors(cleared), undefined);
  });
});
