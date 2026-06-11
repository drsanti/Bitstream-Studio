import {
  isCourseWorkbenchSidePanelType,
  type CourseWorkbenchEditorType,
  useCourseWorkbenchFocusStore,
} from "../workbench/course-workbench-focus.store";
import { useCourseWidgetBoardEditorStore } from "./widget-board/useCourseWidgetBoardEditorStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

const COURSE_MAINTAINER_PANE_SELECTORS: Readonly<
  Partial<Record<CourseWorkbenchEditorType, string>>
> = {
  content: ".course-workbench-content-pane",
  diagram: ".course-workbench-diagram-pane",
  markdown: ".course-workbench-markdown-pane",
  "html-page": ".course-workbench-html-pane",
  "scene-3d": ".course-workbench-scene-pane",
  "widget-board": ".course-workbench-widget-board-pane",
  inspector: ".course-workbench-inspector-pane",
};

/** Editors that own their own Delete / Backspace behavior — never remove page blocks here. */
const COURSE_MAINTAINER_OWN_DELETE_EDITORS = new Set<CourseWorkbenchEditorType>([
  "diagram",
  "scene-3d",
  "markdown",
  "html-page",
  "widget-board",
]);

export type CourseMaintainerDeleteScope = "widget-board-widget" | "page-block" | null;

/** Prefer the focused workbench pane; fall back to last non-inspector context. */
export function resolveEffectiveCourseMaintainerEditorType(): CourseWorkbenchEditorType {
  const { activeEditorType, contextEditorType } = useCourseWorkbenchFocusStore.getState();
  if (activeEditorType != null && !isCourseWorkbenchSidePanelType(activeEditorType)) {
    return activeEditorType;
  }
  return contextEditorType;
}

export function resolveCourseMaintainerPaneFromTarget(
  target: EventTarget | null,
): CourseWorkbenchEditorType | null {
  const el = target as HTMLElement | null;
  if (el == null) {
    return null;
  }
  for (const [editorType, selector] of Object.entries(COURSE_MAINTAINER_PANE_SELECTORS)) {
    if (el.closest(selector)) {
      return editorType as CourseWorkbenchEditorType;
    }
  }
  if (el.closest("[data-course-widget-editor-id]")) {
    return "widget-board";
  }
  return null;
}

export function isWidgetBoardEditorTarget(target: EventTarget | null): boolean {
  return resolveCourseMaintainerPaneFromTarget(target) === "widget-board";
}

export function isContentComposerTarget(target: EventTarget | null): boolean {
  return resolveCourseMaintainerPaneFromTarget(target) === "content";
}

function selectedWidgetBoardBlock() {
  const { selectedBlockId, page } = useCoursePageEditorStore.getState();
  if (selectedBlockId == null || page == null) {
    return null;
  }
  const block = page.blocks.find((entry) => entry.id === selectedBlockId);
  return block?.kind === "widget-board" ? block : null;
}

/** Decide which maintainer Delete handler should run for the current focus + DOM target. */
export function resolveCourseMaintainerDeleteScope(
  target: EventTarget | null,
): CourseMaintainerDeleteScope {
  const targetPane = resolveCourseMaintainerPaneFromTarget(target);
  const effectiveEditor = targetPane ?? resolveEffectiveCourseMaintainerEditorType();

  if (COURSE_MAINTAINER_OWN_DELETE_EDITORS.has(effectiveEditor)) {
    if (effectiveEditor === "widget-board" || isWidgetBoardEditorTarget(target)) {
      const { selectedWidgetIds } = useCourseWidgetBoardEditorStore.getState();
      if (selectedWidgetIds.length > 0 && selectedWidgetBoardBlock() != null) {
        return "widget-board-widget";
      }
      return null;
    }
    return null;
  }

  if (effectiveEditor !== "content") {
    return null;
  }

  return "page-block";
}

export function shouldRouteDeleteToWidgetBoardWidget(target: EventTarget | null): boolean {
  return resolveCourseMaintainerDeleteScope(target) === "widget-board-widget";
}

export function shouldRouteDeleteToPageBlock(target: EventTarget | null): boolean {
  return resolveCourseMaintainerDeleteScope(target) === "page-block";
}
