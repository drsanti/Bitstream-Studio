import assert from "node:assert/strict";
import { test } from "node:test";
import { isStageSceneObjectHidden } from "../../src/webview/sensor-studio/core/stage/stage-outliner-visibility";
import { sceneObjectSelectionKey } from "../../src/webview/sensor-studio/core/stage/scene-object-ref";

test("isStageSceneObjectHidden respects exact key and model root", () => {
  const modelRef = {
    kind: "glb-instance" as const,
    sourceNodeId: "model-a",
    objectPath: "Arm/Hand",
    modelIndex: 0,
  };
  const modelRootKey = sceneObjectSelectionKey({
    ...modelRef,
    objectPath: "(model)",
  });
  const hidden = new Set([modelRootKey]);

  assert.equal(isStageSceneObjectHidden(modelRef, hidden), true);
});

test("isStageSceneObjectHidden respects ancestor part paths", () => {
  const partRef = {
    kind: "glb-instance" as const,
    sourceNodeId: "model-a",
    objectPath: "Arm/Hand/Finger",
    modelIndex: 0,
  };
  const armKey = sceneObjectSelectionKey({
    ...partRef,
    objectPath: "Arm",
  });
  const hidden = new Set([armKey]);

  assert.equal(isStageSceneObjectHidden(partRef, hidden), true);
});

test("isStageSceneObjectHidden hides procedural mesh by exact key", () => {
  const ref = {
    kind: "procedural" as const,
    sourceNodeId: "mesh-box",
    objectPath: "proc:mesh-box",
    modelIndex: 0,
  };
  const hidden = new Set([sceneObjectSelectionKey(ref)]);

  assert.equal(isStageSceneObjectHidden(ref, hidden), true);
});
