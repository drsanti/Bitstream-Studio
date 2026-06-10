import { Grid3x3 } from "lucide-react";
import { TRNGridPlacementBadgedFields } from "../../ui/TRN/TRNGridPlacementBadgedFields";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { PageBlockV1 } from "../schemas/page.v1";
import { formatPlacementOccupancyHint } from "./blockPlacement";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const COURSE_PLACEMENT_LIMITS = {
  columnMax: 48,
  rowMax: 200,
  columnSpanMax: 48,
  rowSpanMax: 200,
} as const;

export function CourseBlockPlacementFields({
  block,
  layout = "inspector",
}: {
  block: PageBlockV1;
  /** `strip` — one row R/C/W/H. `inspector` — vertical badged stack. */
  layout?: "strip" | "inspector";
}) {
  const updatePlacement = useCoursePageEditorStore((s) => s.updatePlacement);
  const { placement } = block;

  const fields = (
    <TRNGridPlacementBadgedFields
      placement={placement}
      limits={COURSE_PLACEMENT_LIMITS}
      layout={layout === "strip" ? "strip" : "stack"}
      onPatch={(patch) => updatePlacement(block.id, patch)}
    />
  );

  if (layout === "strip") {
    return fields;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {fields}
      <p className="text-[10px] font-medium text-zinc-400">
        {formatPlacementOccupancyHint(placement)}
      </p>
      <TRNHintText className="!text-[10px]">
        1-based grid on the Content canvas. Drag the block to move; resize handles adjust width and
        height.
      </TRNHintText>
    </div>
  );
}

export function CourseBlockPlacementStrip({
  block,
  bare = false,
}: {
  block: PageBlockV1;
  bare?: boolean;
}) {
  const fields = <CourseBlockPlacementFields block={block} layout="strip" />;

  if (bare) {
    return fields;
  }

  return (
    <div className="course-block-placement-strip rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)]/45 px-2 py-2">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Grid
      </div>
      {fields}
    </div>
  );
}

export function CourseBlockPlacementInspectorCard({ block }: { block: PageBlockV1 }) {
  return (
    <CourseInspectorCard
      title="Grid placement"
      hint="Column, row, and span on the Content page grid."
      titleIcon={<Grid3x3 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      collapsible
      defaultExpanded
    >
      <CourseBlockPlacementFields block={block} layout="inspector" />
    </CourseInspectorCard>
  );
}

/** @deprecated Use {@link CourseBlockPlacementInspectorCard} or {@link CourseBlockPlacementFields}. */
export function CourseBlockPlacementGrid({ block }: { block: PageBlockV1 }) {
  return <CourseBlockPlacementFields block={block} layout="inspector" />;
}
