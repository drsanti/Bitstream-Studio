import assert from "node:assert/strict";
import test from "node:test";

import { findDuplicateBlockPlacement } from "../../src/webview/course-studio/maintainer/blockPlacement";
import { duplicatePageBlock } from "../../src/webview/course-studio/maintainer/duplicatePageBlock";
import type { PageBlockV1 } from "../../src/webview/course-studio/schemas/page.v1";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

function blankPage(blocks: PageBlockV1[]) {
  return parsePageV1({
    version: 1,
    id: "test-page",
    title: "Test",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks,
  });
}

test("findDuplicateBlockPlacement prefers slot to the right", () => {
  const page = blankPage([
    {
      id: "md-1",
      kind: "markdown",
      placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
      markdown: "# A",
    },
  ]);
  const placement = findDuplicateBlockPlacement(page, page.blocks[0]!.placement);
  assert.equal(placement.column, 5);
  assert.equal(placement.row, 1);
  assert.equal(placement.columnSpan, 4);
  assert.equal(placement.rowSpan, 2);
});

test("findDuplicateBlockPlacement places below when right is blocked", () => {
  const page = blankPage([
    {
      id: "md-1",
      kind: "markdown",
      placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 2 },
      markdown: "# A",
    },
    {
      id: "md-2",
      kind: "markdown",
      placement: { column: 7, row: 1, columnSpan: 6, rowSpan: 2 },
      markdown: "# B",
    },
  ]);
  const placement = findDuplicateBlockPlacement(page, page.blocks[0]!.placement);
  assert.equal(placement.column, 1);
  assert.equal(placement.row, 3);
});

test("duplicatePageBlock clones markdown content and colors with a new id", () => {
  const page = blankPage([
    {
      id: "md-1",
      kind: "markdown",
      placement: { column: 1, row: 1, columnSpan: 6, rowSpan: 4 },
      markdown: "## Theory",
      colors: { body: "#56d4a4", background: "#151517" },
    },
  ]);
  const source = page.blocks[0]!;
  assert.equal(source.kind, "markdown");
  if (source.kind !== "markdown") {
    return;
  }
  const copy = duplicatePageBlock(page, source);
  assert.notEqual(copy?.id, source.id);
  assert.equal(copy?.kind, "markdown");
  if (copy?.kind === "markdown") {
    assert.equal(copy.markdown, "## Theory");
    assert.deepEqual(copy.colors, { body: "#56d4a4", background: "#151517" });
    assert.equal(copy.placement.column, 7);
  }
});
