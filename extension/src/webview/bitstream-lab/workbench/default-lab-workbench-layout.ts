/*******************************************************************************
 * File Name : default-lab-workbench-layout.ts
 *
 * Description : Default StandaloneWorkbench layout for Bitstream Lab (Phase 0/1).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LayoutNode } from "../../ui/workbench";

/** Tap (left) | serial + bs2 + activity (right stack) — firmware bring-up default. */
export const DEFAULT_LAB_WORKBENCH_LAYOUT: LayoutNode = {
  id: "lab-root",
  type: "split",
  direction: "horizontal",
  ratio: 0.38,
  first: { id: "pane-tap", type: "editor", editorType: "tap" },
  second: {
    id: "lab-right",
    type: "split",
    direction: "vertical",
    ratio: 0.34,
    first: { id: "pane-serial", type: "editor", editorType: "serial" },
    second: {
      id: "lab-right-mid",
      type: "split",
      direction: "vertical",
      ratio: 0.5,
      first: { id: "pane-bs2", type: "editor", editorType: "bs2" },
      second: { id: "pane-activity", type: "editor", editorType: "activity" },
    },
  },
};
