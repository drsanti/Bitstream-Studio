import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import {
  pageGridChromeToStyleVars,
  pageGridPublishedCellClassName,
  patchPageGridChrome,
  patchPageGridChromeColor,
  resolvePageGridChrome,
} from "../../src/webview/course-studio/schemas/pageGridChrome";

describe("pageGridChrome", () => {
  it("parsePageV1 accepts grid.chrome", () => {
    const page = parsePageV1({
      version: 1,
      id: "grid-chrome",
      title: "Grid chrome",
      grid: {
        columns: 12,
        rowHeightPx: 48,
        gapPx: 12,
        paddingPx: 32,
        chrome: {
          canvasBackground: "#101010",
          guides: { border: "#ffffff40" },
          published: { showCellChrome: true },
        },
      },
      blocks: [],
    });
    assert.equal(page.grid.chrome?.canvasBackground, "#101010");
    assert.equal(page.grid.chrome?.published?.showCellChrome, true);
  });

  it("resolvePageGridChrome applies theme defaults", () => {
    const resolved = resolvePageGridChrome(undefined);
    assert.equal(resolved.guides.borderStyle, "dashed");
    assert.equal(resolved.published.showCellChrome, false);
  });

  it("pageGridChromeToStyleVars maps CSS custom properties", () => {
    const style = pageGridChromeToStyleVars({
      canvasBackground: "#0a0a0a",
      cell: { idleBorder: "#ffffff33" },
    });
    assert.equal(style["--course-grid-canvas-bg"], "#0a0a0a");
    assert.equal(style["--course-grid-cell-idle-border"], "#ffffff33");
  });

  it("coursePageGridStyleVars merges layout and chrome vars", () => {
    const style = {
      "--course-grid-columns": 12,
      ...pageGridChromeToStyleVars({
        guides: { background: "#ff00000a" },
      }),
    };
    assert.equal(style["--course-grid-columns"], 12);
    assert.equal(style["--course-grid-guide-bg"], "#ff00000a");
  });

  it("patchPageGridChromeColor drops theme-default hex", () => {
    assert.equal(
      patchPageGridChromeColor(undefined, "background", "#f59e0b0a", "#f59e0b0a"),
      undefined,
    );
  });

  it("patchPageGridChrome clears colors when nested field is undefined", () => {
    assert.deepEqual(
      patchPageGridChrome(
        { guides: { border: "#ffffff", background: "#000000" }, cell: { idleBorder: "#111111" } },
        { guides: undefined, cell: undefined },
      ),
      undefined,
    );
  });

  it("pageGridPublishedCellClassName adds published chrome classes", () => {
    assert.equal(
      pageGridPublishedCellClassName({ published: { showCellChrome: true } }),
      "course-page-grid__cell course-page-grid__cell--published-chrome",
    );
    assert.equal(
      pageGridPublishedCellClassName({
        published: { showCellChrome: true, useGuideStyleForCells: true },
      }),
      "course-page-grid__cell course-page-grid__cell--published-chrome course-page-grid__cell--published-guide-style",
    );
  });
});
