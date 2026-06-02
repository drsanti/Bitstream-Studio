import { create } from "zustand";
import type { AssetBootstrapPhase } from "./useAssetBootstrap.js";

export type AssetBootstrapActionsSnapshot = {
  phase: AssetBootstrapPhase;
  internetReachable: boolean;
  canDownload: boolean;
};

type AssetBootstrapActionsApi = {
  recheck: () => void;
  startRequiredSync: () => void;
};

type AssetBootstrapActionsState = {
  registered: boolean;
  phase: AssetBootstrapPhase;
  internetReachable: boolean;
  recheck: () => void;
  startRequiredSync: () => void;
  register: (api: AssetBootstrapActionsApi) => void;
  unregister: () => void;
  setRuntime: (patch: Partial<Pick<AssetBootstrapActionsState, "phase" | "internetReachable">>) => void;
  getSnapshot: () => AssetBootstrapActionsSnapshot;
};

const noop = (): void => {};

export const useAssetBootstrapActionsStore = create<AssetBootstrapActionsState>((set, get) => ({
  registered: false,
  phase: "idle",
  internetReachable: false,
  recheck: noop,
  startRequiredSync: noop,

  register: (api) => {
    set({
      registered: true,
      recheck: api.recheck,
      startRequiredSync: api.startRequiredSync,
    });
  },

  unregister: () => {
    set({
      registered: false,
      recheck: noop,
      startRequiredSync: noop,
    });
  },

  setRuntime: (patch) => set(patch),

  getSnapshot: () => {
    const s = get();
    const blocked = s.phase === "blocked";
    return {
      phase: s.phase,
      internetReachable: s.internetReachable,
      canDownload: s.phase === "blocked" && s.internetReachable,
    };
  },
}));
