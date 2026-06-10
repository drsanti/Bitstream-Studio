import { Grid3x3 } from "lucide-react";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { CourseBlockContentFields } from "./CourseBlockInspector";
import { courseBlockHeaderTitle } from "./courseBlockInspectorLabels";
import { CourseBlockPlacementStrip } from "./CourseBlockPlacementStrip";
import type { PageBlockV1 } from "../schemas/page.v1";

export function CourseBlockPropertiesPane({ block }: { block: PageBlockV1 }) {
  return (
    <div className="course-block-properties-pane flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-[1] shrink-0 border-b border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 pb-2 pt-0.5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold leading-tight text-[var(--text-primary)]">
            {courseBlockHeaderTitle(block)}
          </div>
          <div className="truncate text-[10px] leading-snug text-[var(--text-muted)]">{block.id}</div>
        </div>
      </div>

      <div className="course-workbench-pane-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 pt-2">
        <div className="flex flex-col gap-2">
          <CourseInspectorCard
            id={`course-block-properties-grid-${block.id}`}
            title="Grid"
            titleIcon={<Grid3x3 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
            hint="Column, row, width, and height on the page grid."
            defaultExpanded
          >
            <CourseBlockPlacementStrip block={block} bare />
          </CourseInspectorCard>
          <CourseBlockContentFields block={block} />
        </div>
      </div>
    </div>
  );
}
