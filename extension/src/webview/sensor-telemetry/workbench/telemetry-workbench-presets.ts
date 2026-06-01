import type { LayoutNode } from "../../ui/workbench";
import { createEditorPane, createSplit } from "../../ui/workbench/layoutBuilders";
import { DEFAULT_TELEMETRY_WORKBENCH_LAYOUT } from "./default-telemetry-workbench-layout";
import type { WorkbenchLayoutPreset } from "../../ui/workbench/workbench-layout-library";

/** Large telemetry deck, compact config column. */
const TELEMETRY_DECK_FOCUS_LAYOUT: LayoutNode = createSplit(
  createSplit(
    createEditorPane("config", { id: "preset-config-df" }),
    createSplit(
      createEditorPane("main", { id: "preset-main-df" }),
      createEditorPane("telemetry", { id: "preset-telemetry-df" }),
      "horizontal",
      0.38,
      "preset-main-telemetry-df",
    ),
    "horizontal",
    0.22,
    "preset-top-df",
  ),
  createEditorPane("activity", { id: "preset-activity-df" }),
  "vertical",
  0.78,
  "preset-deck-focus-root",
);

/** Config + 3D orientation emphasized for hardware bring-up. */
const TELEMETRY_BRING_UP_LAYOUT: LayoutNode = createSplit(
  createSplit(
    createSplit(
      createEditorPane("config", { id: "preset-config-bu" }),
      createEditorPane("main", { id: "preset-main-bu" }),
      "horizontal",
      0.42,
      "preset-config-main-bu",
    ),
    createEditorPane("telemetry", { id: "preset-telemetry-bu" }),
    "horizontal",
    0.68,
    "preset-top-bu",
  ),
  createEditorPane("activity", { id: "preset-activity-bu" }),
  "vertical",
  0.8,
  "preset-bring-up-root",
);

export const TELEMETRY_WORKBENCH_PRESETS: readonly WorkbenchLayoutPreset[] = [
  {
    id: "default",
    label: "Telemetry default",
    description: "Config · 3D · deck over activity log",
    layout: DEFAULT_TELEMETRY_WORKBENCH_LAYOUT,
  },
  {
    id: "deck-focus",
    label: "Deck focus",
    description: "Large telemetry deck, compact config",
    layout: TELEMETRY_DECK_FOCUS_LAYOUT,
  },
  {
    id: "bring-up",
    label: "Hardware bring-up",
    description: "Config + 3D orientation emphasized",
    layout: TELEMETRY_BRING_UP_LAYOUT,
  },
];

export function getTelemetryWorkbenchPreset(presetId: string): WorkbenchLayoutPreset | null {
  return TELEMETRY_WORKBENCH_PRESETS.find((row) => row.id === presetId) ?? null;
}
