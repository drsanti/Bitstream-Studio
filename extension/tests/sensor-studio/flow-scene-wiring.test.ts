import assert from "node:assert/strict";
import test from "node:test";

import {
  collectFlowMorphTargetDrivesForModel,
  collectFlowSceneLightGlbDrivesForModel,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import { mergeFlowSceneWiresIntoScene3d } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/merge-flow-scene-wires";
import { flowWireFogFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-fog";
import { flowWireStudioLightFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-studio-light";
import { defaultScene3DConfig } from "../../src/webview/sensor-studio/features/editor/nodes/rotation/scene3d-config";

test("mergeFlowSceneWiresIntoScene3d applies exposure fog and studio light", () => {
  const base = defaultScene3DConfig();
  const fogWire = flowWireFogFromEval({ near: 2, far: 40, density: 0.1 }, { mode: "linear" });
  const lightWire = flowWireStudioLightFromEval(
    { intensity: 2, r: 1, g: 0, b: 0, x: 1, y: 2, z: 3 },
    { lightType: "point" },
  );
  const merged = mergeFlowSceneWiresIntoScene3d(base, {
    exposure: 1.2,
    fog: fogWire,
    studioLight: lightWire,
  });
  assert.equal(merged.renderer.toneMappingExposure, 1.2);
  assert.equal(merged.fog.enabled, true);
  assert.equal(merged.fog.near, 2);
  assert.equal(merged.lights.directionals[0]?.id, "flow-studio-light");
  assert.equal(merged.lights.directionals[0]?.intensity, 2);
});

test("collectFlowMorphTargetDrivesForModel reads morph-target nodes", () => {
  const drives = collectFlowMorphTargetDrivesForModel(
    [
      {
        id: "m1",
        data: {
          nodeId: "morph-target",
          defaultConfig: { morphTargetId: "Head:Smile", sourceModelNodeId: "model1", value: 0 },
          liveValue: 0.75,
        },
      },
    ],
    "model1",
  );
  assert.equal(drives["Head:Smile"], 0.75);
});

test("collectFlowSceneLightGlbDrivesForModel reads scene-light target", () => {
  const drives = collectFlowSceneLightGlbDrivesForModel(
    [
      {
        id: "l1",
        data: {
          nodeId: "scene-light",
          defaultConfig: { lightTarget: "KeyLight", sourceModelNodeId: "model1", intensity: 1 },
          liveValue: 3,
        },
      },
    ],
    "model1",
  );
  assert.equal(drives.KeyLight, 3);
});
