import type { LucideIcon } from "lucide-react";
import { FileText, LayoutGrid, PenLine } from "lucide-react";

export type CourseMaintainerTab = "page" | "block" | "diagram";

export const COURSE_MAINTAINER_TAB_STORAGE_KEY = "course-studio:maintainer-tab.v1";

export const COURSE_MAINTAINER_TABS: readonly {
  id: CourseMaintainerTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "page", label: "Page", Icon: FileText },
  { id: "block", label: "Block", Icon: LayoutGrid },
  { id: "diagram", label: "Diagram", Icon: PenLine },
];

export function readStoredCourseMaintainerTab(): CourseMaintainerTab {
  if (typeof window === "undefined") {
    return "block";
  }
  try {
    const raw = window.localStorage.getItem(COURSE_MAINTAINER_TAB_STORAGE_KEY);
    if (raw === "page" || raw === "block" || raw === "diagram") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "block";
}

export function writeStoredCourseMaintainerTab(tab: CourseMaintainerTab): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(COURSE_MAINTAINER_TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}
