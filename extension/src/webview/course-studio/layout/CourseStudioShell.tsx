import { useCallback, useMemo, useState } from "react";
import { Moon, Sun, GraduationCap, Save, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import type { WorkbenchLayoutMenuProps } from "../../ui/workbench";
import { WorkbenchLayoutMenu } from "../../ui/workbench";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { PresentationThemeProvider } from "../../presentation/design/PresentationThemeProvider";
import { usePresentationThemeStore } from "../../presentation/store/usePresentationThemeStore";
import { CourseDocumentStatusBadge } from "../runtime/CourseDocumentStatusBadge";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../maintainer/courseStudioMaintainerMode";
import {
  getCoursePageSourcePath,
  isRuntimeCoursePage,
  loadCoursePage,
  registerRuntimeCoursePage,
} from "../content/pageRegistry";
import { saveCoursePageDev } from "../maintainer/saveCoursePageDev";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { useCourseMaintainerKeyboardShortcuts } from "../maintainer/useCourseMaintainerKeyboardShortcuts";
import { CourseWorkbenchLayout } from "../workbench/CourseWorkbenchLayout";
import { CourseReaderShell } from "../reader/CourseReaderShell";
import { useCourseOutlineStore } from "../maintainer/useCourseOutlineStore";
import { courseBreadcrumbForNode, collectCoursePageIds } from "../runtime/course/courseOutlineTree";
import { saveCourseDev } from "../maintainer/saveCourseDev";
import { CourseMotionController } from "../motion/CourseMotionController";
import { Bmi270FrameRefSync } from "../../presentation/app/Bmi270FrameRefSync";
import { CourseStudioModePill } from "./CourseStudioModePill";
import {
  COURSE_STUDIO_TOPBAR_ACTION_CLASS,
  COURSE_STUDIO_TOPBAR_BRAND_ICON_CLASS,
  COURSE_STUDIO_TOPBAR_BRAND_ICON_PX,
  COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS,
  COURSE_STUDIO_TOPBAR_ICON_BTN_CLASS,
  COURSE_STUDIO_TOPBAR_LAYOUT_MENU_CLASS,
  COURSE_STUDIO_TOPBAR_SUBTITLE_CLASS,
  COURSE_STUDIO_TOPBAR_TITLE_CLASS,
  COURSE_STUDIO_TOPBAR_TITLE_STACK_CLASS,
} from "./course-studio-topbar-ui";
import "../course-studio.css";

export function CourseStudioShell() {
  const theme = usePresentationThemeStore((s) => s.theme);
  const toggleTheme = usePresentationThemeStore((s) => s.toggle);

  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const maintainerEnabled = useCourseStudioMaintainerModeEnabled();
  useCourseMaintainerKeyboardShortcuts(maintainerEnabled);

  const page = useCoursePageEditorStore((s) => s.page);
  const dirty = useCoursePageEditorStore((s) => s.dirty);
  const sourcePath = useCoursePageEditorStore((s) => s.sourcePath);
  const discardChanges = useCoursePageEditorStore((s) => s.discardChanges);
  const markClean = useCoursePageEditorStore((s) => s.markClean);
  const courseTitle = useCourseOutlineStore((s) => s.course?.title);
  const courseDirty = useCourseOutlineStore((s) => s.dirty);
  const courseSourcePath = useCourseOutlineStore((s) => s.sourcePath);
  const courseDocument = useCourseOutlineStore((s) => s.course);
  const courseRoot = useCourseOutlineStore((s) => s.course?.root);
  const activeOutlineNodeId = useCourseOutlineStore((s) => s.activeNodeId);
  const discardCourseChanges = useCourseOutlineStore((s) => s.discardChanges);
  const markCourseClean = useCourseOutlineStore((s) => s.markClean);
  const breadcrumb = useMemo(
    () => courseBreadcrumbForNode(courseRoot, activeOutlineNodeId),
    [activeOutlineNodeId, courseRoot],
  );

  const [saving, setSaving] = useState(false);
  const [layoutMenuProps, setLayoutMenuProps] = useState<WorkbenchLayoutMenuProps | null>(null);

  const handleSave = useCallback(async () => {
    if (!dirty && !courseDirty) {
      return;
    }
    setSaving(true);
    try {
      const savedPageIds = new Set<string>();

      if (dirty && page != null) {
        const pageResult = await saveCoursePageDev(sourcePath, page);
        if (!pageResult.ok) {
          toast.error(pageResult.error);
          return;
        }
        registerRuntimeCoursePage(page.id, page, sourcePath);
        markClean(page);
        savedPageIds.add(page.id);
      }

      if (courseDirty && courseDocument != null) {
        for (const pageId of collectCoursePageIds(courseDocument.root)) {
          if (savedPageIds.has(pageId) || !isRuntimeCoursePage(pageId)) {
            continue;
          }
          const runtimePage = loadCoursePage(pageId);
          const runtimePath = getCoursePageSourcePath(pageId);
          if (runtimePage == null || runtimePath == null) {
            continue;
          }
          const pageResult = await saveCoursePageDev(runtimePath, runtimePage);
          if (!pageResult.ok) {
            toast.error(pageResult.error);
            return;
          }
          registerRuntimeCoursePage(pageId, runtimePage, runtimePath);
          savedPageIds.add(pageId);
          if (page?.id === pageId) {
            markClean(runtimePage);
          }
        }

        const courseResult = await saveCourseDev(courseSourcePath, courseDocument);
        if (!courseResult.ok) {
          toast.error(courseResult.error);
          return;
        }
        markCourseClean(courseDocument);
      }
      toast.success("Saved to repo");
    } finally {
      setSaving(false);
    }
  }, [
    courseDirty,
    courseDocument,
    courseSourcePath,
    dirty,
    markClean,
    markCourseClean,
    page,
    sourcePath,
  ]);

  const handleDiscard = useCallback(() => {
    discardChanges();
    discardCourseChanges();
  }, [discardChanges, discardCourseChanges]);

  const subtitle = useMemo(() => {
    const crumbs =
      breadcrumb.length > 1
        ? breadcrumb
            .slice(1)
            .map((entry) => entry.title)
            .join(" › ")
        : (courseTitle ?? page?.title ?? "");
    const unsaved = dirty || courseDirty ? " · Unsaved" : "";
    return `${crumbs}${unsaved}`;
  }, [breadcrumb, courseDirty, courseTitle, dirty, page?.title]);

  if (page == null) {
    return null;
  }

  return (
    <PresentationThemeProvider
      rootClassName={`presentation-root course-studio-root${
        maintainerEnabled ? "" : " course-studio-root--read-mode"
      }`}
    >
      <Bmi270FrameRefSync />
      <CourseMotionController>
        <header className="course-studio-topbar relative flex h-11 shrink-0 items-center border-b px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GraduationCap
              className={COURSE_STUDIO_TOPBAR_BRAND_ICON_CLASS}
              size={COURSE_STUDIO_TOPBAR_BRAND_ICON_PX}
              strokeWidth={1.75}
              aria-hidden
            />
            <div className={COURSE_STUDIO_TOPBAR_TITLE_STACK_CLASS}>
              <div className={COURSE_STUDIO_TOPBAR_TITLE_CLASS}>Course Studio</div>
              <div className={COURSE_STUDIO_TOPBAR_SUBTITLE_CLASS}>{subtitle}</div>
            </div>
          </div>
          {maintainerAvailable ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <CourseStudioModePill />
            </div>
          ) : null}
          <div className="course-studio-topbar-actions flex flex-1 items-center justify-end">
            {maintainerEnabled && (dirty || courseDirty) ? (
              <>
                <TRNTooltip
                  content="Discard unsaved edits"
                  openDelayMs={TRN_HINT_HOVER_DELAY_MS}
                  disableHoverFx
                  triggerWrapper="span"
                  triggerClassName="inline-flex"
                  trigger={
                    <button
                      type="button"
                      className={`${COURSE_STUDIO_TOPBAR_ACTION_CLASS} gap-1 hover:bg-[var(--surface-hover)]`}
                      onClick={handleDiscard}
                    >
                      <Undo2 className={COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS} strokeWidth={2} aria-hidden />
                      Discard
                    </button>
                  }
                />
                <TRNTooltip
                  content="Save page and course outline to repo (dev only)"
                  openDelayMs={TRN_HINT_HOVER_DELAY_MS}
                  disableHoverFx
                  triggerWrapper="span"
                  triggerClassName="inline-flex"
                  trigger={
                    <button
                      type="button"
                      disabled={saving}
                      className={`${COURSE_STUDIO_TOPBAR_ACTION_CLASS} gap-1 border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 disabled:opacity-60`}
                      onClick={() => void handleSave()}
                    >
                      <Save className={COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS} strokeWidth={2} aria-hidden />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  }
                />
              </>
            ) : null}
            {layoutMenuProps != null && maintainerEnabled ? (
              <WorkbenchLayoutMenu
                {...layoutMenuProps}
                menuTriggerClassName={COURSE_STUDIO_TOPBAR_LAYOUT_MENU_CLASS}
              />
            ) : null}
            <CourseDocumentStatusBadge meta={page.meta} />
            <TRNTooltip
              content={theme === "dark" ? "Light theme" : "Dark theme"}
              openDelayMs={TRN_HINT_HOVER_DELAY_MS}
              disableHoverFx
              triggerWrapper="span"
              triggerClassName="inline-flex"
              trigger={
                <button
                  type="button"
                  aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  className={`${COURSE_STUDIO_TOPBAR_ICON_BTN_CLASS} text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]`}
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className={COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS} strokeWidth={2} aria-hidden />
                  ) : (
                    <Moon className={COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS} strokeWidth={2} aria-hidden />
                  )}
                </button>
              }
            />
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {maintainerEnabled ? (
            <CourseWorkbenchLayout onLayoutMenuPropsChange={setLayoutMenuProps} />
          ) : (
            <CourseReaderShell />
          )}
        </div>
      </CourseMotionController>
    </PresentationThemeProvider>
  );
}
