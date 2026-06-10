import type { CourseV1 } from "../schemas/course.v1";
import { parseCourseV1 } from "../schemas/course.v1";
import {
  snapshotRuntimeCoursePages,
  restoreRuntimeCoursePages,
  type RuntimeCoursePageSnapshot,
} from "./pageRegistry";
import { useCourseOutlineStore } from "../maintainer/useCourseOutlineStore";
import type { CourseStudioSessionOutlineDraftV1 } from "./courseStudioSessionDraft";
import { cloneCourseDocument, loadCourse } from "./courseRegistry";
import { mergeCourseOutlineWithBundled } from "../runtime/course/courseOutlineTree";

export function buildCourseOutlineSessionDraft():
  | CourseStudioSessionOutlineDraftV1
  | undefined {
  const outlineState = useCourseOutlineStore.getState();
  if (outlineState.course == null) {
    return undefined;
  }

  const runtimePages = snapshotRuntimeCoursePages();
  if (!outlineState.dirty && Object.keys(runtimePages).length === 0) {
    return undefined;
  }

  return {
    courseId: outlineState.courseId,
    sourcePath: outlineState.sourcePath,
    course: parseCourseV1(structuredClone(outlineState.course)),
    courseDirty: outlineState.dirty,
    activeNodeId: outlineState.activeNodeId,
    expandedNodeIds: { ...outlineState.expandedNodeIds },
    runtimePages,
  };
}

export function restoreCourseOutlineSessionDraft(
  outline: CourseStudioSessionOutlineDraftV1,
): void {
  restoreRuntimeCoursePages(outline.runtimePages);

  const bundled = loadCourse(outline.courseId);
  const course =
    bundled != null
      ? mergeCourseOutlineWithBundled(outline.course, cloneCourseDocument(bundled))
      : outline.course;

  useCourseOutlineStore.getState().initCourse(
    outline.courseId,
    course,
    outline.sourcePath,
    {
      activeNodeId: outline.activeNodeId ?? undefined,
      navigate: false,
    },
  );
  useCourseOutlineStore.setState({
    dirty: outline.courseDirty,
    expandedNodeIds: outline.expandedNodeIds,
    activeNodeId: outline.activeNodeId,
  });
}
