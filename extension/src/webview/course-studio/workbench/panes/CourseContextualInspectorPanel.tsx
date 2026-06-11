import {
  Box,
  CodeXml,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  PenLine,
  SlidersHorizontal,
  SquareStack,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TRNInspectorContextBar } from "../../../ui/TRN";
import { CourseMaintainerInspectorPanel } from "../../maintainer/CourseMaintainerInspectorPanel";
import { CourseBlockInspector } from "../../maintainer/CourseBlockInspector";
import { CourseBlockPropertiesPane } from "../../maintainer/CourseBlockPropertiesPane";
import { resolveCourseWorkbenchEditorTypeForBlock } from "../../maintainer/coursePageEditorFocus";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { useCourseWorkbenchFocusStore } from "../course-workbench-focus.store";
import { CourseDiagramInspectorPanel } from "./CourseDiagramInspectorPanel";
import { CourseScene3dInspectorPanel } from "./CourseScene3dInspectorPanel";
import { CourseWidgetBoardInspectorPanel } from "../../maintainer/widget-board/CourseWidgetBoardInspectorPanel";
import { COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS } from "../courseWorkbenchPaneBody";

function CourseInspectorShell(props: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconShellClass?: string;
  children: ReactNode;
}) {
  const { title, subtitle, icon, iconShellClass, children } = props;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TRNInspectorContextBar
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconShellClass={iconShellClass}
      />
      <div className={`min-h-0 flex-1 overflow-hidden ${COURSE_WORKBENCH_PANE_SCROLL_PAD_CLASS}`}>
        {children}
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

  const pageSubtitle =
    page != null
      ? `${page.blocks.length} block${page.blocks.length === 1 ? "" : "s"}${page.title.length > 0 ? ` · ${page.title}` : ""}`
      : "No page loaded";

  switch (contextEditorType) {
    case "diagram":
      return (
        <CourseInspectorShell
          icon={PenLine}
          title="Diagram"
          subtitle={
            selectedBlock?.kind === "diagram-2d"
              ? selectedBlock.diagramId
              : "Select a diagram block on the page"
          }
          iconShellClass="border-cyan-500/30 bg-cyan-950/25 text-cyan-300/95"
        >
          <CourseDiagramInspectorPanel />
        </CourseInspectorShell>
      );
    case "markdown":
      return (
        <CourseInspectorShell
          icon={FileText}
          title="Markdown"
          subtitle={selectedBlock?.title ?? selectedBlock?.kind ?? "Select a markdown block"}
          iconShellClass="border-amber-500/30 bg-amber-950/25 text-amber-300/95"
        >
          <CourseBlockInspector variant="block" />
        </CourseInspectorShell>
      );
    case "html-page":
      return (
        <CourseInspectorShell
          icon={CodeXml}
          title="HTML page"
          subtitle={selectedBlock?.title ?? selectedBlock?.kind ?? "Select an HTML page block"}
          iconShellClass="border-emerald-500/30 bg-emerald-950/25 text-emerald-300/95"
        >
          <CourseBlockInspector variant="block" />
        </CourseInspectorShell>
      );
    case "scene-3d":
      return (
        <CourseInspectorShell
          icon={Box}
          title="3D Scene"
          subtitle={
            selectedBlock?.kind === "scene-3d"
              ? selectedBlock.documentId
              : "Select a 3D Scene block on the page"
          }
          iconShellClass="border-violet-500/30 bg-violet-950/25 text-violet-300/95"
        >
          <CourseScene3dInspectorPanel />
        </CourseInspectorShell>
      );
    case "widget-board": {
      const widgetBoardBlock =
        selectedBlock?.kind === "widget-board" ? selectedBlock : null;
      return (
        <CourseInspectorShell
          icon={LayoutDashboard}
          title="Widget board"
          subtitle={
            widgetBoardBlock != null
              ? `${widgetBoardBlock.widgets.length} widget${widgetBoardBlock.widgets.length === 1 ? "" : "s"}`
              : "Select a widget board block"
          }
          iconShellClass="border-cyan-500/30 bg-cyan-950/25 text-cyan-300/95"
        >
          {widgetBoardBlock != null ? (
            <CourseWidgetBoardInspectorPanel
              block={widgetBoardBlock}
              staleMs={page?.meta?.staleMs}
            />
          ) : (
            <p className="text-[10px] leading-snug text-[var(--text-muted)]">
              Select a widget board block on the page to edit its theme and widgets.
            </p>
          )}
        </CourseInspectorShell>
      );
    }
    case "content":
      if (genericBlockSelected && selectedBlock != null) {
        return (
          <CourseInspectorShell
            icon={SquareStack}
            title="Block"
            subtitle={selectedBlock.title ?? selectedBlock.kind}
            iconShellClass="border-amber-500/30 bg-amber-950/25 text-amber-300/95"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CourseBlockPropertiesPane block={selectedBlock} />
            </div>
          </CourseInspectorShell>
        );
      }
      return (
        <CourseInspectorShell icon={LayoutGrid} title="Page" subtitle={pageSubtitle}>
          <CourseMaintainerInspectorPanel embeddedInContextualShell />
        </CourseInspectorShell>
      );
    default:
      if (genericBlockSelected && selectedBlock != null) {
        return (
          <CourseInspectorShell
            icon={SquareStack}
            title="Block"
            subtitle={selectedBlock.title ?? selectedBlock.kind}
            iconShellClass="border-amber-500/30 bg-amber-950/25 text-amber-300/95"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CourseBlockPropertiesPane block={selectedBlock} />
            </div>
          </CourseInspectorShell>
        );
      }
      return (
        <CourseInspectorShell icon={SlidersHorizontal} title="Inspector" subtitle={pageSubtitle}>
          <CourseMaintainerInspectorPanel embeddedInContextualShell />
        </CourseInspectorShell>
      );
  }
}
