import { CourseContextualInspectorPanel } from "./CourseContextualInspectorPanel";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

export function CourseInspectorWorkbenchPane() {
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Inspector"
        hint="Enable Maintainer mode to edit page settings, blocks, and placement."
      />
    );
  }

  return (
    <div className="course-workbench-inspector-pane flex h-full min-h-0 flex-col overflow-hidden">
      <CourseContextualInspectorPanel />
    </div>
  );
}
