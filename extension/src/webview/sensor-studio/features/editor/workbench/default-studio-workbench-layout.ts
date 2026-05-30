import type { LayoutNode } from "../../../../ui/workbench";

/** Default tiling: (Library over Asset Browser) | (Flow over Inspector). */
export const DEFAULT_STUDIO_WORKBENCH_LAYOUT: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  ratio: 0.28,
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
    direction: "vertical",
    ratio: 0.72,
    first: { id: "pane-flow", type: "editor", editorType: "flow" },
    second: { id: "pane-inspector", type: "editor", editorType: "inspector" },
  },
};
