import type { LayoutNode } from "../../ui/workbench";
import { createEditorPane, createSplit } from "../../ui/workbench/layoutBuilders";

/** Content only — view mode / packaged VSIX. */
export const COURSE_VIEW_WORKBENCH_LAYOUT: LayoutNode = createEditorPane("content", {
  id: "pane-content-view",
});

/**
 * Maintainer author layout (v2): 2×2 editor grid + single inspector side panel.
 * Kept for layout migration fingerprinting only.
 */
export const V2_COURSE_AUTHOR_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createSplit(
    createSplit(
      createEditorPane("content", { id: "pane-content" }),
      createEditorPane("diagram", { id: "pane-diagram" }),
      "horizontal",
      0.5,
      "editors-top-row",
    ),
    createSplit(
      createEditorPane("markdown", { id: "pane-markdown" }),
      createEditorPane("scene-3d", { id: "pane-scene-3d" }),
      "horizontal",
      0.5,
      "editors-bottom-row",
    ),
    "vertical",
    0.52,
    "editors-quadrant",
  ),
  createEditorPane("inspector", { id: "pane-inspector" }),
  "horizontal",
  0.76,
  "course-root",
);

/**
 * Maintainer author layout (v3): 2×2 editor grid + dual inspector column (deprecated).
 * Kept for layout migration fingerprinting only.
 */
export const V3_COURSE_AUTHOR_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createSplit(
    createSplit(
      createEditorPane("content", { id: "pane-content" }),
      createEditorPane("diagram", { id: "pane-diagram" }),
      "horizontal",
      0.5,
      "editors-top-row",
    ),
    createSplit(
      createEditorPane("markdown", { id: "pane-markdown" }),
      createEditorPane("scene-3d", { id: "pane-scene-3d" }),
      "horizontal",
      0.5,
      "editors-bottom-row",
    ),
    "vertical",
    0.52,
    "editors-quadrant",
  ),
  createSplit(
    createEditorPane("inspector", { id: "pane-inspector" }),
    createEditorPane("block-inspector", { id: "pane-block-inspector" }),
    "vertical",
    0.38,
    "inspector-column",
  ),
  "horizontal",
  0.76,
  "course-root",
);

/**
 * Maintainer author layout (v5): course outline + 2×2 editor grid + inspector.
 * Kept for layout migration fingerprinting only.
 */
export const V5_COURSE_AUTHOR_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createEditorPane("outline", { id: "pane-outline" }),
  createSplit(
    createSplit(
      createSplit(
        createEditorPane("content", { id: "pane-content" }),
        createEditorPane("diagram", { id: "pane-diagram" }),
        "horizontal",
        0.5,
        "editors-top-row",
      ),
      createSplit(
        createEditorPane("markdown", { id: "pane-markdown" }),
        createEditorPane("scene-3d", { id: "pane-scene-3d" }),
        "horizontal",
        0.5,
        "editors-bottom-row",
      ),
      "vertical",
      0.52,
      "editors-quadrant",
    ),
    createEditorPane("inspector", { id: "pane-inspector" }),
    "horizontal",
    0.76,
    "course-root-inner",
  ),
  "horizontal",
  0.17,
  "course-root",
);

/**
 * Maintainer author layout (v6): outline + editor grid with HTML Editor pane + inspector.
 */
export const V6_COURSE_AUTHOR_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createEditorPane("outline", { id: "pane-outline" }),
  createSplit(
    createSplit(
      createSplit(
        createEditorPane("content", { id: "pane-content" }),
        createEditorPane("diagram", { id: "pane-diagram" }),
        "horizontal",
        0.5,
        "editors-top-row",
      ),
      createSplit(
        createEditorPane("markdown", { id: "pane-markdown" }),
        createSplit(
          createEditorPane("html-page", { id: "pane-html-page" }),
          createEditorPane("scene-3d", { id: "pane-scene-3d" }),
          "horizontal",
          0.5,
          "editors-bottom-right",
        ),
        "horizontal",
        0.34,
        "editors-bottom-row",
      ),
      "vertical",
      0.52,
      "editors-quadrant",
    ),
    createEditorPane("inspector", { id: "pane-inspector" }),
    "horizontal",
    0.76,
    "course-root-inner",
  ),
  "horizontal",
  0.17,
  "course-root",
);

/** v4 default: 2×2 editor grid + single contextual Inspector side panel. */
export const V4_COURSE_AUTHOR_WORKBENCH_LAYOUT = V2_COURSE_AUTHOR_WORKBENCH_LAYOUT;

/** v6 default: outline tree + editor grid including HTML Editor pane. */
export const DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT = V6_COURSE_AUTHOR_WORKBENCH_LAYOUT;

/** v1 author layout: Content | (Inspector | Diagram / Markdown / 3D Scene). */
export const LEGACY_COURSE_AUTHOR_WORKBENCH_LAYOUT: LayoutNode = createSplit(
  createEditorPane("content", { id: "pane-content" }),
  createSplit(
    createEditorPane("inspector", { id: "pane-inspector" }),
    createSplit(
      createEditorPane("diagram", { id: "pane-diagram" }),
      createSplit(
        createEditorPane("markdown", { id: "pane-markdown" }),
        createEditorPane("scene-3d", { id: "pane-scene-3d" }),
        "horizontal",
        0.5,
        "editors-markdown-scene",
      ),
      "vertical",
      0.56,
      "editors-stack",
    ),
    "horizontal",
    0.32,
    "right-column",
  ),
  "horizontal",
  0.58,
  "course-root",
);

export const DEFAULT_COURSE_WORKBENCH_LAYOUT = DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT;
