import { create } from "zustand";
import { parseSceneV1, type SceneEnvironmentSettingsV1, type SceneV1 } from "../schemas/scene.v1";
import type { Diagram3dNodeV1 } from "../schemas/diagram.v1";
import {
  canRedoDiagramHistory,
  canUndoDiagramHistory,
  EMPTY_DIAGRAM_HISTORY,
  pushDiagramHistorySnapshot,
  redoDiagramHistory,
  type DiagramHistoryStacks,
  undoDiagramHistory,
} from "../runtime/diagram/diagramEditorHistory";
import {
  addScene3dNode,
  duplicateScene3dNode,
  moveScene3dNode,
  patchScene3dNode,
  patchSceneCamera,
  removeScene3dNode,
  resetSceneCamera,
} from "../runtime/scene/sceneDiagramBridge";
import type { Diagram3dCameraPatch, Diagram3dNodePatch } from "../runtime/diagram/diagram3dNodeMutations";
import {
  pickSceneNodeSelection,
  EMPTY_SCENE_NODE_SELECTION,
} from "../runtime/scene/courseSceneSelection";
import {
  clearScene3dSelectionParent,
  groupScene3dSelection,
  parentScene3dSelectionToActive,
  type Scene3dClearParentMode,
  type Scene3dParentMode,
} from "../runtime/scene/scene3dHierarchyOps";
import type { Scene3dMultiGizmoPatch } from "../runtime/scene/scene3dMultiGizmoTransform";

type SceneMutationOptions = {
  recordUndo?: boolean;
};

function cloneScene(scene: SceneV1): SceneV1 {
  return parseSceneV1(JSON.parse(JSON.stringify(scene)));
}

type CourseSceneEditorState = {
  sourcePaths: Record<string, string>;
  baselines: Record<string, SceneV1>;
  drafts: Record<string, SceneV1>;
  dirty: Record<string, boolean>;
  selectedNodeIdLists: Record<string, string[]>;
  activeNodeIds: Record<string, string | null>;
  historyStacks: Record<string, DiagramHistoryStacks>;
  initScene: (scene: SceneV1, sourcePath: string) => void;
  setSelectedNodeId: (documentId: string, nodeId: string | null) => void;
  pickSceneNode: (documentId: string, nodeId: string, extend: boolean) => void;
  clearSceneSelection: (documentId: string) => void;
  toggleSceneNodeSelection: (documentId: string, nodeId: string, extend: boolean) => void;
  replaceSceneDraft: (documentId: string, scene: SceneV1, options?: SceneMutationOptions) => void;
  pushSceneUndoSnapshot: (documentId: string) => void;
  patchNode: (
    documentId: string,
    nodeId: string,
    patch: Diagram3dNodePatch,
    options?: SceneMutationOptions,
  ) => void;
  patchNodes: (
    documentId: string,
    patches: Scene3dMultiGizmoPatch[],
    options?: SceneMutationOptions,
  ) => void;
  setSceneSelection: (
    documentId: string,
    selectedNodeIds: string[],
    activeNodeId?: string | null,
  ) => void;
  patchCamera: (
    documentId: string,
    patch: Diagram3dCameraPatch,
    options?: SceneMutationOptions,
  ) => void;
  resetCamera: (documentId: string, options?: SceneMutationOptions) => void;
  patchSettings: (
    documentId: string,
    patch: Partial<SceneEnvironmentSettingsV1>,
    options?: SceneMutationOptions,
  ) => void;
  patchTitle: (documentId: string, title: string, options?: SceneMutationOptions) => void;
  addNode: (
    documentId: string,
    node: Diagram3dNodeV1,
    options?: SceneMutationOptions & { parentGroupId?: string | null },
  ) => void;
  moveNode: (
    documentId: string,
    nodeId: string,
    parentGroupId: string | null,
    options?: SceneMutationOptions,
  ) => void;
  moveNodes: (
    documentId: string,
    nodeIds: string[],
    parentGroupId: string | null,
    options?: SceneMutationOptions,
  ) => void;
  groupSelectedNodes: (documentId: string, options?: SceneMutationOptions) => string | null;
  parentSelectedToActive: (
    documentId: string,
    mode: Scene3dParentMode,
    options?: SceneMutationOptions,
  ) => boolean;
  clearParentForSelected: (
    documentId: string,
    mode?: Scene3dClearParentMode,
    options?: SceneMutationOptions,
  ) => boolean;
  removeNode: (documentId: string, nodeId: string, options?: SceneMutationOptions) => void;
  removeNodes: (documentId: string, nodeIds: string[], options?: SceneMutationOptions) => void;
  duplicateNode: (documentId: string, nodeId: string, options?: SceneMutationOptions) => void;
  duplicateSelectedNodes: (documentId: string, options?: SceneMutationOptions) => void;
  undoScene: (documentId: string) => void;
  redoScene: (documentId: string) => void;
  canUndoScene: (documentId: string) => boolean;
  canRedoScene: (documentId: string) => boolean;
  discardScene: (documentId: string) => void;
  markSceneClean: (documentId: string, scene?: SceneV1) => void;
  isSceneDirty: (documentId: string) => boolean;
};

function getHistoryStacks(state: CourseSceneEditorState, documentId: string): DiagramHistoryStacks {
  return state.historyStacks[documentId] ?? EMPTY_DIAGRAM_HISTORY;
}

function clearSceneHistory(
  historyStacks: Record<string, DiagramHistoryStacks>,
  documentId: string,
): Record<string, DiagramHistoryStacks> {
  return { ...historyStacks, [documentId]: EMPTY_DIAGRAM_HISTORY };
}

export const useCourseSceneEditorStore = create<CourseSceneEditorState>((set, get) => ({
  sourcePaths: {},
  baselines: {},
  drafts: {},
  dirty: {},
  selectedNodeIdLists: {},
  activeNodeIds: {},
  historyStacks: {},
  initScene: (scene, sourcePath) => {
    const snapshot = cloneScene(scene);
    set((state) => ({
      sourcePaths: { ...state.sourcePaths, [scene.id]: sourcePath },
      baselines: { ...state.baselines, [scene.id]: snapshot },
      drafts: { ...state.drafts, [scene.id]: cloneScene(snapshot) },
      dirty: { ...state.dirty, [scene.id]: false },
      historyStacks: clearSceneHistory(state.historyStacks, scene.id),
    }));
  },
  setSelectedNodeId: (documentId, nodeId) => {
    set((state) => ({
      selectedNodeIdLists: {
        ...state.selectedNodeIdLists,
        [documentId]: nodeId != null ? [nodeId] : EMPTY_SCENE_NODE_SELECTION,
      },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]: nodeId,
      },
    }));
  },
  pickSceneNode: (documentId, nodeId, extend) => {
    set((state) => {
      const current = state.selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
      const picked = pickSceneNodeSelection(current, nodeId, extend);
      return {
        selectedNodeIdLists: {
          ...state.selectedNodeIdLists,
          [documentId]: picked.selected,
        },
        activeNodeIds: {
          ...state.activeNodeIds,
          [documentId]: picked.active,
        },
      };
    });
  },
  clearSceneSelection: (documentId) => {
    set((state) => ({
      selectedNodeIdLists: {
        ...state.selectedNodeIdLists,
        [documentId]: EMPTY_SCENE_NODE_SELECTION,
      },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]: null,
      },
    }));
  },
  setSceneSelection: (documentId, selectedNodeIds, activeNodeId) => {
    set((state) => ({
      selectedNodeIdLists: {
        ...state.selectedNodeIdLists,
        [documentId]: selectedNodeIds.length > 0 ? [...selectedNodeIds] : EMPTY_SCENE_NODE_SELECTION,
      },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]:
          activeNodeId !== undefined
            ? activeNodeId
            : (selectedNodeIds[selectedNodeIds.length - 1] ?? null),
      },
    }));
  },
  toggleSceneNodeSelection: (documentId, nodeId, extend) => {
    get().pickSceneNode(documentId, nodeId, extend);
  },
  replaceSceneDraft: (documentId, scene, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    const next = parseSceneV1(scene);
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  pushSceneUndoSnapshot: (documentId) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    set((state) => ({
      historyStacks: {
        ...state.historyStacks,
        [documentId]: pushDiagramHistorySnapshot(
          getHistoryStacks(state, documentId),
          cloneScene(draft),
        ),
      },
    }));
  },
  patchNode: (documentId, nodeId, patch, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const candidate = patchScene3dNode(draft, nodeId, patch);
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: candidate },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  patchNodes: (documentId, patches, options) => {
    const draft = get().drafts[documentId];
    if (draft == null || patches.length === 0) {
      return;
    }
    let candidate = draft;
    for (const entry of patches) {
      candidate = patchScene3dNode(candidate, entry.nodeId, entry.patch);
    }
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: candidate },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  patchCamera: (documentId, patch, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const candidate = patchSceneCamera(draft, patch);
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: candidate },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  resetCamera: (documentId, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const candidate = resetSceneCamera(draft);
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: candidate },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  patchSettings: (documentId, patch, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const candidate = parseSceneV1({
      ...draft,
      settings: { ...draft.settings, ...patch },
    });
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: candidate },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  patchTitle: (documentId, title, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: {
        ...state.drafts,
        [documentId]: parseSceneV1({ ...draft, title: trimmed }),
      },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  addNode: (documentId, node, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    const next = addScene3dNode(draft, node, options?.parentGroupId ?? null);
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: { ...state.selectedNodeIdLists, [documentId]: [node.id] },
      activeNodeIds: { ...state.activeNodeIds, [documentId]: node.id },
    }));
  },
  moveNode: (documentId, nodeId, parentGroupId, options) => {
    get().moveNodes(documentId, [nodeId], parentGroupId, options);
  },
  moveNodes: (documentId, nodeIds, parentGroupId, options) => {
    const draft = get().drafts[documentId];
    if (draft == null || nodeIds.length === 0) {
      return;
    }
    let next = draft;
    for (const nodeId of nodeIds) {
      next = moveScene3dNode(next, nodeId, parentGroupId);
    }
    if (next === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
    }));
  },
  groupSelectedNodes: (documentId, options) => {
    const draft = get().drafts[documentId];
    const selection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    if (draft == null || selection.length === 0) {
      return null;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    const result = groupScene3dSelection(draft, selection);
    if (result == null) {
      return null;
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: result.scene },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: { ...state.selectedNodeIdLists, [documentId]: [result.groupId] },
      activeNodeIds: { ...state.activeNodeIds, [documentId]: result.groupId },
    }));
    return result.groupId;
  },
  parentSelectedToActive: (documentId, mode, options) => {
    const draft = get().drafts[documentId];
    const selection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    const activeId = get().activeNodeIds[documentId];
    if (draft == null || activeId == null || selection.length === 0) {
      return false;
    }
    const result = parentScene3dSelectionToActive(draft, selection, activeId, mode);
    if (result == null) {
      return false;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: result.scene },
      dirty: { ...state.dirty, [documentId]: true },
      ...(result.wrappedActive
        ? { activeNodeIds: { ...state.activeNodeIds, [documentId]: result.parentGroupId } }
        : {}),
    }));
    return true;
  },
  clearParentForSelected: (documentId, mode = "clear", options) => {
    const draft = get().drafts[documentId];
    const selection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    if (draft == null || selection.length === 0) {
      return false;
    }
    const next = clearScene3dSelectionParent(draft, selection, mode);
    if (next == null) {
      return false;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
    }));
    return true;
  },
  removeNode: (documentId, nodeId, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    const next = removeScene3dNode(draft, nodeId);
    const currentSelection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    const nextSelection = currentSelection.filter((id) => id !== nodeId);
    const active = get().activeNodeIds[documentId];
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: {
        ...state.selectedNodeIdLists,
        [documentId]: nextSelection,
      },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]: active === nodeId ? (nextSelection[0] ?? null) : active,
      },
    }));
  },
  removeNodes: (documentId, nodeIds, options) => {
    const draft = get().drafts[documentId];
    if (draft == null || nodeIds.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    let next = draft;
    for (const nodeId of nodeIds) {
      next = removeScene3dNode(next, nodeId);
    }
    const removeSet = new Set(nodeIds);
    const currentSelection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    const active = get().activeNodeIds[documentId];
    const nextSelection = currentSelection.filter((id) => !removeSet.has(id));
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: {
        ...state.selectedNodeIdLists,
        [documentId]: nextSelection,
      },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]:
          active != null && removeSet.has(active) ? (nextSelection[0] ?? null) : active,
      },
    }));
  },
  duplicateNode: (documentId, nodeId, options) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const newId = `dup-${Date.now().toString(36)}`;
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    const next = duplicateScene3dNode(draft, nodeId, newId);
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: { ...state.selectedNodeIdLists, [documentId]: [newId] },
      activeNodeIds: { ...state.activeNodeIds, [documentId]: newId },
    }));
  },
  duplicateSelectedNodes: (documentId, options) => {
    const draft = get().drafts[documentId];
    const selection = get().selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION;
    if (draft == null || selection.length === 0) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushSceneUndoSnapshot(documentId);
    }
    let next = draft;
    const newIds: string[] = [];
    for (const nodeId of selection) {
      const newId = `dup-${nodeId}-${Date.now().toString(36)}`;
      next = duplicateScene3dNode(next, nodeId, newId);
      newIds.push(newId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: next },
      dirty: { ...state.dirty, [documentId]: true },
      selectedNodeIdLists: { ...state.selectedNodeIdLists, [documentId]: newIds },
      activeNodeIds: {
        ...state.activeNodeIds,
        [documentId]: newIds[newIds.length - 1] ?? null,
      },
    }));
  },
  undoScene: (documentId) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const stacks = getHistoryStacks(get(), documentId);
    const result = undoDiagramHistory(stacks, draft);
    if (result == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: result.snapshot as SceneV1 },
      dirty: { ...state.dirty, [documentId]: true },
      historyStacks: { ...state.historyStacks, [documentId]: result.stacks },
    }));
  },
  redoScene: (documentId) => {
    const draft = get().drafts[documentId];
    if (draft == null) {
      return;
    }
    const stacks = getHistoryStacks(get(), documentId);
    const result = redoDiagramHistory(stacks, draft);
    if (result == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: result.snapshot as SceneV1 },
      dirty: { ...state.dirty, [documentId]: true },
      historyStacks: { ...state.historyStacks, [documentId]: result.stacks },
    }));
  },
  canUndoScene: (documentId) => canUndoDiagramHistory(getHistoryStacks(get(), documentId)),
  canRedoScene: (documentId) => canRedoDiagramHistory(getHistoryStacks(get(), documentId)),
  discardScene: (documentId) => {
    const baseline = get().baselines[documentId];
    if (baseline == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [documentId]: cloneScene(baseline) },
      dirty: { ...state.dirty, [documentId]: false },
      historyStacks: clearSceneHistory(state.historyStacks, documentId),
    }));
  },
  markSceneClean: (documentId, scene) => {
    const next = scene ?? get().drafts[documentId];
    if (next == null) {
      return;
    }
    const snapshot = cloneScene(next);
    set((state) => ({
      baselines: { ...state.baselines, [documentId]: snapshot },
      drafts: { ...state.drafts, [documentId]: cloneScene(snapshot) },
      dirty: { ...state.dirty, [documentId]: false },
      historyStacks: clearSceneHistory(state.historyStacks, documentId),
    }));
  },
  isSceneDirty: (documentId) => get().dirty[documentId] === true,
}));
