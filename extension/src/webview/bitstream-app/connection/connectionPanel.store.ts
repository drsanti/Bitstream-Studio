import { create } from "zustand";

export type ConnectionPanelMode = "guided" | "expert";

export type ConnectionStepId =
  | "bridge"
  | "websocket"
  | "source"
  | "transport"
  | "handshake"
  | "link";

const MODE_STORAGE_KEY = "bitstream-connection-panel-mode";

function loadMode(): ConnectionPanelMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    if (raw === "expert" || raw === "guided") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "guided";
}

function persistMode(mode: ConnectionPanelMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

interface ConnectionPanelState {
  open: boolean;
  mode: ConnectionPanelMode;
  focusStepId: ConnectionStepId | null;
  openPanel: (focusStepId?: ConnectionStepId) => void;
  closePanel: () => void;
  setMode: (mode: ConnectionPanelMode) => void;
  clearFocusStep: () => void;
}

export const useConnectionPanelStore = create<ConnectionPanelState>((set) => ({
  open: false,
  mode: loadMode(),
  focusStepId: null,
  openPanel: (focusStepId) =>
    set({
      open: true,
      focusStepId: focusStepId ?? null,
    }),
  closePanel: () => set({ open: false, focusStepId: null }),
  setMode: (mode) => {
    persistMode(mode);
    set({ mode });
  },
  clearFocusStep: () => set({ focusStepId: null }),
}));
