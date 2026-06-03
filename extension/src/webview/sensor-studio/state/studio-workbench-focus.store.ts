import { create } from "zustand";
import type { StudioWorkbenchEditorType } from "../features/editor/workbench/validate-studio-workbench-layout";

type StudioWorkbenchFocusStore = {
  /** Workbench pane that last received focus (library, stage, flow, …). */
  activeEditorType: StudioWorkbenchEditorType | null;
  setActiveEditorType: (editorType: StudioWorkbenchEditorType | null) => void;
};

export const useStudioWorkbenchFocusStore = create<StudioWorkbenchFocusStore>((set) => ({
  activeEditorType: null,
  setActiveEditorType: (activeEditorType) => set({ activeEditorType }),
}));
