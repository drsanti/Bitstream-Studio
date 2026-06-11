const PREFIX = "ternion.sensor-studio.dashboardInspector.";

const ACTIVE_TAB_KEY = `${PREFIX}activeTab.v1`;

/** Two-tab dashboard inspector: widgets (operator + list + controls) and layout. */
export type DashboardInspectorTab = "widgets" | "layout";

const LEGACY_WIDGET_TABS = new Set(["overview", "widgets", "controls"]);

export function normalizeDashboardInspectorTab(value: unknown): DashboardInspectorTab {
  if (value === "layout") {
    return "layout";
  }
  if (value === "widgets" || LEGACY_WIDGET_TABS.has(String(value))) {
    return "widgets";
  }
  return "widgets";
}

export function readStoredDashboardInspectorTab(): DashboardInspectorTab {
  try {
    const raw = localStorage.getItem(ACTIVE_TAB_KEY);
    if (raw != null) {
      return normalizeDashboardInspectorTab(raw);
    }
  } catch {
    /* ignore */
  }
  return "widgets";
}

export function writeStoredDashboardInspectorTab(tab: DashboardInspectorTab): void {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}
