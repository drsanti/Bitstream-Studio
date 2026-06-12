import { create } from "zustand";
import type { PhysicsLabAuthoringMode, PhysicsLabGizmoMode } from "../utils/physicsLabMath.js";
import type { PhysicsLabProjectionMode } from "../core/physicsLabViewportProjection.js";
import { parsePhysicsLabSceneDocument } from "../serialization/physicsLabSceneDocument.js";
import type { PhysicsLabBodyDef, PhysicsLabShapeKind } from "../types/physicsLabBody.js";
import {
  createPhysicsLabSpawnBody,
  isPhysicsLabFloor,
  PHYSICS_LAB_INITIAL_BODIES,
} from "../types/physicsLabBody.js";

export type PhysicsLabWorkbenchMode = "edit" | "simulate";

type PhysicsLabSnapshot = {
  bodies: PhysicsLabBodyDef[];
};

const MAX_UNDO = 50;

function cloneBodies(bodies: readonly PhysicsLabBodyDef[]): PhysicsLabBodyDef[] {
  return bodies.map((body) => ({
    ...body,
    position: [...body.position] as [number, number, number],
    rotationDeg: body.rotationDeg
      ? ([...body.rotationDeg] as [number, number, number])
      : [0, 0, 0],
    halfExtents: body.halfExtents ? ([...body.halfExtents] as [number, number, number]) : undefined,
  }));
}

function selectionFromPick(
  current: readonly string[],
  id: string,
  extend: boolean,
  toggle: boolean,
): { selectedIds: string[]; activeId: string } {
  if (toggle) {
    const set = new Set(current);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    const selectedIds = [...set];
    return { selectedIds, activeId: id };
  }
  if (extend) {
    const set = new Set(current);
    set.add(id);
    const selectedIds = [...set];
    return { selectedIds, activeId: id };
  }
  return { selectedIds: [id], activeId: id };
}

type PhysicsLabState = {
  workbenchMode: PhysicsLabWorkbenchMode;
  isPlaying: boolean;
  authoringMode: PhysicsLabAuthoringMode;
  gizmoMode: PhysicsLabGizmoMode;
  projectionMode: PhysicsLabProjectionMode;
  bodies: PhysicsLabBodyDef[];
  selectedIds: string[];
  activeId: string | null;
  simGeneration: number;
  showColliderWireframes: boolean;
  undoStack: PhysicsLabSnapshot[];
  redoStack: PhysicsLabSnapshot[];
  setWorkbenchMode: (mode: PhysicsLabWorkbenchMode) => void;
  setAuthoringMode: (mode: PhysicsLabAuthoringMode) => void;
  setGizmoMode: (mode: PhysicsLabGizmoMode) => void;
  toggleProjectionMode: () => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSelection: (selectedIds: string[], activeId?: string | null) => void;
  pickBody: (id: string, options?: { extend?: boolean; toggle?: boolean }) => void;
  clearSelection: () => void;
  spawnBody: (shape: PhysicsLabShapeKind) => void;
  deleteSelectedBodies: () => void;
  updateBodyTransform: (
    id: string,
    patch: { position?: [number, number, number]; rotationDeg?: [number, number, number] },
  ) => void;
  reorderBody: (bodyId: string, targetIndex: number) => void;
  loadSceneDocument: (json: string) => void;
  pushUndoSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  resetSimulation: () => void;
  setShowColliderWireframes: (value: boolean) => void;
};

export const usePhysicsLabStore = create<PhysicsLabState>((set, get) => ({
  workbenchMode: "edit",
  isPlaying: false,
  authoringMode: "object",
  gizmoMode: "translate",
  projectionMode: "perspective",
  bodies: cloneBodies(PHYSICS_LAB_INITIAL_BODIES),
  selectedIds: ["dynamic-box"],
  activeId: "dynamic-box",
  simGeneration: 0,
  showColliderWireframes: true,
  undoStack: [],
  redoStack: [],
  setWorkbenchMode: (mode) => {
    set({
      workbenchMode: mode,
      isPlaying: mode === "simulate",
    });
  },
  setAuthoringMode: (mode) => {
    set({ authoringMode: mode });
  },
  setGizmoMode: (mode) => {
    set({ gizmoMode: mode });
  },
  toggleProjectionMode: () => {
    set((state) => ({
      projectionMode: state.projectionMode === "perspective" ? "orthographic" : "perspective",
    }));
  },
  setPlaying: (playing) => {
    set({ isPlaying: playing });
  },
  togglePlaying: () => {
    const { workbenchMode, isPlaying } = get();
    if (workbenchMode !== "simulate") {
      return;
    }
    set({ isPlaying: !isPlaying });
  },
  setSelection: (selectedIds, activeId) => {
    set({
      selectedIds: [...new Set(selectedIds)],
      activeId: activeId ?? selectedIds[selectedIds.length - 1] ?? null,
    });
  },
  pickBody: (id, options) => {
    const { selectedIds } = get();
    const next = selectionFromPick(
      selectedIds,
      id,
      options?.extend === true,
      options?.toggle === true,
    );
    set(next);
  },
  clearSelection: () => {
    set({ selectedIds: [], activeId: null });
  },
  pushUndoSnapshot: () => {
    set((state) => ({
      undoStack: [
        ...state.undoStack.slice(-(MAX_UNDO - 1)),
        { bodies: cloneBodies(state.bodies) },
      ],
      redoStack: [],
    }));
  },
  spawnBody: (shape) => {
    const state = get();
    state.pushUndoSnapshot();
    const spawnIndex = state.bodies.filter((b) => !isPhysicsLabFloor(b.id)).length;
    const maxSort = state.bodies.reduce((max, body) => Math.max(max, body.sortOrder ?? 0), 0);
    const body = { ...createPhysicsLabSpawnBody(shape, spawnIndex), sortOrder: maxSort + 1 };
    set((current) => ({
      bodies: [...current.bodies, body],
      selectedIds: [body.id],
      activeId: body.id,
      simGeneration: current.simGeneration + 1,
    }));
  },
  deleteSelectedBodies: () => {
    const { selectedIds, bodies } = get();
    const deletable = selectedIds.filter((id) => !isPhysicsLabFloor(id));
    if (deletable.length === 0) {
      return;
    }
    get().pushUndoSnapshot();
    const remove = new Set(deletable);
    const nextBodies = bodies.filter((body) => !remove.has(body.id));
    set((state) => ({
      bodies: nextBodies,
      selectedIds: state.selectedIds.filter((id) => !remove.has(id)),
      activeId: state.activeId != null && remove.has(state.activeId) ? null : state.activeId,
      simGeneration: state.simGeneration + 1,
    }));
  },
  updateBodyTransform: (id, patch) => {
    set((state) => ({
      bodies: state.bodies.map((body) => {
        if (body.id !== id) {
          return body;
        }
        return {
          ...body,
          position: patch.position ?? body.position,
          rotationDeg: patch.rotationDeg ?? body.rotationDeg ?? [0, 0, 0],
        };
      }),
      simGeneration: state.simGeneration + 1,
    }));
  },
  reorderBody: (bodyId, targetIndex) => {
    const { bodies } = get();
    const sorted = [...bodies].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const fromIndex = sorted.findIndex((body) => body.id === bodyId);
    if (fromIndex < 0 || fromIndex === targetIndex) {
      return;
    }
    get().pushUndoSnapshot();
    const [moved] = sorted.splice(fromIndex, 1);
    if (moved == null) {
      return;
    }
    sorted.splice(targetIndex, 0, moved);
    const reindexed = sorted.map((body, index) => ({ ...body, sortOrder: index }));
    set({ bodies: reindexed });
  },
  loadSceneDocument: (json) => {
    const doc = parsePhysicsLabSceneDocument(json);
    get().pushUndoSnapshot();
    const bodies = cloneBodies(doc.bodies);
    set({
      bodies,
      selectedIds: bodies[0]?.id ? [bodies[0].id] : [],
      activeId: bodies[0]?.id ?? null,
      simGeneration: get().simGeneration + 1,
    });
  },
  undo: () => {
    const { undoStack, bodies, redoStack, selectedIds, activeId } = get();
    if (undoStack.length === 0) {
      return;
    }
    const previous = undoStack[undoStack.length - 1]!;
    const nextBodies = cloneBodies(previous.bodies);
    const validIds = new Set(nextBodies.map((body) => body.id));
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, { bodies: cloneBodies(bodies) }],
      bodies: nextBodies,
      selectedIds: selectedIds.filter((id) => validIds.has(id)),
      activeId: activeId != null && validIds.has(activeId) ? activeId : null,
      simGeneration: get().simGeneration + 1,
    });
  },
  redo: () => {
    const { redoStack, bodies, undoStack, selectedIds, activeId } = get();
    if (redoStack.length === 0) {
      return;
    }
    const next = redoStack[redoStack.length - 1]!;
    const nextBodies = cloneBodies(next.bodies);
    const validIds = new Set(nextBodies.map((body) => body.id));
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, { bodies: cloneBodies(bodies) }],
      bodies: nextBodies,
      selectedIds: selectedIds.filter((id) => validIds.has(id)),
      activeId: activeId != null && validIds.has(activeId) ? activeId : null,
      simGeneration: get().simGeneration + 1,
    });
  },
  resetSimulation: () => {
    set((state) => ({
      isPlaying: false,
      simGeneration: state.simGeneration + 1,
    }));
  },
  setShowColliderWireframes: (value) => {
    set({ showColliderWireframes: value });
  },
}));

export function physicsLabPhysicsPaused(state: Pick<PhysicsLabState, "workbenchMode" | "isPlaying">): boolean {
  return state.workbenchMode === "edit" || !state.isPlaying;
}

export function physicsLabBodyById(
  bodies: readonly PhysicsLabBodyDef[],
  id: string,
): PhysicsLabBodyDef | undefined {
  return bodies.find((body) => body.id === id);
}
