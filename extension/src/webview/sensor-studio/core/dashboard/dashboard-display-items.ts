import type { DashboardSnapshotItemV1, DashboardSnapshotV1 } from "./dashboard-snapshot";

/** Resolve visible dashboard items (respects tab bar when active). */
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

export function dashboardSnapshotHasDisplayItems(snapshot: DashboardSnapshotV1): boolean {
  if (snapshot.tabs.length > 0) {
    return snapshot.tabs.some((tab) => tab.enabled && tab.items.length > 0);
  }
  return snapshot.items.length > 0;
}
