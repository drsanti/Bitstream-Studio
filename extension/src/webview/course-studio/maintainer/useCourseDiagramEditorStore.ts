import { create } from "zustand";
import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
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
  addDiagramNode,
  patchDiagramNode,
  removeDiagramNode,
  replaceDiagramNode,
  reorderDiagramNode,
  type DiagramNodePatch,
  type DiagramNodeZOrderDirection,
} from "../runtime/diagram/diagramNodeMutations";
import type { DiagramNodeV1 } from "../schemas/diagram.v1";
import { pushDiagramJsonUndoCoalesced } from "./diagramJsonUndoCoalesce";

function cloneDiagram(diagram: DiagramV1): DiagramV1 {
  return parseDiagramV1(structuredClone(diagram));
}

type DiagramMutationOptions = {
  recordUndo?: boolean;
};

type CourseDiagramEditorState = {
  sourcePaths: Record<string, string>;
  baselines: Record<string, DiagramV1>;
  drafts: Record<string, DiagramV1>;
  dirty: Record<string, boolean>;
  selectedNodeIds: Record<string, string | null>;
  historyStacks: Record<string, DiagramHistoryStacks>;
  initDiagram: (diagram: DiagramV1, sourcePath: string) => void;
  setDraftJson: (diagramId: string, rawJson: string) => { ok: true } | { ok: false; error: string };
  setSelectedNodeId: (diagramId: string, nodeId: string | null) => void;
  pushDiagramUndoSnapshot: (diagramId: string) => void;
  patchNode: (
    diagramId: string,
    nodeId: string,
    patch: DiagramNodePatch,
    options?: DiagramMutationOptions,
  ) => void;
  replaceNode: (
    diagramId: string,
    nodeId: string,
    node: DiagramNodeV1,
    options?: DiagramMutationOptions,
  ) => void;
  addNode: (diagramId: string, node: DiagramNodeV1, options?: DiagramMutationOptions) => void;
  removeNode: (diagramId: string, nodeId: string, options?: DiagramMutationOptions) => void;
  reorderNode: (
    diagramId: string,
    nodeId: string,
    direction: DiagramNodeZOrderDirection,
    options?: DiagramMutationOptions,
  ) => void;
  undoDiagram: (diagramId: string) => void;
  redoDiagram: (diagramId: string) => void;
  canUndoDiagram: (diagramId: string) => boolean;
  canRedoDiagram: (diagramId: string) => boolean;
  discardDiagram: (diagramId: string) => void;
  markDiagramClean: (diagramId: string, diagram?: DiagramV1) => void;
  isDiagramDirty: (diagramId: string) => boolean;
};

function getHistoryStacks(state: CourseDiagramEditorState, diagramId: string): DiagramHistoryStacks {
  return state.historyStacks[diagramId] ?? EMPTY_DIAGRAM_HISTORY;
}

function clearDiagramHistory(
  historyStacks: Record<string, DiagramHistoryStacks>,
  diagramId: string,
): Record<string, DiagramHistoryStacks> {
  return { ...historyStacks, [diagramId]: EMPTY_DIAGRAM_HISTORY };
}

export const useCourseDiagramEditorStore = create<CourseDiagramEditorState>((set, get) => ({
  sourcePaths: {},
  baselines: {},
  drafts: {},
  dirty: {},
  selectedNodeIds: {},
  historyStacks: {},
  initDiagram: (diagram, sourcePath) => {
    const snapshot = cloneDiagram(diagram);
    set((state) => ({
      sourcePaths: { ...state.sourcePaths, [diagram.id]: sourcePath },
      baselines: { ...state.baselines, [diagram.id]: snapshot },
      drafts: { ...state.drafts, [diagram.id]: cloneDiagram(snapshot) },
      dirty: { ...state.dirty, [diagram.id]: false },
      historyStacks: clearDiagramHistory(state.historyStacks, diagram.id),
    }));
  },
  pushDiagramUndoSnapshot: (diagramId) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    set((state) => ({
      historyStacks: {
        ...state.historyStacks,
        [diagramId]: pushDiagramHistorySnapshot(
          getHistoryStacks(state, diagramId),
          cloneDiagram(draft),
        ),
      },
    }));
  },
  setDraftJson: (diagramId, rawJson) => {
    try {
      const parsed = parseDiagramV1(JSON.parse(rawJson));
      if (parsed.id !== diagramId) {
        return { ok: false, error: `Diagram id must stay "${diagramId}"` };
      }
      const draft = get().drafts[diagramId];
      if (draft == null) {
        return { ok: false, error: "Diagram is not loaded" };
      }
      pushDiagramJsonUndoCoalesced(diagramId, () => {
        get().pushDiagramUndoSnapshot(diagramId);
      });
      set((state) => ({
        drafts: { ...state.drafts, [diagramId]: parsed },
        dirty: { ...state.dirty, [diagramId]: true },
      }));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  setSelectedNodeId: (diagramId, nodeId) => {
    set((state) => ({
      selectedNodeIds: { ...state.selectedNodeIds, [diagramId]: nodeId },
    }));
  },
  patchNode: (diagramId, nodeId, patch, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const next = patchDiagramNode(draft, nodeId, patch);
    if (next === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  replaceNode: (diagramId, nodeId, node, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const next = replaceDiagramNode(draft, nodeId, node);
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  addNode: (diagramId, node, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    const next = addDiagramNode(draft, node);
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
      selectedNodeIds: { ...state.selectedNodeIds, [diagramId]: node.id },
    }));
  },
  removeNode: (diagramId, nodeId, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    const next = removeDiagramNode(draft, nodeId);
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
      selectedNodeIds: {
        ...state.selectedNodeIds,
        [diagramId]: state.selectedNodeIds[diagramId] === nodeId ? null : state.selectedNodeIds[diagramId],
      },
    }));
  },
  reorderNode: (diagramId, nodeId, direction, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const next = reorderDiagramNode(draft, nodeId, direction);
    if (next === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  undoDiagram: (diagramId) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const stacks = getHistoryStacks(get(), diagramId);
    const result = undoDiagramHistory(stacks, cloneDiagram(draft));
    if (result.draft == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: cloneDiagram(result.draft!) },
      dirty: { ...state.dirty, [diagramId]: true },
      historyStacks: { ...state.historyStacks, [diagramId]: result.stacks },
    }));
  },
  redoDiagram: (diagramId) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const stacks = getHistoryStacks(get(), diagramId);
    const result = redoDiagramHistory(stacks, cloneDiagram(draft));
    if (result.draft == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: cloneDiagram(result.draft!) },
      dirty: { ...state.dirty, [diagramId]: true },
      historyStacks: { ...state.historyStacks, [diagramId]: result.stacks },
    }));
  },
  canUndoDiagram: (diagramId) => canUndoDiagramHistory(getHistoryStacks(get(), diagramId)),
  canRedoDiagram: (diagramId) => canRedoDiagramHistory(getHistoryStacks(get(), diagramId)),
  discardDiagram: (diagramId) => {
    const baseline = get().baselines[diagramId];
    if (baseline == null) {
      return;
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: cloneDiagram(baseline) },
      dirty: { ...state.dirty, [diagramId]: false },
      selectedNodeIds: { ...state.selectedNodeIds, [diagramId]: null },
      historyStacks: clearDiagramHistory(state.historyStacks, diagramId),
    }));
  },
  markDiagramClean: (diagramId, diagram) => {
    const next = diagram ?? get().drafts[diagramId];
    if (next == null) {
      return;
    }
    const snapshot = cloneDiagram(next);
    set((state) => ({
      baselines: { ...state.baselines, [diagramId]: snapshot },
      drafts: { ...state.drafts, [diagramId]: cloneDiagram(snapshot) },
      dirty: { ...state.dirty, [diagramId]: false },
      historyStacks: clearDiagramHistory(state.historyStacks, diagramId),
    }));
  },
  isDiagramDirty: (diagramId) => get().dirty[diagramId] === true,
}));
