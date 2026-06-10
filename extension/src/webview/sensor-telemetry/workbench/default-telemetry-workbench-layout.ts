/*******************************************************************************
 * File Name : default-telemetry-workbench-layout.ts
 *
 * Description : Default Sensor Telemetry workbench layout (user-resizable).
 *               Top: Sensor Config | Digital Twin | Telemetry Deck. Bottom: Activity Log.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 2.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LayoutNode } from "../../ui/workbench";

/** Top row: config ~32% · main ~38% · telemetry ~30% (nested horizontal splits). */
const TOP_ROW: LayoutNode = {
  id: "telemetry-top",
  type: "split",
  direction: "horizontal",
  ratio: 0.32,
  first: { id: "pane-config", type: "editor", editorType: "config" },
  second: {
    id: "telemetry-top-main-telemetry",
    type: "split",
    direction: "horizontal",
    ratio: 0.559,
    first: { id: "pane-main", type: "editor", editorType: "main" },
    second: { id: "pane-telemetry", type: "editor", editorType: "telemetry" },
  },
};

/** Vertical split: ~72% top row, ~28% activity log (resizable). */
export const DEFAULT_TELEMETRY_WORKBENCH_LAYOUT: LayoutNode = {
  id: "telemetry-root",
  type: "split",
  direction: "vertical",
  ratio: 0.72,
  first: TOP_ROW,
  second: { id: "pane-activity", type: "editor", editorType: "activity" },
};
