import { create } from "zustand";

type GroupPresetLinkedSessionStore = {
  linkedProjectAssetId: string | null;
  linkedProjectAssetName: string | null;
  setLinkedProjectAsset: (assetId: string, assetName: string) => void;
  clearLinkedProjectAsset: () => void;
};

export const useGroupPresetLinkedSessionStore = create<GroupPresetLinkedSessionStore>((set) => ({
  linkedProjectAssetId: null,
  linkedProjectAssetName: null,
  setLinkedProjectAsset: (assetId, assetName) => {
    set({
      linkedProjectAssetId: assetId,
      linkedProjectAssetName: assetName,
    });
  },
  clearLinkedProjectAsset: () => {
    set({
      linkedProjectAssetId: null,
      linkedProjectAssetName: null,
    });
  },
}));
