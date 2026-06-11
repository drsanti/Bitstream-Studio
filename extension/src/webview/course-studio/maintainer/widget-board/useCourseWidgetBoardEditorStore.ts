import { create } from "zustand";
import { dashboardPrimaryHighlightedWidgetId } from "../../../sensor-studio/core/dashboard/dashboard-widget-selection";

type CourseWidgetBoardEditorState = {
  /** Ordered selection — last id is the primary (resize / inspector anchor). */
  selectedWidgetIds: string[];
  /** Primary selected widget — mirrors last entry in {@link selectedWidgetIds}. */
  selectedWidgetId: string | null;
  setWidgetSelection: (widgetIds: string[]) => void;
  selectWidget: (widgetId: string | null) => void;
  clearWidgetSelection: () => void;
};

function selectionState(widgetIds: string[]) {
  const selectedWidgetIds = [...new Set(widgetIds.filter(Boolean))];
  return {
    selectedWidgetIds,
    selectedWidgetId: dashboardPrimaryHighlightedWidgetId(selectedWidgetIds),
  };
}

export const useCourseWidgetBoardEditorStore = create<CourseWidgetBoardEditorState>((set) => ({
  selectedWidgetIds: [],
  selectedWidgetId: null,
  setWidgetSelection: (widgetIds) => set(selectionState(widgetIds)),
  selectWidget: (widgetId) => set(selectionState(widgetId == null ? [] : [widgetId])),
  clearWidgetSelection: () => set({ selectedWidgetIds: [], selectedWidgetId: null }),
}));
