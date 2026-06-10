import { cloneCoursePage, getCoursePageSourcePath, loadCoursePage } from "../content/pageRegistry";
import { initCourseDiagramsForPage } from "../content/initCourseDiagramsForPage";
import { initCourseScenesForPage } from "../content/initCourseScenesForPage";
import { useCoursePackStore } from "../content/useCoursePackStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function navigateCoursePage(pageId: string, options?: { dirty?: boolean }): boolean {
  const page = loadCoursePage(pageId);
  const sourcePath = getCoursePageSourcePath(pageId);
  if (page == null || sourcePath == null) {
    return false;
  }

  useCoursePageEditorStore.getState().initPage(cloneCoursePage(page), sourcePath, {
    dirty: options?.dirty,
  });
  initCourseDiagramsForPage(page);
  initCourseScenesForPage(page);
  useCoursePackStore.getState().setActivePageId(pageId);
  return true;
}
