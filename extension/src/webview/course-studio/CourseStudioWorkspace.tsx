import { useEffect } from "react";
import { initBundledCourseDiagrams } from "./content/diagramRegistry";
import { initBundledCourseMarkdowns } from "./content/markdownRegistry";
import { loadPilotBmiAccelTheoryPage, PILOT_PAGE_SOURCE_PATH } from "./content/loadPilotPage";
import { useCoursePageEditorStore } from "./maintainer/useCoursePageEditorStore";
import { CourseStudioShell } from "./layout/CourseStudioShell";

/** Bitstream Studio workspace: Course Studio (alive documents v2). */
export function CourseStudioWorkspace() {
  const initPage = useCoursePageEditorStore((s) => s.initPage);

  useEffect(() => {
    initBundledCourseDiagrams();
    initBundledCourseMarkdowns();
    initPage(loadPilotBmiAccelTheoryPage(), PILOT_PAGE_SOURCE_PATH);
  }, [initPage]);

  return <CourseStudioShell />;
}
