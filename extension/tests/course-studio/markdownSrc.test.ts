import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

const PILOT_ACCEL_THEORY_MD_SRC = "pilot-bmi-accel-theory.theory.md";

describe("markdown block src", () => {
  test("parsePageV1 accepts markdown block with src only", () => {
    const page = parsePageV1({
      version: 1,
      id: "test",
      title: "Test",
      grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
      blocks: [
        {
          id: "md",
          kind: "markdown",
          placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          src: PILOT_ACCEL_THEORY_MD_SRC,
        },
      ],
    });
    const block = page.blocks[0];
    assert.equal(block.kind, "markdown");
    if (block.kind !== "markdown") {
      return;
    }
    assert.equal(block.src, PILOT_ACCEL_THEORY_MD_SRC);
    assert.equal(block.markdown, undefined);
  });

  test("parsePageV1 rejects markdown block without markdown or src", () => {
    assert.throws(() =>
      parsePageV1({
        version: 1,
        id: "test",
        title: "Test",
        grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
        blocks: [
          {
            id: "md",
            kind: "markdown",
            placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
          },
        ],
      }),
    );
  });
});
