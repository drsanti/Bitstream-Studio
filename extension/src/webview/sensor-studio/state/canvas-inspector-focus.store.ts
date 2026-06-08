import { create } from "zustand";
import type { CanvasInspectorCanvasTabCardId } from "../features/editor/components/inspector/canvas-inspector-ui-persistence";

export type CanvasInspectorFocusRequest = {
  tab: "canvas";
  expandCardId: CanvasInspectorCanvasTabCardId;
};

type CanvasInspectorFocusStore = {
  request: CanvasInspectorFocusRequest | null;
  focusPerformanceCard: () => void;
  clearRequest: () => void;
};

export const useCanvasInspectorFocusStore = create<CanvasInspectorFocusStore>((set) => ({
  request: null,
  focusPerformanceCard: () =>
    set({ request: { tab: "canvas", expandCardId: "performance" } }),
  clearRequest: () => set({ request: null }),
}));
