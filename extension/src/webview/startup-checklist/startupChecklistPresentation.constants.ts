/** Minimum time a step stays focused before advancing when truth is already ok. */
export const STARTUP_STEP_MIN_DWELL_MS = 450;

/** Shorter dwell when truth settled before this step was revealed. */
export const STARTUP_STEP_CATCH_UP_DWELL_MS = 180;

/** Fade/slide-in before dwell. */
export const STARTUP_STEP_ENTER_MS = 280;

/** Success transition before advancing to the next step. */
export const STARTUP_STEP_COMPLETE_MS = 320;

/** Gap between steps. */
export const STARTUP_STEP_GAP_MS = 120;

/** Cap sequential walkthrough; then show truth immediately. */
export const STARTUP_MAX_ORCHESTRATION_MS = 12_000;
