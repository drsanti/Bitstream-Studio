import type {
  DashboardSnapshotItemV1,
  DashboardSnapshotV1,
  DashboardWidgetEntryV1,
} from "./dashboard-snapshot";

function widgetLiveEqual(
  a: DashboardWidgetEntryV1,
  b: DashboardWidgetEntryV1,
): boolean {
  if (a.sourceNodeId !== b.sourceNodeId) {
    return false;
  }
  if (a.liveValue !== b.liveValue) {
    return false;
  }
  if (a.sensorHealth !== b.sensorHealth) {
    return false;
  }
  if (a.enabled !== b.enabled) {
    return false;
  }
  const histA = a.liveHistory;
  const histB = b.liveHistory;
  if (histA === histB) {
    return true;
  }
  if (histA == null || histB == null) {
    return histA === histB;
  }
  if (histA.length !== histB.length) {
    return false;
  }
  for (let i = 0; i < histA.length; i += 1) {
    if (histA[i] !== histB[i]) {
      return false;
    }
  }
  return true;
}

function flattenWidgetEntries(
  items: readonly DashboardSnapshotItemV1[],
): DashboardWidgetEntryV1[] {
  const out: DashboardWidgetEntryV1[] = [];
  for (const item of items) {
    if (item.kind === "widget") {
      out.push(item.widget);
      continue;
    }
    out.push(...item.group.children);
  }
  return out;
}

/**
 * Compare only live telemetry fields — layout/theme/structure changes always refresh.
 */
export function areDashboardLiveSnapshotsEqual(
  prev: DashboardSnapshotV1,
  next: DashboardSnapshotV1,
): boolean {
  if (prev.dashboardOutputNodeId !== next.dashboardOutputNodeId) {
    return false;
  }
  if (prev.tabs.length !== next.tabs.length) {
    return false;
  }
  if (prev.items.length !== next.items.length) {
    return false;
  }

  const prevWidgets = [
    ...flattenWidgetEntries(prev.items),
    ...prev.tabs.flatMap((tab) => flattenWidgetEntries(tab.items)),
  ];
  const nextWidgets = [
    ...flattenWidgetEntries(next.items),
    ...next.tabs.flatMap((tab) => flattenWidgetEntries(tab.items)),
  ];
  if (prevWidgets.length !== nextWidgets.length) {
    return false;
  }

  const nextBySource = new Map(
    nextWidgets.map((widget) => [widget.sourceNodeId, widget]),
  );
  for (const widget of prevWidgets) {
    const other = nextBySource.get(widget.sourceNodeId);
    if (other == null || !widgetLiveEqual(widget, other)) {
      return false;
    }
  }
  return true;
}
