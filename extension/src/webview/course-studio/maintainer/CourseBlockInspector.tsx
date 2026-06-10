import { FileText, Trash2 } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNTextarea } from "../../ui/TRN/TRNTextarea";
import { CourseDiagramBlockInspectorFields } from "../workbench/panes/CourseDiagramBlockInspectorFields";
import { CourseScene3dBlockInspectorFields } from "./CourseScene3dBlockFields";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseBlockReadHeightField } from "./CourseBlockReadHeightField";
import { CourseCardBlockInspectorFields } from "./CourseCardBlockInspectorFields";
import { CourseDashboardWidgetBlockInspectorFields } from "./CourseDashboardWidgetBlockInspectorFields";
import { CourseWidgetBoardBlockInspectorFields } from "./CourseWidgetBoardBlockInspectorFields";
import { CourseLiveMetricBlockInspectorFields } from "./CourseLiveMetricBlockInspectorFields";
import { CourseSensorTelemetryCardBlockInspectorFields } from "./CourseSensorTelemetryCardBlockInspectorFields";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseMarkdownBlockInspectorFields } from "./CourseMarkdownBlockInspectorFields";
import { CourseHtmlPageBlockInspectorFields } from "./CourseHtmlPageBlockInspectorFields";
import { CourseIframeBlockInspectorFields } from "./CourseIframeBlockInspectorFields";
import { CourseYoutubeBlockInspectorFields } from "./CourseYoutubeBlockInspectorFields";
import { CourseBlockPlacementInspectorCard } from "./CourseBlockPlacementStrip";
import { calloutVariantFromBlockKind } from "../ui/catalog/callout-tokens";
import { COURSE_TITLE_ICON_COLOR_DEFAULT_HEX } from "../schemas/courseTitleIcon";
import { CourseTitleIconField } from "./inspector/CourseTitleIconField";
import type { PageBlockV1 } from "../schemas/page.v1";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const CALLOUT_KINDS = [
  { value: "callout-info", label: "Info" },
  { value: "callout-warning", label: "Warning" },
  { value: "callout-danger", label: "Danger" },
  { value: "callout-tip", label: "Tip" },
] as const;

function DiagramBlockFields({ block }: { block: Extract<PageBlockV1, { kind: "diagram-2d" }> }) {
  return <CourseDiagramBlockInspectorFields block={block} />;
}

function Scene3dBlockFields({ block }: { block: Extract<PageBlockV1, { kind: "scene-3d" }> }) {
  return <CourseScene3dBlockInspectorFields block={block} />;
}

function BlockFields({ block }: { block: PageBlockV1 }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  switch (block.kind) {
    case "heading":
      return (
        <div className="flex flex-col gap-3">
          <CourseEmojiTextField
            id={`${block.id}-eyebrow`}
            label="Eyebrow"
            value={block.eyebrow ?? ""}
            onChange={(eyebrow) => updateBlock(block.id, { eyebrow })}
          />
          <CourseEmojiTextField
            id={`${block.id}-title`}
            label="Title"
            value={block.title}
            onChange={(title) => updateBlock(block.id, { title })}
          />
          <CourseTitleIconField
            blockId={block.id}
            id={`${block.id}-title-icon`}
            icon={block.icon}
            iconColor={block.iconColor}
            mode="optional"
            colorTarget={{ kind: "block" }}
            iconAnimation={block.iconAnimation}
            defaultIconColorHex={COURSE_TITLE_ICON_COLOR_DEFAULT_HEX.heading}
            hint="Shown left of the page heading title."
          />
          <CourseEmojiTextField
            id={`${block.id}-subtitle`}
            label="Subtitle"
            multiline
            rows={3}
            value={block.subtitle ?? ""}
            onChange={(subtitle) => updateBlock(block.id, { subtitle })}
          />
        </div>
      );
    case "callout-info":
    case "callout-warning":
    case "callout-danger":
    case "callout-tip":
      return (
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-kind`} label="Variant">
            <TRNSelect
              value={block.kind}
              ariaLabel="Callout variant"
              options={CALLOUT_KINDS.map((o) => ({ value: o.value, label: o.label }))}
              onValueChange={(value) =>
                updateBlock(block.id, {
                  kind: value as PageBlockV1["kind"],
                })
              }
            />
          </TRNFormField>
          <CourseEmojiTextField
            id={`${block.id}-title`}
            label="Title"
            value={block.title ?? ""}
            onChange={(title) => updateBlock(block.id, { title })}
          />
          <CourseTitleIconField
            blockId={block.id}
            id={`${block.id}-title-icon`}
            icon={block.icon}
            iconColor={block.iconColor}
            mode="callout"
            colorTarget={{ kind: "block" }}
            iconAnimation={block.iconAnimation}
            calloutVariant={calloutVariantFromBlockKind(block.kind)}
            hint="Variant default uses the callout style icon. Pick None to hide the prefix icon."
          />
          <CourseEmojiTextField
            id={`${block.id}-body`}
            label="Body"
            multiline
            rows={4}
            value={block.body}
            onChange={(body) => updateBlock(block.id, { body })}
          />
        </div>
      );
    case "markdown":
      return <CourseMarkdownBlockInspectorFields block={block} />;
    case "card":
      return <CourseCardBlockInspectorFields block={block} />;
    case "live-metric":
      return (
        <div className="flex flex-col gap-3">
          <CourseEmojiTextField
            id={`${block.id}-title`}
            label="Title"
            value={block.title}
            onChange={(title) => updateBlock(block.id, { title })}
          />
          <CourseTitleIconField
            blockId={block.id}
            id={`${block.id}-title-icon`}
            icon={block.icon}
            iconColor={block.iconColor}
            mode="optional"
            colorTarget={{ kind: "block" }}
            iconAnimation={block.iconAnimation}
            defaultIconColorHex={COURSE_TITLE_ICON_COLOR_DEFAULT_HEX.liveMetric}
            hint="Defaults to the live metric glyph when unset. Pick None to hide the prefix icon."
          />
          <CourseLiveMetricBlockInspectorFields block={block} />
        </div>
      );
    case "dashboard-widget":
      return <CourseDashboardWidgetBlockInspectorFields block={block} />;
    case "widget-board":
      return <CourseWidgetBoardBlockInspectorFields block={block} />;
    case "sensor-telemetry-card":
      return <CourseSensorTelemetryCardBlockInspectorFields block={block} />;
    case "diagram-2d":
      return <DiagramBlockFields block={block} />;
    case "scene-3d":
      return <Scene3dBlockFields block={block} />;
    case "image":
      return (
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-src`} label="Image URL">
            <TRNInput
              id={`${block.id}-src`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.src}
              onChange={(e) => updateBlock(block.id, { src: e.target.value })}
            />
            <TRNHintText className="mt-1 text-[10px]">
              GitHub <code className="text-[var(--accent-cyan)]">/blob/</code> links are resolved to
              raw file URLs automatically when the image renders.
            </TRNHintText>
          </TRNFormField>
          <CourseEmojiTextField
            id={`${block.id}-alt`}
            label="Alt text"
            value={block.alt ?? ""}
            onChange={(alt) => updateBlock(block.id, { alt })}
          />
          <CourseEmojiTextField
            id={`${block.id}-caption`}
            label="Caption"
            value={block.caption ?? ""}
            onChange={(caption) => updateBlock(block.id, { caption })}
          />
          <TRNFormField id={`${block.id}-fit`} label="Fit">
            <TRNSelect
              value={block.fit}
              ariaLabel="Image fit"
              options={[
                { value: "contain", label: "Contain" },
                { value: "cover", label: "Cover" },
              ]}
              onValueChange={(value) =>
                updateBlock(block.id, { fit: value as "contain" | "cover" })
              }
            />
          </TRNFormField>
        </div>
      );
    case "code":
      return (
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-language`} label="Language">
            <TRNInput
              id={`${block.id}-language`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.language}
              onChange={(e) => updateBlock(block.id, { language: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${block.id}-code`} label="Code">
            <TRNTextarea
              id={`${block.id}-code`}
              variant="outlined"
              size="sm"
              className="w-full font-mono"
              rows={10}
              value={block.code}
              onChange={(e) => updateBlock(block.id, { code: e.target.value })}
            />
          </TRNFormField>
          <CourseEmojiTextField
            id={`${block.id}-caption`}
            label="Caption"
            value={block.caption ?? ""}
            onChange={(caption) => updateBlock(block.id, { caption })}
          />
        </div>
      );
    case "youtube":
      return <CourseYoutubeBlockInspectorFields block={block} />;
    case "iframe":
      return <CourseIframeBlockInspectorFields block={block} />;
    case "html-page":
      return <CourseHtmlPageBlockInspectorFields block={block} />;
    default:
      return null;
  }
}

export function CourseBlockContentFields({ block }: { block: PageBlockV1 }) {
  const fields = <BlockFields block={block} />;

  if (
    block.kind === "youtube" ||
    block.kind === "iframe" ||
    block.kind === "html-page" ||
    block.kind === "markdown" ||
    block.kind === "card" ||
    block.kind === "scene-3d" ||
    block.kind === "sensor-telemetry-card" ||
    block.kind === "dashboard-widget" ||
    block.kind === "widget-board"
  ) {
    return (
      <div className="course-block-content-fields flex flex-col gap-2" data-course-block-content-fields>
        {fields}
      </div>
    );
  }

  return (
    <CourseInspectorCard
      id={`course-block-properties-content-${block.id}`}
      title="Content"
      titleIcon={<FileText className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Block copy and type-specific settings."
      defaultExpanded
    >
      <div className="course-block-content-fields" data-course-block-content-fields>
        {fields}
      </div>
    </CourseInspectorCard>
  );
}

export function CourseBlockInspector({
  variant = "block",
}: {
  variant?: "block" | "diagram-empty";
}) {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const removeBlock = useCoursePageEditorStore((s) => s.removeBlock);
  const block = page?.blocks.find((b) => b.id === selectedBlockId) ?? null;
  const canDelete = (page?.blocks.length ?? 0) > 0;

  if (variant === "diagram-empty") {
    const emptyHint = (
      <TRNHintText>
        Select a diagram-2d block on the page to edit canvas nodes, bindings, and diagram JSON.
      </TRNHintText>
    );
    return (
      <TRNFormSection title="Diagram editor" showHeading={false} className="border-dashed">
        {emptyHint}
      </TRNFormSection>
    );
  }

  if (block == null) {
    return (
      <TRNFormSection title="Block inspector" showHeading={false} className="border-dashed">
        <TRNHintText>
          Select a block on the page to edit copy, markdown, or grid placement.
        </TRNHintText>
      </TRNFormSection>
    );
  }

  return (
    <div className="course-maintainer-inspector flex flex-col gap-3">
      <TRNFormSection title={`${block.id} · ${block.kind}`} showHeading={false}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-100">Selected block</div>
            <div className="mt-0.5 truncate text-2xs text-zinc-400">
              {block.id} · {block.kind}
            </div>
          </div>
          <TRNButton
            size="compact"
            disabled={!canDelete}
            hint={canDelete ? "Remove block from page" : "No block selected"}
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 size={14} strokeWidth={2} />
          </TRNButton>
        </div>
      </TRNFormSection>

      <CourseBlockPlacementInspectorCard block={block} />

      <TRNFormSection title="Content" className="min-h-0 flex-1">
        <BlockFields block={block} />
      </TRNFormSection>
    </div>
  );
}
