import { create } from "zustand";

export type PhysicsLabWorkbenchMode = "edit" | "simulate";

export type PhysicsLabSceneObjectId = "floor" | "dynamic-box";

type PhysicsLabState = {
  workbenchMode: PhysicsLabWorkbenchMode;
  isPlaying: boolean;
  selectedObjectId: PhysicsLabSceneObjectId | null;
  simGeneration: number;
  setWorkbenchMode: (mode: PhysicsLabWorkbenchMode) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  selectObject: (id: PhysicsLabSceneObjectId | null) => void;
  resetSimulation: () => void;
};

export const usePhysicsLabStore = create<PhysicsLabState>((set, get) => ({
  workbenchMode: "edit",
  isPlaying: false,
  selectedObjectId: "dynamic-box",
  simGeneration: 0,
  setWorkbenchMode: (mode) => {
    set({
      workbenchMode: mode,
      isPlaying: mode === "simulate",
    });
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
  selectObject: (id) => {
    set({ selectedObjectId: id });
  },
  resetSimulation: () => {
    set((state) => ({
      isPlaying: false,
      simGeneration: state.simGeneration + 1,
    }));
  },
}));

export function physicsLabPhysicsPaused(state: Pick<PhysicsLabState, "workbenchMode" | "isPlaying">): boolean {
  return state.workbenchMode === "edit" || !state.isPlaying;
}
