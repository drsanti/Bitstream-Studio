import { useRef, useState, type CSSProperties } from "react";
import type { PageV1 } from "../schemas/page.v1";
import type { GridPlacementV1 } from "../schemas/placement";
import { placementGridStyle } from "../schemas/placement";
import { BlockRenderer } from "../runtime/BlockRenderer";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { pageGridToDashboardMetrics } from "./courseGridMetrics";
import { CourseGridEditChrome } from "./CourseGridEditChrome";

export function CoursePageGridComposer({ page }: { page: PageV1 }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const updatePlacement = useCoursePageEditorStore((s) => s.updatePlacement);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const [previewByBlockId, setPreviewByBlockId] = useState<Record<string, GridPlacementV1>>({});

  const metrics = pageGridToDashboardMetrics(page.grid);
  const { grid } = page;

  const effectivePlacement = (blockId: string, placement: GridPlacementV1) =>
    previewByBlockId[blockId] ?? placement;

  return (
    <div
      ref={gridRef}
      className="course-page-grid course-page-grid--composer mx-auto w-full max-w-6xl"
      style={
        {
          "--course-grid-columns": grid.columns,
          "--course-grid-gap": `${grid.gapPx}px`,
          "--course-grid-padding": `${grid.paddingPx}px`,
          "--course-grid-row-height": `${grid.rowHeightPx}px`,
        } as CSSProperties
      }
      onClick={() => selectBlock(null)}
    >
      {page.blocks.map((block) => {
        const selected = selectedBlockId === block.id;
        const placement = effectivePlacement(block.id, block.placement);
        const previewing = previewByBlockId[block.id] != null;

        return (
          <div
            key={block.id}
            className={`course-page-grid__cell course-page-grid__cell--editable relative min-h-0 ${
              selected ? "course-page-grid__cell--selected" : ""
            } ${previewing ? "course-page-grid__cell--preview" : ""}`}
            style={placementGridStyle(placement)}
            data-course-block-id={block.id}
            onClick={(event) => {
              event.stopPropagation();
              selectBlock(block.id);
            }}
          >
            {selected ? (
              <CourseGridEditChrome
                blockId={block.id}
                placement={placement}
                gridElement={gridRef.current}
                metrics={metrics}
                onSelect={() => selectBlock(block.id)}
                onPreviewPlacement={(next) =>
                  setPreviewByBlockId((prev) => ({ ...prev, [block.id]: next }))
                }
                onCommitPlacement={(next) =>
                  updatePlacement(block.id, next, { recordUndo: false })
                }
                onGestureStart={() => pushPageUndoSnapshot()}
                onClearPreview={() =>
                  setPreviewByBlockId((prev) => {
                    const { [block.id]: _, ...rest } = prev;
                    return rest;
                  })
                }
              />
            ) : null}
            <div className={previewing ? "pointer-events-none opacity-80" : "min-h-0"}>
              <BlockRenderer
                block={block}
                pageLinkHealth={page.meta?.defaultLinkHealth}
                pageStaleMs={page.meta?.staleMs}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
