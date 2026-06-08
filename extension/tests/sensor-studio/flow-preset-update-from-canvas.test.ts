import assert from "node:assert/strict";
import test from "node:test";

import { buildFlowPresetUpdateFromCanvas } from "../../src/webview/sensor-studio/features/editor/flow-library/build-flow-preset-update-from-canvas";
import { replaceFlowPresetById } from "../../src/webview/sensor-studio/features/editor/flow-library/flow-preset-upsert";
import type { StudioFlowPresetFile } from "../../src/webview/sensor-studio/features/editor/flow-library/studio-flow-preset-file";
import {
  buildProjectPresetUpdateMismatchMessage,
  shouldConfirmProjectPresetUpdateMismatch,
} from "../../src/webview/sensor-studio/features/editor/flow-library/request-project-flow-preset-update";

const basePreset: StudioFlowPresetFile = {
  marker: "trn-flow-preset",
  version: 1,
  meta: {
    id: "preset-a",
    name: "Telemetry chain",
    category: "telemetry",
    presetKind: "flowFull",
    sourceScopeId: "__root__",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  document: {
    version: 1,
    nodes: [
      {
        id: "n1",
        type: "studio-node",
        position: { x: 0, y: 0 },
        data: { nodeId: "number-constant", label: "A" },
      },
    ],
    edges: [],
    rootNodes: [
      {
        id: "n1",
        type: "studio-node",
        position: { x: 0, y: 0 },
        data: { nodeId: "number-constant", label: "A" },
      },
    ],
    rootEdges: [],
  },
  dependencies: { modelUrls: [], dataChannels: [] },
};

test("replaceFlowPresetById keeps id and createdAt", () => {
  const incoming: StudioFlowPresetFile = {
    ...basePreset,
    meta: {
      ...basePreset.meta,
      id: "should-not-win",
      name: "Telemetry chain v2",
      createdAt: "2099-01-01T00:00:00.000Z",
    },
    document: {
      ...basePreset.document,
      nodes: [
        {
          id: "n2",
          type: "studio-node",
          position: { x: 10, y: 10 },
          data: { nodeId: "number-constant", label: "B" },
        },
      ],
    },
  };
  const result = replaceFlowPresetById([basePreset], "preset-a", incoming);
  assert.ok(result != null);
  assert.equal(result.result.updated, true);
  assert.equal(result.library[0]?.meta.id, "preset-a");
  assert.equal(result.library[0]?.meta.createdAt, "2026-01-01T00:00:00.000Z");
  assert.equal(result.library[0]?.document.nodes[0]?.id, "n2");
  assert.notEqual(result.library[0]?.meta.updatedAt, "2026-01-01T00:00:00.000Z");
});

test("buildFlowPresetUpdateFromCanvas rebuilds full preset from canvas", () => {
  const updated = buildFlowPresetUpdateFromCanvas({
    existing: basePreset,
    nodes: [
      {
        id: "n9",
        type: "studio-node",
        position: { x: 40, y: 40 },
        data: { nodeId: "number-constant", label: "Z" },
      },
    ],
    edges: [],
    subgraphs: {},
    activeGraphId: "__root__",
    rootNodes: [
      {
        id: "n9",
        type: "studio-node",
        position: { x: 40, y: 40 },
        data: { nodeId: "number-constant", label: "Z" },
      },
    ],
    rootEdges: [],
  });
  assert.equal(updated.meta.presetKind, "flowFull");
  assert.equal(updated.document.nodes[0]?.id, "n9");
  assert.equal(updated.meta.name, "Telemetry chain");
});

test("shouldConfirmProjectPresetUpdateMismatch when linked preset differs", () => {
  assert.equal(
    shouldConfirmProjectPresetUpdateMismatch({
      linkedProjectPresetId: "preset-a",
      targetPresetId: "preset-b",
    }),
    true,
  );
  assert.equal(
    shouldConfirmProjectPresetUpdateMismatch({
      linkedProjectPresetId: "preset-a",
      targetPresetId: "preset-a",
    }),
    false,
  );
});

test("buildProjectPresetUpdateMismatchMessage names both presets", () => {
  const message = buildProjectPresetUpdateMismatchMessage({
    targetPresetName: "Stage scene",
    linkedProjectPresetName: "Audio lab",
  });
  assert.match(message, /Audio lab/);
  assert.match(message, /Stage scene/);
});
