/** Bump when required setup steps change — invalidates “setup complete” skip. */
export const STARTUP_CHECKLIST_VERSION = 2;

const COMPLETED_VERSION_KEY = "ternion.startupChecklist.completedVersion";
const SESSION_DISMISS_KEY = "ternion.startupChecklist.sessionDismissed";

export function readStartupChecklistCompletedVersion(): number {
  if (typeof localStorage === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem(COMPLETED_VERSION_KEY);
    const n = raw != null ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function writeStartupChecklistCompletedVersion(version: number): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(COMPLETED_VERSION_KEY, String(version));
  } catch {
    /* ignore */
  }
}

export function isStartupChecklistMarkedComplete(): boolean {
  return readStartupChecklistCompletedVersion() >= STARTUP_CHECKLIST_VERSION;
}

export function markStartupChecklistComplete(): void {
  writeStartupChecklistCompletedVersion(STARTUP_CHECKLIST_VERSION);
}

export function readStartupChecklistSessionDismissed(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeStartupChecklistSessionDismissed(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearStartupChecklistSessionDismissed(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(SESSION_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
