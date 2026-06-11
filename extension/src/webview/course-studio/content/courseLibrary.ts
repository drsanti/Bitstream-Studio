import type { CourseNodeV1, CourseV1 } from "../schemas/course.v1";
import {
  findCourseNode,
  sanitizeCourseOutline,
} from "../runtime/course/courseOutlineTree";
import {
  cloneCourseDocument,
  getCourseSourcePath,
  listCourseIds,
  loadCourse,
  resolveCourseId,
} from "./courseRegistry";

export type CourseLibraryEntry = {
  course: CourseV1;
  sourcePath: string;
};

export type CourseLibraryMap = Record<string, CourseLibraryEntry>;

export type BundledCourseSummary = {
  id: string;
  title: string;
  description?: string;
};

export function buildBundledCourseLibrary(): CourseLibraryMap {
  const library: CourseLibraryMap = {};
  for (const courseId of listCourseIds()) {
    const course = loadCourse(courseId);
    const sourcePath = getCourseSourcePath(courseId);
    if (course == null || sourcePath == null) {
      continue;
    }
    library[courseId] = {
      course: sanitizeCourseOutline(cloneCourseDocument(course)),
      sourcePath,
    };
  }
  return library;
}

export function listBundledCourseSummaries(): BundledCourseSummary[] {
  const library = buildBundledCourseLibrary();
  return listCourseIds().map((courseId) => {
    const course = library[courseId]?.course ?? loadCourse(courseId);
    return {
      id: courseId,
      title: course?.title ?? courseId,
      description: course?.description,
    };
  });
}

/** Top-level book nodes for every bundled course (stable registry order). */
export function selectLibraryBookRoots(library: CourseLibraryMap): CourseNodeV1[] {
  return listCourseIds()
    .map((courseId) => library[courseId]?.course.root)
    .filter((root): root is CourseNodeV1 => root != null);
}

export function findCourseIdForOutlineNode(
  library: CourseLibraryMap,
  nodeId: string,
): string | null {
  for (const courseId of listCourseIds()) {
    const root = library[courseId]?.course.root;
    if (root != null && findCourseNode(root, nodeId) != null) {
      return courseId;
    }
  }
  return null;
}

export function defaultExpandedForLibrary(library: CourseLibraryMap): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  for (const courseId of listCourseIds()) {
    const root = library[courseId]?.course.root;
    if (root == null) {
      continue;
    }
    expanded[root.id] = true;
    for (const chapter of root.children ?? []) {
      expanded[chapter.id] = true;
    }
  }
  return expanded;
}

export function writeCourseIdToLocation(courseId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const resolved = resolveCourseId(courseId);
  const url = new URL(window.location.href);
  url.searchParams.set("course", resolved);
  window.history.replaceState(null, "", url.toString());
}
