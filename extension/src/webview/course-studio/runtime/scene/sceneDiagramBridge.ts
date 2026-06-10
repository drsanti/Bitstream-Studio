import { type DiagramLayerV1, type DiagramV1 } from "../../schemas/diagram.v1";
import { getDiagram3dLayer } from "../../schemas/normalizeDiagramV1";
import { parseSceneV1, type SceneV1 } from "../../schemas/scene.v1";
import {
  addDiagram3dNode,
  addDiagram3dNodeToParent,
  duplicateDiagram3dNode,
  listDiagram3dNodes,
  moveDiagram3dNodeToParent,
  patchDiagram3dCamera,
  patchDiagram3dNode,
  removeDiagram3dNode,
  resetDiagram3dCamera,
  type Diagram3dCameraPatch,
  type Diagram3dNodeListEntry,
  type Diagram3dNodePatch,
} from "../diagram/diagram3dNodeMutations";
import type { Diagram3dNodeV1 } from "../../schemas/diagram.v1";

export function sceneV1ToDiagramV1(scene: SceneV1): DiagramV1 {
  const layer3d: Extract<DiagramLayerV1, { kind: "3d" }> = {
    kind: "3d",
    nodes: scene.nodes,
    ...(scene.camera != null ? { camera: scene.camera } : {}),
  };
  return {
    version: 1,
    id: scene.id,
    title: scene.title,
    linkHealth: scene.linkHealth,
    viewBox: [0, 0, 360, 360],
    layers: [layer3d],
    nodes: [],
  };
}

export function mergeDiagram3dIntoScene(scene: SceneV1, diagram: DiagramV1): SceneV1 {
  const layer = getDiagram3dLayer(diagram);
  if (layer == null) {
    return parseSceneV1({
      ...scene,
      nodes: [],
    });
  }
  return parseSceneV1({
    ...scene,
    nodes: layer.nodes,
    camera: layer.camera ?? scene.camera,
  });
}

export function listScene3dNodes(scene: SceneV1): Diagram3dNodeListEntry[] {
  return listDiagram3dNodes(sceneV1ToDiagramV1(scene));
}

export function patchScene3dNode(
  scene: SceneV1,
  nodeId: string,
  patch: Diagram3dNodePatch,
): SceneV1 {
  return mergeDiagram3dIntoScene(scene, patchDiagram3dNode(sceneV1ToDiagramV1(scene), nodeId, patch));
}

export function patchSceneCamera(scene: SceneV1, patch: Diagram3dCameraPatch): SceneV1 {
  return mergeDiagram3dIntoScene(scene, patchDiagram3dCamera(sceneV1ToDiagramV1(scene), patch));
}

export function resetSceneCamera(scene: SceneV1): SceneV1 {
  return mergeDiagram3dIntoScene(scene, resetDiagram3dCamera(sceneV1ToDiagramV1(scene)));
}

export function addScene3dNode(
  scene: SceneV1,
  node: Diagram3dNodeV1,
  parentGroupId: string | null = null,
): SceneV1 {
  const diagram = sceneV1ToDiagramV1(scene);
  const next =
    parentGroupId != null
      ? addDiagram3dNodeToParent(diagram, node, parentGroupId)
      : addDiagram3dNode(diagram, node);
  return mergeDiagram3dIntoScene(scene, next);
}

export function moveScene3dNode(
  scene: SceneV1,
  nodeId: string,
  parentGroupId: string | null,
): SceneV1 {
  return mergeDiagram3dIntoScene(
    scene,
    moveDiagram3dNodeToParent(sceneV1ToDiagramV1(scene), nodeId, parentGroupId),
  );
}

export function removeScene3dNode(scene: SceneV1, nodeId: string): SceneV1 {
  return mergeDiagram3dIntoScene(scene, removeDiagram3dNode(sceneV1ToDiagramV1(scene), nodeId));
}

export function duplicateScene3dNode(scene: SceneV1, nodeId: string, newId: string): SceneV1 {
  return mergeDiagram3dIntoScene(
    scene,
    duplicateDiagram3dNode(sceneV1ToDiagramV1(scene), nodeId, newId),
  );
}
