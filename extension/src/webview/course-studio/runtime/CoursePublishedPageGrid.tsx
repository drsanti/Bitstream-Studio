import type { CSSProperties, ReactNode } from "react";
import type { PageBlockV1, PageGridV1, PageV1 } from "../schemas/page.v1";
import type { CourseThemesV1 } from "../schemas/courseThemes.v1";
import type { LinkHealthPolicy } from "../schemas/linkHealth";
import {
  embedShellHeightForRead,
  embedUsesReadContentHeight,
  iframeReadContentHeightPx,
  iframeUsesReadContentHeight,
} from "../schemas/embedBlocks";
import {
  htmlPageReadContentHeightPx,
  htmlPageShellHeightForRead,
  htmlPageUsesReadContentHeight,
} from "../schemas/htmlPageBlocks";
import {
  markdownShellHeightForRead,
  resolveMarkdownReadHeight,
} from "../schemas/markdownReadHeight";
import {
  pageGridChromeToStyleVars,
  pageGridPublishedCellClassName,
} from "../schemas/pageGridChrome";
import { placementGridStyleForReadMode } from "../schemas/placement";
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
    <div className="course-page-grid-composer-shell course-page-grid-composer-shell--read mx-auto w-full max-w-6xl">
      <div className="course-page-grid-composer-canvas" style={gridStyleVars}>
        <div
          className="course-page-grid course-page-grid--composer course-page-grid--published relative z-[1] w-full"
          style={gridStyleVars}
        >
          {page.blocks.map((block) => (
            <CoursePublishedPageGridCell
              key={block.id}
              block={block}
              grid={page.grid}
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
  grid,
  pageMeta,
  courseThemes,
  pageLinkHealth,
  pageStaleMs,
  publishedCellClass,
}: {
  block: PageBlockV1;
  grid: PageGridV1;
  pageMeta?: PageV1["meta"];
  courseThemes?: CourseThemesV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  publishedCellClass: string;
}) {
  const markdownReadContent =
    block.kind === "markdown" &&
    markdownShellHeightForRead(resolveMarkdownReadHeight(block)) === "content";
  const embedReadContent =
    (block.kind === "iframe" || block.kind === "youtube") && embedUsesReadContentHeight(block);
  const htmlReadContent = block.kind === "html-page" && htmlPageUsesReadContentHeight(block);
  const autoReadHeight = markdownReadContent || embedReadContent || htmlReadContent;
  const embedShellHeight =
    block.kind === "iframe" || block.kind === "youtube"
      ? embedShellHeightForRead(block)
      : block.kind === "html-page"
        ? htmlPageShellHeightForRead(block)
        : "fill";
  const iframeReadContentHeight =
    block.kind === "iframe" && iframeUsesReadContentHeight(block)
      ? iframeReadContentHeightPx(block)
      : undefined;
  const htmlReadContentHeight =
    block.kind === "html-page" && htmlPageUsesReadContentHeight(block)
      ? htmlPageReadContentHeightPx(block)
      : undefined;
  const embedReadContentHeightPx = iframeReadContentHeight ?? htmlReadContentHeight;

  return (
    <div
      className={
        autoReadHeight
          ? `${publishedCellClass} course-page-grid__cell--markdown-read-content relative min-h-0 min-w-0`
          : `${publishedCellClass} relative min-h-0 min-w-0 overflow-hidden`
      }
      style={placementGridStyleForReadMode(block.placement, autoReadHeight)}
      data-course-block-id={block.id}
      data-course-read-height={autoReadHeight ? "content" : "grid"}
    >
      <div
        className={
          autoReadHeight
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
          embedShellHeight={embedShellHeight}
          embedReadContentHeightPx={embedReadContentHeightPx}
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
