import { create } from "zustand";
import type { FlowOutputLensKind } from "../core/flow/flow-output-lens";

export type StudioSplitFlowLens = FlowOutputLensKind | "full";

const STORAGE_KEY = "ternion.sensor-studio.splitFlowLens.v1";

function readStored(): StudioSplitFlowLens {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dashboard" || raw === "stage" || raw === "full") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "dashboard";
}

function writeStored(lens: StudioSplitFlowLens): void {
  try {
    localStorage.setItem(STORAGE_KEY, lens);
  } catch {
    /* ignore */
  }
}

type StudioSplitFlowLensStore = {
  lens: StudioSplitFlowLens;
  setLens: (lens: StudioSplitFlowLens) => void;
};

export const useStudioSplitFlowLensStore = create<StudioSplitFlowLensStore>((set) => ({
  lens: readStored(),
  setLens: (lens) => {
    writeStored(lens);
    set({ lens });
  },
}));
