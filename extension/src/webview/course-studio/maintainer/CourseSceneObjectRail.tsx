import { Copy, FolderPlus, Link2, Plus, Trash2, Unlink2 } from "lucide-react";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

const TOOLBAR_HINT_DELAY_MS = 400;

const VIEWPORT_OBJECT_PILL_CLASS =
  "pointer-events-none absolute left-3 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-amber-400/25 bg-zinc-950/88 px-1 py-1.5 shadow-lg backdrop-blur-md";

const VIEWPORT_ICON_BUTTON_CLASS =
  "!h-7 !w-7 !rounded-full !border-0 !bg-transparent hover:!bg-zinc-800/60";

export function CourseSceneObjectRail({
  documentId,
  selectedNodeIds,
  addMenuOpen = false,
  onOpenAddMenu,
  onGroupSelected,
  onOpenParentMenu,
  onOpenClearParentMenu,
}: {
  documentId: string;
  selectedNodeIds: string[];
  addMenuOpen?: boolean;
  onOpenAddMenu: (anchor: { clientX: number; clientY: number }) => void;
  onGroupSelected?: () => void;
  onOpenParentMenu?: (anchor: { clientX: number; clientY: number }) => void;
  onOpenClearParentMenu?: (anchor: { clientX: number; clientY: number }) => void;
}) {
  const duplicateSelectedNodes = useCourseSceneEditorStore((s) => s.duplicateSelectedNodes);
  const removeNodes = useCourseSceneEditorStore((s) => s.removeNodes);

  const hasSelection = selectedNodeIds.length > 0;

  return (
    <div
      className={`course-scene-object-rail ${VIEWPORT_OBJECT_PILL_CLASS}`}
      role="toolbar"
      aria-label="3D scene object tools"
    >
      <TRNIconButton
        icon={<Plus size={14} className="text-zinc-400" aria-hidden />}
        label="Add object"
        hint="Add object (Shift+A)"
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        aria-pressed={addMenuOpen}
        nativeTitle={false}
        onClick={(event) => {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          onOpenAddMenu({
            clientX: rect.right + 8,
            clientY: rect.top + rect.height / 2,
          });
        }}
        className={
          addMenuOpen
            ? `${VIEWPORT_ICON_BUTTON_CLASS} !bg-sky-500/15`
            : VIEWPORT_ICON_BUTTON_CLASS
        }
      />

      <TRNIconButton
        icon={<FolderPlus size={14} className="text-zinc-400" aria-hidden />}
        label="Group"
        disabled={!hasSelection}
        hint={hasSelection ? "Group selected (Ctrl+G)" : "Select objects to group"}
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={() => onGroupSelected?.()}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />

      <TRNIconButton
        icon={<Link2 size={14} className="text-zinc-400" aria-hidden />}
        label="Set Parent To"
        disabled={!hasSelection}
        hint={hasSelection ? "Set Parent To (Ctrl+P)" : "Select objects, then pick active parent"}
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={(event) => {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          onOpenParentMenu?.({
            clientX: rect.right + 8,
            clientY: rect.top + rect.height / 2,
          });
        }}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />

      <TRNIconButton
        icon={<Unlink2 size={14} className="text-zinc-400" aria-hidden />}
        label="Clear Parent"
        disabled={!hasSelection}
        hint={hasSelection ? "Clear Parent (Alt+P)" : "Select parented objects to clear"}
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={(event) => {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          onOpenClearParentMenu?.({
            clientX: rect.right + 8,
            clientY: rect.top + rect.height / 2,
          });
        }}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />

      <TRNIconButton
        icon={<Copy size={14} className="text-zinc-400" aria-hidden />}
        label="Duplicate"
        disabled={!hasSelection}
        hint={
          hasSelection
            ? "Duplicate selection (Ctrl+D)"
            : "Select objects to duplicate"
        }
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={() => {
          if (hasSelection) {
            duplicateSelectedNodes(documentId);
          }
        }}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />

      <TRNIconButton
        icon={<Trash2 size={14} className="text-zinc-400" aria-hidden />}
        label="Delete"
        disabled={!hasSelection}
        hint={hasSelection ? "Delete selection (Delete)" : "Select objects to delete"}
        hintPlacement="right"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={() => {
          if (hasSelection) {
            removeNodes(documentId, selectedNodeIds);
          }
        }}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />
    </div>
  );
}
