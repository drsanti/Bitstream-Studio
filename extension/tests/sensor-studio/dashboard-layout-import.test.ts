import assert from "node:assert/strict";
import { test } from "node:test";
import { createDashboardLayoutExport } from "../../src/webview/sensor-studio/core/dashboard/dashboard-layout-export";
import {
  collectDashboardLayoutNodeFieldPatches,
  collectLayoutPatchesFromSnapshot,
  parseDashboardLayoutImportJson,
} from "../../src/webview/sensor-studio/core/dashboard/dashboard-layout-import";
import { evaluateDashboardSnapshot } from "../../src/webview/sensor-studio/core/dashboard/evaluate-dashboard-snapshot";
import type { FlowGraphNode } from "../../src/webview/sensor-studio/features/editor/store/flow-graph-types";
import {
  STUDIO_HANDLE_TAB,
  STUDIO_HANDLE_TABS,
  STUDIO_HANDLE_WIDGET,
  STUDIO_HANDLE_WIDGETS,
} from "../../src/webview/sensor-studio/features/editor/studio-handle-ids";

function studioNode(
  id: string,
  nodeId: string,
  data: Partial<FlowGraphNode["data"]> = {},
): FlowGraphNode {
  return {
    id,
    type: "studio",
    position: { x: 0, y: 0 },
    data: {
      nodeId,
      label: nodeId,
      defaultConfig: {},
      ...data,
    },
  } as FlowGraphNode;
}

test("parseDashboardLayoutImportJson rejects invalid JSON", () => {
  const result = parseDashboardLayoutImportJson("{");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /Invalid JSON/);
  }
});

test("collectLayoutPatchesFromSnapshot includes tab order and widget placement", () => {
  const output = studioNode("out-1", "dashboard-output", {
    defaultConfig: {
      layout: {
        version: 1,
        mode: "grid",
        grid: { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 },
      },
    },
  });
  const tab = studioNode("tab-1", "dashboard-tab", {
    defaultConfig: { label: "Ops", order: 2 },
  });
  const button = studioNode("btn-1", "dashboard-button", {
    defaultConfig: {
      label: "Go",
      placement: { column: 3, row: 2, columnSpan: 2, rowSpan: 1 },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, tab, button],
    edges: [
      {
        id: "e-tab",
        source: tab.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_TAB,
        targetHandle: STUDIO_HANDLE_TABS,
      },
      {
        id: "e-btn",
        source: button.id,
        target: tab.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  const patches = collectLayoutPatchesFromSnapshot(snap);
  const tabPatch = patches.find((row) => row.sourceNodeId === "tab-1");
  const buttonPatch = patches.find((row) => row.sourceNodeId === "btn-1");
  assert.equal(tabPatch?.tabOrder, 2);
  assert.equal(tabPatch?.placement, undefined);
  assert.deepEqual(buttonPatch?.placement, {
    column: 3,
    row: 2,
    columnSpan: 2,
    rowSpan: 1,
  });
  assert.equal(buttonPatch?.dashboardTabId, "tab-1");
  assert.equal(buttonPatch?.placement?.column, 3);
});

test("collectDashboardLayoutNodeFieldPatches merges fields per node for batch apply", () => {
  const exportPayload = createDashboardLayoutExport({
    version: 1,
    dashboardOutputNodeId: "out-1",
    layout: {
      version: 1,
      mode: "grid",
      grid: { columns: 8, gapPx: 4, paddingPx: 12, rowHeightPx: 40 },
    },
    theme: { version: 1, preset: "studio-dark" },
    items: [],
    tabs: [],
    layoutWarnings: [],
  });

  const patches = collectLayoutPatchesFromSnapshot(exportPayload.snapshot);
  const collected = collectDashboardLayoutNodeFieldPatches({
    patches,
    outputLayoutPatch: {
      sourceNodeId: "out-1",
      layout: exportPayload.snapshot.layout,
    },
    existingNodeIds: new Set(["out-1", "btn-1"]),
  });

  assert.equal(collected.matchedNodes, 1);
  assert.deepEqual(collected.nodeFieldPatches.get("out-1")?.layout, exportPayload.snapshot.layout);
});

test("import roundtrip preserves button placement on matching node ids", () => {
  const output = studioNode("out-1", "dashboard-output", {
    defaultConfig: {
      layout: {
        version: 1,
        mode: "grid",
        grid: { columns: 12, gapPx: 8, paddingPx: 16, rowHeightPx: 48 },
      },
    },
  });
  const button = studioNode("btn-1", "dashboard-button", {
    defaultConfig: {
      label: "Go",
      placement: { column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
    },
  });

  const snap = evaluateDashboardSnapshot({
    nodes: [output, button],
    edges: [
      {
        id: "e1",
        source: button.id,
        target: output.id,
        sourceHandle: STUDIO_HANDLE_WIDGET,
        targetHandle: STUDIO_HANDLE_WIDGETS,
      },
    ],
  });

  const json = JSON.stringify(createDashboardLayoutExport(snap));
  const parsed = parseDashboardLayoutImportJson(json);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) {
    return;
  }

  const collected = collectDashboardLayoutNodeFieldPatches({
    patches: parsed.parsed.nodePatches,
    outputLayoutPatch: parsed.parsed.outputLayoutPatch,
    existingNodeIds: new Set(["out-1", "btn-1"]),
  });

  const buttonFields = collected.nodeFieldPatches.get("btn-1");
  assert.deepEqual(buttonFields?.placement, {
    column: 1,
    row: 1,
    columnSpan: 1,
    rowSpan: 1,
  });
});
