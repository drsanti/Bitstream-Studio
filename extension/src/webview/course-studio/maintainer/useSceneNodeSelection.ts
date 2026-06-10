import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";
import {
  EMPTY_SCENE_NODE_SELECTION,
  isSceneNodeActive,
  isSceneNodeSelected,
  resolveSceneActiveNodeId,
} from "../runtime/scene/courseSceneSelection";

export function useSceneNodeSelection(documentId: string): {
  selectedNodeIds: string[];
  activeNodeId: string | null;
  /** Last-clicked / gizmo target — same as activeNodeId */
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  pickSceneNode: (nodeId: string, extend: boolean) => void;
  clearSceneSelection: () => void;
  isSelected: (nodeId: string) => boolean;
  isActive: (nodeId: string) => boolean;
} {
  const selectedNodeIds = useCourseSceneEditorStore(
    (s) => s.selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION,
  );
  const activeNodeId = useCourseSceneEditorStore(
    (s) => s.activeNodeIds[documentId] ?? null,
  );
  const setSelectedNodeId = useCourseSceneEditorStore((s) => s.setSelectedNodeId);
  const pickSceneNode = useCourseSceneEditorStore((s) => s.pickSceneNode);
  const clearSceneSelection = useCourseSceneEditorStore((s) => s.clearSceneSelection);

  const resolvedActive = resolveSceneActiveNodeId(activeNodeId, selectedNodeIds);

  return {
    selectedNodeIds,
    activeNodeId: resolvedActive,
    selectedNodeId: resolvedActive,
    setSelectedNodeId: (nodeId) => setSelectedNodeId(documentId, nodeId),
    pickSceneNode: (nodeId, extend) => pickSceneNode(documentId, nodeId, extend),
    clearSceneSelection: () => clearSceneSelection(documentId),
    isSelected: (nodeId) => isSceneNodeSelected(selectedNodeIds, nodeId),
    isActive: (nodeId) => isSceneNodeActive(nodeId, resolvedActive),
  };
}
