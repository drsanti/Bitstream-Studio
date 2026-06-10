import { lazy, Suspense } from "react";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import { diagramHas3dLayer } from "../../schemas/normalizeDiagramV1";
import { diagramHasKonvaFreeform, konvaFreeformHasContent } from "../../schemas/diagramFreeform";
import { CourseDiagramRenderer } from "./CourseDiagramRenderer";

const CourseKonvaPreview = lazy(async () => {
  const mod = await import("./CourseKonvaPreview");
  return { default: mod.CourseKonvaPreview };
});

const CourseDiagram3DLayer = lazy(async () => {
  const mod = await import("./CourseDiagram3DLayer");
  return { default: mod.CourseDiagram3DLayer };
});

function DiagramLayerLoadingFallback() {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center text-2xs text-[var(--text-muted)]">
      Loading diagram layer…
    </div>
  );
}

export function CourseDiagramCompositeRenderer({
  diagram,
  pageLinkHealth,
  pageStaleMs,
  designTime = false,
}: {
  diagram: DiagramV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  designTime?: boolean;
}) {
  const has3d = diagramHas3dLayer(diagram);
  const hasKonva = diagramHasKonvaFreeform(diagram) && konvaFreeformHasContent(diagram);
  const has2d = diagram.nodes.length > 0;

  if (!has3d && !hasKonva && !has2d && diagramHasKonvaFreeform(diagram)) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[var(--surface-border)] px-4 text-center text-2xs text-[var(--text-muted)]">
        Empty diagram — open the Diagram workbench pane to draw shapes or bind properties to live
        data.
      </div>
    );
  }

  if (!has3d && !hasKonva) {
    return (
      <CourseDiagramRenderer
        diagram={diagram}
        pageLinkHealth={pageLinkHealth}
        pageStaleMs={pageStaleMs}
        designTime={designTime}
      />
    );
  }

  if (!has3d && hasKonva && !has2d) {
    return (
      <Suspense fallback={<DiagramLayerLoadingFallback />}>
        <CourseKonvaPreview diagram={diagram} pageStaleMs={pageStaleMs} />
      </Suspense>
    );
  }

  if (!has3d) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {hasKonva ? (
          <div className="min-h-0 flex-1 basis-0">
            <Suspense fallback={<DiagramLayerLoadingFallback />}>
              <CourseKonvaPreview diagram={diagram} pageStaleMs={pageStaleMs} />
            </Suspense>
          </div>
        ) : null}
        {has2d ? (
          <div className="min-h-0 flex-1 basis-0">
            <CourseDiagramRenderer
              diagram={diagram}
              pageLinkHealth={pageLinkHealth}
              pageStaleMs={pageStaleMs}
              designTime={designTime}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {has2d ? (
        <div className="min-h-0 flex-1 basis-0">
          <CourseDiagramRenderer
            diagram={diagram}
            pageLinkHealth={pageLinkHealth}
            pageStaleMs={pageStaleMs}
            designTime={designTime}
          />
        </div>
      ) : hasKonva ? (
        <div className="min-h-0 flex-1 basis-0">
          <Suspense fallback={<DiagramLayerLoadingFallback />}>
            <CourseKonvaPreview diagram={diagram} pageStaleMs={pageStaleMs} />
          </Suspense>
        </div>
      ) : null}
      <div className={has2d || hasKonva ? "min-h-[180px] flex-1 basis-0" : "h-full min-h-[180px]"}>
        <Suspense fallback={<DiagramLayerLoadingFallback />}>
          <CourseDiagram3DLayer
            diagram={diagram}
            pageLinkHealth={pageLinkHealth}
            pageStaleMs={pageStaleMs}
            designTime={designTime}
            className="h-full"
          />
        </Suspense>
      </div>
    </div>
  );
}
