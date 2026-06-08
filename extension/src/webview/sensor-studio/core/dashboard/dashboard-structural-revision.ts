import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../features/editor/store/flow-graph-types";
import {
  DASHBOARD_GROUP_NODE_ID,
  DASHBOARD_OUTPUT_NODE_ID,
  DASHBOARD_TAB_NODE_ID,
} from "./evaluate-dashboard-snapshot";
import { readPublishToDashboardFlag } from "./dashboard-publish";

const DASHBOARD_WIDGET_CATALOG_IDS = new Set([
  "dashboard-button",
  "dashboard-led",
  "dashboard-text",
  "dashboard-gauge",
  "dashboard-knob",
  "dashboard-switch",
  "dashboard-slider",
  "dashboard-status",
]);

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/** True when the document contains a **dashboard-output** node. */
export function graphHasDashboardOutputNode(nodes: readonly FlowGraphNode[]): boolean {
  return nodes.some((node) => node.data.nodeId === DASHBOARD_OUTPUT_NODE_ID);
}

/**
 * Revision for dashboard layout / wiring — ignores simulation `live*` fields.
 * Bumps when operators edit placements, wire widgets, or change dashboard-output layout.
 */
export function readDashboardStructuralRevision(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): string {
  const parts: string[] = [];
  for (const node of nodes) {
    if (node.type !== "studio") {
      continue;
    }
    const nodeId = node.data.nodeId;
    const dc = node.data.defaultConfig as Record<string, unknown>;
    if (nodeId === DASHBOARD_OUTPUT_NODE_ID) {
      parts.push(`out:${node.id}:${stableJson(dc.layout)}:${stableJson(dc.theme)}`);
      continue;
    }
    if (
      nodeId === DASHBOARD_GROUP_NODE_ID ||
      nodeId === DASHBOARD_TAB_NODE_ID ||
      DASHBOARD_WIDGET_CATALOG_IDS.has(nodeId)
    ) {
      parts.push(
        `w:${node.id}:${nodeId}:${node.data.label ?? ""}:${stableJson(dc.placement)}:${stableJson(dc.flex)}:${String(dc.enabled ?? true)}`,
      );
      continue;
    }
    if (readPublishToDashboardFlag(dc)) {
      parts.push(
        `pub:${node.id}:${nodeId}:${stableJson(dc.placement)}:${stableJson(dc.flex)}:${stableJson(dc.publishToDashboard)}`,
      );
    }
  }
  for (const edge of edges) {
    const sh = edge.sourceHandle ?? "";
    const th = edge.targetHandle ?? "";
    if (
      sh.includes("widget") ||
      th.includes("widget") ||
      sh.includes("tab") ||
      th.includes("tab") ||
      sh.includes("theme") ||
      th.includes("theme")
    ) {
      parts.push(
        `e:${edge.id}:${edge.source}:${sh}:${edge.target}:${th}`,
      );
    }
  }
  return parts.sort().join("|");
}
