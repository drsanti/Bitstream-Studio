import { Box, CodeXml, FileText, LayoutGrid, PenLine, SlidersHorizontal, SquareStack } from "lucide-react";
import { CourseMaintainerInspectorPanel } from "../../maintainer/CourseMaintainerInspectorPanel";
import { CourseBlockInspector } from "../../maintainer/CourseBlockInspector";
import { CourseBlockPropertiesPane } from "../../maintainer/CourseBlockPropertiesPane";
import { resolveCourseWorkbenchEditorTypeForBlock } from "../../maintainer/coursePageEditorFocus";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../course-workbench-focus.store";
import { CourseDiagramInspectorPanel } from "./CourseDiagramInspectorPanel";
import { CourseScene3dInspectorPanel } from "./CourseScene3dInspectorPanel";
import { COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS } from "../courseWorkbenchPaneBody";

function InspectorContextHeader({
  icon: Icon,
  title,
  subtitle,
  accentClassName,
}: {
  icon: typeof SlidersHorizontal;
  title: string;
  subtitle?: string;
  accentClassName?: string;
}) {
  return (
    <div className="course-inspector-context-header flex shrink-0 border-b border-[var(--surface-border)] px-2.5 py-1.5">
      <span
        className={`course-inspector-context-header__icon ${accentClassName ?? "text-zinc-400"}`}
        aria-hidden
      >
        <Icon strokeWidth={2} />
      </span>
      <div className="course-inspector-context-header__text min-w-0">
        <div className="text-[11px] font-semibold leading-tight text-[var(--text-primary)]">{title}</div>
        {subtitle != null ? (
          <div className="truncate text-[10px] leading-snug text-[var(--text-muted)]">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

export function CourseContextualInspectorPanel() {
  const contextEditorType = useCourseWorkbenchFocusStore((s) => s.contextEditorType);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlock =
    page?.blocks.find((entry) => entry.id === selectedBlockId) ?? null;
  const genericBlockSelected =
    selectedBlock != null && resolveCourseWorkbenchEditorTypeForBlock(selectedBlock) == null;

  switch (contextEditorType) {
    case "diagram":
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader
            icon={PenLine}
            title="Diagram inspector"
            subtitle="Selected shape, bindings, block settings"
            accentClassName="text-cyan-400/90"
          />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseDiagramInspectorPanel />
          </div>
        </div>
      );
    case "markdown":
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader
            icon={FileText}
            title="Markdown inspector"
            subtitle="Block fields and placement"
            accentClassName="text-amber-400/90"
          />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseBlockInspector variant="block" />
          </div>
        </div>
      );
    case "html-page":
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader
            icon={CodeXml}
            title="HTML page inspector"
            subtitle="Source, caption, and placement"
            accentClassName="text-emerald-400/90"
          />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseBlockInspector variant="block" />
          </div>
        </div>
      );
    case "scene-3d":
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader
            icon={Box}
            title="3D Scene inspector"
            subtitle="Models, transforms, block settings"
            accentClassName="text-violet-400/90"
          />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseScene3dInspectorPanel />
          </div>
        </div>
      );
    case "content":
      if (genericBlockSelected && selectedBlock != null) {
        return (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <InspectorContextHeader
              icon={SquareStack}
              title="Block inspector"
              subtitle="Placement and content fields"
              accentClassName="text-amber-400/90"
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CourseBlockPropertiesPane block={selectedBlock} />
            </div>
          </div>
        );
      }
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader
            icon={LayoutGrid}
            title="Page inspector"
            subtitle="Grid guides, blocks, document settings"
          />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseMaintainerInspectorPanel embeddedInContextualShell />
          </div>
        </div>
      );
    default:
      if (genericBlockSelected && selectedBlock != null) {
        return (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <InspectorContextHeader
              icon={SquareStack}
              title="Block inspector"
              subtitle="Placement and content fields"
              accentClassName="text-amber-400/90"
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CourseBlockPropertiesPane block={selectedBlock} />
            </div>
          </div>
        );
      }
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <InspectorContextHeader icon={SlidersHorizontal} title="Inspector" />
          <div className={COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}>
            <CourseMaintainerInspectorPanel embeddedInContextualShell />
          </div>
        </div>
      );
  }
}
