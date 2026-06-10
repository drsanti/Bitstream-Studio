import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  COURSE_BLOCK_PALETTE_EMBED_GROUP,
  courseBlockEmbedPaletteEntries,
  courseBlockPaletteMoreRowCount,
  courseBlockPaletteVisibleEntries,
  type CourseBlockPaletteEntry,
  type CourseBlockPaletteTier,
} from "./blockPaletteMeta";
import { COURSE_BLOCK_PALETTE_ICONS } from "./blockPaletteIcons";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../workbench/course-workbench-pane-labels";
import { suppressCoursePageGridDeselect } from "./coursePageEditorDeselectGuard";
import { useOpenHtmlPageBlockInEditor } from "./useAddHtmlPageBlock";
import { useFocusAddedScene3dBlock } from "./useFocusAddedScene3dBlock";

/** Matches Sensor Studio inspector subsection labels (e.g. Dashboard settings). */
const PALETTE_SECTION_LABEL_CLASS =
  "mb-1 text-[10px] font-medium uppercase tracking-wide leading-none text-zinc-500";

function CourseBlockPaletteTile({
  entry,
  disabled,
  onAdd,
  showDivider,
  compact = false,
}: {
  entry: CourseBlockPaletteEntry;
  disabled?: boolean;
  onAdd: () => void;
  showDivider?: boolean;
  compact?: boolean;
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
          className={`group grid w-full min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-2 gap-x-2 text-left transition-colors hover:bg-zinc-800/45 disabled:cursor-not-allowed disabled:opacity-60 ${
            compact ? "px-2 py-1.5" : "px-1 py-2"
          } ${showDivider ? "border-b border-zinc-800/80" : ""}`}
        >
          <span
            className={`row-span-2 flex items-center justify-center self-center ${
              entry.accentClassName ?? "text-zinc-400"
            }`}
            aria-hidden
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
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

function CourseBlockPaletteEmbedGroup({
  disabled,
  onAdd,
  showDivider,
}: {
  disabled?: boolean;
  onAdd: (entry: CourseBlockPaletteEntry) => void;
  showDivider?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const options = courseBlockEmbedPaletteEntries();
  const Icon = COURSE_BLOCK_PALETTE_ICONS[COURSE_BLOCK_PALETTE_EMBED_GROUP.icon];

  return (
    <div className={showDivider ? "border-b border-zinc-800/80" : ""}>
      <TRNTooltip
        content="Choose YouTube or external iFrame embed"
        openDelayMs={TRN_HINT_HOVER_DELAY_MS}
        disableHoverFx
        triggerWrapper="span"
        className="block w-full min-w-0"
        triggerClassName="flex w-full min-w-0"
        trigger={
          <button
            type="button"
            disabled={disabled}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="group grid w-full min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_1rem] grid-rows-2 gap-x-2 px-1 py-2 text-left transition-colors hover:bg-zinc-800/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={`row-span-2 flex items-center justify-center self-center ${COURSE_BLOCK_PALETTE_EMBED_GROUP.accentClassName}`}
              aria-hidden
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 truncate text-[11px] font-semibold leading-snug text-zinc-100">
              {COURSE_BLOCK_PALETTE_EMBED_GROUP.label}
            </span>
            <span
              className="row-span-2 flex items-center justify-center text-zinc-500"
              aria-hidden
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </span>
            <span className="min-w-0 truncate text-[10px] leading-snug text-zinc-500">
              {COURSE_BLOCK_PALETTE_EMBED_GROUP.description}
            </span>
          </button>
        }
      />
      {expanded ? (
        <div className="border-t border-zinc-800/60 bg-zinc-950/35">
          {options.map((entry, index) => (
            <CourseBlockPaletteTile
              key={entry.kind}
              entry={entry}
              compact
              disabled={disabled}
              showDivider={index < options.length - 1}
              onAdd={() => onAdd(entry)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CourseBlockPaletteTierSections({
  tier,
  addingDiagram,
  addingScene,
  onAddBlock,
}: {
  tier: CourseBlockPaletteTier;
  addingDiagram: boolean;
  addingScene: boolean;
  onAddBlock: (entry: CourseBlockPaletteEntry) => void;
}) {
  const visibleEntries = courseBlockPaletteVisibleEntries(tier);

  return (
    <>
      {COURSE_BLOCK_PALETTE_CATEGORY_ORDER.map((category) => {
        const entries = visibleEntries.filter((entry) => entry.category === category);
        const showEmbedGroup = tier === "more" && category === "embed";
        if (entries.length === 0 && !showEmbedGroup) {
          return null;
        }

        return (
          <section key={`${tier}-${category}`} className="min-w-0">
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
                  showDivider={index < entries.length - 1 || showEmbedGroup}
                  onAdd={() => onAddBlock(entry)}
                />
              ))}
              {showEmbedGroup ? (
                <CourseBlockPaletteEmbedGroup
                  showDivider={false}
                  disabled={addingDiagram || addingScene}
                  onAdd={onAddBlock}
                />
              ) : null}
            </div>
          </section>
        );
      })}
    </>
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
  const openHtmlPageBlock = useOpenHtmlPageBlockInEditor();
  const [addingDiagram, setAddingDiagram] = useState(false);
  const [addingScene, setAddingScene] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRowCount = courseBlockPaletteMoreRowCount();

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
    if (entry.kind === "html-page") {
      const block = createPageBlock(entry.kind, page!);
      addBlock(block);
      openHtmlPageBlock(block.id);
      return;
    }
    addBlock(createPageBlock(entry.kind, page!));
  }

  const body = (
    <div className="flex flex-col gap-2.5">
      <CourseBlockPaletteTierSections
        tier="default"
        addingDiagram={addingDiagram}
        addingScene={addingScene}
        onAddBlock={handleAddBlock}
      />
      <section className="min-w-0">
        <button
          type="button"
          aria-expanded={moreOpen}
          className="mb-1 flex w-full items-center gap-1.5 text-left text-[10px] font-medium uppercase tracking-wide leading-none text-zinc-500 transition-colors hover:text-zinc-400"
          onClick={() => setMoreOpen((value) => !value)}
        >
          {moreOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          )}
          <span>More blocks</span>
          <span className="normal-case tracking-normal text-zinc-600">({moreRowCount})</span>
        </button>
        {moreOpen ? (
          <div className="flex flex-col gap-2.5">
            <CourseBlockPaletteTierSections
              tier="more"
              addingDiagram={addingDiagram}
              addingScene={addingScene}
              onAddBlock={handleAddBlock}
            />
          </div>
        ) : null}
      </section>
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
