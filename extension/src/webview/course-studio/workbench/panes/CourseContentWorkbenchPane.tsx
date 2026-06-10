import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import { CoursePageRenderer } from "../../runtime/CoursePageRenderer";
import { isCoursePageGridDeselectSuppressed } from "../../maintainer/coursePageEditorDeselectGuard";
import { useCourseWorkbenchFocusStore } from "../course-workbench-focus.store";
import type { MouseEvent } from "react";

export function CourseContentWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const composerMode = maintainerAvailable && maintainer;

  if (page == null) {
    return null;
  }

  const onComposerPaneClick = composerMode
    ? (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (target.closest("[data-course-block-id]")) {
          return;
        }
        if (isCoursePageGridDeselectSuppressed()) {
          return;
        }
        selectBlock(null);
        setActiveEditorType("content");
      }
    : undefined;

  return (
    <div
      className={`course-workbench-content-pane course-workbench-pane-scroll scrollbar-hide h-full min-h-0 overflow-y-auto py-6${
        composerMode ? " course-workbench-content-pane--composer" : ""
      }`}
      onClick={onComposerPaneClick}
    >
      {composerMode ? (
        <div className="course-workbench-content-pane__composer-body">
          <CoursePageRenderer page={page} />
        </div>
      ) : (
        <CoursePageRenderer page={page} />
      )}
    </div>
  );
}
