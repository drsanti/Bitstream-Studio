import type { StageViewportPickDetail } from "../viewport/studio-viewport-stage-multi-models";

/** Stable Stage object identity for selection and graph sync (SE1+). */
export type SceneObjectRefV1 =
  | {
      kind: "procedural";
      sourceNodeId: string;
      objectPath: string;
      modelIndex: number;
      meshLeafIndex?: number;
    }
  | {
      kind: "glb-instance";
      sourceNodeId: string;
      objectPath: string;
      modelIndex: number;
    };

export function sceneObjectRefFromStagePick(
  pick: StageViewportPickDetail,
): SceneObjectRefV1 | null {
  if (pick.sourceNodeId.trim().length === 0) {
    return null;
  }
  const path = pick.objectPath.trim();
  if (path.startsWith("proc:")) {
    const parts = path.split(":");
    const leafRaw = parts[2];
    const meshLeafIndex =
      leafRaw != null && leafRaw.length > 0
        ? Number.parseInt(leafRaw, 10)
        : undefined;
    return {
      kind: "procedural",
      sourceNodeId: pick.sourceNodeId,
      objectPath: path,
      modelIndex: pick.modelIndex,
      meshLeafIndex:
        meshLeafIndex != null && Number.isFinite(meshLeafIndex)
          ? meshLeafIndex
          : undefined,
    };
  }
  return {
    kind: "glb-instance",
    sourceNodeId: pick.sourceNodeId,
    objectPath: path.length > 0 ? path : "(mesh)",
    modelIndex: pick.modelIndex,
  };
}

export function sceneObjectSelectionKey(ref: SceneObjectRefV1): string {
  return `${ref.kind}|${ref.sourceNodeId}|${ref.objectPath}|${ref.modelIndex}`;
}

/** Flow node ids to select in the graph for this Stage object (SE1: source node). */
export function flowNodeIdsForSceneObjectRef(ref: SceneObjectRefV1): string[] {
  return [ref.sourceNodeId];
}
