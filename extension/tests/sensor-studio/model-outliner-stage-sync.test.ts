import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveExtractRowFromStageObjectPath,
  stagePickMatchesOutlinerParent,
} from "../../src/webview/sensor-studio/features/editor/model-outliner/model-outliner-stage-sync";
import type { StudioGltfExtractionResult } from "../../src/webview/sensor-studio/features/editor/gltf/studio-gltf-extract";

const extraction: StudioGltfExtractionResult = {
  animations: [],
  parts: [{ kind: "part", ref: "Drone/Arm_L", label: "Arm_L" }],
  materials: [],
  morphs: [],
  lights: [{ kind: "light", ref: "KeyLight", label: "KeyLight" }],
  cameras: [],
  sceneTree: [],
  objectDetailsByPath: {},
  materialDetailsByName: {},
};

test("resolveExtractRowFromStageObjectPath matches part paths", () => {
  const row = resolveExtractRowFromStageObjectPath("Drone/Arm_L", extraction);
  assert.equal(row?.kind, "part");
  assert.equal(row?.ref, "Drone/Arm_L");
});

test("resolveExtractRowFromStageObjectPath matches lights by leaf name", () => {
  const row = resolveExtractRowFromStageObjectPath("Rig/KeyLight", extraction);
  assert.equal(row?.kind, "light");
  assert.equal(row?.ref, "KeyLight");
});

test("stagePickMatchesOutlinerParent compares source node id", () => {
  assert.equal(
    stagePickMatchesOutlinerParent(
      {
        button: 0,
        modelIndex: 0,
        sourceNodeId: "ms-1",
        hitPoint: { x: 0, y: 0, z: 0 },
        objectPath: "Arm",
      },
      "ms-1",
    ),
    true,
  );
  assert.equal(
    stagePickMatchesOutlinerParent(
      {
        button: 0,
        modelIndex: 0,
        sourceNodeId: "ms-2",
        hitPoint: { x: 0, y: 0, z: 0 },
        objectPath: "Arm",
      },
      "ms-1",
    ),
    false,
  );
});
