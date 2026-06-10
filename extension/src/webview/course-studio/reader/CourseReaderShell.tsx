import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen, PanelLeft } from "lucide-react";
import type { CourseNodeV1 } from "../schemas/course.v1";
import { useCourseOutlineStore } from "../maintainer/useCourseOutlineStore";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { CoursePageRenderer } from "../runtime/CoursePageRenderer";

const READER_NAV_WIDTH_KEY = "course-studio:reader-nav-width.v1";
const DEFAULT_NAV_WIDTH = 280;
const MIN_NAV_WIDTH = 200;
const MAX_NAV_WIDTH = 480;

function readStoredNavWidth(): number {
  if (typeof localStorage === "undefined") {
    return DEFAULT_NAV_WIDTH;
  }
  try {
    const raw = localStorage.getItem(READER_NAV_WIDTH_KEY);
    const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(MAX_NAV_WIDTH, Math.max(MIN_NAV_WIDTH, parsed));
    }
  } catch {
    // ignore
  }
  return DEFAULT_NAV_WIDTH;
}

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

function ReaderTocRows({
  nodes,
  depth,
  activeNodeId,
  expandedNodeIds,
  onSelect,
  onToggle,
}: {
  nodes: CourseNodeV1[];
  depth: number;
  activeNodeId: string | null;
  expandedNodeIds: Record<string, boolean>;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const Icon = nodeIcon(node.kind);
        const children = node.children ?? [];
        const hasChildren = children.length > 0;
        const expanded = expandedNodeIds[node.id] ?? true;
        const selected = activeNodeId === node.id;
        const navigable = node.pageId != null;

        return (
          <li key={node.id}>
            <div
              className="flex min-w-0 items-center gap-1"
              style={{ paddingLeft: `${8 + depth * 12}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={expanded ? "Collapse section" : "Expand section"}
                  onClick={() => onToggle(node.id)}
                >
                  {expanded ? (
                    <ChevronDown className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronRight className="size-3.5" aria-hidden />
                  )}
                </button>
              ) : (
                <span className="inline-block w-5 shrink-0" aria-hidden />
              )}
              <button
                type="button"
                disabled={!navigable && !hasChildren}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 pr-2 text-left text-[12px] transition ${
                  selected && navigable
                    ? "bg-[color-mix(in_srgb,var(--accent-amber)_14%,transparent)] font-medium text-[var(--text-primary)]"
                    : navigable
                      ? "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                }`}
                onClick={() => {
                  if (navigable) {
                    onSelect(node.id);
                  } else if (hasChildren) {
                    onToggle(node.id);
                  }
                }}
              >
                <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="min-w-0 truncate">{node.title}</span>
              </button>
            </div>
            {hasChildren && expanded ? (
              <ul className="mt-0.5">
                <ReaderTocRows
                  nodes={children}
                  depth={depth + 1}
                  activeNodeId={activeNodeId}
                  expandedNodeIds={expandedNodeIds}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

export function CourseReaderShell() {
  const course = useCourseOutlineStore((s) => s.course);
  const activeNodeId = useCourseOutlineStore((s) => s.activeNodeId);
  const expandedNodeIds = useCourseOutlineStore((s) => s.expandedNodeIds);
  const selectNode = useCourseOutlineStore((s) => s.selectNode);
  const toggleExpanded = useCourseOutlineStore((s) => s.toggleExpanded);
  const page = useCoursePageEditorStore((s) => s.page);

  const [navOpen, setNavOpen] = useState(true);
  const [navWidth, setNavWidth] = useState(readStoredNavWidth);
  const resizingRef = useRef(false);

  const onResizePointerDown = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingRef.current = true;
    const startX = event.clientX;
    const startWidth = navWidth;

    const onMove = (moveEvent: MouseEvent | globalThis.MouseEvent) => {
      if (!resizingRef.current) {
        return;
      }
      const next = Math.min(MAX_NAV_WIDTH, Math.max(MIN_NAV_WIDTH, startWidth + moveEvent.clientX - startX));
      setNavWidth(next);
    };

    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setNavWidth((current) => {
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(READER_NAV_WIDTH_KEY, String(current));
          } catch {
            // ignore
          }
        }
        return current;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [navWidth]);

  useEffect(() => {
    if (course == null) {
      return;
    }
    if (activeNodeId == null) {
      selectNode(course.root.id);
    }
  }, [activeNodeId, course, selectNode]);

  if (course == null || page == null) {
    return null;
  }

  return (
    <div className="course-reader-shell flex min-h-0 min-w-0 flex-1 overflow-hidden">
      {navOpen ? (
        <aside
          className="course-reader-nav relative flex shrink-0 flex-col border-r border-[var(--surface-border)] bg-[var(--surface-panel)]"
          style={{ width: navWidth }}
        >
          <div className="shrink-0 border-b border-[var(--surface-border)] px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Contents
            </div>
            <div className="mt-1 text-[13px] font-medium text-[var(--text-primary)]">{course.title}</div>
          </div>
          <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Table of contents">
            <ul role="tree">
              <ReaderTocRows
                nodes={[course.root]}
                depth={0}
                activeNodeId={activeNodeId}
                expandedNodeIds={expandedNodeIds}
                onSelect={selectNode}
                onToggle={toggleExpanded}
              />
            </ul>
          </nav>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize table of contents"
            className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize"
            onMouseDown={onResizePointerDown}
          />
        </aside>
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--surface-border)] px-3 py-1.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            onClick={() => setNavOpen((open) => !open)}
          >
            <PanelLeft className="size-3.5" aria-hidden />
            {navOpen ? "Hide contents" : "Show contents"}
          </button>
        </div>
        <main className="course-reader-main scrollbar-hide min-h-0 flex-1 overflow-y-auto py-8">
          <div className="course-reader-main__inner mx-auto w-full max-w-6xl px-6">
            <CoursePageRenderer page={page} />
          </div>
        </main>
      </div>
    </div>
  );
}
