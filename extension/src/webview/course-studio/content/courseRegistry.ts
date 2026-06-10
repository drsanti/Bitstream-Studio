import { parseCourseV1, type CourseV1 } from "../schemas/course.v1";
import tesaiotEmbeddedCourseJson from "./tesaiot-embedded.course.v1.json";

export const TESAIOT_EMBEDDED_COURSE_ID = "tesaiot-embedded";

export const TESAIOT_EMBEDDED_COURSE_SOURCE_PATH =
  "src/webview/course-studio/content/tesaiot-embedded.course.v1.json";

/** @deprecated Use `TESAIOT_EMBEDDED_COURSE_ID` — kept for URL alias `?course=bmi270`. */
export const BMI270_COURSE_ID = "bmi270";

const DEFAULT_COURSE_ENTRY = {
  course: parseCourseV1(tesaiotEmbeddedCourseJson),
  sourcePath: TESAIOT_EMBEDDED_COURSE_SOURCE_PATH,
};

const BUNDLED_COURSES: Record<string, { course: CourseV1; sourcePath: string }> = {
  [TESAIOT_EMBEDDED_COURSE_ID]: DEFAULT_COURSE_ENTRY,
  /** Legacy query param — same manifest as `tesaiot-embedded`. */
  [BMI270_COURSE_ID]: DEFAULT_COURSE_ENTRY,
};

export const BUNDLED_COURSE_IDS = [TESAIOT_EMBEDDED_COURSE_ID];

export const DEFAULT_COURSE_ID = TESAIOT_EMBEDDED_COURSE_ID;

export function resolveCourseId(courseId: string): string {
  if (BUNDLED_COURSES[courseId] != null) {
    return courseId === BMI270_COURSE_ID ? TESAIOT_EMBEDDED_COURSE_ID : courseId;
  }
  return DEFAULT_COURSE_ID;
}

export function loadCourse(courseId: string): CourseV1 | null {
  const resolved = resolveCourseId(courseId);
  return BUNDLED_COURSES[resolved]?.course ?? null;
}

export function getCourseSourcePath(courseId: string): string | null {
  const resolved = resolveCourseId(courseId);
  return BUNDLED_COURSES[resolved]?.sourcePath ?? null;
}

export function loadDefaultCourse(): { course: CourseV1; sourcePath: string; courseId: string } {
  const courseId = DEFAULT_COURSE_ID;
  const entry = BUNDLED_COURSES[courseId];
  if (entry == null) {
    throw new Error(`Default course "${courseId}" is missing from bundled registry.`);
  }
  return {
    courseId,
    course: parseCourseV1(structuredClone(entry.course)),
    sourcePath: entry.sourcePath,
  };
}

export function listCourseIds(): string[] {
  return [...BUNDLED_COURSE_IDS];
}

export function cloneCourseDocument(course: CourseV1): CourseV1 {
  return parseCourseV1(structuredClone(course));
}

export function readCourseIdFromLocation(
  search = typeof window !== "undefined" ? window.location.search : "",
): string {
  const params = new URLSearchParams(search);
  const courseId = params.get("course")?.trim();
  if (courseId != null && courseId.length > 0 && BUNDLED_COURSES[courseId] != null) {
    return resolveCourseId(courseId);
  }
  return DEFAULT_COURSE_ID;
}
