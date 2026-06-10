import { lazy, Suspense } from "react";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { diagramHasKonvaFreeform, konvaFreeformHasContent } from "../../schemas/diagramFreeform";
import { useCourseTelemetryLinkState } from "../useCourseTelemetryLinkState";

const CourseKonvaEditor = lazy(async () => {
  const mod = await import("../../maintainer/CourseKonvaEditor");
  return { default: mod.CourseKonvaEditor };
});

export function CourseKonvaPreview({
  diagram,
  pageStaleMs,
}: {
  diagram: DiagramV1;
  pageStaleMs?: number;
}) {
  const { snapshot } = useCourseTelemetryLinkState(pageStaleMs);

  if (!diagramHasKonvaFreeform(diagram) || !konvaFreeformHasContent(diagram)) {
    return null;
  }

  return (
    <div className="course-konva-preview h-full min-h-[160px] w-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-2xs text-[var(--text-muted)]">
            Loading diagram…
          </div>
        }
      >
        <CourseKonvaEditor diagramId={diagram.id} readOnly liveSnapshot={snapshot} />
      </Suspense>
    </div>
  );
}
