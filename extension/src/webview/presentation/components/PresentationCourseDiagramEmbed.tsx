import { useCourseDiagram } from "../../course-studio/content/diagramRegistry";
import { DEFAULT_LINK_HEALTH_POLICY, type LinkHealthPolicy } from "../../course-studio/schemas/linkHealth";
import { CourseDiagramCompositeRenderer } from "../../course-studio/runtime/diagram/CourseDiagramCompositeRenderer";
import { useCourseTelemetryLinkState } from "../../course-studio/runtime/useCourseTelemetryLinkState";

export type PresentationCourseDiagramEmbedProps = {
  /** Course Studio diagram id (e.g. `pilot-bmi-accel-mems`). */
  diagramId: string;
  linkHealth?: LinkHealthPolicy;
  staleMs?: number;
  showLiveBadge?: boolean;
};

/** Live Course Studio `diagram.v1` for Presentation theory slide visual panels (7e). */
export function PresentationCourseDiagramEmbed({
  diagramId,
  linkHealth = DEFAULT_LINK_HEALTH_POLICY,
  staleMs = 2000,
  showLiveBadge = true,
}: PresentationCourseDiagramEmbedProps) {
  const diagram = useCourseDiagram(diagramId);
  const { healthy } = useCourseTelemetryLinkState(staleMs);

  if (diagram == null) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
        Course diagram not found: {diagramId}
      </div>
    );
  }

  return (
    <div className="presentation-course-diagram-embed relative flex h-full min-h-[160px] w-full flex-col">
      {showLiveBadge ? (
        <span
          className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border px-2 py-0.5 text-2xs font-semibold"
          style={{
            color: healthy ? "var(--status-live)" : "var(--text-muted)",
            borderColor: healthy
              ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
              : "var(--surface-border)",
            background: "color-mix(in srgb, var(--surface-panel) 88%, transparent)",
          }}
        >
          {healthy ? "Live" : "Frozen"}
        </span>
      ) : null}
      <CourseDiagramCompositeRenderer
        diagram={diagram}
        pageLinkHealth={linkHealth}
        pageStaleMs={staleMs}
      />
    </div>
  );
}
