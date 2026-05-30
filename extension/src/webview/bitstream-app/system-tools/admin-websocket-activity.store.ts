import { create } from "zustand";

interface AdminWebsocketActivityStoreState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Global open/close for `SystemWebsocketActivity` (Quick Action, Bitstream menu, etc.). */
export const useAdminWebsocketActivityStore = create<AdminWebsocketActivityStoreState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
