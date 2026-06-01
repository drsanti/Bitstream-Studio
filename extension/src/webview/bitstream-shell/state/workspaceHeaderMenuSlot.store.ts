import type { ReactNode } from "react";
import { create } from "zustand";

type WorkspaceHeaderMenuSlotState = {
  /** Extra menu sections from the active workspace (mounted into {@link BitstreamHeaderMenuPanel}). */
  sections: ReactNode | null;
  setSections: (node: ReactNode | null) => void;
};

export const useWorkspaceHeaderMenuSlotStore = create<WorkspaceHeaderMenuSlotState>((set) => ({
  sections: null,
  setSections: (node) => set({ sections: node }),
}));
