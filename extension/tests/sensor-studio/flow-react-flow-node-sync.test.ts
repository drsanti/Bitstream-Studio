import assert from "node:assert/strict";
import test from "node:test";

import {
  filterNodeChangesForStore,
  mergeStoreNodesIntoRenderNodes,
  nodeChangesIncludeSelection,
  reactFlowShellSignature,
  reconcileRenderNodeMeasured,
  shouldReplaceRenderNodesFromStore,
  syncRenderNodeSelection,
  storeSelectionWillChange,
} from "../../src/webview/sensor-studio/features/editor/flow-react-flow-node-sync";

test("shouldReplaceRenderNodesFromStore ignores live data-only updates", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      data: { liveValue: 1 },
    },
  ];
  const incoming = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      data: { liveValue: 99 },
    },
  ];
  assert.equal(shouldReplaceRenderNodesFromStore(current, incoming), false);
});

test("shouldReplaceRenderNodesFromStore detects shell changes", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      data: {},
    },
  ];
  const incoming = [
    {
      id: "a",
      type: "studio",
      position: { x: 12, y: 20 },
      data: {},
    },
  ];
  assert.equal(shouldReplaceRenderNodesFromStore(current, incoming), true);
});

test("nodeChangesIncludeSelection detects select batches", () => {
  assert.equal(
    nodeChangesIncludeSelection([{ type: "select", id: "a", selected: true }]),
    true,
  );
  assert.equal(
    nodeChangesIncludeSelection([
      {
        type: "dimensions",
        id: "a",
        dimensions: { width: 200, height: 120 },
        resizing: false,
        setAttributes: true,
      },
    ]),
    false,
  );
});

test("filterNodeChangesForStore drops select and redundant dimensions", () => {
  const nodes = [
    {
      id: "a",
      type: "studio",
      position: { x: 0, y: 0 },
      width: 200,
      height: 120,
      data: {},
    },
  ];
  const filtered = filterNodeChangesForStore(
    [
      { type: "select", id: "a", selected: true },
      {
        type: "dimensions",
        id: "a",
        dimensions: { width: 200, height: 120 },
        resizing: false,
        setAttributes: true,
      },
      {
        type: "dimensions",
        id: "a",
        dimensions: { width: 220, height: 120 },
        resizing: false,
        setAttributes: true,
      },
    ],
    nodes,
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.type, "dimensions");
});

test("reconcileRenderNodeMeasured drops stale RF measure when store has explicit width", () => {
  const previous = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    measured: { width: 420, height: 180 },
    data: {},
  };
  const incoming = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    width: 280,
    height: 120,
    data: {},
  };
  assert.deepEqual(reconcileRenderNodeMeasured(incoming, previous), {
    width: 280,
    height: 120,
  });
});

test("mergeStoreNodesIntoRenderNodes keeps reference when shell is unchanged", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      data: { liveValue: 1 },
    },
  ];
  const incoming = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      data: { liveValue: 99 },
    },
  ];
  assert.equal(mergeStoreNodesIntoRenderNodes(current, incoming), current);
});

test("mergeStoreNodesIntoRenderNodes aligns measured box to explicit store width", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 0, y: 0 },
      selected: false,
      measured: { width: 420, height: 180 },
      data: {},
    },
  ];
  const incoming = [
    {
      id: "a",
      type: "studio",
      position: { x: 0, y: 0 },
      selected: true,
      width: 280,
      height: 120,
      data: {},
    },
  ];
  const merged = mergeStoreNodesIntoRenderNodes(current, incoming);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0]?.measured, { width: 280, height: 120 });
});

test("reconcileRenderNodeMeasured drops stale measure when store clears explicit box", () => {
  const previous = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    measured: { width: 280, height: 320 },
    data: {},
  };
  const incoming = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    data: {},
  };
  assert.equal(reconcileRenderNodeMeasured(incoming, previous), undefined);
});

test("reconcileRenderNodeMeasured shrinks height when store layout is smaller", () => {
  const previous = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    measured: { width: 280, height: 320 },
    data: {},
  };
  const incoming = {
    id: "a",
    type: "studio",
    position: { x: 0, y: 0 },
    width: 280,
    height: 140,
    data: {},
  };
  assert.deepEqual(reconcileRenderNodeMeasured(incoming, previous), {
    width: 280,
    height: 140,
  });
});

test("shouldReplaceRenderNodesFromStore ignores selection-only store updates", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      selected: false,
      data: {},
    },
  ];
  const incoming = [
    {
      id: "a",
      type: "studio",
      position: { x: 10, y: 20 },
      selected: true,
      data: {},
    },
  ];
  assert.equal(shouldReplaceRenderNodesFromStore(current, incoming), false);
});

test("syncRenderNodeSelection toggles flags without replacing unchanged nodes", () => {
  const current = [
    {
      id: "a",
      type: "studio",
      position: { x: 0, y: 0 },
      selected: false,
      data: {},
    },
    {
      id: "b",
      type: "studio",
      position: { x: 0, y: 0 },
      selected: true,
      data: {},
    },
  ];
  const synced = syncRenderNodeSelection(current, ["a"]);
  assert.notEqual(synced, current);
  assert.equal(synced[0]?.selected, true);
  assert.equal(synced[1]?.selected, false);
  const again = syncRenderNodeSelection(synced, ["a"]);
  assert.equal(again, synced);
});

test("storeSelectionWillChange detects id and node.selected drift", () => {
  const nodes = [
    {
      id: "a",
      type: "studio",
      position: { x: 0, y: 0 },
      selected: false,
      data: {},
    },
  ];
  assert.equal(
    storeSelectionWillChange([], null, nodes, ["a"]),
    true,
  );
  assert.equal(
    storeSelectionWillChange(["a"], "a", [{ ...nodes[0]!, selected: true }], ["a"]),
    false,
  );
});

test("reactFlowShellSignature ignores selection", () => {
  const sigA = reactFlowShellSignature({
    id: "n1",
    type: "studio",
    position: { x: 1, y: 2 },
    selected: false,
    data: {},
  });
  const sigB = reactFlowShellSignature({
    id: "n1",
    type: "studio",
    position: { x: 1, y: 2 },
    selected: true,
    data: {},
  });
  assert.equal(sigA, sigB);
});
