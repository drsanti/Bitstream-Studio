import { create } from "zustand";

type CourseWidgetBoardEditorState = {
  selectedWidgetId: string | null;
  selectWidget: (widgetId: string | null) => void;
  clearWidgetSelection: () => void;
};

export const useCourseWidgetBoardEditorStore = create<CourseWidgetBoardEditorState>((set) => ({
  selectedWidgetId: null,
  selectWidget: (widgetId) => set({ selectedWidgetId: widgetId }),
  clearWidgetSelection: () => set({ selectedWidgetId: null }),
}));
