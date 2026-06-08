import type { LayoutNode } from "../../../../ui/workbench";
import { createEditorPane, createSplit } from "../../../../ui/workbench/layoutBuilders";

/** Left column: Library → Model Outliner → Assets (user can reorder via workbench). */
export function createStudioLeftColumn(paneIdPrefix = ""): LayoutNode {
  const p = (suffix: string) => (paneIdPrefix.length > 0 ? `${paneIdPrefix}-${suffix}` : `pane-${suffix}`);
  return createSplit(
    createEditorPane("library", { id: p("library") }),
    createSplit(
      createEditorPane("model-outliner", { id: p("model-outliner") }),
      createEditorPane("assets", { id: p("assets") }),
      "vertical",
      0.58,
      paneIdPrefix.length > 0 ? `${paneIdPrefix}-left-lower` : "left-lower",
    ),
    "vertical",
    0.38,
    paneIdPrefix.length > 0 ? `${paneIdPrefix}-left-column` : "left-column",
  );
}

/** Default tiling: (Library / Outliner / Assets) | (Stage / Flow / Inspector). */
export const DEFAULT_STUDIO_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn(),
  createSplit(
    createSplit(
      createEditorPane("stage", { id: "pane-stage" }),
      createEditorPane("flow", { id: "pane-flow" }),
      "vertical",
      0.58,
      "center-column",
    ),
    createEditorPane("inspector", { id: "pane-inspector" }),
    "horizontal",
    0.74,
    "main",
  ),
  "horizontal",
  0.26,
  "root",
);
