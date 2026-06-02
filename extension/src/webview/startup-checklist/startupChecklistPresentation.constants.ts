/** Minimum time each step stays focused (ms) — UI floor even when checks finish instantly. */
export const STARTUP_STEP_MIN_VISIBLE_MS = 250;

/** Brief pause after a step’s check settles, before the next card (ms). */
export const STARTUP_STEP_PADDING_AFTER_MS = 250;

/** Poll interval while waiting for a step’s real check to finish (ms). */
export const STARTUP_STEP_POLL_MS = 50;

/** Safety cap per step if status stays active/pending (ms). */
export const STARTUP_STEP_MAX_OPERATION_MS = 30_000;
