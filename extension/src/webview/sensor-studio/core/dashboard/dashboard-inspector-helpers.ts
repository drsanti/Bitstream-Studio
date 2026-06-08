import type {
  DashboardGroupEntryV1,
  DashboardSnapshotItemV1,
  DashboardSnapshotV1,
  DashboardWidgetEntryV1,
  DashboardWidgetKindV1,
} from "./dashboard-snapshot";

export const DASHBOARD_CONTROL_WIDGET_KINDS: ReadonlySet<DashboardWidgetKindV1> = new Set([
  "button",
  "switch",
  "slider",
  "knob",
]);

export const DASHBOARD_DISPLAY_WIDGET_KINDS: ReadonlySet<DashboardWidgetKindV1> = new Set([
  "led",
  "text",
  "gauge",
  "bar",
  "status",
  "sparkline",
  "plotter",
]);

export type DashboardInspectorWidgetRow = {
  widget: DashboardWidgetEntryV1;
  group: DashboardGroupEntryV1 | null;
};

export type DashboardInspectorInventoryV1 = {
  controlCount: number;
  displayCount: number;
  groupCount: number;
  topLevelWidgetCount: number;
  publishedCount: number;
};

export function resolveDashboardDisplayItems(args: {
  snapshot: DashboardSnapshotV1;
  activeTabSourceNodeId: string | null;
}): DashboardSnapshotItemV1[] {
  const { snapshot, activeTabSourceNodeId } = args;
  const tabs = snapshot.tabs;
  if (tabs.length === 0) {
    return snapshot.items;
  }
  const enabledTabs = tabs.filter((tab) => tab.enabled);
  const active =
    enabledTabs.find((tab) => tab.sourceNodeId === activeTabSourceNodeId) ?? enabledTabs[0];
  return active?.items ?? [];
}

export function flattenDashboardInspectorWidgets(
  items: readonly DashboardSnapshotItemV1[],
): DashboardInspectorWidgetRow[] {
  const rows: DashboardInspectorWidgetRow[] = [];
  for (const item of items) {
    if (item.kind === "group") {
      for (const child of item.group.children) {
        rows.push({ widget: child, group: item.group });
      }
      continue;
    }
    rows.push({ widget: item.widget, group: null });
  }
  return rows;
}

export function summarizeDashboardInspectorInventory(
  items: readonly DashboardSnapshotItemV1[],
): DashboardInspectorInventoryV1 {
  let controlCount = 0;
  let displayCount = 0;
  let groupCount = 0;
  let topLevelWidgetCount = 0;
  let publishedCount = 0;

  for (const item of items) {
    if (item.kind === "group") {
      groupCount += 1;
      for (const child of item.group.children) {
        if (DASHBOARD_CONTROL_WIDGET_KINDS.has(child.widgetKind)) {
          controlCount += 1;
        } else {
          displayCount += 1;
        }
        if (!child.catalogNodeId.startsWith("dashboard-")) {
          publishedCount += 1;
        }
      }
      continue;
    }
    topLevelWidgetCount += 1;
    if (DASHBOARD_CONTROL_WIDGET_KINDS.has(item.widget.widgetKind)) {
      controlCount += 1;
    } else {
      displayCount += 1;
    }
    if (!item.widget.catalogNodeId.startsWith("dashboard-")) {
      publishedCount += 1;
    }
  }

  return {
    controlCount,
    displayCount,
    groupCount,
    topLevelWidgetCount,
    publishedCount,
  };
}

export function dashboardWidgetKindLabel(kind: DashboardWidgetKindV1): string {
  switch (kind) {
    case "button":
      return "Button";
    case "led":
      return "LED";
    case "text":
      return "Text";
    case "gauge":
      return "Gauge";
    case "bar":
      return "Bar";
    case "knob":
      return "Knob";
    case "switch":
      return "Switch";
    case "slider":
      return "Slider";
    case "status":
      return "Status";
    case "sparkline":
      return "Sparkline";
    case "plotter":
      return "Plotter";
    default:
      return kind;
  }
}

export function formatDashboardPlacementSummary(widget: DashboardWidgetEntryV1): string {
  const { column, row, columnSpan, rowSpan } = widget.placement;
  return `col ${column}, row ${row} · ${columnSpan}×${rowSpan}`;
}

/** Warnings for the active dashboard page (tab-scoped + global). */
export function resolveDashboardLayoutWarningsForPage(args: {
  snapshot: DashboardSnapshotV1;
  activeTabSourceNodeId: string | null;
}): string[] {
  const { snapshot, activeTabSourceNodeId } = args;
  const { layoutWarnings, tabs } = snapshot;
  if (tabs.length === 0) {
    return [...layoutWarnings];
  }

  const enabledTabs = tabs.filter((tab) => tab.enabled);
  const activeTab =
    enabledTabs.find((tab) => tab.sourceNodeId === activeTabSourceNodeId) ?? enabledTabs[0];
  const global = layoutWarnings.filter((warning) => !warning.startsWith('Tab "'));
  if (activeTab == null) {
    return global;
  }

  const prefix = `Tab "${activeTab.label}": `;
  const pageWarnings = layoutWarnings
    .filter((warning) => warning.startsWith(prefix))
    .map((warning) => warning.slice(prefix.length));

  return [...global, ...pageWarnings];
}

export function dashboardEnabledTabSelectOptions(
  tabs: DashboardSnapshotV1["tabs"],
): Array<{ value: string; label: string }> {
  return tabs
    .filter((tab) => tab.enabled)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((tab) => ({
      value: tab.sourceNodeId,
      label: tab.label,
    }));
}
