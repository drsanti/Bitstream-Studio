import { create } from "zustand";

const FLOW_PRESET_MAINTAINER_MODE_KEY = "sensor-studio:flow-preset-maintainer-mode:v1";

/** Maintainer tools are dev-only — not shipped for end users in production builds. */
export function isFlowPresetMaintainerModeAvailable(): boolean {
  return import.meta.env.DEV;
}

function readStoredMaintainerMode(): boolean {
  if (!isFlowPresetMaintainerModeAvailable() || typeof localStorage === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(FLOW_PRESET_MAINTAINER_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistMaintainerMode(enabled: boolean): void {
  if (!isFlowPresetMaintainerModeAvailable() || typeof localStorage === "undefined") {
    return;
  }
  try {
    if (enabled) {
      localStorage.setItem(FLOW_PRESET_MAINTAINER_MODE_KEY, "1");
    } else {
      localStorage.removeItem(FLOW_PRESET_MAINTAINER_MODE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

type FlowPresetMaintainerModeStore = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useFlowPresetMaintainerModeStore = create<FlowPresetMaintainerModeStore>((set) => ({
  enabled: readStoredMaintainerMode(),
  setEnabled: (enabled) => {
    persistMaintainerMode(enabled);
    set({ enabled });
  },
}));

export function useFlowPresetMaintainerModeEnabled(): boolean {
  const available = isFlowPresetMaintainerModeAvailable();
  const enabled = useFlowPresetMaintainerModeStore((s) => s.enabled);
  return available && enabled;
}
