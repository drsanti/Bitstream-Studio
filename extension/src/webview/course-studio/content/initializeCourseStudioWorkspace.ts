import { bootstrapCourseStudioContent } from "./bootstrapCourseStudioContent";
import { registerContentFolderPages } from "./registerContentFolderPages";
import { readCourseStudioBootstrapModeFromLocation } from "./bootstrapCourseStudioBlank";
import {
  loadCourseStudioSessionDraft,
  restoreCourseStudioSessionDraft,
  clearCourseStudioSessionDraft,
  shouldRestoreCourseStudioSessionDraft,
} from "./courseStudioSessionDraft";
import { restoreCourseOutlineSessionDraft } from "./courseOutlineSessionDraft";
import { initCourseScenesForPage } from "./initCourseScenesForPage";
import { initCourseDiagramsForPage } from "./initCourseDiagramsForPage";
import {
  cloneCourseDocument,
  getCourseSourcePath,
  loadCourse,
  readCourseIdFromLocation,
} from "./courseRegistry";
import { buildBundledCourseLibrary } from "./courseLibrary";
import {
  bootstrapCourseOutlineLibrary,
  useCourseOutlineStore,
} from "../maintainer/useCourseOutlineStore";
import { findCourseNodeIdForPageId } from "../runtime/course/courseOutlineTree";

let courseStudioWorkspaceBootstrapped = false;

export function initializeCourseStudioWorkspace(): void {
  if (courseStudioWorkspaceBootstrapped) {
    return;
  }
  courseStudioWorkspaceBootstrapped = true;

  registerContentFolderPages();

  const mode = readCourseStudioBootstrapModeFromLocation();

  const session = loadCourseStudioSessionDraft();
  if (
    session != null &&
    session.bootstrapMode === mode &&
    shouldRestoreCourseStudioSessionDraft(session)
  ) {
    restoreCourseStudioSessionDraft(session);
    if (session.outline != null) {
      restoreCourseOutlineSessionDraft(session.outline);
    }
    initCourseDiagramsForPage(session.page);
    initCourseScenesForPage(session.page);
    if (session.outline == null) {
      const courseId = readCourseIdFromLocation();
      const course = loadCourse(courseId);
      const courseSourcePath = getCourseSourcePath(courseId);
      if (course != null && courseSourcePath != null) {
        const activeNodeId =
          findCourseNodeIdForPageId(course.root, session.page.id) ??
          undefined;
        useCourseOutlineStore.setState({ library: buildBundledCourseLibrary() });
        useCourseOutlineStore.getState().initCourse(
          courseId,
          cloneCourseDocument(course),
          courseSourcePath,
          { activeNodeId, navigate: false },
        );
      }
    }
    return;
  }
  if (session != null && session.bootstrapMode === mode) {
    clearCourseStudioSessionDraft();
  }

  bootstrapCourseStudioContent({ mode });
  bootstrapCourseOutlineLibrary(readCourseIdFromLocation());
}
