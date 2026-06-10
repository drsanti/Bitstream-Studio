import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Diagram3dCameraPatch, Diagram3dNodePatch } from "../runtime/diagram/diagram3dNodeMutations";
import type { Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";
import { resolveSceneActiveNodeId, EMPTY_SCENE_NODE_SELECTION } from "../runtime/scene/courseSceneSelection";

type Diagram3dDocumentEditorActions = {
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  patchNode: (nodeId: string, patch: Diagram3dNodePatch, options?: { recordUndo?: boolean }) => void;
  removeNode: (nodeId: string, options?: { recordUndo?: boolean }) => void;
  addNode: (
    node: Diagram3dNodeV1,
    options?: { recordUndo?: boolean; parentGroupId?: string | null },
  ) => void;
  moveNode: (
    nodeId: string,
    parentGroupId: string | null,
    options?: { recordUndo?: boolean },
  ) => void;
  patchCamera: (patch: Diagram3dCameraPatch, options?: { recordUndo?: boolean }) => void;
  resetCamera: (options?: { recordUndo?: boolean }) => void;
};

const Diagram3dDocumentEditorContext = createContext<Diagram3dDocumentEditorActions | null>(null);

export function Diagram3dSceneDocumentEditorProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: ReactNode;
}) {
  const activeNodeId = useCourseSceneEditorStore(
    (s) => s.activeNodeIds[documentId] ?? null,
  );
  const selectedNodeIds = useCourseSceneEditorStore(
    (s) => s.selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION,
  );
  const selectedNodeId = resolveSceneActiveNodeId(activeNodeId, selectedNodeIds);
  const setSelectedNodeId = useCourseSceneEditorStore((s) => s.setSelectedNodeId);
  const patchNode = useCourseSceneEditorStore((s) => s.patchNode);
  const removeNode = useCourseSceneEditorStore((s) => s.removeNode);
  const addNode = useCourseSceneEditorStore((s) => s.addNode);
  const moveNode = useCourseSceneEditorStore((s) => s.moveNode);
  const patchCamera = useCourseSceneEditorStore((s) => s.patchCamera);
  const resetCamera = useCourseSceneEditorStore((s) => s.resetCamera);

  const value = useMemo<Diagram3dDocumentEditorActions>(
    () => ({
      selectedNodeId,
      setSelectedNodeId: (nodeId) => setSelectedNodeId(documentId, nodeId),
      patchNode: (nodeId, patch, options) => patchNode(documentId, nodeId, patch, options),
      removeNode: (nodeId, options) => removeNode(documentId, nodeId, options),
      addNode: (node, options) => addNode(documentId, node, options),
      moveNode: (nodeId, parentGroupId, options) =>
        moveNode(documentId, nodeId, parentGroupId, options),
      patchCamera: (patch, options) => patchCamera(documentId, patch, options),
      resetCamera: (options) => resetCamera(documentId, options),
    }),
    [
      addNode,
      activeNodeId,
      documentId,
      moveNode,
      patchCamera,
      patchNode,
      removeNode,
      resetCamera,
      selectedNodeIds,
      setSelectedNodeId,
    ],
  );

  return (
    <Diagram3dDocumentEditorContext.Provider value={value}>
      {children}
    </Diagram3dDocumentEditorContext.Provider>
  );
}

export function useDiagram3dDocumentEditor(documentId: string): Diagram3dDocumentEditorActions {
  const sceneContext = useContext(Diagram3dDocumentEditorContext);
  const diagramSelectedNodeId = useCourseDiagramEditorStore(
    (s) => s.selected3dNodeIds[documentId] ?? null,
  );
  const setSelected3dNodeId = useCourseDiagramEditorStore((s) => s.setSelected3dNodeId);
  const patch3dNode = useCourseDiagramEditorStore((s) => s.patch3dNode);
  const remove3dNode = useCourseDiagramEditorStore((s) => s.remove3dNode);
  const add3dNode = useCourseDiagramEditorStore((s) => s.add3dNode);
  const move3dNode = useCourseDiagramEditorStore((s) => s.move3dNode);
  const patch3dCamera = useCourseDiagramEditorStore((s) => s.patch3dCamera);
  const reset3dCamera = useCourseDiagramEditorStore((s) => s.reset3dCamera);

  if (sceneContext != null) {
    return sceneContext;
  }

  return {
    selectedNodeId: diagramSelectedNodeId,
    setSelectedNodeId: (nodeId) => setSelected3dNodeId(documentId, nodeId),
    patchNode: (nodeId, patch, options) => patch3dNode(documentId, nodeId, patch, options),
    removeNode: (nodeId, options) => remove3dNode(documentId, nodeId, options),
    addNode: (node, options) => add3dNode(documentId, node, options),
    moveNode: (nodeId, parentGroupId, options) =>
      move3dNode(documentId, nodeId, parentGroupId, options),
    patchCamera: (patch, options) => patch3dCamera(documentId, patch, options),
    resetCamera: (options) => reset3dCamera(documentId, options),
  };
}
