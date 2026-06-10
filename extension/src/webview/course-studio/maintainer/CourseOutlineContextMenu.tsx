import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import type { CourseNodeKindV1, CourseNodeV1 } from "../schemas/course.v1";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../ui/TRN/TRNMenu";
import { canAddChildToNode } from "../runtime/course/courseOutlineTree";

export type CourseOutlineMenuAnchor = {
  x: number;
  y: number;
  node: CourseNodeV1 | null;
};

const MENU_ITEM_CLASS =
  "rounded px-2 py-1.5 text-[11px] font-medium text-[var(--text-primary)]";

function kindLabel(kind: CourseNodeKindV1): string {
  switch (kind) {
    case "chapter":
      return "Chapter";
    case "topic":
      return "Topic";
    case "subtopic":
      return "Subtopic";
    default:
      return "Section";
  }
}

export const CourseOutlineContextMenu = memo(function CourseOutlineContextMenu({
  anchor,
  subtopicAddParent,
  onClose,
  onAddChapter,
  onAddTopic,
  onAddSubtopic,
  onRename,
  onDuplicate,
  onDelete,
}: {
  anchor: CourseOutlineMenuAnchor;
  /** Parent node for **Add subtopic** (topic or chapter). When the menu opens on a subtopic, this is its parent. */
  subtopicAddParent: CourseNodeV1 | null;
  onClose: () => void;
  onAddChapter: () => void;
  onAddTopic: () => void;
  onAddSubtopic: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const panelRef = useRef<HTMLDivElement>(null);
  const node = anchor.node;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (portalTarget == null) {
    return null;
  }

  const addParent =
    node?.kind === "book" || node?.kind === "chapter" || node?.kind === "topic" ? node : null;
  const canAddChapter = node?.kind === "book";
  const canAddTopic = addParent != null && canAddChildToNode(addParent, "topic");
  const canAddSubtopic =
    subtopicAddParent != null && canAddChildToNode(subtopicAddParent, "subtopic");
  const canRename = node != null && node.kind !== "book";
  const canDuplicate = node != null && node.kind !== "book";
  const canDelete = node != null && node.kind !== "book";
  const hasAdd = canAddChapter || canAddTopic || canAddSubtopic;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label="Course outline"
      className="pointer-events-auto fixed z-[600]"
      style={{ top: anchor.y, left: anchor.x }}
      onClick={(event) => event.stopPropagation()}
    >
      <TRNMenuPanel tone="glass-dropdown" className="min-w-[12rem] p-1 scrollbar-hide">
        {hasAdd ? (
          <>
            <TRNMenuSectionTitle spacing="menuFirst">Add</TRNMenuSectionTitle>
            {canAddChapter ? (
              <TRNMenuItemButton
                label={kindLabel("chapter")}
                icon={<Plus className="size-3.5" aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  onAddChapter();
                  onClose();
                }}
              />
            ) : null}
            {canAddTopic ? (
              <TRNMenuItemButton
                label={kindLabel("topic")}
                icon={<Plus className="size-3.5" aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  onAddTopic();
                  onClose();
                }}
              />
            ) : null}
            {canAddSubtopic ? (
              <TRNMenuItemButton
                label={kindLabel("subtopic")}
                icon={<Plus className="size-3.5" aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  onAddSubtopic();
                  onClose();
                }}
              />
            ) : null}
          </>
        ) : null}
        {canRename || canDuplicate || canDelete ? (
          <>
            <TRNMenuSectionTitle spacing={hasAdd ? "menuNext" : "menuFirst"}>Node</TRNMenuSectionTitle>
            {canRename ? (
              <TRNMenuItemButton
                label="Rename…"
                icon={<Pencil className="size-3.5" aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  onRename();
                  onClose();
                }}
              />
            ) : null}
            {canDuplicate ? (
              <TRNMenuItemButton
                label="Duplicate"
                icon={<Copy className="size-3.5" aria-hidden />}
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  onDuplicate();
                  onClose();
                }}
              />
            ) : null}
            {canDelete ? (
              <TRNMenuItemButton
                label="Delete"
                icon={<Trash2 className="size-3.5" aria-hidden />}
                className={`${MENU_ITEM_CLASS} text-red-300 hover:bg-red-500/10`}
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              />
            ) : null}
          </>
        ) : null}
      </TRNMenuPanel>
    </div>,
    portalTarget,
  );
});
