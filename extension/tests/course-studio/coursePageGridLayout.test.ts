import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COURSE_PAGE_GRID_MIN_VISIBLE_ROWS,
  coursePageEmptyStateCenterPlacement,
  coursePageGridLayoutStyle,
  coursePageGridVisibleRows,
} from "../../src/webview/course-studio/maintainer/coursePageGridLayout";
import type { PageBlockV1, PageGridV1 } from "../../src/webview/course-studio/schemas/page.v1";

const sampleGrid: PageGridV1 = {
  columns: 12,
  gapPx: 12,
  paddingPx: 32,
  rowHeightPx: 48,
};

function block(row: number, rowSpan: number): PageBlockV1 {  return {
    id: "b1",
    kind: "card",
    placement: { column: 1, row, columnSpan: 4, rowSpan },
    body: "x",
  };
}

describe("coursePageGridVisibleRows", () => {
  it("returns at least the dashboard-style minimum row count", () => {
    assert.equal(coursePageGridVisibleRows([]), COURSE_PAGE_GRID_MIN_VISIBLE_ROWS);
  });

  it("extends when blocks occupy lower rows", () => {
    assert.equal(coursePageGridVisibleRows([block(8, 3)]), 12);
  });
});

describe("coursePageEmptyStateCenterPlacement", () => {
  it("centers a card-sized message region on the default grid", () => {
    assert.deepEqual(coursePageEmptyStateCenterPlacement(12, 10), {
      column: 4,
      row: 4,
      columnSpan: 6,
      rowSpan: 4,
    });
  });
});

describe("coursePageGridLayoutStyle", () => {
  it("includes padding by default", () => {
    assert.equal(coursePageGridLayoutStyle(sampleGrid).padding, "32px");
  });

  it("can omit padding for overlay grids that use inset instead", () => {
    assert.equal(
      coursePageGridLayoutStyle(sampleGrid, { includePadding: false }).padding,
      undefined,
    );
  });

  it("uses fixed row tracks when requested", () => {
    assert.equal(
      coursePageGridLayoutStyle(sampleGrid, { fixedRowHeight: true }).gridAutoRows,
      "48px",
    );
  });
});