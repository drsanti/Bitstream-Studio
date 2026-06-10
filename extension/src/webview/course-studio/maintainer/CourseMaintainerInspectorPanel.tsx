import { CoursePageInspectorCards } from "./CoursePageInspectorCards";
import { COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS } from "../workbench/courseWorkbenchPaneBody";

export function CourseMaintainerInspectorPanel({
  embeddedInContextualShell = false,
}: {
  embeddedInContextualShell?: boolean;
}) {
  if (embeddedInContextualShell) {
    return <CoursePageInspectorCards />;
  }

  return (
    <div className="mx-2 mb-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)]/45">
      <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
        <CoursePageInspectorCards />
      </div>
    </div>
  );
}
