import assert from "node:assert/strict";
import test from "node:test";
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";

import { parseSceneV1 } from "../../src/webview/course-studio/schemas/scene.v1";
import { sceneV1ToDiagramV1 } from "../../src/webview/course-studio/runtime/scene/sceneDiagramBridge";
import { computeDiagram3dNodeWorldMatrix } from "../../src/webview/course-studio/runtime/diagram/diagram3dHierarchyTransform";
import {
  applyScene3dMultiGizmoPatches,
  buildScene3dMultiPivotTransformPatches,
  buildScene3dMultiTranslatePatches,
  captureScene3dMultiGizmoSnapshot,
  computeScene3dMultiPivotPreviewWorldMatrices,
} from "../../src/webview/course-studio/runtime/scene/scene3dMultiGizmoTransform";
import {
  computeScene3dSelectionPivotWorldMatrix,
  computeScene3dSelectionWorldBounds,
} from "../../src/webview/course-studio/runtime/scene/scene3dSelectionPivot";
import {
  mergeScene3dViewportBoxSelection,
  normalizeScene3dViewportScreenRect,
  projectWorldPointToViewport,
  scene3dViewportMarqueeIsDrag,
  scene3dViewportPointInRect,
  shouldStartScene3dViewportMarquee,
} from "../../src/webview/course-studio/runtime/scene/scene3dViewportBoxSelection";

test("buildScene3dMultiPivotTransformPatches moves all selected by pivot translation", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-pivot",
    title: "Pivot",
    nodes: [
      { id: "box-a", type: "model", modelId: "procedural-box", position: { x: 0, y: 0, z: 0 } },
      { id: "box-b", type: "model", modelId: "procedural-box", position: { x: 2, y: 0, z: 0 } },
    ],
  });
  const diagram = sceneV1ToDiagramV1(scene);
  const snapshot = captureScene3dMultiGizmoSnapshot(scene, ["box-a", "box-b"]);
  assert.ok(snapshot != null);

  const pivotStart = computeScene3dSelectionPivotWorldMatrix(diagram, ["box-a", "box-b"], "box-b");
  assert.ok(pivotStart != null);
  const pivotEnd = pivotStart.clone().setPosition(
    new Vector3().setFromMatrixPosition(pivotStart).add(new Vector3(0, 1, 0)),
  );

  const patches = buildScene3dMultiPivotTransformPatches(
    scene,
    snapshot,
    pivotStart,
    pivotEnd,
    ["box-a", "box-b"],
  );
  const next = applyScene3dMultiGizmoPatches(scene, patches);
  const nextDiagram = sceneV1ToDiagramV1(next);
  const worldA = computeDiagram3dNodeWorldMatrix(nextDiagram, "box-a");
  const worldB = computeDiagram3dNodeWorldMatrix(nextDiagram, "box-b");
  assert.ok(worldA != null && worldB != null);

  const posA = new Vector3();
  const posB = new Vector3();
  const quat = new Quaternion();
  const scale = new Vector3();
  worldA.decompose(posA, quat, scale);
  worldB.decompose(posB, quat, scale);

  assert.equal(Math.round(posA.y * 1000), 1000);
  assert.equal(Math.round(posB.y * 1000), 1000);
});

test("computeScene3dSelectionWorldBounds centers pivot between separated meshes", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-bounds",
    title: "Bounds",
    nodes: [
      { id: "low", type: "model", modelId: "procedural-sphere", position: { x: 0, y: 0, z: 0 } },
      { id: "high", type: "model", modelId: "procedural-cylinder", position: { x: 0, y: 3, z: 0 } },
    ],
  });
  const diagram = sceneV1ToDiagramV1(scene);
  const bounds = computeScene3dSelectionWorldBounds(diagram, ["low", "high"]);
  assert.ok(bounds != null);
  const center = bounds.getCenter(new Vector3());
  assert.ok(center.y > 0.8 && center.y < 2.2);

  const pivot = computeScene3dSelectionPivotWorldMatrix(diagram, ["low", "high"], "high");
  assert.ok(pivot != null);
  const pivotPos = new Vector3().setFromMatrixPosition(pivot);
  assert.ok(Math.abs(pivotPos.y - center.y) < 0.01);
});

test("computeScene3dMultiPivotPreviewWorldMatrices matches commit patches for translation", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-preview",
    title: "Preview",
    nodes: [
      { id: "a", type: "model", modelId: "procedural-box", position: { x: 0, y: 0, z: 0 } },
      { id: "b", type: "model", modelId: "procedural-box", position: { x: 1, y: 0, z: 0 } },
    ],
  });
  const snapshot = captureScene3dMultiGizmoSnapshot(scene, ["a", "b"]);
  assert.ok(snapshot != null);
  const pivotStart = new Matrix4();
  const pivotEnd = new Matrix4().makeTranslation(0, 2, 0);
  const preview = computeScene3dMultiPivotPreviewWorldMatrices(snapshot, pivotStart, pivotEnd, ["a", "b"]);
  const patches = buildScene3dMultiPivotTransformPatches(scene, snapshot, pivotStart, pivotEnd, ["a", "b"]);
  const next = applyScene3dMultiGizmoPatches(scene, patches);
  const diagram = sceneV1ToDiagramV1(next);
  for (const id of ["a", "b"] as const) {
    const committed = computeDiagram3dNodeWorldMatrix(diagram, id);
    assert.ok(committed != null);
    const posCommitted = new Vector3();
    const quat = new Quaternion();
    const scale = new Vector3();
    committed.decompose(posCommitted, quat, scale);
    const posPreview = new Vector3();
    preview[id]!.decompose(posPreview, quat, scale);
    assert.ok(posCommitted.distanceTo(posPreview) < 0.001);
  }
});

test("buildScene3dMultiTranslatePatches moves all selected by same world delta", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      { id: "box-a", type: "model", modelId: "procedural-box", position: { x: 0, y: 0, z: 0 } },
      { id: "box-b", type: "model", modelId: "procedural-box", position: { x: 2, y: 0, z: 0 } },
    ],
  });

  const snapshot = captureScene3dMultiGizmoSnapshot(scene, ["box-a", "box-b"]);
  assert.ok(snapshot != null);

  const patches = buildScene3dMultiTranslatePatches(
    scene,
    snapshot,
    "box-a",
    [1, 0, 0],
    ["box-a", "box-b"],
  );
  const next = applyScene3dMultiGizmoPatches(scene, patches);
  const diagram = sceneV1ToDiagramV1(next);
  const worldA = computeDiagram3dNodeWorldMatrix(diagram, "box-a");
  const worldB = computeDiagram3dNodeWorldMatrix(diagram, "box-b");
  assert.ok(worldA != null && worldB != null);

  const posA = new Vector3();
  const posB = new Vector3();
  const quatA = new Quaternion();
  const quatB = new Quaternion();
  const scaleA = new Vector3();
  const scaleB = new Vector3();
  worldA.decompose(posA, quatA, scaleA);
  worldB.decompose(posB, quatB, scaleB);

  const beforePosA = new Vector3();
  const beforePosB = new Vector3();
  const quat = new Quaternion();
  const scale = new Vector3();
  snapshot.worldMatrices["box-a"]!.decompose(beforePosA, quat, scale);
  snapshot.worldMatrices["box-b"]!.decompose(beforePosB, quat, scale);

  assert.equal(Math.round((posA.x - beforePosA.x) * 1000), 1000);
  assert.equal(Math.round((posB.x - beforePosB.x) * 1000), 1000);
});

test("mergeScene3dViewportBoxSelection supports additive shift extend", () => {
  const merged = mergeScene3dViewportBoxSelection(["a"], ["b", "c"], true);
  assert.deepEqual(merged.selected.sort(), ["a", "b", "c"]);
  assert.equal(merged.active, "c");
});

test("shouldStartScene3dViewportMarquee skips Alt orbit and Alt+Shift pan", () => {
  assert.equal(shouldStartScene3dViewportMarquee({ altKey: false } as PointerEvent), true);
  assert.equal(shouldStartScene3dViewportMarquee({ altKey: true } as PointerEvent), false);
});

test("scene3d viewport marquee helpers", () => {
  const rect = normalizeScene3dViewportScreenRect({ x: 10, y: 20 }, { x: 30, y: 50 });
  assert.equal(rect.x, 10);
  assert.equal(rect.y, 20);
  assert.equal(rect.width, 20);
  assert.equal(rect.height, 30);
  assert.equal(scene3dViewportMarqueeIsDrag(rect), true);
  assert.equal(scene3dViewportPointInRect({ x: 15, y: 25 }, rect), true);
});

test("projectWorldPointToViewport maps origin in front of camera", () => {
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const screen = projectWorldPointToViewport(new Vector3(0, 0, 0), camera, 200, 200);
  assert.ok(screen.x > 90 && screen.x < 110);
  assert.ok(screen.y > 90 && screen.y < 110);
});
