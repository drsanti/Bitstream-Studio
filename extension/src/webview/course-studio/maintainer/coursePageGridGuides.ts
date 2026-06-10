import { create } from "zustand";

const STORAGE_KEY = "course-studio:page-grid-guides.v1";

export function readCoursePageGridGuidesEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "0") {
      return false;
    }
    if (raw === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return true;
}

export function writeCoursePageGridGuidesEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

type CoursePageGridGuidesState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useCoursePageGridGuidesStore = create<CoursePageGridGuidesState>((set) => ({
  enabled: readCoursePageGridGuidesEnabled(),
  setEnabled: (enabled) => {
    writeCoursePageGridGuidesEnabled(enabled);
    set({ enabled });
  },
}));
