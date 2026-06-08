const PREFIX = "ternion.sensor-studio.dashboardInspector.";

const ACTIVE_TAB_KEY = `${PREFIX}activeTab.v1`;

export type DashboardInspectorTab = "overview" | "widgets" | "controls" | "layout";

export function readStoredDashboardInspectorTab(): DashboardInspectorTab {
  try {
    const raw = localStorage.getItem(ACTIVE_TAB_KEY);
    if (raw === "overview" || raw === "widgets" || raw === "controls" || raw === "layout") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "overview";
}

export function writeStoredDashboardInspectorTab(tab: DashboardInspectorTab): void {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}
