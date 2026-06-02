/** Minimum time each step stays focused (visible “checking” beat) before advancing. */
export const STARTUP_STEP_MIN_DWELL_MS = 400;

/** Fade/slide-in before dwell. */
export const STARTUP_STEP_ENTER_MS = 220;

/** Success transition before advancing to the next step. */
export const STARTUP_STEP_COMPLETE_MS = 280;

/** Gap between steps (artificial pacing when backend is fast). */
export const STARTUP_STEP_GAP_MS = 280;

/** Cap sequential walkthrough; then show truth immediately. */
export const STARTUP_MAX_ORCHESTRATION_MS = 12_000;
