import {
  Copy,
  PanelRight,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import type { PageBlockV1 } from "../schemas/page.v1";
import { formatGridSpanLabel } from "../schemas/embedBlocks";
import { useFocusCourseWorkbenchEditor } from "../workbench/useFocusCourseWorkbenchEditor";
import { coursePageBlockSelectionLabel } from "./coursePageBlockSelectionLabel";
import {
  courseWorkbenchOpenIconForBlock,
  courseWorkbenchOpenLabelForBlock,
  resolveCourseWorkbenchEditorTypeForBlock,
} from "./coursePageEditorFocus";
import { duplicatePageBlock } from "./duplicatePageBlock";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const TOOLBAR_PILL_CLASS =
  "pointer-events-auto flex max-w-[min(100%,28rem)] items-center gap-1 rounded-md border border-amber-400/30 bg-zinc-950/88 px-1 py-0.5 shadow-sm backdrop-blur-sm";

const TOOLBAR_LABEL_CLASS =
  "min-w-0 max-w-[9rem] shrink truncate pr-0.5 text-[10px] font-medium text-amber-100/90";

const TOOLBAR_DIVIDER_CLASS = "mx-0.5 h-3 w-px shrink-0 bg-zinc-600/55";

export function CoursePageGridSelectionToolbar({
  block,
  placementBelow = false,
}: {
  block: PageBlockV1;
  placementBelow?: boolean;
}) {
  const page = useCoursePageEditorStore((s) => s.page);
  const pushPageUndoSnapshot = useCoursePageEditorStore((s) => s.pushPageUndoSnapshot);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const removeBlock = useCoursePageEditorStore((s) => s.removeBlock);
  const focusWorkbenchEditor = useFocusCourseWorkbenchEditor();

  const label = coursePageBlockSelectionLabel(block);
  const spanLabel = formatGridSpanLabel(block.placement.columnSpan, block.placement.rowSpan);
  const OpenIcon = courseWorkbenchOpenIconForBlock(block);
  const dedicatedEditor = resolveCourseWorkbenchEditorTypeForBlock(block);

  const focusEditor = (editorType: "inspector" | "diagram" | "markdown" | "scene-3d") => {
    focusWorkbenchEditor(editorType);
  };

  const handleOpen = () => {
    focusEditor(dedicatedEditor ?? "inspector");
  };

  const handleInspector = () => {
    focusEditor("inspector");
  };

  const handleDuplicate = () => {
    if (page == null) {
      return;
    }
    const copy = duplicatePageBlock(page, block);
    if (copy == null) {
      toast.error("Could not duplicate block — diagram source is missing.");
      return;
    }
    pushPageUndoSnapshot();
    addBlock(copy, { recordUndo: false });
    toast.success("Block duplicated");
  };

  const handleDelete = () => {
    pushPageUndoSnapshot();
    removeBlock(block.id, { recordUndo: false });
  };

  const positionClass = placementBelow
    ? "pointer-events-none absolute left-0 top-full z-20 mt-1"
    : "pointer-events-none absolute -top-7 left-0 z-20";

  return (
    <div className={positionClass}>
      <div className={TOOLBAR_PILL_CLASS} role="toolbar" aria-label={`${label} block actions`}>
        <span className={TOOLBAR_LABEL_CLASS}>
          {label}
          <span className="text-amber-200/55"> · {spanLabel}</span>
        </span>
        <span className="flex shrink-0 items-center gap-0">
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6"
            icon={<OpenIcon size={13} strokeWidth={2.25} aria-hidden />}
            label={courseWorkbenchOpenLabelForBlock(block)}
            nativeTitle={false}
            hint={courseWorkbenchOpenLabelForBlock(block)}
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
          />
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6"
            icon={<PanelRight size={13} strokeWidth={2.25} aria-hidden />}
            label="Open Inspector"
            nativeTitle={false}
            hint="Open Inspector"
            onClick={(event) => {
              event.stopPropagation();
              handleInspector();
            }}
          />
        </span>
        <span className={TOOLBAR_DIVIDER_CLASS} aria-hidden />
        <span className="flex shrink-0 items-center gap-0">
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6"
            icon={<Copy size={13} strokeWidth={2.25} aria-hidden />}
            label="Duplicate block"
            nativeTitle={false}
            hint="Duplicate block beside or below"
            onClick={(event) => {
              event.stopPropagation();
              handleDuplicate();
            }}
          />
          <TRNIconButton
            variant="ghost"
            className="h-6 w-6 hover:text-rose-400"
            icon={<Trash2 size={13} strokeWidth={2.25} aria-hidden />}
            label="Delete block"
            nativeTitle={false}
            hint="Delete block"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
          />
        </span>
      </div>
    </div>
  );
}
