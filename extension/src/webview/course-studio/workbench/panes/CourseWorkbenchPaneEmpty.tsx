import { TRNHintText } from "../../../ui/TRN/TRNHintText";

export function CourseWorkbenchPaneEmpty({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="course-workbench-pane-scroll scrollbar-hide flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-y-auto px-4 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <TRNHintText>{hint}</TRNHintText>
    </div>
  );
}
