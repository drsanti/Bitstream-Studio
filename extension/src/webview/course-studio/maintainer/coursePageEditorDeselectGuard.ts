let suppressDeselectUntilMs = 0;

/** Briefly ignore content-grid background clicks that would clear block selection. */
export function suppressCoursePageGridDeselect(durationMs = 150): void {
  suppressDeselectUntilMs = Math.max(suppressDeselectUntilMs, Date.now() + durationMs);
}

export function isCoursePageGridDeselectSuppressed(): boolean {
  return Date.now() < suppressDeselectUntilMs;
}
