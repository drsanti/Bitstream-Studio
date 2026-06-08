import type { StageWorkbenchMode } from "../../core/stage/stage-workbench-mode";

const KEY = "ternion.sensor-studio.stage.workbenchMode.v1";

export function readStoredStageWorkbenchMode(): StageWorkbenchMode {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === "simulate" ? "simulate" : "edit";
  } catch {
    return "edit";
  }
}

export function writeStoredStageWorkbenchMode(mode: StageWorkbenchMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}
