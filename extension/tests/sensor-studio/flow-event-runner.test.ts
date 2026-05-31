import assert from "node:assert/strict";
import test from "node:test";

import {
  applyFlowEventActionsToNodes,
  collectFlowEventTargetNodeIds,
  readEventBooleanValue,
  readEventSetBooleanTarget,
  runFlowEventDispatch,
} from "../../src/webview/sensor-studio/core/flow/flow-event-runner";
import { readGlbAnimTriggerNonce } from "../../src/webview/sensor-studio/features/editor/nodes/events/glb-anim-event-config";
import {
  readGlbPartSetVisibleTarget,
  readGlbPartVisibilityScalar,
} from "../../src/webview/sensor-studio/features/editor/nodes/events/glb-part-event-config";
import { collectGlbEventAnimationDrivesForModel, collectGlbScalarDrivesForModel } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import { keyboardEventMatchesOnKeyConfig } from "../../src/webview/sensor-studio/features/editor/nodes/events/on-key-config";
import { pointerEventMatchesOnClickConfig } from "../../src/webview/sensor-studio/features/editor/nodes/events/on-click-config";

function stubNode(id: string, nodeId: string, defaultConfig: Record<string, unknown> = {}) {
  return {
    id,
    type: "studio" as const,
    position: { x: 0, y: 0 },
    data: {
      label: nodeId,
      category: "logic" as const,
      nodeId,
      defaultConfig,
      liveValue: null,
      liveHistory: [],
      livePlotHistory: {},
    },
  };
}

test("collectFlowEventTargetNodeIds follows event edges from source", () => {
  const edges = [
    { source: "a", target: "b", sourceHandle: "out", targetHandle: "in" },
    { source: "a", target: "c", sourceHandle: "out", targetHandle: "in" },
    { source: "x", target: "b", sourceHandle: "out", targetHandle: "in" },
  ];
  assert.deepEqual(collectFlowEventTargetNodeIds(edges, "a"), ["b", "c"]);
});

test("applyFlowEventActionsToNodes toggles event-toggle-boolean", () => {
  const nodes = [
    stubNode("toggle", "event-toggle-boolean", { value: false }),
    stubNode("other", "indicator", {}),
  ];
  const next = applyFlowEventActionsToNodes(nodes, ["toggle"]);
  assert.equal(readEventBooleanValue(next[0]!.data.defaultConfig), true);
  const again = applyFlowEventActionsToNodes(next, ["toggle"]);
  assert.equal(readEventBooleanValue(again[0]!.data.defaultConfig), false);
});

test("applyFlowEventActionsToNodes sets event-set-boolean to setTo", () => {
  const nodes = [stubNode("set", "event-set-boolean", { setTo: true, value: false })];
  const next = applyFlowEventActionsToNodes(nodes, ["set"]);
  assert.equal(readEventBooleanValue(next[0]!.data.defaultConfig), true);
  const off = applyFlowEventActionsToNodes(
    [stubNode("set2", "event-set-boolean", { setTo: false, value: true })],
    ["set2"],
  );
  assert.equal(readEventBooleanValue(off[0]!.data.defaultConfig), false);
});

test("runFlowEventDispatch pulses source nodes", () => {
  const nodes = [
    stubNode("key", "on-key", {}),
    stubNode("toggle", "event-toggle-boolean", { value: false }),
  ];
  const edges = [{ source: "key", target: "toggle", sourceHandle: "out", targetHandle: "in" }];
  const next = runFlowEventDispatch({ nodes, edges, sourceNodeIds: ["key"], nowMs: 1234 });
  assert.equal(next[0]!.data.flowEventLastFiredAtMs, 1234);
  assert.equal(readEventBooleanValue(next[1]!.data.defaultConfig), true);
});

test("keyboardEventMatchesOnKeyConfig respects modifiers", () => {
  const cfg = { key: "KeyR", requireCtrl: true, requireShift: false, requireAlt: false };
  assert.equal(
    keyboardEventMatchesOnKeyConfig({ code: "KeyR", ctrlKey: true, shiftKey: false, altKey: false }, cfg),
    true,
  );
  assert.equal(
    keyboardEventMatchesOnKeyConfig({ code: "KeyR", ctrlKey: false, shiftKey: false, altKey: false }, cfg),
    false,
  );
});

test("pointerEventMatchesOnClickConfig matches left and right", () => {
  assert.equal(
    pointerEventMatchesOnClickConfig({ button: 0 }, { button: "left" }),
    true,
  );
  assert.equal(
    pointerEventMatchesOnClickConfig({ button: 2 }, { button: "right" }),
    true,
  );
  assert.equal(
    pointerEventMatchesOnClickConfig({ button: 0 }, { button: "right" }),
    false,
  );
});

test("readEventSetBooleanTarget defaults to true", () => {
  assert.equal(readEventSetBooleanTarget({}), true);
});

test("applyFlowEventActionsToNodes toggles event-toggle-glb-part visibility", () => {
  const nodes = [stubNode("part", "event-toggle-glb-part", { value: 1 })];
  const next = applyFlowEventActionsToNodes(nodes, ["part"]);
  assert.equal(readGlbPartVisibilityScalar(next[0]!.data.defaultConfig), 0);
  const again = applyFlowEventActionsToNodes(next, ["part"]);
  assert.equal(readGlbPartVisibilityScalar(again[0]!.data.defaultConfig), 1);
});

test("applyFlowEventActionsToNodes sets event-set-glb-part to setTo", () => {
  const nodes = [stubNode("set", "event-set-glb-part", { setTo: 1, value: 0 })];
  const next = applyFlowEventActionsToNodes(nodes, ["set"]);
  assert.equal(readGlbPartVisibilityScalar(next[0]!.data.defaultConfig), 1);
  const off = applyFlowEventActionsToNodes(
    [stubNode("set2", "event-set-glb-part", { setTo: 0, value: 1 })],
    ["set2"],
  );
  assert.equal(readGlbPartVisibilityScalar(off[0]!.data.defaultConfig), 0);
});

test("collectGlbScalarDrivesForModel includes event glb part nodes", () => {
  const nodes = [
    stubNode("part-toggle", "event-toggle-glb-part", {
      value: 1,
      sourceModelNodeId: "model-1",
      glbExtractKind: "part",
      glbExtractRef: "Door_L",
    }),
  ];
  const drives = collectGlbScalarDrivesForModel(nodes, "model-1");
  assert.equal(drives.parts["Door_L"], 1);
  const hidden = applyFlowEventActionsToNodes(nodes, ["part-toggle"]);
  const drives2 = collectGlbScalarDrivesForModel(hidden, "model-1");
  assert.equal(drives2.parts["Door_L"], 0);
});

test("readGlbPartSetVisibleTarget defaults to visible", () => {
  assert.equal(readGlbPartSetVisibleTarget({}), 1);
});

test("applyFlowEventActionsToNodes increments event-trigger-glb-anim triggerNonce", () => {
  const nodes = [stubNode("anim", "event-trigger-glb-anim", { triggerNonce: 0 })];
  const next = applyFlowEventActionsToNodes(nodes, ["anim"]);
  assert.equal(readGlbAnimTriggerNonce(next[0]!.data.defaultConfig), 1);
  const again = applyFlowEventActionsToNodes(next, ["anim"]);
  assert.equal(readGlbAnimTriggerNonce(again[0]!.data.defaultConfig), 2);
});

test("collectGlbEventAnimationDrivesForModel emits drive after trigger", () => {
  const idle = [
    stubNode("anim", "event-trigger-glb-anim", {
      triggerNonce: 0,
      sourceModelNodeId: "model-1",
      glbExtractKind: "animation",
      glbExtractRef: "Open",
    }),
  ];
  assert.deepEqual(collectGlbEventAnimationDrivesForModel(idle, "model-1"), {});
  const fired = applyFlowEventActionsToNodes(idle, ["anim"]);
  const drives = collectGlbEventAnimationDrivesForModel(fired, "model-1");
  assert.equal(drives["Open"]?.loopMode, "once");
  assert.equal(drives["Open"]?.restartNonce, 1);
  assert.equal(drives["Open"]?.holdTime, false);
});

test("collectGlbEventAnimationDrivesForModel scopes trigger via lone model-select fallback", () => {
  const nodes = [
    { id: "model-1", type: "studio" as const, position: { x: 0, y: 0 }, data: { label: "model", category: "utility" as const, nodeId: "model-select", defaultConfig: {}, liveValue: null, liveHistory: [] } },
    stubNode("anim", "event-trigger-glb-anim", {
      triggerNonce: 1,
      glbExtractKind: "animation",
      glbExtractRef: "Walk",
    }),
  ];
  const drives = collectGlbEventAnimationDrivesForModel(nodes, "model-1");
  assert.equal(drives["Walk"]?.restartNonce, 1);
});
