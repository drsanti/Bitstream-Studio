import type { CourseV1 } from "../schemas/course.v1";
import { parseCourseV1 } from "../schemas/course.v1";
import { isCourseContentReadOnlySourcePath } from "../content/courseSourcePaths";

export async function saveCourseDev(
  sourcePath: string,
  course: CourseV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: false, error: "Save is only available in Vite dev mode." };
  }

  if (isCourseContentReadOnlySourcePath(sourcePath)) {
    return { ok: false, error: "This course is loaded from a read-only presentation pack." };
  }

  const response = await fetch("/__dev_api/course-studio/save-course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath, course }),
  });

  const body = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || body.ok !== true) {
    return { ok: false, error: body.error ?? `Save failed (${response.status})` };
  }
  return { ok: true };
}

export function validateCourseForSave(course: CourseV1): CourseV1 {
  return parseCourseV1(structuredClone(course));
}
