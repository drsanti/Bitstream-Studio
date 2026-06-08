import { useCourseDiagram } from "../../content/diagramRegistry";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import { CourseDiagramRenderer } from "../../runtime/diagram/CourseDiagramRenderer";
import { useCourseTelemetryLinkState } from "../../runtime/useCourseTelemetryLinkState";

export function CourseDiagramCard({
  diagramId,
  caption,
  pageLinkHealth,
  pageStaleMs,
}: {
  diagramId: string;
  caption?: string;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
}) {
  const diagram = useCourseDiagram(diagramId);
  const { healthy } = useCourseTelemetryLinkState(pageStaleMs);

  if (diagram == null) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
        Diagram not found: {diagramId}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {caption ? (
          <div className="text-2xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {caption}
          </div>
        ) : (
          <span />
        )}
        <span
          className="rounded-full border px-2 py-0.5 text-2xs font-semibold"
          style={{
            color: healthy ? "var(--status-live)" : "var(--text-muted)",
            borderColor: healthy
              ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
              : "var(--surface-border)",
          }}
        >
          {healthy ? "Live bindings" : "Frozen"}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <CourseDiagramRenderer
          diagram={diagram}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
        />
      </div>
    </div>
  );
}
