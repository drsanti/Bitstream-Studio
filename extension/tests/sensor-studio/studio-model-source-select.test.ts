import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudioModelSourceSelectOptions,
  GLB_MODEL_SOURCE_UNBOUND,
  resolveUnwiredStudioModelSourceSelectValue,
  resolveWiredStudioModelFlowId,
} from "../../src/webview/sensor-studio/features/editor/model/studio-model-source-select";
import {
  STUDIO_HANDLE_MODEL,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../src/webview/sensor-studio/features/editor/model/model-generated-bindings";

test("resolveWiredStudioModelFlowId follows Model socket on animation-clip", () => {
  const nodes = [
    { id: "m1", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "m2", data: { nodeId: "model-select", defaultConfig: {} } },
    { id: "clip-1", data: { nodeId: "animation-clip", defaultConfig: {} } },
  ];
  const edges = [
    {
      source: "m2",
      target: "clip-1",
      sourceHandle: "out",
      targetHandle: STUDIO_HANDLE_MODEL,
    },
  ];
  assert.equal(resolveWiredStudioModelFlowId("clip-1", nodes, edges), "m2");
  assert.equal(resolveWiredStudioModelFlowId("clip-1", nodes, []), undefined);
});

test("resolveUnwiredStudioModelSourceSelectValue prefers config then sole canvas model", () => {
  const nodes = [
    {
      id: "m1",
      data: {
        nodeId: "model-select",
        defaultConfig: { selectedModelUrl: "models/a.glb" },
      },
    },
    {
      id: "m2",
      data: {
        nodeId: "model-select",
        defaultConfig: { selectedModelUrl: "models/b.glb" },
      },
    },
  ];
  assert.equal(
    resolveUnwiredStudioModelSourceSelectValue(
      { [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: "m2" },
      nodes,
    ),
    "m2",
  );
  assert.equal(
    resolveUnwiredStudioModelSourceSelectValue({}, [{ ...nodes[0]! }]),
    "m1",
  );
  assert.equal(resolveUnwiredStudioModelSourceSelectValue({}, nodes), GLB_MODEL_SOURCE_UNBOUND);
});

test("buildStudioModelSourceSelectOptions lists canvas model-select nodes", () => {
  const nodes = [
    {
      id: "m1",
      data: {
        nodeId: "model-select",
        label: "Drone A",
        defaultConfig: { selectedModelUrl: "models/tesa-drone/tesa-drone.glb" },
      },
    },
    { id: "clip-1", data: { nodeId: "animation-clip", defaultConfig: {} } },
  ];
  const options = buildStudioModelSourceSelectOptions(nodes, []);
  assert.equal(options.length, 1);
  assert.equal(options[0]!.value, "m1");
  assert.match(options[0]!.label, /tesa-drone|Drone A/i);
});
