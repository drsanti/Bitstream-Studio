import { create } from "zustand";
import type { DiagTaskRow, DiagTaskTableState } from "../types/diagTaskTable";

type DiagTaskTableStore = DiagTaskTableState & {
  reset: () => void;
  setError: (error: string | null) => void;
  applyHeader: (payload: { timestampMs: number; expectedTaskCount: number }) => void;
  applyRow: (row: DiagTaskRow) => void;
};

const EMPTY: DiagTaskTableState = {
  timestampMs: null,
  expectedTaskCount: null,
  rowsById: {},
  updatedAt: null,
  error: null,
};

export const useBitstreamDiagTasksStore = create<DiagTaskTableStore>((set, get) => ({
  ...EMPTY,
  reset: () => set({ ...EMPTY }),
  setError: (error) => set({ error }),
  applyHeader: ({ timestampMs, expectedTaskCount }) =>
    set({
      timestampMs,
      expectedTaskCount,
      updatedAt: Date.now(),
      error: null,
    }),
  applyRow: (row) => {
    set((s) => ({
      rowsById: { ...s.rowsById, [row.taskId]: row },
      updatedAt: Date.now(),
      error: null,
    }));
  },
}));

