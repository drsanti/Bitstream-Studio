import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildStageSceneOutlinerRows,
  isStageSceneOutlinerRowSelected,
  sceneObjectRefForStageMeshEntry,
  stageSceneOutlinerRowMatchesSearch,
} from "../../src/webview/sensor-studio/core/stage/build-stage-scene-outliner-rows";
import { sceneObjectSelectionKey } from "../../src/webview/sensor-studio/core/stage/scene-object-ref";
import type { StageSceneSnapshotV1 } from "../../src/webview/sensor-studio/core/stage/stage-scene-snapshot";
import { EMPTY_STAGE_SCENE_SNAPSHOT } from "../../src/webview/sensor-studio/core/stage/stage-scene-snapshot";

function snapshotWithCommit(
  partial: Partial<StageSceneSnapshotV1> = {},
): StageSceneSnapshotV1 {
  return {
    ...EMPTY_STAGE_SCENE_SNAPSHOT,
    sceneOutputNodeId: "scene-out-1",
    updatedAtMs: 1,
    ...partial,
  };
}

test("buildStageSceneOutlinerRows lists models and meshes from snapshot", () => {
  const snapshot = snapshotWithCommit({
    models: [
      {
        sourceNodeId: "model-a",
        label: "Robot",
        modelUrl: "robot.glb",
      },
    ],
    meshes: [
      {
        sourceNodeId: "mesh-box",
        label: "Floor",
        wire: { version: 1, kind: "plane" },
      },
    ],
  });

  const rows = buildStageSceneOutlinerRows({
    snapshot,
    lastViewportPick: null,
    selectedSceneObject: null,
  });

  const sceneOutput = rows.find((r) => r.kind === "scene-output");
  assert.ok(sceneOutput);
  assert.equal(sceneOutput!.focusFlowNodeId, "scene-out-1");
  assert.equal(rows.some((r) => r.kind === "model" && r.label === "Robot"), true);
  assert.equal(rows.some((r) => r.kind === "mesh" && r.label === "Floor"), true);
});

test("buildStageSceneOutlinerRows adds pick row when selection is not in flat list", () => {
  const snapshot = snapshotWithCommit({
    models: [
      {
        sourceNodeId: "model-a",
        label: "Robot",
        modelUrl: "robot.glb",
      },
    ],
  });
  const selected = {
    kind: "glb-instance" as const,
    sourceNodeId: "model-a",
    objectPath: "Arm/Hand",
    modelIndex: 0,
  };

  const rows = buildStageSceneOutlinerRows({
    snapshot,
    lastViewportPick: null,
    selectedSceneObject: selected,
  });

  const pickRow = rows.find((r) => r.kind === "pick");
  assert.ok(pickRow);
  assert.equal(pickRow!.subtitle, "Arm/Hand");
});

test("sceneObjectRefForStageMeshEntry uses proc object paths", () => {
  const ref = sceneObjectRefForStageMeshEntry(
    {
      sourceNodeId: "box-1",
      label: "Box",
      wire: { version: 1, kind: "box" },
      meshLeafIndex: 2,
    },
    0,
  );
  assert.equal(ref.objectPath, "proc:box-1:2");
  assert.equal(ref.kind, "procedural");
});

test("isStageSceneOutlinerRowSelected matches scene object keys", () => {
  const ref = sceneObjectRefForStageMeshEntry(
    {
      sourceNodeId: "box-1",
      label: "Box",
      wire: { version: 1, kind: "box" },
    },
    0,
  );
  const row = {
    id: "mesh:box-1:0",
    label: "Box",
    subtitle: "box",
    kind: "mesh" as const,
    sceneObjectRef: ref,
    modelIndex: 0,
    focusFlowNodeId: null,
  };
  assert.equal(isStageSceneOutlinerRowSelected(row, ref), true);
  assert.equal(
    isStageSceneOutlinerRowSelected(row, {
      ...ref,
      objectPath: "proc:other",
    }),
    false,
  );
  assert.equal(sceneObjectSelectionKey(ref).length > 0, true);
});

test("stageSceneOutlinerRowMatchesSearch filters by label and subtitle", () => {
  const row = {
    id: "model:a:0",
    label: "Robot arm",
    subtitle: "GLB model",
    kind: "model" as const,
    sceneObjectRef: null,
    modelIndex: 0,
    focusFlowNodeId: null,
  };
  assert.equal(stageSceneOutlinerRowMatchesSearch(row, ""), true);
  assert.equal(stageSceneOutlinerRowMatchesSearch(row, "robot"), true);
  assert.equal(stageSceneOutlinerRowMatchesSearch(row, "floor"), false);
});
