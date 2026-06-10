import { strict as assert } from "node:assert";
import test from "node:test";

import {
  listMarkdownPageBlocks,
  markdownBlockWorkbenchLabel,
} from "../../src/webview/course-studio/maintainer/markdownBlockWorkbenchLabel";
import type { PageBlockV1 } from "../../src/webview/course-studio/schemas/page.v1";

function markdownBlock(
  overrides: Partial<Extract<PageBlockV1, { kind: "markdown" }>> = {},
): Extract<PageBlockV1, { kind: "markdown" }> {
  return {
    id: "markdown-1",
    kind: "markdown",
    placement: { column: 1, row: 3, columnSpan: 6, rowSpan: 4 },
    markdown: "## Theory intro\n\nBody",
    ...overrides,
  };
}

test("markdownBlockWorkbenchLabel prefers first markdown heading", () => {
  assert.equal(
    markdownBlockWorkbenchLabel(markdownBlock()),
    "Theory intro",
  );
});

test("markdownBlockWorkbenchLabel uses src basename for file blocks", () => {
  assert.equal(
    markdownBlockWorkbenchLabel(
      markdownBlock({ src: "content/theory/imu-notes.md", markdown: undefined }),
    ),
    "imu-notes.md",
  );
});

test("markdownBlockWorkbenchLabel falls back to grid row", () => {
  assert.equal(
    markdownBlockWorkbenchLabel(markdownBlock({ markdown: "" })),
    "Markdown (row 3)",
  );
});

test("listMarkdownPageBlocks filters markdown kind only", () => {
  const blocks: PageBlockV1[] = [
    markdownBlock({ id: "md-1" }),
    {
      id: "card-1",
      kind: "card",
      placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
      title: "Card",
      body: "Body",
    },
  ];
  assert.equal(listMarkdownPageBlocks(blocks).length, 1);
  assert.equal(listMarkdownPageBlocks(blocks)[0]?.id, "md-1");
});
