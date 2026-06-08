import { Trash2 } from "lucide-react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNScrubNumberInput } from "../../ui/TRN/TRNScrubNumberInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import { TRNTextarea } from "../../ui/TRN/TRNTextarea";
import { PresentationTheoryMarkdown } from "../../presentation/components/PresentationTheoryMarkdown";
import { prepareNewCourseDiagram } from "../content/diagramTemplates";
import { useCourseDiagramIds } from "../content/diagramRegistry";
import { COURSE_3D_SCENE_CATALOG } from "../content/course3dSceneCatalog";
import { CourseMarkdownFileEditor } from "./CourseMarkdownFileEditor";
import type { PageBlockV1 } from "../schemas/page.v1";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const CALLOUT_KINDS = [
  { value: "callout-info", label: "Info" },
  { value: "callout-warning", label: "Warning" },
  { value: "callout-danger", label: "Danger" },
  { value: "callout-tip", label: "Tip" },
] as const;

function PlacementFields({ block }: { block: PageBlockV1 }) {
  const updatePlacement = useCoursePageEditorStore((s) => s.updatePlacement);
  const { placement } = block;

  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          ["column", "Column", 1, 48],
          ["row", "Row", 1, 200],
          ["columnSpan", "Col span", 1, 48],
          ["rowSpan", "Row span", 1, 200],
        ] as const
      ).map(([key, label, min, max]) => (
        <TRNFormField key={key} id={`placement-${block.id}-${key}`} label={label}>
          <TRNScrubNumberInput
            value={placement[key]}
            min={min}
            max={max}
            step={1}
            onChange={(value) => updatePlacement(block.id, { [key]: value })}
          />
        </TRNFormField>
      ))}
    </div>
  );
}

function DiagramBlockFields({ block }: { block: Extract<PageBlockV1, { kind: "diagram-2d" }> }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const diagramIds = useCourseDiagramIds();

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField id={`${block.id}-diagram`} label="Diagram">
        <TRNSelect
          value={block.diagramId}
          ariaLabel="Diagram id"
          options={diagramIds.map((id) => ({ value: id, label: id }))}
          onValueChange={(value) => updateBlock(block.id, { diagramId: value })}
        />
      </TRNFormField>
      <TRNFormField id={`${block.id}-caption`} label="Caption">
        <TRNInput
          id={`${block.id}-caption`}
          variant="outlined"
          size="sm"
          className="w-full"
          value={block.caption ?? ""}
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        />
      </TRNFormField>
      <div className="flex flex-wrap gap-1.5">
        <TRNButton
          size="compact"
          onClick={() =>
            void prepareNewCourseDiagram("blank").then(({ diagramId }) =>
              updateBlock(block.id, { diagramId }),
            )
          }
        >
          New blank diagram
        </TRNButton>
        <TRNButton
          size="compact"
          onClick={() =>
            void prepareNewCourseDiagram("from-pilot").then(({ diagramId }) =>
              updateBlock(block.id, { diagramId }),
            )
          }
        >
          Duplicate MEMS pilot
        </TRNButton>
      </div>
      <TRNHintText>
        Open the Diagram tab for canvas editing, node bindings, and JSON. + Diagram in the palette
        creates a blank canvas (dev mode saves a new JSON file under content/).
      </TRNHintText>
    </div>
  );
}

function Diagram3dBlockFields({ block }: { block: Extract<PageBlockV1, { kind: "diagram-3d" }> }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  return (
    <div className="flex flex-col gap-3">
      <TRNFormField id={`${block.id}-scene`} label="3D scene">
        <TRNSelect
          value={block.sceneId}
          ariaLabel="3D scene preset"
          options={COURSE_3D_SCENE_CATALOG.map((entry) => ({
            value: entry.id,
            label: entry.label,
          }))}
          onValueChange={(value) =>
            updateBlock(block.id, {
              sceneId: value as typeof block.sceneId,
            })
          }
        />
      </TRNFormField>
      <TRNFormField id={`${block.id}-caption`} label="Caption">
        <TRNInput
          id={`${block.id}-caption`}
          variant="outlined"
          size="sm"
          className="w-full"
          value={block.caption ?? ""}
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        />
      </TRNFormField>
      <TRNHintText>
        Reuses Presentation v1 R3F scenes (`PresentationStage`, orbit controls). PCB and gimbal
        scenes follow live BMI270 quaternion / gyro when the link is healthy.
      </TRNHintText>
    </div>
  );
}

function BlockFields({ block }: { block: PageBlockV1 }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  switch (block.kind) {
    case "heading":
      return (
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-eyebrow`} label="Eyebrow">
            <TRNInput
              id={`${block.id}-eyebrow`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.eyebrow ?? ""}
              onChange={(e) => updateBlock(block.id, { eyebrow: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${block.id}-title`} label="Title">
            <TRNInput
              id={`${block.id}-title`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.title}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${block.id}-subtitle`} label="Subtitle">
            <TRNTextarea
              id={`${block.id}-subtitle`}
              variant="outlined"
              size="sm"
              className="w-full"
              rows={3}
              value={block.subtitle ?? ""}
              onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
            />
          </TRNFormField>
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
          <TRNFormField id={`${block.id}-title`} label="Title">
            <TRNInput
              id={`${block.id}-title`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.title ?? ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${block.id}-body`} label="Body">
            <TRNTextarea
              id={`${block.id}-body`}
              variant="outlined"
              size="sm"
              className="w-full"
              rows={4}
              value={block.body}
              onChange={(e) => updateBlock(block.id, { body: e.target.value })}
            />
          </TRNFormField>
        </div>
      );
    case "markdown":
      if (block.src != null) {
        return (
          <div className="flex flex-col gap-3">
            <TRNHintText>
              Theory content lives in <code className="text-[var(--accent-cyan)]">{block.src}</code>.
              Edit the file below or switch to the Page tab for document settings.
            </TRNHintText>
            <CourseMarkdownFileEditor src={block.src} embedded />
          </div>
        );
      }
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <TRNFormField id={`${block.id}-markdown`} label="Markdown">
            <TRNTextarea
              id={`${block.id}-markdown`}
              variant="outlined"
              size="sm"
              className="w-full"
              rows={8}
              value={block.markdown ?? ""}
              onChange={(e) => updateBlock(block.id, { markdown: e.target.value })}
            />
          </TRNFormField>
          <TRNHintText>
            Admonitions: {"> **Note:** …"}, {"> **Warning:** …"}, {"> **Tip:** …"} render as
            callouts in preview.
          </TRNHintText>
          <TRNFormField id={`${block.id}-preview`} label="Preview">
            <div className="max-h-48 overflow-y-auto scrollbar-hide rounded-md border border-zinc-700/80 bg-zinc-950/50 px-3 py-2">
              <PresentationTheoryMarkdown markdown={block.markdown ?? ""} />
            </div>
          </TRNFormField>
        </div>
      );
    case "card":
      return (
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-title`} label="Title">
            <TRNInput
              id={`${block.id}-title`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={block.title ?? ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            />
          </TRNFormField>
          <TRNFormField id={`${block.id}-body`} label="Body">
            <TRNTextarea
              id={`${block.id}-body`}
              variant="outlined"
              size="sm"
              className="w-full"
              rows={4}
              value={block.body}
              onChange={(e) => updateBlock(block.id, { body: e.target.value })}
            />
          </TRNFormField>
        </div>
      );
    case "live-metric":
      return (
        <TRNFormField id={`${block.id}-title`} label="Title">
          <TRNInput
            id={`${block.id}-title`}
            variant="outlined"
            size="sm"
            className="w-full"
            value={block.title}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
          />
        </TRNFormField>
      );
    case "diagram-2d":
      return <DiagramBlockFields block={block} />;
    case "diagram-3d":
      return <Diagram3dBlockFields block={block} />;
    default:
      return null;
  }
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
  const canDelete = (page?.blocks.length ?? 0) > 1;

  if (variant === "diagram-empty") {
    return (
      <TRNFormSection title="Diagram editor" showHeading={false} className="border-dashed">
        <TRNHintText>
          Select a diagram-2d block on the page to edit canvas nodes, bindings, and diagram JSON.
        </TRNHintText>
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
            hint={canDelete ? "Remove block from page" : "Page must keep at least one block"}
            onClick={() => removeBlock(block.id)}
          >
            <Trash2 size={14} strokeWidth={2} />
          </TRNButton>
        </div>
      </TRNFormSection>

      <TRNFormSection title="Placement">
        <PlacementFields block={block} />
      </TRNFormSection>

      <TRNFormSection title="Content" className="min-h-0 flex-1">
        <BlockFields block={block} />
      </TRNFormSection>
    </div>
  );
}
