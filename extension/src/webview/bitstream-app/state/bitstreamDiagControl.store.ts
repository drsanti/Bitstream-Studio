import { create } from "zustand";

export type DiagTaskPriorityMode = "sensor" | "diagnostics";

type DiagControlState = {
  streamEnabled: boolean;
  globalPeriodMs: number;
  taskPeriodMs: number;
  maxRowsPerBatch: number;
  resyncPeriodMs: number;
  priorityMode: DiagTaskPriorityMode;
  setStreamEnabled: (v: boolean) => void;
  setGlobalPeriodMs: (v: number) => void;
  setTaskPeriodMs: (v: number) => void;
  setMaxRowsPerBatch: (v: number) => void;
  setResyncPeriodMs: (v: number) => void;
  setPriorityMode: (v: DiagTaskPriorityMode) => void;
};

export const useBitstreamDiagControlStore = create<DiagControlState>((set) => ({
  streamEnabled: false,
  globalPeriodMs: 1000,
  taskPeriodMs: 1000,
  maxRowsPerBatch: 6,
  resyncPeriodMs: 2000,
  priorityMode: "sensor",
  setStreamEnabled: (v) => set({ streamEnabled: v }),
  setGlobalPeriodMs: (v) => set({ globalPeriodMs: v }),
  setTaskPeriodMs: (v) => set({ taskPeriodMs: v }),
  setMaxRowsPerBatch: (v) => set({ maxRowsPerBatch: v }),
  setResyncPeriodMs: (v) => set({ resyncPeriodMs: v }),
  setPriorityMode: (v) => set({ priorityMode: v }),
}));

