import { BookOpen } from "lucide-react";
import type { PageBlockV1, PageGridV1 } from "../schemas/page.v1";
import {
  IFRAME_READ_HEIGHT_DEFAULT_FIXED_PX,
  IFRAME_READ_HEIGHT_MAX_PX,
  IFRAME_READ_HEIGHT_MIN_PX,
  resolveIframeReadHeightUiMode,
  type IframeReadHeightUiMode,
} from "../schemas/embedBlocks";
import { placementSpanHeightPx } from "../schemas/placement";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

function readHeightOptionsForBlock(
  block: EmbedReadHeightBlock,
): ReadonlyArray<{ value: IframeReadHeightUiMode; label: string }> {
  const autoLabel = "Auto (content height)";
  return [
    { value: "auto", label: autoLabel },
    { value: "fixed", label: "Fixed height" },
    { value: "grid", label: "Grid cell (scroll inside)" },
  ];
}

type EmbedReadHeightBlock = Extract<PageBlockV1, { kind: "iframe" | "html-page" }>;

function defaultFixedHeightPx(block: EmbedReadHeightBlock, grid: PageGridV1 | undefined): number {
  if (grid != null) {
    return placementSpanHeightPx(block.placement, grid);
  }
  return IFRAME_READ_HEIGHT_DEFAULT_FIXED_PX;
}

export function CourseIframeReadHeightField({
  block,
}: {
  block: EmbedReadHeightBlock;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const grid = useCoursePageEditorStore((s) => s.page?.grid);
  const mode = resolveIframeReadHeightUiMode(block);
  const fixedDefaultPx = defaultFixedHeightPx(block, grid);
  const fixedValue = block.readHeightPx ?? fixedDefaultPx;

  return (
    <CourseInspectorCard
      id={`${block.id}-read-height`}
      title="Read mode"
      titleIcon={<BookOpen className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="How this block sizes in Read mode. Edit mode always uses the grid cell."
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-2">
        <TRNFormField id={`${block.id}-read-height-select`} label="Height">
          <TRNSelect
            value={mode}
            ariaLabel="Read mode height"
            options={readHeightOptionsForBlock(block).map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            variant="field"
            size="sm"
            className="w-full"
            onValueChange={(next) => {
              const uiMode = next as IframeReadHeightUiMode;
              if (uiMode === "grid") {
                updateBlock(block.id, {
                  readHeight: "grid",
                  readHeightPx: undefined,
                });
                return;
              }
              if (uiMode === "fixed") {
                updateBlock(block.id, {
                  readHeight: undefined,
                  readHeightPx: block.readHeightPx ?? fixedDefaultPx,
                });
                return;
              }
              updateBlock(block.id, {
                readHeight: undefined,
                readHeightPx: undefined,
              });
            }}
          />
        </TRNFormField>
        {mode === "fixed" ? (
          <TRNFormField id={`${block.id}-read-height-px`} label="Height (px)">
            <CourseMaintainerScrubNumberField
              ariaLabel="Read mode fixed height in pixels"
              value={fixedValue}
              min={IFRAME_READ_HEIGHT_MIN_PX}
              max={IFRAME_READ_HEIGHT_MAX_PX}
              step={8}
              fractionDigits={0}
              defaultValue={fixedDefaultPx}
              onChange={(readHeightPx) =>
                updateBlock(block.id, {
                  readHeight: undefined,
                  readHeightPx,
                })
              }
            />
          </TRNFormField>
        ) : null}
        <TRNHintText>
          {mode === "auto"
            ? block.kind === "html-page"
              ? "Auto sizes to the HTML document height in Read (no inner scroll)."
              : "Auto sizes to the embed document height when fetchable; otherwise uses the live iframe (may not shrink-wrap cross-origin)."
            : mode === "fixed"
              ? "Fixed uses your pixel height in Read (no inner scroll)."
              : "Grid cell keeps the row span locked with scroll inside the block."}
        </TRNHintText>
      </div>
    </CourseInspectorCard>
  );
}
