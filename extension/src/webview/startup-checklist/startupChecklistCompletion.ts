import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";
import type { StartupChecklistStepView } from "./useStartupChecklist.js";

/** Step has finished its check (success, warning, or error — not still running or waiting). */
export function isStartupStepCheckSettled(status: ConnectionStepStatus): boolean {
  return status === "ok" || status === "fail" || status === "warn";
}

/** Real work still running for this step (tour waits past {@link STARTUP_STEP_MIN_VISIBLE_MS}). */
export function isStepOperationInProgress(status: ConnectionStepStatus): boolean {
  return status === "active" || status === "pending";
}

/** Expandable action panels (buttons, port list, etc.) — not shown when the check passed. */
export function shouldShowStartupStepActions(status: ConnectionStepStatus): boolean {
  return status === "fail" || status === "warn";
}

/** Every step in the list has a settled check result. */
export function areAllStartupStepsChecked(steps: StartupChecklistStepView[]): boolean {
  return steps.length > 0 && steps.every((s) => isStartupStepCheckSettled(s.status));
}

/**
 * Close is allowed after the sequential walkthrough has visited every step.
 * Live link state may still be pending, locked, or failed — operator can fix that later.
 */
export function canCloseSetupOverlay(
  steps: StartupChecklistStepView[],
  tour: { walkthroughComplete: boolean },
): boolean {
  return steps.length > 0 && tour.walkthroughComplete;
}

/** Every step reported success (auto-close only when all green). */
export function areAllStartupStepsPassed(steps: StartupChecklistStepView[]): boolean {
  return steps.length > 0 && steps.every((s) => s.status === "ok");
}

/**
 * Header recheck is operator-driven — hide during the guided walkthrough so it
 * does not restart checks or fight staged progress. Show after the tour finishes
 * or whenever the panel is in instant mode (Ctrl+/ manual open).
 */
export function shouldShowStartupRecheckButton(tour: {
  isSequentialActive: boolean;
  walkthroughComplete: boolean;
}): boolean {
  return !tour.isSequentialActive || tour.walkthroughComplete;
}
