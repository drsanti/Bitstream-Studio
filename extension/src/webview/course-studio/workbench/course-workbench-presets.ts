import type { LayoutNode } from "../../ui/workbench";
import { createEditorPane, createSplit } from "../../ui/workbench/layoutBuilders";
import type { WorkbenchLayoutPreset } from "../../ui/workbench/workbench-layout-library";
import {
  COURSE_VIEW_WORKBENCH_LAYOUT,
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "./default-course-workbench-layout";

const COURSE_DIAGRAM_FOCUS_LAYOUT: LayoutNode = createSplit(
  createEditorPane("content", { id: "preset-content-df" }),
  createSplit(
    createEditorPane("inspector", { id: "preset-inspector-df" }),
    createSplit(
      createEditorPane("diagram", { id: "preset-diagram-df" }),
      createSplit(
        createEditorPane("markdown", { id: "preset-markdown-df" }),
        createEditorPane("scene-3d", { id: "preset-scene-df" }),
        "horizontal",
        0.5,
        "preset-md-scene",
      ),
      "vertical",
      0.72,
      "preset-editors",
    ),
    "horizontal",
    0.22,
    "preset-right",
  ),
  "horizontal",
  0.42,
  "preset-diagram-focus-root",
);

export const COURSE_WORKBENCH_PRESETS: readonly WorkbenchLayoutPreset[] = [
  {
    id: "course-author",
    label: "Author (all panes)",
    description:
      "2×2 editor grid (Page Editor, Diagram Editor, Markdown, 3D) with contextual Inspector on the right.",
    layout: DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
  },
  {
    id: "course-view",
    label: "View (content only)",
    description: "Full-width page preview without editor panes.",
    layout: COURSE_VIEW_WORKBENCH_LAYOUT,
  },
  {
    id: "course-diagram-focus",
    label: "Diagram Editor focus",
    description: "Larger Diagram Editor / infographics column.",
    layout: COURSE_DIAGRAM_FOCUS_LAYOUT,
  },
];

export function getCourseWorkbenchPreset(presetId: string): WorkbenchLayoutPreset | null {
  return COURSE_WORKBENCH_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
