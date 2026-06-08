import assert from "node:assert/strict";
import test from "node:test";

import {
  formatStudioGltfVec3,
  resolveModelOutlinerDetail,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-object-detail";
import type { StudioGltfExtractionResult } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const extraction: StudioGltfExtractionResult = {
  animations: [],
  parts: [{ kind: "part", ref: "Drone/Arm_L", label: "Arm_L" }],
  materials: [{ kind: "material", ref: "BodyMat", label: "BodyMat" }],
  morphs: [],
  lights: [],
  cameras: [],
  sceneTree: [],
  objectDetailsByPath: {
    "Drone/Arm_L": {
      path: "Drone/Arm_L",
      nodeType: "mesh",
      transform: {
        position: { x: 1, y: 2, z: 3 },
        rotationDeg: { x: 0, y: 90, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      materialSlotNames: ["BodyMat"],
      morphTargetNames: [],
    },
  },
  materialDetailsByName: {
    BodyMat: {
      name: "BodyMat",
      usedOnMeshPaths: ["Drone/Arm_L"],
      occupiedTextureSlots: ["map", "normalMap"],
      metalness: 0.5,
      roughness: 0.25,
    },
  },
};

test("resolveModelOutlinerDetail resolves part transform from scene path", () => {
  const detail = resolveModelOutlinerDetail(extraction, null, "Drone/Arm_L");
  assert.equal(detail.objectDetail?.path, "Drone/Arm_L");
  assert.equal(detail.objectDetail?.transform.position.x, 1);
  assert.equal(detail.materialDetail, null);
});

test("resolveModelOutlinerDetail resolves material slot breakdown", () => {
  const detail = resolveModelOutlinerDetail(extraction, extraction.materials[0]!, null);
  assert.equal(detail.materialDetail?.name, "BodyMat");
  assert.deepEqual(detail.materialDetail?.occupiedTextureSlots, ["map", "normalMap"]);
  assert.equal(detail.objectDetail?.path, "Drone/Arm_L");
});

test("formatStudioGltfVec3 formats with fixed digits", () => {
  assert.equal(formatStudioGltfVec3({ x: 1.234, y: 2, z: -3.1 }), "1.23, 2.00, -3.10");
});
