import { create } from "zustand";
import type { LayoutNode } from "../../ui/workbench/types";
import {
  collectVisibleWorkbenchEditorTypes,
  readWorkbenchPaneVisibility,
} from "../core/runtime/studio-workbench-visible-panes";

type StudioRuntimeVisibilityStore = {
  visibleEditorTypes: ReadonlySet<string>;
  stagePaneVisible: boolean;
  dashboardPaneVisible: boolean;
  flowPaneVisible: boolean;
  syncFromWorkbenchLayout: (layout: LayoutNode) => void;
};

function buildVisibilityState(types: readonly string[]): Pick<
  StudioRuntimeVisibilityStore,
  "visibleEditorTypes" | "stagePaneVisible" | "dashboardPaneVisible" | "flowPaneVisible"
> {
  const panes = readWorkbenchPaneVisibility(types);
  return {
    visibleEditorTypes: new Set(types),
    ...panes,
  };
}

export const useStudioRuntimeVisibilityStore = create<StudioRuntimeVisibilityStore>((set) => ({
  ...buildVisibilityState([]),
  syncFromWorkbenchLayout: (layout) => {
    const types = collectVisibleWorkbenchEditorTypes(layout);
    set(buildVisibilityState(types));
  },
}));
