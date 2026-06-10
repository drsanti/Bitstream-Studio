import { useState } from "react";
import { toast } from "react-toastify";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import {
  persistNewCourseDiagramToDev,
  registerNewCourseDiagram,
} from "../content/diagramTemplates";
import { readCourseStudioBootstrapModeFromLocation } from "../content/bootstrapCourseStudioBlank";
import { persistCourseStudioSessionDraft } from "../content/courseStudioSessionDraft";
import {
  persistNewCourseSceneToDev,
  prepareNewCourseScene,
} from "../content/sceneTemplates";
import { formatGridSpanLabel } from "../schemas/embedBlocks";
import { createPageBlock } from "./blockFactory";
import {
  COURSE_BLOCK_PALETTE_CATEGORY_LABELS,
  COURSE_BLOCK_PALETTE_CATEGORY_ORDER,
  PAGE_BLOCK_PALETTE,
  type CourseBlockPaletteEntry,
} from "./blockPaletteMeta";
import { COURSE_BLOCK_PALETTE_ICONS } from "./blockPaletteIcons";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../workbench/course-workbench-pane-labels";
import { suppressCoursePageGridDeselect } from "./coursePageEditorDeselectGuard";
import { useFocusAddedScene3dBlock } from "./useFocusAddedScene3dBlock";

/** Matches Sensor Studio inspector subsection labels (e.g. Dashboard settings). */
const PALETTE_SECTION_LABEL_CLASS =
  "mb-1 text-[10px] font-medium uppercase tracking-wide leading-none text-zinc-500";

function CourseBlockPaletteTile({
  entry,
  disabled,
  onAdd,
  showDivider,
}: {
  entry: CourseBlockPaletteEntry;
  disabled?: boolean;
  onAdd: () => void;
  showDivider?: boolean;
}) {
  const Icon = COURSE_BLOCK_PALETTE_ICONS[entry.icon];
  const spanLabel = formatGridSpanLabel(entry.defaultSpan.columnSpan, entry.defaultSpan.rowSpan);

  return (
    <TRNTooltip
      content={`Add ${entry.label} (${spanLabel}) — ${entry.description}`}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      triggerWrapper="span"
      className="block w-full min-w-0"
      triggerClassName="flex w-full min-w-0"
      trigger={
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className={`group grid w-full min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-2 gap-x-2 px-1 py-2 text-left transition-colors hover:bg-zinc-800/45 disabled:cursor-not-allowed disabled:opacity-60 ${
            showDivider ? "border-b border-zinc-800/80" : ""
          }`}
        >
          <span
            className={`row-span-2 flex items-center justify-center self-center ${
              entry.accentClassName ?? "text-zinc-400"
            }`}
            aria-hidden
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 truncate text-[11px] font-semibold leading-snug text-zinc-100">
            {entry.label}
          </span>
          <span className="flex min-w-0 items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-[10px] leading-snug text-zinc-500">
              {entry.description}
            </span>
            <span className="shrink-0 text-[10px] leading-none text-zinc-600">{spanLabel}</span>
          </span>
        </button>
      }
    />
  );
}

export function CourseBlockPalette({
  embedded = false,
  bare = false,
}: {
  embedded?: boolean;
  bare?: boolean;
}) {
  const page = useCoursePageEditorStore((s) => s.page);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const focusAddedScene3dBlock = useFocusAddedScene3dBlock();
  const [addingDiagram, setAddingDiagram] = useState(false);
  const [addingScene, setAddingScene] = useState(false);

  if (page == null) {
    return null;
  }

  function handleAddBlock(entry: CourseBlockPaletteEntry) {
    if (entry.kind === "diagram-2d") {
      setAddingDiagram(true);
      try {
        const built = registerNewCourseDiagram("blank");
        addBlock(createPageBlock(entry.kind, page!, { diagramId: built.diagramId }));
        void persistNewCourseDiagramToDev(built).then((result) => {
          if (!result.ok) {
            toast.warn(
              `Diagram added in memory; dev save failed: ${result.error}. Save the page after fixing the dev API.`,
            );
          }
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not create diagram block.",
        );
      } finally {
        setAddingDiagram(false);
      }
      return;
    }
    if (entry.kind === "scene-3d") {
      setAddingScene(true);
      try {
        const built = prepareNewCourseScene("blank");
        const block = createPageBlock(entry.kind, page!, { documentId: built.documentId });
        suppressCoursePageGridDeselect();
        addBlock(block);
        focusAddedScene3dBlock(block.id);
        if (readCourseStudioBootstrapModeFromLocation() === "blank") {
          persistCourseStudioSessionDraft("blank");
        }
        void persistNewCourseSceneToDev(built)
          .then((result) => {
            if (!result.ok) {
              toast.warn(
                `3D Scene added in memory; dev save failed: ${result.error}. Save the page after fixing the dev API.`,
              );
            }
          })
          .catch((error) => {
            toast.error(
              error instanceof Error ? error.message : "Could not save 3D Scene document.",
            );
          })
          .finally(() => {
            setAddingScene(false);
          });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create 3D Scene block.");
        setAddingScene(false);
      }
      return;
    }
    addBlock(createPageBlock(entry.kind, page!));
  }

  const body = (
    <div className="flex flex-col gap-2.5">
      {COURSE_BLOCK_PALETTE_CATEGORY_ORDER.map((category) => {
        const entries = PAGE_BLOCK_PALETTE.filter((entry) => entry.category === category);
        if (entries.length === 0) {
          return null;
        }
        return (
          <section key={category} className="min-w-0">
            <p className={PALETTE_SECTION_LABEL_CLASS}>
              {COURSE_BLOCK_PALETTE_CATEGORY_LABELS[category]}
            </p>
            <div className="overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950/20">
              {entries.map((entry, index) => (
                <CourseBlockPaletteTile
                  key={entry.kind}
                  entry={entry}
                  disabled={
                    (entry.kind === "diagram-2d" && addingDiagram) ||
                    (entry.kind === "scene-3d" && addingScene)
                  }
                  showDivider={index < entries.length - 1}
                  onAdd={() => handleAddBlock(entry)}
                />
              ))}
            </div>
          </section>
        );
      })}
      <TRNHintText>
        Blocks land in the first free grid slot on the {COURSE_WORKBENCH_PANE_LABELS.content}.
      </TRNHintText>
    </div>
  );

  if (bare || embedded) {
    return body;
  }

  return <div className="border-b border-[var(--surface-border)] px-4 py-3">{body}</div>;
}
