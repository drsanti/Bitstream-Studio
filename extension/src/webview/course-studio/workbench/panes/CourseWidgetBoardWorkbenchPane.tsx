import { useEffect } from "react";
import { LayoutDashboard } from "lucide-react";
import { useAddWidgetBoardBlock, useOpenWidgetBoardBlockInEditor } from "../../maintainer/widget-board/useWidgetBoardWorkbenchActions";
import { CourseWidgetBoardEditorToolbar } from "../../maintainer/widget-board/CourseWidgetBoardEditorToolbar";
import { CourseWidgetBoardInnerComposer } from "../../maintainer/widget-board/CourseWidgetBoardInnerComposer";
import {
  createWidgetBoardEntry,
  removeWidgetBoardWidgets,
  updateWidgetBoardWidgets,
} from "../../maintainer/widget-board/widgetBoardEditorOps";
import { useCourseWidgetBoardEditorStore } from "../../maintainer/widget-board/useCourseWidgetBoardEditorStore";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import type { PageBlockV1 } from "../../schemas/page.v1";
import type { WidgetBoardWidgetKind } from "../../schemas/widgetBoard.v1";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

function listWidgetBoardBlocks(blocks: PageBlockV1[]) {
  return blocks.filter(
    (block): block is Extract<PageBlockV1, { kind: "widget-board" }> =>
      block.kind === "widget-board",
  );
}

export function CourseWidgetBoardWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const addWidgetBoardBlock = useAddWidgetBoardBlock();
  const openWidgetBoardBlock = useOpenWidgetBoardBlockInEditor();
  const selectedWidgetIds = useCourseWidgetBoardEditorStore((s) => s.selectedWidgetIds);
  const setWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.setWidgetSelection);
  const clearWidgetSelection = useCourseWidgetBoardEditorStore((s) => s.clearWidgetSelection);

  const block =
    page?.blocks.find(
      (entry) => entry.id === selectedBlockId && entry.kind === "widget-board",
    ) ?? null;

  useEffect(() => {
    clearWidgetSelection();
  }, [block?.id, clearWidgetSelection]);

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Widget Editor"
        hint="Enable Maintainer mode, select a widget board, then click grid cells to place and configure widgets."
      />
    );
  }

  if (page == null) {
    return (
      <CourseWorkbenchPaneEmpty
        title="Widget Editor"
        hint="Open a course page to add and edit widget boards."
      />
    );
  }

  if (block == null) {
    const boards = listWidgetBoardBlocks(page.blocks);
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
        <CourseWorkbenchPaneEmpty
          title="Widget Editor"
          hint="Select a widget board on the page, or add one below."
        />
        {boards.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Widget boards on this page
            </p>
            {boards.map((entry) => (
              <TRNButton
                key={entry.id}
                variant="secondary"
                size="compact"
                className="justify-start text-[11px]"
                onClick={() => openWidgetBoardBlock(entry.id)}
              >
                {entry.id}
              </TRNButton>
            ))}
          </div>
        ) : null}
        <TRNButton variant="primary" size="compact" className="w-fit" onClick={addWidgetBoardBlock}>
          Add widget board
        </TRNButton>
      </div>
    );
  }

  const onAddWidget = (kind: WidgetBoardWidgetKind) => {
    const entry = createWidgetBoardEntry(kind, block.widgets, block.grid.columns);
    const next = updateWidgetBoardWidgets(block, [...block.widgets, entry]);
    updateBlock(block.id, { widgets: next.widgets });
    setWidgetSelection([entry.id]);
  };

  const onDeleteSelected = () => {
    if (selectedWidgetIds.length === 0) {
      return;
    }
    const next = removeWidgetBoardWidgets(block, selectedWidgetIds);
    if (next == null) {
      return;
    }
    updateBlock(block.id, { widgets: next.widgets });
    clearWidgetSelection();
  };

  return (
    <div className="course-workbench-widget-board-pane flex h-full min-h-0 flex-col overflow-hidden">
      <CourseWidgetBoardEditorToolbar
        onAddWidget={onAddWidget}
        onDeleteSelected={onDeleteSelected}
        canDeleteSelected={
          selectedWidgetIds.length > 0 &&
          block.widgets.length - selectedWidgetIds.length >= 1
        }
      />
      <div className="course-widget-board-editor-scroll relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 scrollbar-hide">
        <CourseWidgetBoardInnerComposer
          block={block}
          staleMs={page.meta?.staleMs}
        />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--surface-border)] px-2 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {block.id}
        </span>
        <TRNButton
          variant="ghost"
          size="compact"
          className="text-[11px]"
          onClick={() => selectBlock(null)}
        >
          Deselect board
        </TRNButton>
      </div>
    </div>
  );
}
