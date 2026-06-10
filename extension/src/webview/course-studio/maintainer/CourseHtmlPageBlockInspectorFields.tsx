import { Captions, CodeXml, ExternalLink } from "lucide-react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import type { CourseEmbedCaptionPlacement, PageBlockV1 } from "../schemas/page.v1";
import { CourseIframeReadHeightField } from "./CourseIframeReadHeightField";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseHtmlPageUrlEditor } from "./CourseHtmlPageUrlEditor";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseHtmlEditorShell } from "./html-editor/CourseHtmlEditorShell";
import {
  buildHtmlPageSourceSelectOptions,
  patchHtmlPageSourceMode,
  resolveHtmlPageSourceMode,
  type HtmlPageBlockSourceMode,
} from "./htmlPageBlockSource";
import { useOpenHtmlPageBlockInEditor } from "./useAddHtmlPageBlock";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const SOURCE_HINT: Record<HtmlPageBlockSourceMode, string> = {
  inline: "HTML stored in the page JSON — edit in the HTML Editor pane.",
  url: "HTML fetched from a public URL at runtime (GitHub raw, gist, etc.).",
};

export function CourseHtmlPageBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "html-page" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const openHtmlWorkbench = useOpenHtmlPageBlockInEditor();
  const sourceMode = resolveHtmlPageSourceMode(block);
  const captionPlacement = block.captionPlacement ?? "below";

  return (
    <>
      <CourseInspectorCard
        id={`${block.id}-html-source`}
        title="Source"
        titleIcon={<CodeXml className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint={SOURCE_HINT[sourceMode]}
        defaultExpanded
      >
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-html-source-mode`} label="Source">
            <TRNSelect
              value={sourceMode}
              ariaLabel="HTML source"
              options={buildHtmlPageSourceSelectOptions()}
              onValueChange={(value) => {
                const mode = value as HtmlPageBlockSourceMode;
                if (mode === sourceMode) {
                  return;
                }
                updateBlock(block.id, patchHtmlPageSourceMode(block, mode));
              }}
            />
          </TRNFormField>

          {sourceMode === "inline" ? (
            <>
              <TRNButton size="compact" onClick={() => openHtmlWorkbench(block.id)}>
                <ExternalLink size={13} strokeWidth={2} className="mr-1 inline" />
                Open HTML Editor
              </TRNButton>
              <CourseHtmlEditorShell
                key={block.id}
                value={block.html ?? ""}
                onChange={(html) => updateBlock(block.id, { html })}
                variant="embedded"
                sandboxSameOrigin={block.sandboxSameOrigin}
              />
            </>
          ) : (
            <CourseHtmlPageUrlEditor
              url={block.url ?? ""}
              onUrlChange={(url) => updateBlock(block.id, { url, html: undefined })}
              embedded
              editorSurface="inspector"
              sandboxSameOrigin={block.sandboxSameOrigin}
            />
          )}

          <TRNHintText>
            HTML runs in a sandboxed iframe with scripts enabled. It cannot access Course Studio.
          </TRNHintText>

          <TRNInlineToggleRow
            label="Allow same-origin sandbox"
            hint="Enable only when the demo needs localStorage or other same-origin APIs."
            checked={block.sandboxSameOrigin === true}
            onCheckedChange={(checked) =>
              updateBlock(block.id, { sandboxSameOrigin: checked ? true : undefined })
            }
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-html-caption`}
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
                  ? "Caption renders in a bar above the HTML frame."
                  : captionPlacement === "overlay"
                    ? "Caption sits over the bottom of the HTML frame."
                    : "Caption renders in a bar below the HTML frame."
            }
          >
            <TRNSelect
              value={captionPlacement}
              ariaLabel="Caption placement"
              options={[
                { value: "hidden", label: "Hidden" },
                { value: "above", label: "Above frame" },
                { value: "below", label: "Below frame" },
                { value: "overlay", label: "Over frame" },
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
            hint="Screen reader label for the HTML frame. Not shown on the page."
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
