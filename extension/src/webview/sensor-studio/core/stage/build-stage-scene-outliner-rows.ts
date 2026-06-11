import type { StageViewportPickDetail } from "../viewport/studio-viewport-stage-multi-models";
import type { StageMeshEntryV1 } from "./stage-mesh-entry";
import {
  sceneObjectSelectionKey,
  type SceneObjectRefV1,
} from "./scene-object-ref";
import type { StageSceneSnapshotV1 } from "./stage-scene-snapshot";

export type StageSceneOutlinerRowKind = "scene-output" | "model" | "mesh" | "pick";

export type StageSceneOutlinerRowV1 = {
  id: string;
  label: string;
  subtitle: string | null;
  kind: StageSceneOutlinerRowKind;
  sceneObjectRef: SceneObjectRefV1 | null;
  modelIndex: number | null;
  /** Flow node to focus (e.g. Scene Output commit node). */
  focusFlowNodeId: string | null;
};

function proceduralObjectPath(entry: StageMeshEntryV1): string {
  if (entry.meshLeafIndex != null) {
    return `proc:${entry.sourceNodeId}:${entry.meshLeafIndex}`;
  }
  return `proc:${entry.sourceNodeId}`;
}

export function sceneObjectRefForStageMeshEntry(
  entry: StageMeshEntryV1,
  modelIndex = 0,
): SceneObjectRefV1 {
  return {
    kind: "procedural",
    sourceNodeId: entry.sourceNodeId,
    objectPath: proceduralObjectPath(entry),
    modelIndex,
    meshLeafIndex: entry.meshLeafIndex,
  };
}

export function sceneObjectRefForStageModelEntry(args: {
  sourceNodeId: string;
  modelIndex: number;
  objectPath?: string;
}): SceneObjectRefV1 {
  const path = args.objectPath?.trim() ?? "";
  return {
    kind: "glb-instance",
    sourceNodeId: args.sourceNodeId,
    objectPath: path.length > 0 ? path : "(model)",
    modelIndex: args.modelIndex,
  };
}

export function buildStageSceneOutlinerRows(args: {
  snapshot: StageSceneSnapshotV1;
  lastViewportPick: StageViewportPickDetail | null;
  selectedSceneObject: SceneObjectRefV1 | null;
}): StageSceneOutlinerRowV1[] {
  const { snapshot, lastViewportPick, selectedSceneObject } = args;
  const rows: StageSceneOutlinerRowV1[] = [];

  if (snapshot.sceneOutputNodeId != null) {
    rows.push({
      id: `scene-output:${snapshot.sceneOutputNodeId}`,
      label: "Scene Output",
      subtitle: `${snapshot.models.length} models · ${snapshot.meshes.length} meshes`,
      kind: "scene-output",
      sceneObjectRef: null,
      modelIndex: null,
      focusFlowNodeId: snapshot.sceneOutputNodeId,
    });
  }

  snapshot.models.forEach((model, modelIndex) => {
    const pickPath =
      lastViewportPick != null &&
      lastViewportPick.sourceNodeId === model.sourceNodeId &&
      lastViewportPick.modelIndex === modelIndex &&
      !lastViewportPick.objectPath.startsWith("proc:")
        ? lastViewportPick.objectPath
        : undefined;
    rows.push({
      id: `model:${model.sourceNodeId}:${modelIndex}`,
      label: model.label,
      subtitle: "GLB model",
      kind: "model",
      sceneObjectRef: sceneObjectRefForStageModelEntry({
        sourceNodeId: model.sourceNodeId,
        modelIndex,
        objectPath: pickPath,
      }),
      modelIndex,
      focusFlowNodeId: null,
    });
  });

  snapshot.meshes.forEach((mesh, index) => {
    rows.push({
      id: `mesh:${mesh.sourceNodeId}:${mesh.meshLeafIndex ?? index}`,
      label: mesh.label,
      subtitle: mesh.wire.kind ?? "mesh",
      kind: "mesh",
      sceneObjectRef: sceneObjectRefForStageMeshEntry(mesh, 0),
      modelIndex: 0,
      focusFlowNodeId: null,
    });
  });

  if (selectedSceneObject != null) {
    const selectedKey = sceneObjectSelectionKey(selectedSceneObject);
    const matched = rows.some(
      (row) =>
        row.sceneObjectRef != null &&
        sceneObjectSelectionKey(row.sceneObjectRef) === selectedKey,
    );
    if (!matched) {
      rows.push({
        id: `pick:${selectedKey}`,
        label:
          selectedSceneObject.kind === "procedural"
            ? "Procedural pick"
            : "GLB part pick",
        subtitle: selectedSceneObject.objectPath,
        kind: "pick",
        sceneObjectRef: selectedSceneObject,
        modelIndex: selectedSceneObject.modelIndex,
        focusFlowNodeId: null,
      });
    }
  }

  return rows;
}

export function stageSceneOutlinerRowMatchesSearch(
  row: StageSceneOutlinerRowV1,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return true;
  }
  const haystack = `${row.label} ${row.subtitle ?? ""} ${row.kind}`.toLowerCase();
  return haystack.includes(q);
}

export function isStageSceneOutlinerRowSelected(
  row: StageSceneOutlinerRowV1,
  selectedSceneObject: SceneObjectRefV1 | null,
): boolean {
  if (selectedSceneObject == null || row.sceneObjectRef == null) {
    return false;
  }
  return (
    sceneObjectSelectionKey(row.sceneObjectRef) ===
    sceneObjectSelectionKey(selectedSceneObject)
  );
}
