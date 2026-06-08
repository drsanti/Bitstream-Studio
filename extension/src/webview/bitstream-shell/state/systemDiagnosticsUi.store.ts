import { create } from "zustand";

interface SystemDiagnosticsUiState {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

/** Opens Diagnostics & runtime services ({@link RuntimeServicesHealthPanel}). */
export const useSystemDiagnosticsUiStore = create<SystemDiagnosticsUiState>((set) => ({
  open: false,
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
}));
