import type { DashboardWidgetKindV1 } from "./dashboard-snapshot";

/** Flow catalog nodes that can appear on Dashboard without a Widget wire. */
export const DASHBOARD_PUBLISHABLE_CATALOG_IDS = [
  "radial-gauge",
  "bar-meter",
  "led-indicator",
  "numeric-display",
  "knob",
  "sparkline",
  "plotter",
  "compare",
  "indicator",
  "threshold",
] as const;

/** Legacy graph node id — treated as plotter for publish. */
export const DASHBOARD_PUBLISHABLE_PLOTTER_ALIASES = ["oscilloscope"] as const;

export type DashboardPublishableCatalogId = (typeof DASHBOARD_PUBLISHABLE_CATALOG_IDS)[number];

const PUBLISH_KIND_BY_CATALOG_ID: Readonly<Record<DashboardPublishableCatalogId, DashboardWidgetKindV1>> =
  {
    "radial-gauge": "gauge",
    "bar-meter": "bar",
    "led-indicator": "led",
    "numeric-display": "text",
    "knob": "knob",
    "sparkline": "sparkline",
    "plotter": "plotter",
    compare: "status",
    indicator: "status",
    threshold: "status",
  };

const PUBLISH_KIND_BY_ALIAS: Readonly<Record<string, DashboardWidgetKindV1>> = {
  oscilloscope: "plotter",
};

export function isDashboardPublishableCatalogId(
  nodeId: string,
): nodeId is DashboardPublishableCatalogId {
  return (DASHBOARD_PUBLISHABLE_CATALOG_IDS as readonly string[]).includes(nodeId);
}

export function dashboardWidgetKindFromPublishableCatalogId(
  nodeId: string,
): DashboardWidgetKindV1 | null {
  if (isDashboardPublishableCatalogId(nodeId)) {
    return PUBLISH_KIND_BY_CATALOG_ID[nodeId];
  }
  return PUBLISH_KIND_BY_ALIAS[nodeId] ?? null;
}

export function isDashboardPublishableFlowNodeId(nodeId: string): boolean {
  return dashboardWidgetKindFromPublishableCatalogId(nodeId) != null;
}

export function readPublishToDashboardFlag(defaultConfig: Record<string, unknown>): boolean {
  return defaultConfig.publishToDashboard === true;
}

/** Flow node id of a wired `dashboard-group`, or empty for top-level publish. */
export function readDashboardPublishGroupId(defaultConfig: Record<string, unknown>): string {
  const raw = defaultConfig.dashboardGroupId;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
}

/** Flow node id of a wired `dashboard-tab`, or empty for top-level / legacy single-page. */
export function readDashboardPublishTabId(defaultConfig: Record<string, unknown>): string {
  const raw = defaultConfig.dashboardTabId;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
}
