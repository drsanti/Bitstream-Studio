import { Captions, Frame } from "lucide-react";
import { CourseIframeReadHeightField } from "./CourseIframeReadHeightField";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import type { CourseEmbedCaptionPlacement, PageBlockV1 } from "../schemas/page.v1";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseIframeBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "iframe" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const captionPlacement = block.captionPlacement ?? "below";

  return (
    <>
      <CourseInspectorCard
        id={`${block.id}-iframe-embed`}
        title="Embed"
        titleIcon={<Frame className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="External page URL for the grid iframe."
        defaultExpanded
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${block.id}-src`} label="Embed URL">
            <TRNInput
              id={`${block.id}-src`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.src}
              onChange={(e) => updateBlock(block.id, { src: e.target.value })}
            />
          </TRNFormField>
          <TRNHintText>
            Frame-friendly URLs (e.g. tesaiot.dev) render in the grid. Sites like google.com block
            embedding (X-Frame-Options) and show an open-in-tab fallback instead.
          </TRNHintText>
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-iframe-caption`}
        title="Caption & labels"
        titleIcon={<Captions className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Optional visible caption and screen-reader title."
        defaultExpanded={false}
      >
        <div className="flex flex-col gap-2">
          <CourseEmojiTextField
            id={`${block.id}-caption`}
            label="Caption text"
            value={block.caption ?? ""}
            onChange={(caption) =>
              updateBlock(block.id, {
                caption: caption.length > 0 ? caption : undefined,
              })
            }
          />
          <TRNFormField
            id={`${block.id}-caption-placement`}
            label="Show caption"
            hint={
              captionPlacement === "hidden"
                ? "Caption text is saved but not shown on the page."
                : captionPlacement === "above"
                  ? "Caption renders in a bar above the embed."
                  : captionPlacement === "overlay"
                    ? "Caption sits over the bottom of the embed frame."
                    : "Caption renders in a bar below the embed."
            }
          >
            <TRNSelect
              value={captionPlacement}
              ariaLabel="Caption placement"
              options={[
                { value: "hidden", label: "Hidden" },
                { value: "above", label: "Above embed" },
                { value: "below", label: "Below embed" },
                { value: "overlay", label: "Over embed" },
              ]}
              onValueChange={(value) => {
                const next = value as CourseEmbedCaptionPlacement;
                updateBlock(block.id, {
                  captionPlacement: next === "below" ? undefined : next,
                });
              }}
            />
          </TRNFormField>
          <CourseEmojiTextField
            id={`${block.id}-title`}
            label="Accessible title"
            hint="Screen reader label for the iframe. Not shown on the page."
            value={block.title ?? ""}
            onChange={(title) =>
              updateBlock(block.id, {
                title: title.length > 0 ? title : undefined,
              })
            }
          />
        </div>
      </CourseInspectorCard>

      <CourseIframeReadHeightField block={block} />
    </>
  );
}
