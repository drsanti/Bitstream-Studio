import { create } from "zustand";

type FlowPresetLinkedSessionStore = {
  linkedProjectPresetId: string | null;
  linkedProjectPresetName: string | null;
  setLinkedProjectPreset: (presetId: string, presetName: string) => void;
  clearLinkedProjectPreset: () => void;
};

export const useFlowPresetLinkedSessionStore = create<FlowPresetLinkedSessionStore>((set) => ({
  linkedProjectPresetId: null,
  linkedProjectPresetName: null,
  setLinkedProjectPreset: (presetId, presetName) => {
    set({
      linkedProjectPresetId: presetId,
      linkedProjectPresetName: presetName,
    });
  },
  clearLinkedProjectPreset: () => {
    set({
      linkedProjectPresetId: null,
      linkedProjectPresetName: null,
    });
  },
}));
