import { ExternalLink, FileText } from "lucide-react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";
import { COURSE_MARKDOWN_BUNDLED_SRCS } from "../content/courseMarkdownBundledSrcs";
import { CourseMarkdownBlockContent } from "../ui/catalog/CourseMarkdownBlockShell";
import { CourseMarkdownFileEditor } from "./CourseMarkdownFileEditor";
import { CourseMarkdownUrlEditor } from "./CourseMarkdownUrlEditor";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { CourseMarkdownReadHeightField } from "./CourseMarkdownReadHeightField";
import { MarkdownColorsCard } from "./CourseMarkdownBlockColorsCard";
import { MarkdownBlockPreviewSection } from "./CourseMarkdownPreviewCard";
import { CourseMarkdownEditorShell } from "./markdown-editor/CourseMarkdownEditorShell";
import {
  buildMarkdownBlockSourceSelectOptions,
  DEFAULT_MARKDOWN_FILE_SRC,
  patchMarkdownBlockSourceMode,
  resolveMarkdownBlockSourceMode,
  type MarkdownBlockSourceMode,
} from "./markdownBlockSource";
import { useOpenMarkdownBlockInEditor } from "./useAddMarkdownBlock";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNInput } from "../../ui/TRN/TRNInput";

const BUNDLED_MARKDOWN_FILE_OPTIONS = COURSE_MARKDOWN_BUNDLED_SRCS.map((src) => ({
  value: src,
  label: src,
}));

const SOURCE_HINT: Record<MarkdownBlockSourceMode, string> = {
  inline: "Markdown stored in the page JSON.",
  file: "Theory content lives in a bundled markdown file under content/.",
  url: "Markdown fetched from a remote URL at runtime.",
};

export function CourseMarkdownBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const openMarkdownWorkbench = useOpenMarkdownBlockInEditor();
  const pageDirty = useCoursePageEditorStore((s) => s.dirty);
  const sourceMode = resolveMarkdownBlockSourceMode(block);

  return (
    <>
      <CourseInspectorCard
        id={`${block.id}-markdown-content`}
        title="Content"
        titleIcon={<FileText className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint={SOURCE_HINT[sourceMode]}
        defaultExpanded
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <TRNFormField id={`${block.id}-md-source`} label="Source">
            <TRNSelect
              value={sourceMode}
              ariaLabel="Markdown source"
              options={buildMarkdownBlockSourceSelectOptions()}
              onValueChange={(value) => {
                const mode = value as MarkdownBlockSourceMode;
                if (mode === sourceMode) {
                  return;
                }
                updateBlock(block.id, patchMarkdownBlockSourceMode(block, mode));
              }}
            />
          </TRNFormField>

          {sourceMode === "inline" ? (
            <TRNFormField id={`${block.id}-markdown`} label="Markdown">
              <CourseMarkdownEditorShell
                key={block.id}
                value={block.markdown ?? ""}
                onChange={(value) => updateBlock(block.id, { markdown: value })}
                variant="embedded"
                enablePreview={false}
                pageDirty={pageDirty}
                ariaLabel="Inline markdown"
                preview={
                  <CourseMarkdownBlockContent
                    markdown={block.markdown ?? ""}
                    colors={block.colors}
                    className="rounded-md border-0"
                  />
                }
              />
            </TRNFormField>
          ) : null}

          {sourceMode === "file" ? (
            <>
              <TRNFormField id={`${block.id}-md-file-src`} label="Bundled file">
                {BUNDLED_MARKDOWN_FILE_OPTIONS.some((option) => option.value === block.src) ? (
                  <TRNSelect
                    value={block.src ?? DEFAULT_MARKDOWN_FILE_SRC}
                    ariaLabel="Bundled markdown file"
                    options={BUNDLED_MARKDOWN_FILE_OPTIONS}
                    onValueChange={(value) =>
                      updateBlock(block.id, { src: value, url: undefined, markdown: undefined })
                    }
                  />
                ) : (
                  <TRNInput
                    id={`${block.id}-md-file-src-custom`}
                    variant="outlined"
                    size="sm"
                    value={block.src ?? ""}
                    placeholder="lesson.theory.md"
                    onChange={(event) =>
                      updateBlock(block.id, {
                        src: event.target.value,
                        url: undefined,
                        markdown: undefined,
                      })
                    }
                  />
                )}
              </TRNFormField>
              <TRNHintText>
                Edit{" "}
                <code className="text-[var(--accent-cyan)]">{block.src ?? "lesson.theory.md"}</code>{" "}
                below or open the Markdown workbench for split preview.
              </TRNHintText>
              <CourseMarkdownFileEditor
                src={block.src ?? "lesson.theory.md"}
                embedded
                showPreview={false}
                colors={block.colors}
              />
            </>
          ) : null}

          {sourceMode === "url" ? (
            <CourseMarkdownUrlEditor
              url={block.url ?? "https://github.com/user/repo"}
              embedded
              showPreview={false}
              onUrlChange={(url) =>
                updateBlock(block.id, { url, markdown: undefined, src: undefined })
              }
            />
          ) : null}

          <TRNButton
            size="compact"
            onClick={() => openMarkdownWorkbench(block.id)}
            hint="Open split editor with preview, snippets, and source navigation."
          >
            <ExternalLink size={13} strokeWidth={2} className="mr-1 inline" aria-hidden />
            Open in Markdown workbench
          </TRNButton>
        </div>
      </CourseInspectorCard>
      <MarkdownBlockPreviewSection block={block} />
      <CourseMarkdownReadHeightField blockId={block.id} readHeight={block.readHeight} />
      <MarkdownColorsCard block={block} />
    </>
  );
}
