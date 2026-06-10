import { strict as assert } from "node:assert";
import test from "node:test";

import {
  isDiagram3dGizmoTarget,
  isSceneNodeSelected,
  pickSceneNodeSelection,
  primarySceneSelection,
  resolveSceneActiveNodeId,
  resolveSceneSelectionIds,
} from "../../src/webview/course-studio/runtime/scene/courseSceneSelection";
import { parseSceneV1 } from "../../src/webview/course-studio/schemas/scene.v1";
import {
  clearScene3dSelectionParent,
  groupScene3dSelection,
  parentScene3dSelectionToActive,
  parentScene3dSelectionToGroup,
} from "../../src/webview/course-studio/runtime/scene/scene3dHierarchyOps";
import { computeDiagram3dNodeWorldMatrix } from "../../src/webview/course-studio/runtime/diagram/diagram3dHierarchyTransform";
import { sceneV1ToDiagramV1 } from "../../src/webview/course-studio/runtime/scene/sceneDiagramBridge";

test("resolveSceneSelectionIds prefers multi-select list", () => {
  assert.deepEqual(resolveSceneSelectionIds(["a", "b"], "c"), ["a", "b"]);
  assert.deepEqual(resolveSceneSelectionIds([], "c"), ["c"]);
  assert.deepEqual(resolveSceneSelectionIds(undefined, null), []);
});

test("pickSceneNodeSelection uses last clicked as active", () => {
  assert.deepEqual(pickSceneNodeSelection([], "a", false), {
    selected: ["a"],
    active: "a",
  });
  assert.deepEqual(pickSceneNodeSelection(["a", "b"], "b", false), {
    selected: ["a", "b"],
    active: "b",
  });
  assert.deepEqual(pickSceneNodeSelection(["a"], "b", true), {
    selected: ["a", "b"],
    active: "b",
  });
});

test("primarySceneSelection returns last selected id", () => {
  assert.equal(primarySceneSelection(["a", "b"]), "b");
});

test("gizmo targets active node only", () => {
  assert.equal(resolveSceneActiveNodeId("b", ["a", "b"]), "b");
  assert.equal(isDiagram3dGizmoTarget("b", "b"), true);
  assert.equal(isDiagram3dGizmoTarget("a", "b"), false);
  assert.equal(isSceneNodeSelected(["a", "b"], "a"), true);
});

test("groupScene3dSelection nests selected nodes under new group", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      { id: "box-a", type: "model", modelId: "procedural-box" },
      { id: "box-b", type: "model", modelId: "procedural-box" },
    ],
  });

  const result = groupScene3dSelection(scene, ["box-a", "box-b"]);
  assert.ok(result != null);
  assert.equal(result.scene.nodes.length, 1);
  assert.equal(result.scene.nodes[0]?.type, "group3d");
  if (result.scene.nodes[0]?.type === "group3d") {
    assert.equal(result.scene.nodes[0].children.length, 2);
  }
});

test("parentScene3dSelectionToGroup reparents under active group", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      { id: "grp", type: "group3d", children: [] },
      { id: "box-a", type: "model", modelId: "procedural-box" },
    ],
  });

  const next = parentScene3dSelectionToGroup(scene, ["box-a"], "grp");
  assert.ok(next != null);
  const group = next.nodes.find((node) => node.id === "grp");
  assert.equal(group?.type, "group3d");
  if (group?.type === "group3d") {
    assert.equal(group.children[0]?.id, "box-a");
  }
});

test("clearScene3dSelectionParent keep transform preserves world position", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      {
        id: "grp",
        type: "group3d",
        position: { x: 3, y: 0, z: 0 },
        children: [
          {
            id: "child",
            type: "model",
            modelId: "procedural-box",
            position: { x: 2, y: 0, z: 0 },
          },
        ],
      },
    ],
  });

  const diagramBefore = sceneV1ToDiagramV1(scene);
  const worldBefore = computeDiagram3dNodeWorldMatrix(diagramBefore, "child");
  assert.ok(worldBefore != null);

  const next = clearScene3dSelectionParent(scene, ["child"], "keepTransform");
  assert.ok(next != null);
  assert.equal(next.nodes.length, 2);

  const diagramAfter = sceneV1ToDiagramV1(next);
  const worldAfter = computeDiagram3dNodeWorldMatrix(diagramAfter, "child");
  assert.ok(worldAfter != null);
  assert.ok(worldBefore.equals(worldAfter));
});

test("clearScene3dSelectionParent moves nodes to root", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      {
        id: "grp",
        type: "group3d",
        children: [{ id: "box-a", type: "model", modelId: "procedural-box" }],
      },
    ],
  });

  const next = clearScene3dSelectionParent(scene, ["box-a"]);
  assert.ok(next != null);
  assert.equal(next.nodes.length, 2);
});

test("clearScene3dSelectionParent clearInverse keeps parent and world position", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      {
        id: "grp",
        type: "group3d",
        position: { x: 3, y: 0, z: 0 },
        children: [
          {
            id: "child",
            type: "model",
            modelId: "procedural-box",
            position: { x: 2, y: 0, z: 0 },
          },
        ],
      },
    ],
  });

  const diagramBefore = sceneV1ToDiagramV1(scene);
  const worldBefore = computeDiagram3dNodeWorldMatrix(diagramBefore, "child");
  assert.ok(worldBefore != null);

  const next = clearScene3dSelectionParent(scene, ["child"], "clearInverse");
  assert.ok(next != null);
  assert.equal(next.nodes.length, 1);
  const group = next.nodes[0];
  assert.equal(group?.type, "group3d");
  if (group?.type === "group3d") {
    assert.equal(group.children[0]?.id, "child");
  }

  const diagramAfter = sceneV1ToDiagramV1(next);
  const worldAfter = computeDiagram3dNodeWorldMatrix(diagramAfter, "child");
  assert.ok(worldAfter != null);
  assert.ok(worldBefore.equals(worldAfter));
});

test("parentScene3dSelectionToActive wraps active model as Blender object parent", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      { id: "parent-box", type: "model", modelId: "procedural-box" },
      { id: "child-box", type: "model", modelId: "procedural-box" },
    ],
  });

  const result = parentScene3dSelectionToActive(scene, ["child-box"], "parent-box", "object");
  assert.ok(result != null);
  assert.equal(result.wrappedActive, true);
  const wrapper = result.scene.nodes.find(
    (node) => node.type === "group3d" && node.id === result.parentGroupId,
  );
  assert.equal(wrapper?.type, "group3d");
  if (wrapper?.type === "group3d") {
    assert.equal(wrapper.children.some((child) => child.id === "parent-box"), true);
    assert.equal(wrapper.children.some((child) => child.id === "child-box"), true);
  }
});

test("parentScene3dSelectionToActive keep transform preserves world position", () => {
  const scene = parseSceneV1({
    version: 1,
    id: "scene-test",
    title: "Test",
    nodes: [
      { id: "grp", type: "group3d", children: [] },
      {
        id: "child",
        type: "model",
        modelId: "procedural-box",
        position: { x: 5, y: 0, z: 0 },
      },
    ],
  });

  const diagramBefore = sceneV1ToDiagramV1(scene);
  const worldBefore = computeDiagram3dNodeWorldMatrix(diagramBefore, "child");
  assert.ok(worldBefore != null);

  const result = parentScene3dSelectionToActive(scene, ["child"], "grp", "keepTransform");
  assert.ok(result != null);

  const diagramAfter = sceneV1ToDiagramV1(result.scene);
  const worldAfter = computeDiagram3dNodeWorldMatrix(diagramAfter, "child");
  assert.ok(worldAfter != null);
  assert.ok(worldBefore.equals(worldAfter));
});
