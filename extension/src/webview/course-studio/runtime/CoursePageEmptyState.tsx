import { LayoutGrid } from "lucide-react";
import { TRNHintText } from "../../ui/TRN/TRNHintText";

export function CoursePageEmptyState({
  maintainer,
  fit = "standalone",
}: {
  maintainer: boolean;
  fit?: "standalone" | "grid";
}) {
  const gridFit = fit === "grid";

  if (gridFit) {
    return (
      <div
        className="course-page-empty-state course-page-empty-state--grid flex h-full min-h-0 w-full items-center justify-center p-2"
        data-testid="course-page-empty-state"
        data-fit={fit}
      >
        <div className="course-page-empty-state__panel flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 rounded-xl border border-[var(--surface-border)]/60 bg-[var(--surface-card)]/45 px-6 py-8 text-center">
          <LayoutGrid
            size={48}
            strokeWidth={1.5}
            className="shrink-0 text-[var(--text-muted)]"
            aria-hidden
          />
          <div className="max-w-sm space-y-1">
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">Empty page</p>
            {maintainer ? (
              <TRNHintText>
                Add blocks from the Inspector → Add block card. Use the element checklist below to
                verify each block type.
              </TRNHintText>
            ) : (
              <TRNHintText>This page has no content blocks yet.</TRNHintText>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="course-page-empty-state flex min-h-[min(420px,50vh)] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)]/40 px-6 py-10 text-center"
      data-testid="course-page-empty-state"
      data-fit={fit}
    >
      <LayoutGrid
        size={28}
        strokeWidth={1.75}
        className="text-[var(--text-muted)]"
        aria-hidden
      />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Empty page</p>
        {maintainer ? (
          <TRNHintText>
            Add blocks from the Inspector → Add block card. Use the element checklist below to
            verify each block type.
          </TRNHintText>
        ) : (
          <TRNHintText>This page has no content blocks yet.</TRNHintText>
        )}
      </div>
    </div>
  );
}
