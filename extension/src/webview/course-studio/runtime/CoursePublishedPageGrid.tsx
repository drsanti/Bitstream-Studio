import type { CSSProperties, ReactNode } from "react";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import type { CourseThemesV1 } from "../schemas/courseThemes.v1";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import {
  markdownShellHeightForRead,
  resolveMarkdownReadHeight,
} from "../schemas/markdownReadHeight";
import {
  pageGridChromeToStyleVars,
  pageGridPublishedCellClassName,
} from "../schemas/pageGridChrome";
import { placementGridStyle } from "../schemas/placement";
import { BlockRenderer } from "./BlockRenderer";

export function coursePageGridStyleVars(grid: PageV1["grid"]): CSSProperties {
  return {
    "--course-grid-columns": grid.columns,
    "--course-grid-gap": `${grid.gapPx}px`,
    "--course-grid-padding": `${grid.paddingPx}px`,
    "--course-grid-row-height": `${grid.rowHeightPx}px`,
    ...pageGridChromeToStyleVars(grid.chrome),
  } as CSSProperties;
}

/** Read / published grid — same track sizing and cell chrome as {@link CoursePageGridComposer}. */
export function CoursePublishedPageGrid({
  page,
  courseThemes,
  pageLinkHealth,
  pageStaleMs,
}: {
  page: PageV1;
  courseThemes?: CourseThemesV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
}) {
  const gridStyleVars = coursePageGridStyleVars(page.grid);
  const publishedCellClass = pageGridPublishedCellClassName(page.grid.chrome);

  return (
    <div className="course-page-grid-composer-shell mx-auto w-full max-w-6xl min-h-full">
      <div className="course-page-grid-composer-canvas" style={gridStyleVars}>
        <div
          className="course-page-grid course-page-grid--composer course-page-grid--published relative z-[1] w-full"
          style={gridStyleVars}
        >
          {page.blocks.map((block) => (
            <CoursePublishedPageGridCell
              key={block.id}
              block={block}
              pageMeta={page.meta}
              courseThemes={courseThemes}
              pageLinkHealth={pageLinkHealth}
              pageStaleMs={pageStaleMs}
              publishedCellClass={publishedCellClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CoursePublishedPageGridCell({
  block,
  pageMeta,
  courseThemes,
  pageLinkHealth,
  pageStaleMs,
  publishedCellClass,
}: {
  block: PageBlockV1;
  pageMeta?: PageV1["meta"];
  courseThemes?: CourseThemesV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  publishedCellClass: string;
}) {
  const markdownReadContent =
    block.kind === "markdown" &&
    markdownShellHeightForRead(resolveMarkdownReadHeight(block)) === "content";

  return (
    <div
      className={
        markdownReadContent
          ? `${publishedCellClass} course-page-grid__cell--markdown-read-content relative min-h-0 min-w-0`
          : `${publishedCellClass} relative min-h-0 min-w-0 overflow-hidden`
      }
      style={placementGridStyle(block.placement)}
      data-course-block-id={block.id}
    >
      <div
        className={
          markdownReadContent
            ? "course-page-grid__cell-body course-page-grid__cell-body--markdown-read-content h-auto min-h-0 overflow-visible"
            : block.kind === "dashboard-widget" || block.kind === "sensor-telemetry-card"
              ? "course-page-grid__cell-body h-full min-h-0 overflow-hidden"
              : "course-page-grid__cell-body h-full min-h-0 overflow-auto"
        }
      >
        <BlockRenderer
          block={block}
          pageMeta={pageMeta}
          courseThemes={courseThemes}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
          markdownShellHeight={
            block.kind === "markdown"
              ? markdownShellHeightForRead(resolveMarkdownReadHeight(block))
              : "fill"
          }
        />
      </div>
    </div>
  );
}

export function CoursePublishedPageGridShell({
  gridStyleVars,
  children,
}: {
  gridStyleVars: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="course-page-grid-composer-shell mx-auto w-full max-w-6xl min-h-full">
      <div className="course-page-grid-composer-canvas" style={gridStyleVars}>
        {children}
      </div>
    </div>
  );
}
