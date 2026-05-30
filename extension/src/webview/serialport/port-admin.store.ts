import { create } from "zustand";
import type { PortInfo } from "../../serialport-bridge/protocol";

export type PortDetailsViewMode = "readable" | "json";

const PORT_DETAILS_VIEW_MODE_KEY = "t3d-port-admin-details-view-mode";

function loadPortDetailsViewMode(): PortDetailsViewMode
{
  try
  {
    return localStorage.getItem(PORT_DETAILS_VIEW_MODE_KEY) === "json"
      ? "json"
      : "readable";
  }
  catch
  {
    return "readable";
  }
}

function savePortDetailsViewMode(mode: PortDetailsViewMode): void
{
  try
  {
    localStorage.setItem(PORT_DETAILS_VIEW_MODE_KEY, mode);
  }
  catch
  {
    /* ignore quota / private mode */
  }
}

interface PortAdminState {
  isOpen: boolean;
  selectedPath: string | null;
  ports: PortInfo[];
  loading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  detailsViewMode: PortDetailsViewMode;
  open: () => void;
  close: () => void;
  setSelectedPath: (path: string | null) => void;
  setPorts: (ports: PortInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDetailsViewMode: (mode: PortDetailsViewMode) => void;
}

export const usePortAdminStore = create<PortAdminState>((set, get) => ({
  isOpen: false,
  selectedPath: null,
  ports: [],
  loading: false,
  error: null,
  lastUpdatedAt: null,
  detailsViewMode: loadPortDetailsViewMode(),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setSelectedPath: (path) => set({ selectedPath: path }),
  setPorts: (ports) => {
    const selectedPath = get().selectedPath;
    const hasSelection = selectedPath && ports.some((p) => p.path === selectedPath);
    set({
      ports,
      selectedPath: hasSelection ? selectedPath : (ports[0]?.path ?? null),
      lastUpdatedAt: Date.now(),
    });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setDetailsViewMode: (mode) => {
    savePortDetailsViewMode(mode);
    set({ detailsViewMode: mode });
  },
}));
