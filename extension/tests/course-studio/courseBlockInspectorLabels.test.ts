import { strict as assert } from "node:assert";
import test from "node:test";

import {
  courseBlockHeaderTitle,
  courseBlockPaletteLabel,
} from "../../src/webview/course-studio/maintainer/courseBlockInspectorLabels";
import type { PageBlockV1 } from "../../src/webview/course-studio/schemas/page.v1";

function calloutBlock(id: string): PageBlockV1 {
  return {
    id,
    kind: "callout-info",
    placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
    body: "x",
  };
}

test("courseBlockHeaderTitle uses palette label for non-callout blocks", () => {
  const block: PageBlockV1 = {
    id: "heading-1",
    kind: "heading",
    placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
    title: "Title",
  };
  assert.equal(courseBlockPaletteLabel("heading"), "Heading");
  assert.equal(courseBlockHeaderTitle(block), "Heading");
});

test("courseBlockHeaderTitle includes callout variant", () => {
  assert.equal(courseBlockHeaderTitle(calloutBlock("c1")), "Callout · Info");
});
