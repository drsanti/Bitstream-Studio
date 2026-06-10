import { create } from "zustand";
import { parseDiagramV1, type DiagramNodeV1, type DiagramV1 } from "../schemas/diagram.v1";
import type { DiagramKonvaFreeformV1 } from "../schemas/diagramFreeform";
import type { KonvaPropertyBindingValueV1 } from "../schemas/konvaPropertyBindings";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import { migrateLegacyFreeformToKonva } from "../runtime/diagram/migrateLegacyFreeform";
import { normalizeKonvaCanvasView } from "./courseKonvaTheme";
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
import {
  addDiagram3dNode,
  addDiagram3dNodeToParent,
  createDefaultDiagram3dModelNode,
  ensureDiagram3dLayerWithModel,
  moveDiagram3dNodeToParent,
  patchDiagram3dCamera,
  patchDiagram3dNode,
  resetDiagram3dCamera,
  removeDiagram3dNode,
  type Diagram3dCameraPatch,
  type Diagram3dNodePatch,
} from "../runtime/diagram/diagram3dNodeMutations";
import type { Diagram3dModelNodeV1, Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { syncDiagramLayers } from "../schemas/normalizeDiagramV1";
import { pushDiagramJsonUndoCoalesced } from "./diagramJsonUndoCoalesce";

function normalizeKonvaFreeformInDiagram(diagram: DiagramV1): DiagramV1 {
  if (diagram.freeform == null) {
    return diagram;
  }
  if (diagram.freeform.engine === "konva") {
    const view = normalizeKonvaCanvasView(diagram.freeform.view);
    if (diagram.freeform.view === view) {
      return diagram;
    }
    return parseDiagramV1({
      ...diagram,
      freeform: { ...diagram.freeform, view },
    });
  }
  const migrated = migrateLegacyFreeformToKonva(
    diagram.freeform as unknown as Record<string, unknown>,
  );
  return parseDiagramV1({
    ...diagram,
    freeform: migrated,
  });
}

function cloneDiagram(diagram: DiagramV1): DiagramV1 {
  const populatedLayers = diagram.layers.filter((layer) => layer.nodes.length > 0);
  const parsed = parseDiagramV1({
    version: diagram.version,
    id: diagram.id,
    title: diagram.title,
    linkHealth: diagram.linkHealth,
    viewBox: diagram.viewBox,
    nodes: diagram.nodes,
    freeform: diagram.freeform,
    ...(populatedLayers.length > 0 ? { layers: populatedLayers } : {}),
  });
  return normalizeKonvaFreeformInDiagram(parsed);
}

type DiagramMutationOptions = {
  recordUndo?: boolean;
};

function publishDiagramDraft(diagram: DiagramV1): DiagramV1 {
  return syncDiagramLayers(diagram);
}

type CourseDiagramEditorState = {
  sourcePaths: Record<string, string>;
  baselines: Record<string, DiagramV1>;
  drafts: Record<string, DiagramV1>;
  dirty: Record<string, boolean>;
  selectedNodeIds: Record<string, string | null>;
  selected3dNodeIds: Record<string, string | null>;
  historyStacks: Record<string, DiagramHistoryStacks>;
  initDiagram: (diagram: DiagramV1, sourcePath: string) => void;
  setDraftJson: (diagramId: string, rawJson: string) => { ok: true } | { ok: false; error: string };
  updateKonvaFreeform: (
    diagramId: string,
    payload: {
      shapes: KonvaShapeV1[];
      view?: DiagramKonvaFreeformV1["view"];
    },
    options?: DiagramMutationOptions,
  ) => void;
  patchKonvaPropertyBinding: (
    diagramId: string,
    shapeId: string,
    property: string,
    binding: KonvaPropertyBindingValueV1 | null,
    options?: DiagramMutationOptions,
  ) => void;
  setSelectedNodeId: (diagramId: string, nodeId: string | null) => void;
  setSelected3dNodeId: (diagramId: string, nodeId: string | null) => void;
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
  enableDiagram3dLayer: (diagramId: string, options?: DiagramMutationOptions) => void;
  patch3dNode: (
    diagramId: string,
    nodeId: string,
    patch: Diagram3dNodePatch,
    options?: DiagramMutationOptions,
  ) => void;
  patch3dCamera: (
    diagramId: string,
    patch: Diagram3dCameraPatch,
    options?: DiagramMutationOptions,
  ) => void;
  reset3dCamera: (diagramId: string, options?: DiagramMutationOptions) => void;
  add3dNode: (
    diagramId: string,
    node: Diagram3dNodeV1,
    options?: DiagramMutationOptions & { parentGroupId?: string | null },
  ) => void;
  move3dNode: (
    diagramId: string,
    nodeId: string,
    parentGroupId: string | null,
    options?: DiagramMutationOptions,
  ) => void;
  remove3dNode: (diagramId: string, nodeId: string, options?: DiagramMutationOptions) => void;
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
  selected3dNodeIds: {},
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
  updateKonvaFreeform: (diagramId, payload, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const priorFreeform = draft.freeform;
    const freeform: DiagramKonvaFreeformV1 = {
      engine: "konva",
      shapes: payload.shapes,
      view: normalizeKonvaCanvasView(payload.view ?? priorFreeform?.view),
      ...(priorFreeform?.propertyBindings != null
        ? { propertyBindings: priorFreeform.propertyBindings }
        : {}),
    };
    const next = publishDiagramDraft(
      parseDiagramV1({
        ...draft,
        freeform,
      }),
    );
    if (options?.recordUndo !== false) {
      pushDiagramJsonUndoCoalesced(diagramId, () => {
        get().pushDiagramUndoSnapshot(diagramId);
      });
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  patchKonvaPropertyBinding: (diagramId, shapeId, property, binding, options) => {
    const draft = get().drafts[diagramId];
    if (draft?.freeform?.engine !== "konva") {
      return;
    }
    const prior = draft.freeform.propertyBindings ?? {};
    const shapeBindings = { ...(prior[shapeId] ?? {}) };
    if (binding == null) {
      delete shapeBindings[property];
    } else {
      shapeBindings[property] = binding;
    }
    const nextBindings = { ...prior };
    if (Object.keys(shapeBindings).length === 0) {
      delete nextBindings[shapeId];
    } else {
      nextBindings[shapeId] = shapeBindings;
    }
    const freeform: DiagramKonvaFreeformV1 = {
      ...draft.freeform,
      propertyBindings: Object.keys(nextBindings).length > 0 ? nextBindings : undefined,
    };
    const next = publishDiagramDraft(parseDiagramV1({ ...draft, freeform }));
    if (options?.recordUndo !== false) {
      pushDiagramJsonUndoCoalesced(diagramId, () => {
        get().pushDiagramUndoSnapshot(diagramId);
      });
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  setSelectedNodeId: (diagramId, nodeId) => {
    set((state) => ({
      selectedNodeIds: { ...state.selectedNodeIds, [diagramId]: nodeId },
    }));
  },
  setSelected3dNodeId: (diagramId, nodeId) => {
    set((state) => ({
      selected3dNodeIds: { ...state.selected3dNodeIds, [diagramId]: nodeId },
    }));
  },
  patchNode: (diagramId, nodeId, patch, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const next = publishDiagramDraft(patchDiagramNode(draft, nodeId, patch));
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
    const next = publishDiagramDraft(replaceDiagramNode(draft, nodeId, node));
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
    const next = publishDiagramDraft(addDiagramNode(draft, node));
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
    const next = publishDiagramDraft(removeDiagramNode(draft, nodeId));
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
    const next = publishDiagramDraft(reorderDiagramNode(draft, nodeId, direction));
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
  enableDiagram3dLayer: (diagramId, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    const next = publishDiagramDraft(ensureDiagram3dLayerWithModel(draft));
    const layerNodeId = next.layers.find((layer) => layer.kind === "3d")?.nodes[0]?.id ?? null;
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
      selected3dNodeIds: {
        ...state.selected3dNodeIds,
        [diagramId]: layerNodeId,
      },
    }));
  },
  patch3dNode: (diagramId, nodeId, patch, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const candidate = publishDiagramDraft(patchDiagram3dNode(draft, nodeId, patch));
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: candidate },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  patch3dCamera: (diagramId, patch, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const candidate = publishDiagramDraft(patchDiagram3dCamera(draft, patch));
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: candidate },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  reset3dCamera: (diagramId, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const candidate = publishDiagramDraft(resetDiagram3dCamera(draft));
    if (candidate === draft) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: candidate },
      dirty: { ...state.dirty, [diagramId]: true },
    }));
  },
  add3dNode: (diagramId, node, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    const parentGroupId = options?.parentGroupId ?? null;
    const next = publishDiagramDraft(addDiagram3dNodeToParent(draft, node, parentGroupId));
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
      selected3dNodeIds: { ...state.selected3dNodeIds, [diagramId]: node.id },
    }));
  },
  move3dNode: (diagramId, nodeId, parentGroupId, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    const next = publishDiagramDraft(moveDiagram3dNodeToParent(draft, nodeId, parentGroupId));
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
  remove3dNode: (diagramId, nodeId, options) => {
    const draft = get().drafts[diagramId];
    if (draft == null) {
      return;
    }
    if (options?.recordUndo !== false) {
      get().pushDiagramUndoSnapshot(diagramId);
    }
    const next = publishDiagramDraft(removeDiagram3dNode(draft, nodeId));
    set((state) => ({
      drafts: { ...state.drafts, [diagramId]: next },
      dirty: { ...state.dirty, [diagramId]: true },
      selected3dNodeIds: {
        ...state.selected3dNodeIds,
        [diagramId]: state.selected3dNodeIds[diagramId] === nodeId ? null : state.selected3dNodeIds[diagramId],
      },
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
      selected3dNodeIds: { ...state.selected3dNodeIds, [diagramId]: null },
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
