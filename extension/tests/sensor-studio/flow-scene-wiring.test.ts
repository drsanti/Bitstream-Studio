import assert from "node:assert/strict";
import test from "node:test";

import {
  collectFlowMorphTargetDrivesForModel,
  collectFlowSceneLightGlbDrivesForModel,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import {
  collectFlowCameraSwitchIndexForModel,
  collectFlowCameraSwitchRigForModel,
  collectFlowMorphTargetDrivesForModel,
  collectFlowSceneLightGlbDrivesForModel,
} from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-flow-drives";
import { resolveGlbCameraDrivesWithSwitch } from "../../src/webview/sensor-studio/features/editor/gltf/studio-glb-preview-runtime";
import { mergeFlowSceneWiresIntoScene3d } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/merge-flow-scene-wires";
import { flowWireFogFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-fog";
import { flowWireStudioLightFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-studio-light";
import { flowWirePostProcessingFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-post-processing";
import { flowWireContactShadowsFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-contact-shadows";
import { flowWireParticleEmitterFromEval } from "../../src/webview/sensor-studio/features/editor/nodes/scene-fx/flow-wire-particle-emitter";
import { defaultScene3DConfig } from "../../src/webview/sensor-studio/core/scene3d/scene3d-config";

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

test("mergeFlowSceneWiresIntoScene3d applies post-processing and contact shadows", () => {
  const base = defaultScene3DConfig();
  const postWire = flowWirePostProcessingFromEval(
    { bloomIntensity: 2.5, bloomThreshold: 0.8 },
    { enabled: true, enableBloom: true },
  );
  const shadowWire = flowWireContactShadowsFromEval(
    { opacity: 0.6, blur: 3, far: 12, scale: 8 },
    { enabled: true, color: "#333333" },
  );
  const merged = mergeFlowSceneWiresIntoScene3d(base, {
    postProcessing: postWire,
    contactShadows: shadowWire,
  });
  assert.equal(merged.postProcessing.enabled, true);
  assert.equal(merged.postProcessing.enableBloom, true);
  assert.equal(merged.postProcessing.bloomIntensity, 2.5);
  assert.equal(merged.postProcessing.bloomThreshold, 0.8);
  assert.equal(merged.contactShadows.enabled, true);
  assert.equal(merged.contactShadows.opacity, 0.6);
  assert.equal(merged.contactShadows.blur, 3);
  assert.equal(merged.contactShadows.scale, 8);
  assert.equal(merged.contactShadows.colorHex, "#333333");
});

test("mergeFlowSceneWiresIntoScene3d applies particle emitter wire", () => {
  const base = defaultScene3DConfig();
  const emitterWire = flowWireParticleEmitterFromEval(
    { trigger: 1, rate: 2 },
    { enabled: true, preset: "steam", life: 2, color: "#aabbcc", target: "Nozzle" },
  );
  const merged = mergeFlowSceneWiresIntoScene3d(base, { particleEmitter: emitterWire });
  assert.equal(merged.particleEmitter.enabled, true);
  assert.equal(merged.particleEmitter.preset, "steam");
  assert.equal(merged.particleEmitter.trigger, 1);
  assert.equal(merged.particleEmitter.rate, 2);
  assert.equal(merged.particleEmitter.colorHex, "#aabbcc");
  assert.equal(merged.particleEmitter.target, "Nozzle");
});

test("collectFlowCameraSwitchIndexForModel reads scoped camera-switch live index", () => {
  const index = collectFlowCameraSwitchIndexForModel(
    [
      {
        id: "cs1",
        data: {
          nodeId: "camera-switch",
          defaultConfig: { index: 0, sourceModelNodeId: "model1" },
          liveValue: 2,
        },
      },
    ],
    "model1",
  );
  assert.equal(index, 2);
});

test("resolveGlbCameraDrivesWithSwitch maps slot index to one-hot drive", () => {
  const drives = resolveGlbCameraDrivesWithSwitch({}, 1, ["CamA", "CamB", "CamC"], []);
  assert.deepEqual(drives, { CamB: 1 });
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
