import type { DashboardFlexPlacementV1 } from "./dashboard-flex-placement";
import { coerceDashboardFlexPlacementV1 } from "./dashboard-flex-placement";
import { coerceDashboardLayoutV1 } from "./dashboard-layout";
import type { DashboardLayoutExportV1 } from "./dashboard-layout-export";
import { coerceDashboardPlacementV1, type DashboardPlacementV1 } from "./dashboard-placement";
import type {
  DashboardSnapshotItemV1,
  DashboardSnapshotV1,
  DashboardWidgetEntryV1,
} from "./dashboard-snapshot";

export type DashboardLayoutNodePatchV1 = {
  sourceNodeId: string;
  placement?: DashboardPlacementV1;
  flex?: DashboardFlexPlacementV1;
  publishToDashboard?: boolean;
  dashboardGroupId?: string;
  dashboardTabId?: string;
  tabOrder?: number;
};

export type DashboardOutputLayoutPatchV1 = {
  sourceNodeId: string;
  layout: ReturnType<typeof coerceDashboardLayoutV1>;
};

export type ParsedDashboardLayoutImportV1 = {
  export: DashboardLayoutExportV1;
  nodePatches: DashboardLayoutNodePatchV1[];
  outputLayoutPatch: DashboardOutputLayoutPatchV1 | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function widgetPatch(
  widget: DashboardWidgetEntryV1,
  ctx: { tabId: string; groupId: string },
): DashboardLayoutNodePatchV1 {
  const style = widget.style;
  const publishRaw = style.publishToDashboard;
  return {
    sourceNodeId: widget.sourceNodeId,
    placement: coerceDashboardPlacementV1(widget.placement),
    flex: coerceDashboardFlexPlacementV1(widget.flexPlacement),
    ...(publishRaw === true ? { publishToDashboard: true } : {}),
    ...(ctx.groupId.length > 0 ? { dashboardGroupId: ctx.groupId } : {}),
    ...(ctx.tabId.length > 0 ? { dashboardTabId: ctx.tabId } : {}),
  };
}

function walkItems(
  items: readonly DashboardSnapshotItemV1[],
  ctx: { tabId: string },
  patches: DashboardLayoutNodePatchV1[],
): void {
  for (const item of items) {
    if (item.kind === "widget") {
      patches.push(widgetPatch(item.widget, { tabId: ctx.tabId, groupId: "" }));
      continue;
    }
    patches.push({
      sourceNodeId: item.group.sourceNodeId,
      placement: coerceDashboardPlacementV1(item.group.placement),
      flex: coerceDashboardFlexPlacementV1(item.group.flexPlacement),
      ...(ctx.tabId.length > 0 ? { dashboardTabId: ctx.tabId } : {}),
    });
    for (const child of item.group.children) {
      patches.push(
        widgetPatch(child, { tabId: ctx.tabId, groupId: item.group.sourceNodeId }),
      );
    }
  }
}

export function collectLayoutPatchesFromSnapshot(
  snapshot: DashboardSnapshotV1,
): DashboardLayoutNodePatchV1[] {
  const patches: DashboardLayoutNodePatchV1[] = [];
  for (const tab of snapshot.tabs) {
    patches.push({
      sourceNodeId: tab.sourceNodeId,
      tabOrder: tab.order,
    });
    walkItems(tab.items, { tabId: tab.sourceNodeId }, patches);
  }
  walkItems(snapshot.items, { tabId: "" }, patches);
  return patches;
}

export function collectOutputLayoutPatch(
  snapshot: DashboardSnapshotV1,
): DashboardOutputLayoutPatchV1 | null {
  if (snapshot.dashboardOutputNodeId == null) {
    return null;
  }
  return {
    sourceNodeId: snapshot.dashboardOutputNodeId,
    layout: coerceDashboardLayoutV1(snapshot.layout),
  };
}

export function parseDashboardLayoutImportJson(
  json: string,
): { ok: true; parsed: ParsedDashboardLayoutImportV1 } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, message: "Invalid JSON." };
  }
  if (!isRecord(raw) || raw.version !== 1) {
    return { ok: false, message: "Expected Dashboard layout export version 1." };
  }
  if (!isRecord(raw.snapshot)) {
    return { ok: false, message: "Missing snapshot object." };
  }
  const snapshot = raw.snapshot as DashboardSnapshotV1;
  if (snapshot.version !== 1) {
    return { ok: false, message: "Unsupported dashboard snapshot version." };
  }
  const exportPayload: DashboardLayoutExportV1 = {
    version: 1,
    exportedAtMs:
      typeof raw.exportedAtMs === "number" && Number.isFinite(raw.exportedAtMs)
        ? raw.exportedAtMs
        : Date.now(),
    snapshot: {
      ...snapshot,
      layout: coerceDashboardLayoutV1(snapshot.layout),
      items: Array.isArray(snapshot.items) ? snapshot.items : [],
      tabs: Array.isArray(snapshot.tabs) ? snapshot.tabs : [],
      layoutWarnings: Array.isArray(snapshot.layoutWarnings) ? snapshot.layoutWarnings : [],
    },
  };
  return {
    ok: true,
    parsed: {
      export: exportPayload,
      nodePatches: collectLayoutPatchesFromSnapshot(exportPayload.snapshot),
      outputLayoutPatch: collectOutputLayoutPatch(exportPayload.snapshot),
    },
  };
}

export type CollectDashboardLayoutImportResult = {
  nodeFieldPatches: Map<string, Record<string, unknown>>;
  missingNodeIds: string[];
  matchedNodes: number;
  skippedPatches: number;
};

function mergePatchFields(
  map: Map<string, Record<string, unknown>>,
  nodeId: string,
  fields: Record<string, unknown>,
): void {
  const prev = map.get(nodeId);
  map.set(nodeId, prev == null ? fields : { ...prev, ...fields });
}

export function collectDashboardLayoutNodeFieldPatches(args: {
  patches: readonly DashboardLayoutNodePatchV1[];
  outputLayoutPatch: DashboardOutputLayoutPatchV1 | null;
  existingNodeIds: ReadonlySet<string>;
}): CollectDashboardLayoutImportResult {
  const { patches, outputLayoutPatch, existingNodeIds } = args;
  const nodeFieldPatches = new Map<string, Record<string, unknown>>();
  const missingSet = new Set<string>();
  let skippedPatches = 0;

  if (outputLayoutPatch != null) {
    if (existingNodeIds.has(outputLayoutPatch.sourceNodeId)) {
      mergePatchFields(nodeFieldPatches, outputLayoutPatch.sourceNodeId, {
        layout: outputLayoutPatch.layout,
      });
    } else {
      missingSet.add(outputLayoutPatch.sourceNodeId);
    }
  }

  for (const patch of patches) {
    if (!existingNodeIds.has(patch.sourceNodeId)) {
      missingSet.add(patch.sourceNodeId);
      skippedPatches += 1;
      continue;
    }
    const fields: Record<string, unknown> = {};
    if (patch.placement != null) {
      fields.placement = patch.placement;
    }
    if (patch.flex != null) {
      fields.flex = patch.flex;
    }
    if (patch.publishToDashboard === true) {
      fields.publishToDashboard = true;
    }
    if (patch.dashboardGroupId != null) {
      fields.dashboardGroupId = patch.dashboardGroupId;
    } else if (patch.tabOrder == null) {
      fields.dashboardGroupId = "";
    }
    if (patch.dashboardTabId != null) {
      fields.dashboardTabId = patch.dashboardTabId;
    } else if (patch.tabOrder == null) {
      fields.dashboardTabId = "";
    }
    if (typeof patch.tabOrder === "number") {
      fields.order = patch.tabOrder;
    }
    if (Object.keys(fields).length > 0) {
      mergePatchFields(nodeFieldPatches, patch.sourceNodeId, fields);
    }
  }

  return {
    nodeFieldPatches,
    missingNodeIds: [...missingSet],
    matchedNodes: nodeFieldPatches.size,
    skippedPatches,
  };
}
