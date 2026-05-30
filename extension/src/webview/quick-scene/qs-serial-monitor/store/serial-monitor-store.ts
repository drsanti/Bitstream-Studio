import { create } from "zustand";

/** Defaults for log buffer (bridge-only UI; no Web Serial dependency). */
const DEFAULT_BAUD_RATE = 115200;
const MAX_TERMINAL_LINES = 500;

export interface SerialMonitorState {
  lines: string[];
  maxLines: number;
  baudRate: number;
  autoScroll: boolean;
  /** When false, incoming serial data is ignored (port may stay open). */
  receivingEnabled: boolean;
  appendLine: (line: string) => void;
  clearLines: () => void;
  setBaudRate: (rate: number) => void;
  setAutoScroll: (value: boolean) => void;
  setMaxLines: (n: number) => void;
  setReceivingEnabled: (value: boolean) => void;
}

export const useSerialMonitorStore = create<SerialMonitorState>((set, get) => ({
  lines: [],
  maxLines: MAX_TERMINAL_LINES,
  baudRate: DEFAULT_BAUD_RATE,
  autoScroll: true,
  receivingEnabled: false,

  appendLine: (line: string) => {
    const max = get().maxLines;
    set((state) => ({
      lines: [...state.lines, line].slice(-max),
    }));
  },

  clearLines: () => set({ lines: [] }),

  setBaudRate: (rate: number) => set({ baudRate: rate }),

  setAutoScroll: (value: boolean) => set({ autoScroll: value }),

  setMaxLines: (n: number) => {
    const clamped = Math.max(50, Math.min(5000, n));
    set((state) => ({
      maxLines: clamped,
      lines: state.lines.slice(-clamped),
    }));
  },

  setReceivingEnabled: (value: boolean) => set({ receivingEnabled: value }),
}));
