import { create } from "zustand";
import type { StudioDemoTemplateId } from "../store/flow-editor.store";
import { officialFlowPresetIdForTemplate } from "./demo-template-flow-preset-category";

export type FlowLibrarySavedTab = "flows" | "groups";

export type FlowLibraryNavigatePayload = {
  savedTab?: FlowLibrarySavedTab;
  scrollToOfficial?: boolean;
  highlightPresetId?: string | null;
};

type FlowLibraryNavigationStore = {
  seq: number;
  payload: FlowLibraryNavigatePayload | null;
  requestNavigate: (payload: FlowLibraryNavigatePayload) => void;
  clearNavigate: () => void;
};

export const useFlowLibraryNavigationStore = create<FlowLibraryNavigationStore>((set, get) => ({
  seq: 0,
  payload: null,
  requestNavigate: (payload) => {
    set({ seq: get().seq + 1, payload });
  },
  clearNavigate: () => set({ payload: null }),
}));

export function focusFlowLibraryPane(focusWorkbenchPane: (editorType: string) => void): void {
  focusWorkbenchPane("library");
}

export function buildOfficialFlowLibraryNavigate(
  templateId: StudioDemoTemplateId,
): FlowLibraryNavigatePayload {
  return {
    savedTab: "flows",
    scrollToOfficial: true,
    highlightPresetId: officialFlowPresetIdForTemplate(templateId),
  };
}

export function openFlowLibraryOfficial(
  focusWorkbenchPane: (editorType: string) => void,
  templateId: StudioDemoTemplateId,
): void {
  useFlowLibraryNavigationStore.getState().requestNavigate(buildOfficialFlowLibraryNavigate(templateId));
  focusFlowLibraryPane(focusWorkbenchPane);
}
