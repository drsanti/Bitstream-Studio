import type { LayoutNode } from "../../../../ui/workbench";

/** Default tiling: (Library over Assets) | (Stage over Flow over Inspector) — node-animator Layout parity. */
export const DEFAULT_STUDIO_WORKBENCH_LAYOUT: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  ratio: 0.26,
  first: {
    id: "left-column",
    type: "split",
    direction: "vertical",
    ratio: 0.52,
    first: { id: "pane-library", type: "editor", editorType: "library" },
    second: { id: "pane-assets", type: "editor", editorType: "assets" },
  },
  second: {
    id: "main",
    type: "split",
    direction: "horizontal",
    ratio: 0.74,
    first: {
      id: "center-column",
      type: "split",
      direction: "vertical",
      ratio: 0.58,
      first: { id: "pane-stage", type: "editor", editorType: "stage" },
      second: { id: "pane-flow", type: "editor", editorType: "flow" },
    },
    second: { id: "pane-inspector", type: "editor", editorType: "inspector" },
  },
};
