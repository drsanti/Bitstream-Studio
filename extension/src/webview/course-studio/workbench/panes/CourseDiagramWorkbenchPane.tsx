import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { CourseDiagramWorkbenchEditor } from "../../maintainer/CourseDiagramWorkbenchEditor";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

export function CourseDiagramWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();

  const block =
    page?.blocks.find((entry) => entry.id === selectedBlockId && entry.kind === "diagram-2d") ??
    null;

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Diagram / infographics"
        hint="Enable Maintainer mode, add a Diagram block, then select it to edit the 2D canvas."
      />
    );
  }

  if (block == null) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Diagram / infographics"
        hint={`Select a diagram-2d block on the ${COURSE_WORKBENCH_PANE_LABELS.content}, or add one from Inspector → Page → Add block.`}
      />
    );
  }

  return (
    <CourseDiagramWorkbenchEditor diagramId={block.diagramId} pageStaleMs={page?.meta?.staleMs} />
  );
}
