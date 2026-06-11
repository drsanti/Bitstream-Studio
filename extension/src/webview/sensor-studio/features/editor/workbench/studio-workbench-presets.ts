import type { LayoutNode } from "../../../../ui/workbench";
import { createEditorPane, createSplit } from "../../../../ui/workbench/layoutBuilders";
import {
  createStudioLeftColumn,
  DEFAULT_STUDIO_WORKBENCH_LAYOUT,
} from "./default-studio-workbench-layout";
import {
  STUDIO_TEACHING_TWIN_LAYOUT,
  STUDIO_TWIN_FOCUS_LAYOUT,
} from "./studio-workbench-layout-constants";
import type { WorkbenchLayoutPreset } from "../../../../ui/workbench/workbench-layout-library";

/** Wide flow canvas, compact library column, standard inspector stack. */
const STUDIO_GRAPH_FOCUS_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset"),
  createSplit(
    createEditorPane("flow", { id: "preset-flow" }),
    createEditorPane("inspector", { id: "preset-inspector" }),
    "vertical",
    0.82,
    "preset-main-column",
  ),
  "horizontal",
  0.14,
  "preset-graph-focus-root",
);

/** Larger inspector for node tuning sessions. */
const STUDIO_INSPECTOR_WIDE_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset-iw"),
  createSplit(
    createEditorPane("flow", { id: "preset-flow-iw" }),
    createEditorPane("inspector", { id: "preset-inspector-iw" }),
    "vertical",
    0.58,
    "preset-main-iw",
  ),
  "horizontal",
  0.22,
  "preset-inspector-wide-root",
);

/** Large Dashboard over a thin Flow strip (operator HMI focus). */
const STUDIO_DASHBOARD_FOCUS_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset-dash"),
  createSplit(
    createSplit(
      createEditorPane("dashboard", { id: "preset-dashboard-focus" }),
      createEditorPane("flow", { id: "preset-flow-dash" }),
      "vertical",
      0.78,
      "preset-center-dash",
    ),
    createEditorPane("inspector", { id: "preset-inspector-dash" }),
    "horizontal",
    0.8,
    "preset-main-dash",
  ),
  "horizontal",
  0.16,
  "preset-dashboard-focus-root",
);

/** Large Stage over a thin Flow strip (runtime preview focus). */
const STUDIO_STAGE_FOCUS_LAYOUT: LayoutNode = createSplit(
  createStudioLeftColumn("preset-stg"),
  createSplit(
    createSplit(
      createEditorPane("stage", { id: "preset-stage-focus" }),
      createEditorPane("flow", { id: "preset-flow-stg" }),
      "vertical",
      0.78,
      "preset-center-stg",
    ),
    createEditorPane("inspector", { id: "preset-inspector-stg" }),
    "horizontal",
    0.8,
    "preset-main-stg",
  ),
  "horizontal",
  0.16,
  "preset-stage-focus-root",
);

/** Full-screen Dashboard — operator HMI with no flow, library, or inspector chrome. */
const STUDIO_DASHBOARD_OPERATOR_LAYOUT: LayoutNode = createEditorPane("dashboard", {
  id: "preset-dashboard-operator",
});

/** Flow + inspector only — side catalog panes omitted from tree. */
const STUDIO_MINIMAL_LAYOUT: LayoutNode = createSplit(
  createEditorPane("flow", { id: "preset-flow-min" }),
  createEditorPane("inspector", { id: "preset-inspector-min" }),
  "horizontal",
  0.78,
  "preset-minimal-root",
);

export const STUDIO_WORKBENCH_PRESETS: readonly WorkbenchLayoutPreset[] = [
  {
    id: "default",
    label: "Studio default",
    description: "Library + assets | flow + inspector",
    layout: DEFAULT_STUDIO_WORKBENCH_LAYOUT,
  },
  {
    id: "graph-focus",
    label: "Graph focus",
    description: "Wide flow canvas, thin library column",
    layout: STUDIO_GRAPH_FOCUS_LAYOUT,
  },
  {
    id: "stage-focus",
    label: "Stage focus",
    description: "Large Stage viewport over Flow (Scene Output preview)",
    layout: STUDIO_STAGE_FOCUS_LAYOUT,
  },
  {
    id: "dashboard-focus",
    label: "Dashboard focus",
    description: "Large Dashboard pane over Flow (Dashboard Output HMI)",
    layout: STUDIO_DASHBOARD_FOCUS_LAYOUT,
  },
  {
    id: "twin-focus",
    label: "2D+3D focus",
    description: "Dashboard and Stage side by side with object outliner and flow strip",
    layout: STUDIO_TWIN_FOCUS_LAYOUT,
  },
  {
    id: "teaching-twin",
    label: "Teaching 2D+3D",
    description: "2D+3D desk with shared flow strip and a wide inspector",
    layout: STUDIO_TEACHING_TWIN_LAYOUT,
  },
  {
    id: "dashboard-operator",
    label: "Dashboard operator",
    description: "Full-screen Dashboard — no flow or library chrome",
    layout: STUDIO_DASHBOARD_OPERATOR_LAYOUT,
  },
  {
    id: "inspector-wide",
    label: "Inspector wide",
    description: "Taller inspector for node tuning",
    layout: STUDIO_INSPECTOR_WIDE_LAYOUT,
  },
  {
    id: "minimal",
    label: "Minimal chrome",
    description: "Flow and inspector only",
    layout: STUDIO_MINIMAL_LAYOUT,
  },
];

export function getStudioWorkbenchPreset(presetId: string): WorkbenchLayoutPreset | null {
  return STUDIO_WORKBENCH_PRESETS.find((row) => row.id === presetId) ?? null;
}
