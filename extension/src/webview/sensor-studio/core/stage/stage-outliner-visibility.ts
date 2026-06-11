import * as THREE from "three";
import {
  sceneObjectSelectionKey,
  type SceneObjectRefV1,
} from "./scene-object-ref";

/** Whether a Stage object ref is hidden by outliner toggles (includes ancestor paths). */
export function isStageSceneObjectHidden(
  ref: SceneObjectRefV1,
  hiddenKeys: ReadonlySet<string>,
): boolean {
  if (hiddenKeys.size === 0) {
    return false;
  }
  const exact = sceneObjectSelectionKey(ref);
  if (hiddenKeys.has(exact)) {
    return true;
  }
  if (ref.kind !== "glb-instance") {
    return false;
  }
  const modelRootKey = sceneObjectSelectionKey({
    ...ref,
    objectPath: "(model)",
  });
  if (hiddenKeys.has(modelRootKey)) {
    return true;
  }
  const path = ref.objectPath.trim();
  if (path.length === 0 || path === "(model)" || path === "(mesh)") {
    return false;
  }
  const parts = path.split("/");
  for (let i = 1; i < parts.length; i++) {
    const ancestorPath = parts.slice(0, i).join("/");
    const ancestorKey = sceneObjectSelectionKey({
      ...ref,
      objectPath: ancestorPath,
    });
    if (hiddenKeys.has(ancestorKey)) {
      return true;
    }
  }
  return false;
}

export function buildGlbObjectPathUnderRoot(
  hit: THREE.Object3D,
  modelRoot: THREE.Object3D,
): string {
  const parts: string[] = [];
  let cur: THREE.Object3D | null = hit;
  while (cur != null && cur !== modelRoot) {
    const name = typeof cur.name === "string" ? cur.name.trim() : "";
    if (name.length > 0) {
      parts.unshift(name);
    }
    cur = cur.parent;
  }
  if (parts.length === 0 && hit === modelRoot) {
    return "(model)";
  }
  return parts.length > 0 ? parts.join("/") : "(mesh)";
}

export function applyStageOutlinerVisibilityToProceduralGroup(
  group: THREE.Group,
  hiddenKeys: ReadonlySet<string>,
): void {
  if (hiddenKeys.size === 0) {
    group.traverse((obj) => {
      obj.visible = true;
    });
    return;
  }
  for (const child of group.children) {
    const mesh = child as THREE.Mesh;
    const objectPath =
      typeof mesh.userData?.stageObjectPath === "string"
        ? mesh.userData.stageObjectPath
        : "";
    const sourceNodeId =
      typeof mesh.userData?.stageSourceNodeId === "string"
        ? mesh.userData.stageSourceNodeId
        : "";
    if (objectPath.length === 0 || sourceNodeId.length === 0) {
      mesh.visible = true;
      continue;
    }
    const ref: SceneObjectRefV1 = {
      kind: "procedural",
      sourceNodeId,
      objectPath,
      modelIndex: 0,
    };
    mesh.visible = !isStageSceneObjectHidden(ref, hiddenKeys);
  }
}

export function applyStageOutlinerVisibilityToGlbRoot(
  root: THREE.Object3D,
  sourceNodeId: string,
  modelIndex: number,
  hiddenKeys: ReadonlySet<string>,
): void {
  if (hiddenKeys.size === 0) {
    root.visible = true;
    root.traverse((obj) => {
      obj.visible = true;
    });
    return;
  }
  const modelRef: SceneObjectRefV1 = {
    kind: "glb-instance",
    sourceNodeId,
    objectPath: "(model)",
    modelIndex,
  };
  if (isStageSceneObjectHidden(modelRef, hiddenKeys)) {
    root.visible = false;
    return;
  }
  root.visible = true;
  root.traverse((obj) => {
    if (obj === root) {
      return;
    }
    const objectPath = buildGlbObjectPathUnderRoot(obj, root);
    const ref: SceneObjectRefV1 = {
      kind: "glb-instance",
      sourceNodeId,
      objectPath,
      modelIndex,
    };
    obj.visible = !isStageSceneObjectHidden(ref, hiddenKeys);
  });
}
