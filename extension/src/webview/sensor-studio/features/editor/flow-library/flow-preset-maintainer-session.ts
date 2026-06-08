import { create } from "zustand";

type FlowPresetMaintainerSessionStore = {
  lastLoadedOfficialPresetId: string | null;
  lastLoadedOfficialPresetName: string | null;
  lastCommitStatus: string | null;
  setLastLoadedOfficialPreset: (presetId: string, presetName: string) => void;
  clearLastLoadedOfficialPreset: () => void;
  setLastCommitStatus: (message: string | null) => void;
};

export const useFlowPresetMaintainerSessionStore =
  create<FlowPresetMaintainerSessionStore>((set) => ({
    lastLoadedOfficialPresetId: null,
    lastLoadedOfficialPresetName: null,
    lastCommitStatus: null,
    setLastLoadedOfficialPreset: (presetId, presetName) => {
      set({
        lastLoadedOfficialPresetId: presetId,
        lastLoadedOfficialPresetName: presetName,
      });
    },
    clearLastLoadedOfficialPreset: () => {
      set({
        lastLoadedOfficialPresetId: null,
        lastLoadedOfficialPresetName: null,
      });
    },
    setLastCommitStatus: (message) => set({ lastCommitStatus: message }),
  }));
