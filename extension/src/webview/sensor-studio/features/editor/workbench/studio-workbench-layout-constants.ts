import type { LayoutNode } from "../../../../ui/workbench";
import { createEditorPane, createSplit } from "../../../../ui/workbench/layoutBuilders";
import { createStudioLeftColumn } from "./default-studio-workbench-layout";

/** Dashboard + Stage surfaces with one shared Flow strip (2D+3D desk). */
export const STUDIO_TWIN_FOCUS_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset-twin"),
  createSplit(
    createSplit(
      createSplit(
        createEditorPane("dashboard", { id: "preset-dashboard-twin" }),
        createSplit(
          createEditorPane("stage-outliner", { id: "preset-stage-outliner-twin" }),
          createEditorPane("stage", { id: "preset-stage-twin" }),
          "vertical",
          0.26,
          "preset-stage-stack-twin",
        ),
        "horizontal",
        0.5,
        "preset-twin-surfaces",
      ),
      createEditorPane("flow", { id: "preset-flow-twin" }),
      "vertical",
      0.72,
      "preset-twin-center",
    ),
    createEditorPane("inspector", { id: "preset-inspector-twin" }),
    "horizontal",
    0.78,
    "preset-main-twin",
  ),
  "horizontal",
  0.14,
  "preset-twin-focus-root",
);

/** 2D+3D desk with a wide inspector (teaching / authoring). */
export const STUDIO_TEACHING_TWIN_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset-teach"),
  createSplit(
    createSplit(
      createSplit(
        createEditorPane("dashboard", { id: "preset-dashboard-teach" }),
        createSplit(
          createEditorPane("stage-outliner", { id: "preset-stage-outliner-teach" }),
          createEditorPane("stage", { id: "preset-stage-teach" }),
          "vertical",
          0.28,
          "preset-stage-stack-teach",
        ),
        "horizontal",
        0.5,
        "preset-teach-surfaces",
      ),
      createEditorPane("flow", { id: "preset-flow-teach" }),
      "vertical",
      0.72,
      "preset-teach-center",
    ),
    createEditorPane("inspector", { id: "preset-inspector-teach" }),
    "horizontal",
    0.62,
    "preset-main-teach",
  ),
  "horizontal",
  0.12,
  "preset-teaching-twin-root",
);
