import { BookOpen } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { MarkdownReadHeightMode } from "../schemas/markdownReadHeight";
import { MARKDOWN_READ_HEIGHT_MODES } from "../schemas/markdownReadHeight";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const READ_HEIGHT_OPTIONS = [
  {
    value: "content" as const,
    label: "Auto (fit content)",
  },
  {
    value: "grid" as const,
    label: "Grid cell (like edit)",
  },
] satisfies ReadonlyArray<{ value: MarkdownReadHeightMode; label: string }>;

export function CourseMarkdownReadHeightField({
  blockId,
  readHeight,
}: {
  blockId: string;
  readHeight?: MarkdownReadHeightMode;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const value = readHeight ?? "content";

  return (
    <CourseInspectorCard
      id={`${blockId}-markdown-read-height`}
      title="Read mode"
      titleIcon={<BookOpen className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="How this block sizes in Read mode. Edit mode always uses the grid cell."
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-2">
        <TRNFormField id={`${blockId}-read-height`} label="Height">
          <TRNSelect
            value={value}
            ariaLabel="Markdown read mode height"
            options={READ_HEIGHT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            variant="field"
            size="sm"
            className="w-full"
            onValueChange={(next) => {
              const mode = next as MarkdownReadHeightMode;
              if (!MARKDOWN_READ_HEIGHT_MODES.includes(mode)) {
                return;
              }
              updateBlock(blockId, {
                readHeight: mode === "content" ? undefined : mode,
              });
            }}
          />
        </TRNFormField>
        <TRNHintText>
          Auto grows with the full article in Read. Grid cell keeps the row span from edit mode and
          scrolls inside the block.
        </TRNHintText>
      </div>
    </CourseInspectorCard>
  );
}
