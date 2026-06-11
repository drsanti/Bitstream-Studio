export type DashboardDisplayTarget = "pane" | "stage-hud";

const DASHBOARD_EDIT_MODE_KEY = "ternion.sensor-studio.dashboard.editMode.v1";
const DASHBOARD_DISPLAY_TARGET_KEY = "ternion.sensor-studio.dashboard.displayTarget.v1";

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

const DASHBOARD_HIGHLIGHTED_WIDGET_KEY = "ternion.sensor-studio.dashboard.highlightedWidget.v1";
const DASHBOARD_HIGHLIGHTED_WIDGETS_KEY = "ternion.sensor-studio.dashboard.highlightedWidgets.v2";

export function readDashboardHighlightedWidgetSourceNodeId(): string | null {
  const ids = readDashboardHighlightedWidgetSourceNodeIds();
  return ids.length > 0 ? ids[ids.length - 1]! : null;
}

export function readDashboardHighlightedWidgetSourceNodeIds(): string[] {
  try {
    const rawV2 = localStorage.getItem(DASHBOARD_HIGHLIGHTED_WIDGETS_KEY);
    if (typeof rawV2 === "string" && rawV2.trim().length > 0) {
      const parsed = JSON.parse(rawV2) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
      }
    }
    const rawV1 = localStorage.getItem(DASHBOARD_HIGHLIGHTED_WIDGET_KEY);
    if (typeof rawV1 === "string" && rawV1.trim().length > 0) {
      return [rawV1.trim()];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function readDashboardDisplayTarget(): DashboardDisplayTarget {
  try {
    const raw = localStorage.getItem(DASHBOARD_DISPLAY_TARGET_KEY);
    if (raw === "stage-hud") {
      return "stage-hud";
    }
  } catch {
    /* ignore */
  }
  return "pane";
}

export function writeDashboardDisplayTarget(target: DashboardDisplayTarget): void {
  try {
    localStorage.setItem(DASHBOARD_DISPLAY_TARGET_KEY, target);
  } catch {
    /* ignore */
  }
}

export function writeDashboardHighlightedWidgetSourceNodeId(sourceNodeId: string | null): void {
  writeDashboardHighlightedWidgetSourceNodeIds(sourceNodeId == null ? [] : [sourceNodeId]);
}

export function writeDashboardHighlightedWidgetSourceNodeIds(sourceNodeIds: string[]): void {
  try {
    const unique = [...new Set(sourceNodeIds.filter((id) => id.trim().length > 0))];
    if (unique.length === 0) {
      localStorage.removeItem(DASHBOARD_HIGHLIGHTED_WIDGETS_KEY);
      localStorage.removeItem(DASHBOARD_HIGHLIGHTED_WIDGET_KEY);
      return;
    }
    localStorage.setItem(DASHBOARD_HIGHLIGHTED_WIDGETS_KEY, JSON.stringify(unique));
    localStorage.setItem(
      DASHBOARD_HIGHLIGHTED_WIDGET_KEY,
      unique[unique.length - 1]!.trim(),
    );
  } catch {
    /* ignore */
  }
}
