const DASHBOARD_EDIT_MODE_KEY = "ternion.sensor-studio.dashboard.editMode.v1";

export function readDashboardEditModeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(DASHBOARD_EDIT_MODE_KEY);
    if (raw === "0" || raw === "false") {
      return false;
    }
    if (raw === "1" || raw === "true") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function writeDashboardEditModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DASHBOARD_EDIT_MODE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

const DASHBOARD_ACTIVE_TAB_KEY = "ternion.sensor-studio.dashboard.activeTab.v1";

export function readDashboardActiveTabSourceNodeId(): string | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_ACTIVE_TAB_KEY);
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeDashboardActiveTabSourceNodeId(sourceNodeId: string | null): void {
  try {
    if (sourceNodeId == null || sourceNodeId.trim().length === 0) {
      localStorage.removeItem(DASHBOARD_ACTIVE_TAB_KEY);
      return;
    }
    localStorage.setItem(DASHBOARD_ACTIVE_TAB_KEY, sourceNodeId.trim());
  } catch {
    /* ignore */
  }
}
