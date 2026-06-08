/** Stage workbench authoring vs runtime preview (SE2+). */
export type StageWorkbenchMode = "edit" | "simulate";

export type TickSimulationOptions = {
  /** When true, refresh Stage snapshot even in Edit mode (graph mutations, mode switch). */
  forceStageSnapshot?: boolean;
};

export function isStageEditMode(mode: StageWorkbenchMode): boolean {
  return mode === "edit";
}

export function isStageSimulateMode(mode: StageWorkbenchMode): boolean {
  return mode === "simulate";
}

/**
 * Whether `tickSimulation` should write a new **Stage** snapshot.
 * Edit mode freezes passive telemetry ticks; explicit graph flushes pass `forceStageSnapshot`.
 * **Dashboard** snapshot eval is unaffected — live widget values keep updating in Dashboard Edit mode.
 */
export function shouldRefreshStageSnapshotAfterTick(args: {
  workbenchMode: StageWorkbenchMode;
  forceStageSnapshot?: boolean;
  snapshotHasSceneOutput: boolean;
}): boolean {
  if (args.forceStageSnapshot === true) {
    return true;
  }
  if (!isStageEditMode(args.workbenchMode)) {
    return true;
  }
  return !args.snapshotHasSceneOutput;
}
