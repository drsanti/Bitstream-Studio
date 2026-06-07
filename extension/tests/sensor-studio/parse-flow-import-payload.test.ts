import assert from "node:assert/strict";
import test from "node:test";

import { FLOW_CLIPBOARD_MARKER, FLOW_CLIPBOARD_VERSION } from "../../src/webview/sensor-studio/features/editor/clipboard/flow-clipboard";
import { parseFlowImportPayload } from "../../src/webview/sensor-studio/features/editor/flow-library/parse-flow-import-payload";
import {
  STUDIO_FLOW_PRESET_MARKER,
  STUDIO_FLOW_PRESET_VERSION,
} from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";
import { STUDIO_NODE_ASSET_MARKER } from "../../src/webview/sensor-studio/features/editor/subgraphs/node-library/studio-node-asset-file";

test("parseFlowImportPayload detects node asset before flow preset", () => {
  const payload = JSON.stringify({
    marker: STUDIO_NODE_ASSET_MARKER,
    version: 1,
    meta: {
      id: "a1",
      name: "My group",
      createdAt: "2026-06-07T00:00:00.000Z",
      updatedAt: "2026-06-07T00:00:00.000Z",
    },
    nodes: [{ id: "g1", type: "studio-node-group", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
    subgraphs: {},
  });
  const result = parseFlowImportPayload(payload);
  assert.equal(result?.kind, "node-asset");
});

test("parseFlowImportPayload detects flow preset", () => {
  const payload = JSON.stringify({
    marker: STUDIO_FLOW_PRESET_MARKER,
    version: STUDIO_FLOW_PRESET_VERSION,
    meta: { id: "p1", name: "Telemetry chain", category: "telemetry", presetKind: "flowFull" },
    document: { version: 1, nodes: [], edges: [] },
  });
  const result = parseFlowImportPayload(payload);
  assert.equal(result?.kind, "flow-preset");
  if (result?.kind === "flow-preset") {
    assert.equal(result.preset.meta.name, "Telemetry chain");
  }
});

test("parseFlowImportPayload detects flow clipboard marker", () => {
  const payload = JSON.stringify({
    marker: FLOW_CLIPBOARD_MARKER,
    version: FLOW_CLIPBOARD_VERSION,
    nodes: [{ id: "n1" }],
    edges: [],
  });
  const result = parseFlowImportPayload(payload);
  assert.equal(result?.kind, "flow-clipboard");
});

test("parseFlowImportPayload detects raw flow document", () => {
  const payload = JSON.stringify({
    version: 1,
    nodes: [],
    edges: [],
    selectedNodeId: null,
  });
  const result = parseFlowImportPayload(payload);
  assert.equal(result?.kind, "raw-flow-document");
});

test("parseFlowImportPayload returns null for unrelated text", () => {
  assert.equal(parseFlowImportPayload("not json"), null);
  assert.equal(parseFlowImportPayload('{"foo":1}'), null);
});
