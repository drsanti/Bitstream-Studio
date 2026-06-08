import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogNodeHasStudioModelInput,
  resolveStudioModelScopeNodeId,
  STUDIO_HANDLE_MODEL,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";
import {
  flowAnimationWireFromAnimationClipEval,
  readAnimationClipName,
  readAnimationClipNodeConfig,
} from "../../src/webview/sensor-studio/features/editor/nodes/animation/animation-clip-config";

test("catalogNodeHasStudioModelInput includes animation-clip", () => {
  assert.equal(catalogNodeHasStudioModelInput("animation-clip"), true);
  assert.equal(catalogNodeHasStudioModelInput("event-trigger-glb-anim"), true);
  assert.equal(catalogNodeHasStudioModelInput("threshold"), false);
});

test("resolveStudioModelScopeNodeId prefers wired Model on animation-clip", () => {
  const nodes = [
    { id: "m1", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "m2", data: { nodeId: "model-select", defaultConfig: {} } },
    {
      id: "clip-1",
      data: {
        nodeId: "animation-clip",
        defaultConfig: { [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: "m1" },
      },
    },
  ];
  const edges = [
    {
      id: "e1",
      source: "m2",
      target: "clip-1",
      sourceHandle: "out",
      targetHandle: STUDIO_HANDLE_MODEL,
    },
  ];
  assert.equal(
    resolveStudioModelScopeNodeId({
      nodes,
      edges,
      defaultConfig: nodes[2]!.data.defaultConfig,
      flowNodeId: "clip-1",
      catalogNodeId: "animation-clip",
    }),
    "m2",
  );
});

test("readAnimationClipName prefers glb extract tag", () => {
  assert.equal(
    readAnimationClipName({
      glbExtractKind: "animation",
      glbExtractRef: "Walk",
      clipName: "Other",
    }),
    "Walk",
  );
});

test("flowAnimationWireFromAnimationClipEval builds single-clip wire", () => {
  const wire = flowAnimationWireFromAnimationClipEval({
    defaultConfig: {
      clipName: "Idle",
      timeS: 0.5,
      speed: 1.2,
      weight: 0.8,
      loopMode: "loop",
      enabled: true,
    },
  });
  assert.ok(wire != null);
  assert.equal(wire!.clips.Idle?.timeS, 0.5);
  assert.equal(wire!.clips.Idle?.speed, 1.2);
  assert.equal(wire!.clips.Idle?.weight, 0.8);
  assert.equal(wire!.clips.Idle?.loopMode, "loop");
  assert.equal(wire!.clips.Idle?.enabled, true);
});

test("flowAnimationWireFromAnimationClipEval wired inputs override config", () => {
  const wire = flowAnimationWireFromAnimationClipEval({
    defaultConfig: {
      clipName: "Spin",
      speed: 1,
      weight: 1,
      enabled: true,
    },
    wired: {
      speed: -2,
      weight: 0.25,
      enabled: false,
      timeS: 3,
    },
  });
  assert.ok(wire != null);
  assert.equal(wire!.clips.Spin?.speed, -2);
  assert.equal(wire!.clips.Spin?.weight, 0.25);
  assert.equal(wire!.clips.Spin?.enabled, false);
  assert.equal(wire!.clips.Spin?.timeS, 3);
});

test("flowAnimationWireFromAnimationClipEval returns null without clip name", () => {
  assert.equal(
    flowAnimationWireFromAnimationClipEval({ defaultConfig: {} }),
    null,
  );
  assert.equal(readAnimationClipNodeConfig({}).clipName, "");
});
