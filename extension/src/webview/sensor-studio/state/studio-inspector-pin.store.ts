import { create } from "zustand";
import type { StudioInspectorPinTarget } from "../features/editor/components/inspector/studio-inspector-pin";
import {
  readPersistedInspectorPin,
  writePersistedInspectorPin,
} from "../features/editor/components/inspector/studio-inspector-pin.persistence";

type StudioInspectorPinStore = {
  isPinned: boolean;
  target: StudioInspectorPinTarget | null;
  pin: (target: StudioInspectorPinTarget) => void;
  unpin: () => void;
  hydrateFromStorage: () => void;
};

function persistPinState(isPinned: boolean, target: StudioInspectorPinTarget | null): void {
  writePersistedInspectorPin({ isPinned, target });
}

export const useStudioInspectorPinStore = create<StudioInspectorPinStore>((set) => ({
  isPinned: false,
  target: null,
  pin: (target) => {
    set({ isPinned: true, target });
    persistPinState(true, target);
  },
  unpin: () => {
    set({ isPinned: false, target: null });
    persistPinState(false, null);
  },
  hydrateFromStorage: () => {
    const persisted = readPersistedInspectorPin();
    if (persisted?.isPinned === true && persisted.target != null) {
      set({ isPinned: true, target: persisted.target });
    }
  },
}));
