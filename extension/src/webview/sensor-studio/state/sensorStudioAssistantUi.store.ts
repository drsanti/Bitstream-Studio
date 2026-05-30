import { create } from "zustand";

export type SensorStudioAssistantLayoutMode = "docked" | "floating";

const ASSISTANT_OPEN_STORAGE_KEY = "sensor-studio:assistant:open";
const ASSISTANT_LAYOUT_STORAGE_KEY = "sensor-studio:assistant:layout";

function readPersistedAssistantOpen(fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage?.getItem(ASSISTANT_OPEN_STORAGE_KEY);
    if (raw === "1") {
      return true;
    }
    if (raw === "0") {
      return false;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function readPersistedAssistantLayout(
  fallback: SensorStudioAssistantLayoutMode,
): SensorStudioAssistantLayoutMode {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage?.getItem(ASSISTANT_LAYOUT_STORAGE_KEY);
    if (raw === "docked" || raw === "floating") {
      return raw;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

type SensorStudioAssistantUiState = {
  assistantOpen: boolean;
  assistantLayoutMode: SensorStudioAssistantLayoutMode;
  setAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  setAssistantLayoutMode: (mode: SensorStudioAssistantLayoutMode) => void;
};

export const useSensorStudioAssistantUiStore = create<SensorStudioAssistantUiState>((set, get) => ({
  assistantOpen: readPersistedAssistantOpen(false),
  assistantLayoutMode: readPersistedAssistantLayout("docked"),
  setAssistantOpen: (open) => {
    set({ assistantOpen: open });
    try {
      window.localStorage?.setItem(ASSISTANT_OPEN_STORAGE_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  },
  toggleAssistant: () => {
    const next = !get().assistantOpen;
    get().setAssistantOpen(next);
  },
  setAssistantLayoutMode: (mode) => {
    set({ assistantLayoutMode: mode });
    try {
      window.localStorage?.setItem(ASSISTANT_LAYOUT_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  },
}));
