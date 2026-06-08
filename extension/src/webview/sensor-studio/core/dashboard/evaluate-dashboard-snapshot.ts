import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import {
  STUDIO_HANDLE_TAB,
  STUDIO_HANDLE_TABS,
  STUDIO_HANDLE_THEME,
  STUDIO_HANDLE_WIDGET,
  STUDIO_HANDLE_WIDGETS,
} from "../../features/editor/studio-handle-ids";
import { flowValueAsDashboardTheme } from "../../features/editor/nodes/dashboard/flow-wire-dashboard-theme";
import { coerceDashboardFlexPlacementV1 } from "./dashboard-flex-placement";
import { coerceDashboardGroupLayoutV1 } from "./dashboard-group-layout";
import { coerceDashboardLayoutV1 } from "./dashboard-layout";
import {
  coerceDashboardPlacementV1,
  dashboardPlacementCellKeys,
} from "./dashboard-placement";
import { PLOTTER_INPUT_IDS } from "../../features/editor/nodes/plotter/plotter-config";
import {
  dashboardWidgetKindFromPublishableCatalogId,
  readDashboardPublishGroupId,
  readDashboardPublishTabId,
  readPublishToDashboardFlag,
} from "./dashboard-publish";
import { coerceDashboardThemeV1 } from "./dashboard-theme";
import type {
  DashboardGroupEntryV1,
  DashboardSnapshotItemV1,
  DashboardSnapshotV1,
  DashboardTabEntryV1,
  DashboardWidgetEntryV1,
  DashboardWidgetKindV1,
} from "./dashboard-snapshot";
import { EMPTY_DASHBOARD_SNAPSHOT } from "./dashboard-snapshot";

export const DASHBOARD_OUTPUT_NODE_ID = "dashboard-output";
export const DASHBOARD_GROUP_NODE_ID = "dashboard-group";
export const DASHBOARD_TAB_NODE_ID = "dashboard-tab";

type DashboardPublishTargetContext = {
  tabId: string;
  groupId: string;
  tabsActive: boolean;
};

function matchesPublishTarget(
  defaultConfig: Record<string, unknown>,
  context: DashboardPublishTargetContext,
): boolean {
  const groupId = readDashboardPublishGroupId(defaultConfig);
  const tabId = readDashboardPublishTabId(defaultConfig);
  if (groupId !== context.groupId) {
    return false;
  }
  if (context.groupId.length > 0) {
    return true;
  }
  if (!context.tabsActive) {
    return tabId.length === 0;
  }
  return tabId === context.tabId;
}

const DASHBOARD_WIDGET_NODE_IDS: ReadonlySet<string> = new Set([
  "dashboard-button",
  "dashboard-led",
  "dashboard-text",
  "dashboard-gauge",
  "dashboard-knob",
  "dashboard-switch",
  "dashboard-slider",
  "dashboard-status",
]);

function widgetKindFromNodeId(nodeId: string): DashboardWidgetKindV1 | null {
  if (nodeId === "dashboard-button") {
    return "button";
  }
  if (nodeId === "dashboard-led") {
    return "led";
  }
  if (nodeId === "dashboard-text") {
    return "text";
  }
  if (nodeId === "dashboard-gauge") {
    return "gauge";
  }
  if (nodeId === "dashboard-knob") {
    return "knob";
  }
  if (nodeId === "dashboard-switch") {
    return "switch";
  }
  if (nodeId === "dashboard-slider") {
    return "slider";
  }
  if (nodeId === "dashboard-status") {
    return "status";
  }
  return null;
}

function readWidgetLabel(node: FlowGraphNode): string {
  if (typeof node.data.label === "string" && node.data.label.trim().length > 0) {
    return node.data.label.trim();
  }
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const cfgLabel = dc.label ?? dc.title;
  if (typeof cfgLabel === "string" && cfgLabel.trim().length > 0) {
    return cfgLabel.trim();
  }
  return node.data.nodeId;
}

function readLiveValue(node: FlowGraphNode): number | boolean | string | null {
  const live = node.data.liveValue;
  if (typeof live === "number" && Number.isFinite(live)) {
    return live;
  }
  if (typeof live === "boolean" || typeof live === "string") {
    return live;
  }
  const dc = node.data.defaultConfig as Record<string, unknown>;
  if (
    node.data.nodeId === "dashboard-knob" ||
    node.data.nodeId === "dashboard-slider" ||
    node.data.nodeId === "knob"
  ) {
    const raw = dc.value;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }
  }
  if (node.data.nodeId === "dashboard-switch" || node.data.nodeId === "dashboard-status") {
    const raw = dc.value;
    if (typeof raw === "boolean") {
      return raw;
    }
  }
  if (
    node.data.nodeId === "compare" ||
    node.data.nodeId === "indicator" ||
    node.data.nodeId === "threshold"
  ) {
    const live = node.data.liveValue;
    if (typeof live === "boolean") {
      return live;
    }
  }
  return null;
}

function readLiveHistory(node: FlowGraphNode): readonly number[] | undefined {
  const raw = node.data.liveHistory;
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const values = raw.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return values.length > 0 ? values : undefined;
}

function readLivePlotHistory(
  node: FlowGraphNode,
): Readonly<Record<string, readonly number[]>> | undefined {
  const raw = node.data.livePlotHistory;
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const out: Record<string, readonly number[]> = {};
  for (const [key, series] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(series)) {
      continue;
    }
    const values = series.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (values.length > 0) {
      out[key] = values;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function readPlotterChannelOrder(node: FlowGraphNode): readonly string[] {
  const handles = node.data.inputHandles;
  if (Array.isArray(handles) && handles.length > 0) {
    return handles.map((h) => h.id);
  }
  return PLOTTER_INPUT_IDS;
}

function buildWidgetEntryFromKind(
  node: FlowGraphNode,
  widgetKind: DashboardWidgetKindV1,
): DashboardWidgetEntryV1 {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const liveHistory = readLiveHistory(node);
  const livePlotHistory = readLivePlotHistory(node);
  return {
    widgetKind,
    sourceNodeId: node.id,
    catalogNodeId: node.data.nodeId,
    label: readWidgetLabel(node),
    placement: coerceDashboardPlacementV1(dc.placement),
    flexPlacement: coerceDashboardFlexPlacementV1(dc.flex),
    style: { ...dc },
    liveValue: readLiveValue(node),
    ...(liveHistory != null ? { liveHistory } : {}),
    ...(livePlotHistory != null ? { livePlotHistory } : {}),
    ...(widgetKind === "plotter" ? { plotterChannelOrder: readPlotterChannelOrder(node) } : {}),
    sensorHealth: node.data.sensorHealth,
    enabled: dc.enabled !== false,
  };
}

function buildWidgetEntry(node: FlowGraphNode): DashboardWidgetEntryV1 | null {
  const widgetKind = widgetKindFromNodeId(node.data.nodeId);
  if (widgetKind == null) {
    return null;
  }
  return buildWidgetEntryFromKind(node, widgetKind);
}

function buildPublishedWidgetEntry(node: FlowGraphNode): DashboardWidgetEntryV1 | null {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  if (!readPublishToDashboardFlag(dc)) {
    return null;
  }
  const widgetKind = dashboardWidgetKindFromPublishableCatalogId(node.data.nodeId);
  if (widgetKind == null) {
    return null;
  }
  return buildWidgetEntryFromKind(node, widgetKind);
}

function collectPublishedWidgets(
  nodes: readonly FlowGraphNode[],
  occupiedSourceIds: ReadonlySet<string>,
  context: DashboardPublishTargetContext,
): DashboardWidgetEntryV1[] {
  const entries: DashboardWidgetEntryV1[] = [];
  for (const node of nodes) {
    if (occupiedSourceIds.has(node.id)) {
      continue;
    }
    const dc = node.data.defaultConfig as Record<string, unknown>;
    if (!matchesPublishTarget(dc, context)) {
      continue;
    }
    const widget = buildPublishedWidgetEntry(node);
    if (widget != null) {
      entries.push(widget);
    }
  }
  return entries;
}

function publishedWidgetsAsItems(
  widgets: readonly DashboardWidgetEntryV1[],
): DashboardSnapshotItemV1[] {
  return widgets.map((widget) => ({ kind: "widget" as const, widget }));
}

function collectPublishedTopLevelItems(
  nodes: readonly FlowGraphNode[],
  occupiedSourceIds: ReadonlySet<string>,
  tabsActive: boolean,
): DashboardSnapshotItemV1[] {
  if (tabsActive) {
    return [];
  }
  return publishedWidgetsAsItems(
    collectPublishedWidgets(nodes, occupiedSourceIds, {
      tabId: "",
      groupId: "",
      tabsActive: false,
    }),
  );
}

function collectWidgetEntriesForTarget(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  targetNodeId: string,
): DashboardWidgetEntryV1[] {
  const widgetEdges = edges.filter(
    (e) =>
      e.target === targetNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_WIDGETS) === STUDIO_HANDLE_WIDGETS &&
      (e.sourceHandle ?? STUDIO_HANDLE_WIDGET) === STUDIO_HANDLE_WIDGET,
  );

  const entries: DashboardWidgetEntryV1[] = [];
  for (const edge of widgetEdges) {
    const src = nodes.find((n) => n.id === edge.source);
    if (src == null) {
      continue;
    }
    const entry = buildWidgetEntry(src);
    if (entry != null) {
      entries.push(entry);
    }
  }
  return entries;
}

function buildGroupEntry(
  node: FlowGraphNode,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): DashboardGroupEntryV1 {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  return {
    sourceNodeId: node.id,
    catalogNodeId: "dashboard-group",
    label: readWidgetLabel(node),
    placement: coerceDashboardPlacementV1(dc.placement),
    flexPlacement: coerceDashboardFlexPlacementV1(dc.flex),
    groupLayout: coerceDashboardGroupLayoutV1(dc.groupLayout),
    showTitle: dc.showTitle !== false,
    showBorder: dc.showBorder !== false,
    children: (() => {
      const wiredChildren = collectWidgetEntriesForTarget(nodes, edges, node.id);
      const wiredIds = new Set(wiredChildren.map((child) => child.sourceNodeId));
      const publishedChildren = collectPublishedWidgets(nodes, wiredIds, {
        tabId: "",
        groupId: node.id,
        tabsActive: false,
      });
      return [...wiredChildren, ...publishedChildren];
    })(),
    style: { ...dc },
    enabled: dc.enabled !== false,
  };
}

function collectItemsForTarget(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  targetNodeId: string,
): DashboardSnapshotItemV1[] {
  const widgetEdges = edges.filter(
    (e) =>
      e.target === targetNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_WIDGETS) === STUDIO_HANDLE_WIDGETS &&
      (e.sourceHandle ?? STUDIO_HANDLE_WIDGET) === STUDIO_HANDLE_WIDGET,
  );

  const items: DashboardSnapshotItemV1[] = [];
  for (const edge of widgetEdges) {
    const src = nodes.find((n) => n.id === edge.source);
    if (src == null) {
      continue;
    }
    if (src.data.nodeId === DASHBOARD_GROUP_NODE_ID) {
      items.push({ kind: "group", group: buildGroupEntry(src, nodes, edges) });
      continue;
    }
    const widget = buildWidgetEntry(src);
    if (widget != null) {
      items.push({ kind: "widget", widget });
    }
  }
  return items;
}

function collectTopLevelItems(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  outputNodeId: string,
): DashboardSnapshotItemV1[] {
  return collectItemsForTarget(nodes, edges, outputNodeId);
}

function itemSourceNodeIds(items: readonly DashboardSnapshotItemV1[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.kind === "widget") {
      ids.add(item.widget.sourceNodeId);
    } else if (item.kind === "group") {
      ids.add(item.group.sourceNodeId);
    }
  }
  return ids;
}

function buildTabEntry(
  node: FlowGraphNode,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): DashboardTabEntryV1 {
  const dc = node.data.defaultConfig as Record<string, unknown>;
  const wiredItems = collectItemsForTarget(nodes, edges, node.id);
  const wiredIds = itemSourceNodeIds(wiredItems);
  const publishedItems = publishedWidgetsAsItems(
    collectPublishedWidgets(nodes, wiredIds, {
      tabId: node.id,
      groupId: "",
      tabsActive: true,
    }),
  );
  const orderRaw = dc.order;
  const order = typeof orderRaw === "number" && Number.isFinite(orderRaw) ? Math.round(orderRaw) : 0;
  return {
    sourceNodeId: node.id,
    catalogNodeId: "dashboard-tab",
    label: readWidgetLabel(node),
    order,
    items: [...wiredItems, ...publishedItems],
    enabled: dc.enabled !== false,
  };
}

function collectTabsForOutput(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
  outputNodeId: string,
): DashboardTabEntryV1[] {
  const tabEdges = edges.filter(
    (e) =>
      e.target === outputNodeId &&
      (e.targetHandle ?? STUDIO_HANDLE_TABS) === STUDIO_HANDLE_TABS &&
      (e.sourceHandle ?? STUDIO_HANDLE_TAB) === STUDIO_HANDLE_TAB,
  );
  const tabs: DashboardTabEntryV1[] = [];
  for (const edge of tabEdges) {
    const src = nodes.find((n) => n.id === edge.source);
    if (src == null || src.data.nodeId !== DASHBOARD_TAB_NODE_ID) {
      continue;
    }
    tabs.push(buildTabEntry(src, nodes, edges));
  }
  return tabs.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

function flattenTopLevelWidgets(items: readonly DashboardSnapshotItemV1[]): DashboardWidgetEntryV1[] {
  return items
    .filter(
      (item): item is { kind: "widget"; widget: DashboardWidgetEntryV1 } =>
        item.kind === "widget",
    )
    .map((item) => item.widget);
}

function detectPlacementOverlaps(
  items: readonly DashboardSnapshotItemV1[],
  layoutMode: "grid" | "flex",
): string[] {
  if (layoutMode !== "grid") {
    return [];
  }
  const occupied = new Map<string, string>();
  const warnings: string[] = [];

  const checkPlacement = (label: string, sourceNodeId: string, placement: DashboardWidgetEntryV1["placement"]) => {
    for (const key of dashboardPlacementCellKeys(placement)) {
      const prev = occupied.get(key);
      if (prev != null && prev !== sourceNodeId) {
        warnings.push(`Grid cell ${key} is shared by widgets "${prev}" and "${label}".`);
      } else {
        occupied.set(key, label);
      }
    }
  };

  for (const item of items) {
    if (item.kind === "widget") {
      checkPlacement(item.widget.label, item.widget.sourceNodeId, item.widget.placement);
    } else {
      checkPlacement(item.group.label, item.group.sourceNodeId, item.group.placement);
      const groupOccupied = new Map<string, string>();
      for (const child of item.group.children) {
        for (const key of dashboardPlacementCellKeys(child.placement)) {
          const scopedKey = `${item.group.sourceNodeId}:${key}`;
          const prev = groupOccupied.get(scopedKey);
          if (prev != null && prev !== child.sourceNodeId) {
            warnings.push(
              `Group "${item.group.label}" cell ${key} is shared by "${prev}" and "${child.label}".`,
            );
          } else {
            groupOccupied.set(scopedKey, child.label);
          }
        }
      }
    }
  }
  return warnings;
}

function readCommittedTheme(
  outputNode: FlowGraphNode,
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): ReturnType<typeof coerceDashboardThemeV1> {
  const dc = outputNode.data.defaultConfig as Record<string, unknown>;
  const liveWire = (outputNode.data as { liveDashboardThemeWire?: unknown }).liveDashboardThemeWire;
  const fromLive = flowValueAsDashboardTheme(liveWire);
  if (fromLive != null) {
    return fromLive;
  }

  const themeEdge = edges.find(
    (e) =>
      e.target === outputNode.id &&
      (e.targetHandle ?? STUDIO_HANDLE_THEME) === STUDIO_HANDLE_THEME,
  );
  if (themeEdge != null) {
    const src = nodes.find((n) => n.id === themeEdge.source);
    if (src != null) {
      const srcDc = src.data.defaultConfig as Record<string, unknown>;
      const fromSrc = flowValueAsDashboardTheme(srcDc.theme ?? srcDc);
      if (fromSrc != null) {
        return fromSrc;
      }
    }
  }

  return coerceDashboardThemeV1(dc.theme);
}

/**
 * Evaluate graph → Dashboard snapshot (call after `tickSimulation`).
 *
 * Reads **`dashboard-output`** layout, optional **Theme** wire, and **Widgets** wires
 * (including **`dashboard-group`** nested grids).
 */
export function evaluateDashboardSnapshot(args: {
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
}): DashboardSnapshotV1 {
  const { nodes, edges } = args;
  const outputNode = nodes.find((n) => n.data.nodeId === DASHBOARD_OUTPUT_NODE_ID);
  const nowMs = Date.now();

  if (outputNode == null) {
    return { ...EMPTY_DASHBOARD_SNAPSHOT, updatedAtMs: nowMs };
  }

  const dc = outputNode.data.defaultConfig as Record<string, unknown>;
  const layout = coerceDashboardLayoutV1(dc.layout);
  const tabs = collectTabsForOutput(nodes, edges, outputNode.id);
  const tabsActive = tabs.length > 0;
  const wiredItems = collectTopLevelItems(nodes, edges, outputNode.id);
  const wiredSourceIds = itemSourceNodeIds(wiredItems);
  const publishedItems = collectPublishedTopLevelItems(nodes, wiredSourceIds, tabsActive);
  const items = tabsActive ? [] : [...wiredItems, ...publishedItems];

  const layoutWarnings: string[] = [];
  if (tabsActive && (wiredItems.length > 0 || publishedItems.length > 0)) {
    layoutWarnings.push(
      "Widgets wired directly to Dashboard Output are ignored when Tabs are connected. Wire widgets into a Dashboard Tab instead.",
    );
  }
  if (tabsActive) {
    for (const tab of tabs) {
      for (const warning of detectPlacementOverlaps(tab.items, layout.mode)) {
        layoutWarnings.push(`Tab "${tab.label}": ${warning}`);
      }
    }
  } else {
    layoutWarnings.push(...detectPlacementOverlaps(items, layout.mode));
  }

  return {
    version: 1,
    dashboardOutputNodeId: outputNode.id,
    updatedAtMs: nowMs,
    layout,
    theme: readCommittedTheme(outputNode, nodes, edges),
    items,
    tabs,
    widgets: flattenTopLevelWidgets(items),
    layoutWarnings,
  };
}

export function isDashboardWidgetCatalogId(nodeId: string): boolean {
  return DASHBOARD_WIDGET_NODE_IDS.has(nodeId);
}

export function isDashboardGroupCatalogId(nodeId: string): boolean {
  return nodeId === DASHBOARD_GROUP_NODE_ID;
}

export function isDashboardTabCatalogId(nodeId: string): boolean {
  return nodeId === DASHBOARD_TAB_NODE_ID;
}

export { isDashboardPublishableCatalogId } from "./dashboard-publish";
