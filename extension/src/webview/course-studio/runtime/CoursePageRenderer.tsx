import type { CSSProperties } from "react";
import type { PageV1 } from "../schemas/page.v1";
import { placementGridStyle } from "../schemas/placement";
import { useCourseStudioMaintainerModeEnabled } from "../maintainer/courseStudioMaintainerMode";
import { CoursePageGridComposer } from "../maintainer/CoursePageGridComposer";
import { BlockRenderer } from "./BlockRenderer";

export function CoursePageRenderer({ page }: { page: PageV1 }) {
  const { grid } = page;
  const maintainer = useCourseStudioMaintainerModeEnabled();

  if (maintainer) {
    return <CoursePageGridComposer page={page} />;
  }

  return (
    <div
      className="course-page-grid mx-auto w-full max-w-6xl"
      style={
        {
          "--course-grid-columns": grid.columns,
          "--course-grid-gap": `${grid.gapPx}px`,
          "--course-grid-padding": `${grid.paddingPx}px`,
          "--course-grid-row-height": `${grid.rowHeightPx}px`,
        } as CSSProperties
      }
    >
      {page.blocks.map((block) => (
        <div
          key={block.id}
          className="course-page-grid__cell min-h-0"
          style={placementGridStyle(block.placement)}
        >
          <BlockRenderer
            block={block}
            pageLinkHealth={page.meta?.defaultLinkHealth}
            pageStaleMs={page.meta?.staleMs}
          />
        </div>
      ))}
    </div>
  );
}
