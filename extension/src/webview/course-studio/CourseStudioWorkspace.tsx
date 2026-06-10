import { useEffect } from "react";
import { initializeCourseStudioWorkspace } from "./content/initializeCourseStudioWorkspace";
import { useCourseStudioSessionPersistence } from "./maintainer/useCourseStudioSessionPersistence";
import { CourseStudioShell } from "./layout/CourseStudioShell";

/** Bitstream Studio workspace: Course Studio (alive documents v2). */
export function CourseStudioWorkspace() {
  useEffect(() => {
    initializeCourseStudioWorkspace();
  }, []);

  useCourseStudioSessionPersistence();

  return <CourseStudioShell />;
}
