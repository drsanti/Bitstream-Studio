import { useCallback, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen } from "lucide-react";
import { toast } from "react-toastify";
import type { CourseNodeKindV1, CourseNodeV1 } from "../schemas/course.v1";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { courseBreadcrumbForNode, findCourseNode } from "../runtime/course/courseOutlineTree";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import {
  CourseOutlineContextMenu,
  type CourseOutlineMenuAnchor,
} from "./CourseOutlineContextMenu";

function nodeIcon(kind: CourseNodeV1["kind"]) {
  switch (kind) {
    case "book":
      return BookOpen;
    case "chapter":
      return FolderOpen;
    default:
      return FileText;
  }
}

function OutlineRenameInput({
  value,
  onCommit,
  onCancel,
}: {
  value: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onCommit(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      autoFocus
      className="w-full min-w-0 rounded border border-[var(--accent-amber)]/50 bg-[var(--surface-card)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)] outline-none"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

function OutlineTreeRows({
  nodes,
  depth,
  onContextMenu,
}: {
  nodes: CourseNodeV1[];
  depth: number;
  onContextMenu: (event: MouseEvent, node: CourseNodeV1) => void;
}) {
  const activeNodeId = useCourseOutlineStore((s) => s.activeNodeId);
  const expandedNodeIds = useCourseOutlineStore((s) => s.expandedNodeIds);
  const renamingNodeId = useCourseOutlineStore((s) => s.renamingNodeId);
  const pageDirty = useCoursePageEditorStore((s) => s.dirty);
  const selectNode = useCourseOutlineStore((s) => s.selectNode);
  const toggleExpanded = useCourseOutlineStore((s) => s.toggleExpanded);
  const renameNode = useCourseOutlineStore((s) => s.renameNode);
  const setRenamingNodeId = useCourseOutlineStore((s) => s.setRenamingNodeId);

  return (
    <>
      {nodes.map((node) => {
        const Icon = nodeIcon(node.kind);
        const children = node.children ?? [];
        const hasChildren = children.length > 0;
        const expanded = expandedNodeIds[node.id] ?? node.kind !== "subtopic";
        const selected = activeNodeId === node.id;
        const renaming = renamingNodeId === node.id;
        const showDirtyDot = selected && pageDirty && node.pageId != null;

        return (
          <li key={node.id}>
            <div
              className={`group flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5 transition ${
                selected
                  ? "bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--accent-amber)_40%,transparent)]"
                  : "hover:bg-[var(--surface-hover)]"
              }`}
              style={{ paddingLeft: `${4 + depth * 10}px` }}
              onContextMenu={(event) => onContextMenu(event, node)}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={expanded ? "Collapse" : "Expand"}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                >
                  {expanded ? (
                    <ChevronDown className="size-3" aria-hidden />
                  ) : (
                    <ChevronRight className="size-3" aria-hidden />
                  )}
                </button>
              ) : (
                <span className="inline-block w-4 shrink-0" aria-hidden />
              )}
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                onClick={() => selectNode(node.id)}
                onDoubleClick={(event) => {
                  if (node.kind === "book") {
                    return;
                  }
                  event.preventDefault();
                  setRenamingNodeId(node.id);
                }}
              >
                <Icon
                  className={`size-3 shrink-0 ${
                    selected ? "text-[var(--accent-amber)]" : "text-[var(--text-muted)]"
                  }`}
                  aria-hidden
                />
                {renaming ? (
                  <OutlineRenameInput
                    value={node.title}
                    onCommit={(title) => renameNode(node.id, title)}
                    onCancel={() => setRenamingNodeId(null)}
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate text-[11px] ${
                      selected ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {node.title}
                  </span>
                )}
                {showDirtyDot ? (
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-amber-400"
                    aria-label="Unsaved page edits"
                  />
                ) : null}
              </button>
            </div>
            {hasChildren && expanded ? (
              <ul className="mt-0.5 space-y-0.5">
                <OutlineTreeRows nodes={children} depth={depth + 1} onContextMenu={onContextMenu} />
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

export function CourseOutlinePane() {
  const course = useCourseOutlineStore((s) => s.course);
  const courseDirty = useCourseOutlineStore((s) => s.dirty);
  const activeNodeId = useCourseOutlineStore((s) => s.activeNodeId);
  const breadcrumb = useMemo(
    () => courseBreadcrumbForNode(course?.root, activeNodeId),
    [activeNodeId, course?.root],
  );
  const [menuAnchor, setMenuAnchor] = useState<CourseOutlineMenuAnchor | null>(null);
  const addChildNode = useCourseOutlineStore((s) => s.addChildNode);
  const deleteNode = useCourseOutlineStore((s) => s.deleteNode);
  const duplicateNode = useCourseOutlineStore((s) => s.duplicateNode);
  const setRenamingNodeId = useCourseOutlineStore((s) => s.setRenamingNodeId);

  const breadcrumbLabel = useMemo(() => {
    if (breadcrumb.length <= 1) {
      return course?.title ?? "";
    }
    return breadcrumb
      .slice(1)
      .map((entry) => entry.title)
      .join(" › ");
  }, [breadcrumb, course?.title]);

  const openContextMenu = useCallback((event: MouseEvent, node: CourseNodeV1) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor({ x: event.clientX, y: event.clientY, node });
  }, []);

  const runAdd = useCallback(
    async (parentId: string, kind: CourseNodeKindV1) => {
      const result = await addChildNode(parentId, kind);
      if (!result.ok) {
        toast.error(result.error);
      }
    },
    [addChildNode],
  );

  const menuNode = menuAnchor?.node ?? null;
  const menuParentId = menuNode?.id ?? course?.root.id ?? null;
  const subtopicAddParent = useMemo(() => {
    if (menuNode == null || course == null) {
      return null;
    }
    if (menuNode.kind === "chapter" || menuNode.kind === "topic") {
      return menuNode;
    }
    if (menuNode.kind === "subtopic") {
      const parent = findCourseNode(course.root, menuNode.id)?.parent ?? null;
      if (parent?.kind === "chapter" || parent?.kind === "topic") {
        return parent;
      }
    }
    return null;
  }, [course, menuNode]);

  if (course == null) {
    return (
      <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">No course manifest loaded.</p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[var(--surface-border)] px-3 py-2">
        <div className="text-[11px] font-semibold text-[var(--text-primary)]">
          {course.title}
          {courseDirty ? " · Unsaved outline" : ""}
        </div>
        {breadcrumbLabel.length > 0 ? (
          <TRNHintText className="mt-0.5 truncate text-[10px]">{breadcrumbLabel}</TRNHintText>
        ) : null}
      </div>
      <div
        className="course-workbench-pane-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 py-2"
        onContextMenu={(event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.closest("[data-outline-node]") == null) {
            event.preventDefault();
            setMenuAnchor({ x: event.clientX, y: event.clientY, node: course.root });
          }
        }}
      >
        <ul className="space-y-0.5" role="tree" aria-label="Course outline">
          <OutlineTreeRows nodes={[course.root]} depth={0} onContextMenu={openContextMenu} />
        </ul>
      </div>
      {menuAnchor != null && menuParentId != null ? (
        <CourseOutlineContextMenu
          anchor={menuAnchor}
          subtopicAddParent={subtopicAddParent}
          onClose={() => setMenuAnchor(null)}
          onAddChapter={() => void runAdd(menuParentId, "chapter")}
          onAddTopic={() => void runAdd(menuParentId, "topic")}
          onAddSubtopic={() => {
            if (subtopicAddParent != null) {
              void runAdd(subtopicAddParent.id, "subtopic");
            }
          }}
          onRename={() => {
            if (menuNode != null && menuNode.kind !== "book") {
              setRenamingNodeId(menuNode.id);
            }
          }}
          onDuplicate={() => {
            if (menuNode != null && menuNode.kind !== "book") {
              void duplicateNode(menuNode.id).then((result) => {
                if (!result.ok) {
                  toast.error(result.error);
                }
              });
            }
          }}
          onDelete={() => {
            if (menuNode != null && menuNode.kind !== "book") {
              deleteNode(menuNode.id);
            }
          }}
        />
      ) : null}
    </div>
  );
}
