import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flowNodeIdsForSceneObjectRef,
  sceneObjectRefFromStagePick,
  sceneObjectSelectionKey,
} from "../../src/webview/sensor-studio/core/stage/scene-object-ref.ts";

describe("scene-object-ref", () => {
  it("parses procedural pick paths", () => {
    const ref = sceneObjectRefFromStagePick({
      button: 0,
      modelIndex: 2,
      sourceNodeId: "mesh-box-1",
      hitPoint: { x: 0, y: 0, z: 0 },
      objectPath: "proc:mesh-box-1:3",
    });
    assert.equal(ref?.kind, "procedural");
    assert.equal(ref?.sourceNodeId, "mesh-box-1");
    assert.equal(ref?.meshLeafIndex, 3);
  });

  it("maps glb picks to glb-instance refs", () => {
    const ref = sceneObjectRefFromStagePick({
      button: 0,
      modelIndex: 0,
      sourceNodeId: "model-src-1",
      hitPoint: { x: 0, y: 0, z: 0 },
      objectPath: "Armature/Bone",
    });
    assert.equal(ref?.kind, "glb-instance");
    assert.equal(ref?.objectPath, "Armature/Bone");
  });

  it("flowNodeIdsForSceneObjectRef returns source node id", () => {
    const ref = sceneObjectRefFromStagePick({
      button: 0,
      modelIndex: 0,
      sourceNodeId: "mesh-sphere-2",
      hitPoint: { x: 0, y: 0, z: 0 },
      objectPath: "proc:mesh-sphere-2",
    });
    assert.ok(ref != null);
    assert.deepEqual(flowNodeIdsForSceneObjectRef(ref), ["mesh-sphere-2"]);
    assert.ok(sceneObjectSelectionKey(ref).includes("mesh-sphere-2"));
  });
});
