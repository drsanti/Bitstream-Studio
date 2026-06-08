import { create } from "zustand";

const MAINTAINER_MODE_KEY = "course-studio:maintainer-mode:v1";

/** Maintainer tools are dev-only — not available in packaged VSIX. */
export function isCourseStudioMaintainerModeAvailable(): boolean {
  return import.meta.env.DEV;
}

function readStoredMaintainerMode(): boolean {
  if (!isCourseStudioMaintainerModeAvailable() || typeof localStorage === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(MAINTAINER_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistMaintainerMode(enabled: boolean): void {
  if (!isCourseStudioMaintainerModeAvailable() || typeof localStorage === "undefined") {
    return;
  }
  try {
    if (enabled) {
      localStorage.setItem(MAINTAINER_MODE_KEY, "1");
    } else {
      localStorage.removeItem(MAINTAINER_MODE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

type CourseStudioMaintainerModeStore = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useCourseStudioMaintainerModeStore = create<CourseStudioMaintainerModeStore>((set) => ({
  enabled: readStoredMaintainerMode(),
  setEnabled: (enabled) => {
    persistMaintainerMode(enabled);
    set({ enabled });
  },
}));

export function useCourseStudioMaintainerModeEnabled(): boolean {
  const available = isCourseStudioMaintainerModeAvailable();
  const enabled = useCourseStudioMaintainerModeStore((s) => s.enabled);
  return available && enabled;
}
