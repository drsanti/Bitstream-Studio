import { useCourseDiagram } from "../../content/diagramRegistry";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import { diagramHasKonvaFreeform } from "../../schemas/diagramFreeform";
import { konvaPropertyBindingsHasContent } from "../../schemas/konvaPropertyBindings";
import { readKonvaCanvasBackground } from "../../maintainer/courseKonvaTheme";
import { CourseDiagramCompositeRenderer } from "../../runtime/diagram/CourseDiagramCompositeRenderer";
import { useCourseTelemetryLinkState } from "../../runtime/useCourseTelemetryLinkState";
import {
  COURSE_CATALOG_BLOCK_LABEL_CLASS,
  COURSE_CATALOG_STATUS_CHIP_CLASS,
  courseLiveCanvasStatusLabel,
} from "./course-catalog-ui";

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
  const { healthy, transportUp } = useCourseTelemetryLinkState(pageStaleMs);
  const hasLiveBindings =
    diagram?.freeform != null &&
    konvaPropertyBindingsHasContent(diagram.freeform.propertyBindings);
  const isKonva = diagram != null && diagramHasKonvaFreeform(diagram);
  const canvasBg = readKonvaCanvasBackground(diagram);

  if (diagram == null) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
        Diagram not found: {diagramId}
      </div>
    );
  }

  const statusChip = (
    <span
      className={COURSE_CATALOG_STATUS_CHIP_CLASS}
      style={{
        color: healthy ? "var(--status-live)" : "var(--text-muted)",
        borderColor: healthy
          ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
          : "var(--surface-border)",
      }}
    >
      {courseLiveCanvasStatusLabel(hasLiveBindings, healthy)}
    </span>
  );

  const liveHint =
    !healthy && hasLiveBindings ? (
      <p className="text-2xs text-[var(--text-muted)]">
        {transportUp
          ? "Waiting for sensor samples — start Simulator streaming or open a Bitstream COM link."
          : "Connect the bridge (Simulator or Bitstream toolbar mode) to animate bound shapes."}
      </p>
    ) : null;

  const renderer = (
    <CourseDiagramCompositeRenderer
      diagram={diagram}
      pageLinkHealth={pageLinkHealth}
      pageStaleMs={pageStaleMs}
    />
  );

  if (isKonva) {
    return (
      <div
        className="course-diagram-card course-diagram-card--konva flex h-full min-h-0 w-full flex-col"
        style={{ backgroundColor: canvasBg ?? undefined }}
      >
        {caption?.trim() || hasLiveBindings ? (
          <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-1">
            {caption?.trim() ? (
              <span className={COURSE_CATALOG_BLOCK_LABEL_CLASS}>{caption}</span>
            ) : (
              <span />
            )}
            {statusChip}
          </div>
        ) : null}
        {liveHint}
        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{ backgroundColor: canvasBg ?? undefined }}
        >
          {renderer}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-2.5 py-2">
      <div className="flex min-h-[21px] items-center justify-between gap-2">
        {caption?.trim() ? (
          <span className={COURSE_CATALOG_BLOCK_LABEL_CLASS}>{caption}</span>
        ) : (
          <span />
        )}
        {statusChip}
      </div>
      {liveHint}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--surface-border)] bg-black">
        {renderer}
      </div>
    </div>
  );
}
