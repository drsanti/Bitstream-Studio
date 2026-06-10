import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  StandaloneWorkbench,
  type StandaloneWorkbenchHandle,
  type WorkbenchLayoutMenuProps,
} from "../../ui/workbench";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../maintainer/courseStudioMaintainerMode";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { COURSE_STUDIO_WORKBENCH_REGISTRY } from "./course-workbench-registry";
import {
  CourseWorkbenchShellProvider,
  type CourseWorkbenchShellContextValue,
} from "./course-workbench-context";
import {
  COURSE_VIEW_WORKBENCH_LAYOUT,
  DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
} from "./default-course-workbench-layout";
import { COURSE_WORKBENCH_PRESETS, getCourseWorkbenchPreset } from "./course-workbench-presets";
import { useCourseWorkbenchFocusStore, type CourseWorkbenchEditorType } from "./course-workbench-focus.store";
import { useCourseWorkbenchAutoFocus } from "./useCourseWorkbenchAutoFocus";
import {
  isViewOnlyCourseWorkbenchLayout,
  loadAuthorWorkbenchLayoutBackup,
  saveAuthorWorkbenchLayoutBackup,
  type AuthorWorkbenchLayoutBackup,
} from "./course-workbench-read-mode";
import {
  courseWorkbenchLayoutForMaintainerMode,
  validateCourseWorkbenchLayout,
} from "./validate-course-workbench-layout";

const COURSE_PANE_COMMANDS = [
  { editorType: "outline", label: "Open Course outline", keywords: "outline course book chapter topic" },
  { editorType: "content", label: "Open Content", keywords: "content page canvas grid" },
  {
    editorType: "inspector",
    label: "Open Inspector",
    keywords: "inspector canvas page grid blocks document",
  },
  {
    editorType: "diagram",
    label: "Open Diagram editor",
    keywords: "diagram infographics canvas svg",
  },
  { editorType: "markdown", label: "Open Markdown editor", keywords: "markdown theory text" },
  {
    editorType: "scene-3d",
    label: "Open 3D Scene editor",
    keywords: "3d scene layer orientation",
  },
] as const;

const COURSE_READ_PANE_COMMANDS = [
  { editorType: "content", label: "Open Content", keywords: "content page preview read" },
] as const;

const COURSE_SIDE_PANELS = ["outline", "inspector"] as const;

function authorLayoutSnapshotFromWorkbench(
  wb: StandaloneWorkbenchHandle,
): AuthorWorkbenchLayoutBackup | null {
  const exported = wb.exportLayoutSnapshot();
  if (exported == null) {
    return {
      layout: structuredClone(wb.getLayout()),
    };
  }
  return {
    layout: structuredClone(exported.layout),
    dockMemory: structuredClone(exported.dockMemory ?? {}),
  };
}

function applyAuthorWorkbenchBackup(
  wb: StandaloneWorkbenchHandle,
  backup: AuthorWorkbenchLayoutBackup,
): void {
  wb.applyImportedLayoutSnapshot({
    layout: structuredClone(backup.layout),
    dockMemory: structuredClone(backup.dockMemory ?? {}),
  });
}

export function CourseWorkbenchLayout({
  onLayoutMenuPropsChange,
}: {
  onLayoutMenuPropsChange?: (props: WorkbenchLayoutMenuProps | null) => void;
}) {
  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();
  const maintainerEdit = maintainerAvailable && maintainer;
  const selectBlock = useCoursePageEditorStore((s) => s.selectBlock);
  const setActiveEditorType = useCourseWorkbenchFocusStore((s) => s.setActiveEditorType);
  const prevMaintainerRef = useRef<boolean | null>(null);
  const sessionBackupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialLayout = useMemo(
    () => courseWorkbenchLayoutForMaintainerMode(maintainerEdit),
    [maintainerEdit],
  );

  const focusWorkbenchPane = useCallback((editorType: string) => {
    workbenchRef.current?.focusPane(editorType);
    setActiveEditorType(editorType as CourseWorkbenchEditorType);
  }, [setActiveEditorType]);

  const applyWorkbenchPreset = useCallback((presetId: string) => {
    const preset = getCourseWorkbenchPreset(presetId);
    if (preset == null) {
      return false;
    }
    workbenchRef.current?.applyImportedLayoutSnapshot({
      layout: preset.layout,
      dockMemory: {},
    });
    return true;
  }, []);

  const resetWorkbenchLayout = useCallback(() => {
    workbenchRef.current?.applyImportedLayoutSnapshot({
      layout: maintainerEdit
        ? DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT
        : COURSE_VIEW_WORKBENCH_LAYOUT,
      dockMemory: {},
    });
  }, [maintainerEdit]);

  const queueAuthorLayoutBackup = useCallback((snapshot: AuthorWorkbenchLayoutBackup) => {
    if (sessionBackupTimerRef.current != null) {
      clearTimeout(sessionBackupTimerRef.current);
    }
    sessionBackupTimerRef.current = setTimeout(() => {
      sessionBackupTimerRef.current = null;
      saveAuthorWorkbenchLayoutBackup(snapshot);
    }, 200);
  }, []);

  const handleWorkbenchSessionChange = useCallback(
    (snapshot: AuthorWorkbenchLayoutBackup) => {
      if (!maintainerEdit) {
        return;
      }
      queueAuthorLayoutBackup(snapshot);
    },
    [maintainerEdit, queueAuthorLayoutBackup],
  );

  useCourseWorkbenchAutoFocus(workbenchRef);

  useEffect(() => {
    return () => {
      if (sessionBackupTimerRef.current != null) {
        clearTimeout(sessionBackupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const wb = workbenchRef.current;
    if (wb == null || !maintainerAvailable) {
      return;
    }

    const prev = prevMaintainerRef.current;
    prevMaintainerRef.current = maintainer;

    if (prev === null) {
      if (!maintainer) {
        wb.applyImportedLayoutSnapshot({
          layout: structuredClone(COURSE_VIEW_WORKBENCH_LAYOUT),
          dockMemory: {},
        });
        return;
      }

      const backup = loadAuthorWorkbenchLayoutBackup();
      if (backup != null) {
        applyAuthorWorkbenchBackup(wb, backup);
        return;
      }

      if (isViewOnlyCourseWorkbenchLayout(wb.getLayout())) {
        applyAuthorWorkbenchBackup(wb, {
          layout: structuredClone(DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT),
        });
      }
      return;
    }

    if (maintainer && !prev) {
      const backup = loadAuthorWorkbenchLayoutBackup();
      applyAuthorWorkbenchBackup(wb, {
        layout: structuredClone(
          backup?.layout ?? DEFAULT_COURSE_AUTHOR_WORKBENCH_LAYOUT,
        ),
        dockMemory: structuredClone(backup?.dockMemory ?? {}),
      });
      return;
    }

    if (!maintainer && prev) {
      const snapshot = authorLayoutSnapshotFromWorkbench(wb);
      if (snapshot != null) {
        saveAuthorWorkbenchLayoutBackup(snapshot);
      }
      selectBlock(null);
      setActiveEditorType("content");
      wb.applyImportedLayoutSnapshot({
        layout: structuredClone(COURSE_VIEW_WORKBENCH_LAYOUT),
        dockMemory: {},
      });
    }
  }, [maintainer, maintainerAvailable, selectBlock, setActiveEditorType]);

  useEffect(() => {
    if (!maintainerEdit) {
      onLayoutMenuPropsChange?.(null);
    }
  }, [maintainerEdit, onLayoutMenuPropsChange]);

  const shellValue = useMemo(
    (): CourseWorkbenchShellContextValue => ({
      workbenchRef,
      focusWorkbenchPane,
      applyWorkbenchPreset,
      resetWorkbenchLayout,
    }),
    [applyWorkbenchPreset, focusWorkbenchPane, resetWorkbenchLayout],
  );

  return (
    <CourseWorkbenchShellProvider value={shellValue}>
      <StandaloneWorkbench
        ref={workbenchRef}
        initialLayout={initialLayout}
        registry={COURSE_STUDIO_WORKBENCH_REGISTRY}
        persistenceKey="course-studio"
        persistLayout={maintainerEdit}
        ignorePersistedLayout={!maintainerEdit}
        validateLayout={validateCourseWorkbenchLayout}
        sidePanelEditorTypes={maintainerEdit ? COURSE_SIDE_PANELS : []}
        paneCommands={maintainerEdit ? COURSE_PANE_COMMANDS : COURSE_READ_PANE_COMMANDS}
        layoutPresets={maintainerEdit ? COURSE_WORKBENCH_PRESETS : []}
        enableCommandPalette={maintainerEdit}
        onWorkbenchSessionChange={handleWorkbenchSessionChange}
        onActiveEditorTypeChange={(editorType) =>
          setActiveEditorType(
            editorType as Parameters<typeof setActiveEditorType>[0],
          )
        }
        onLayoutMenuPropsChange={maintainerEdit ? onLayoutMenuPropsChange : undefined}
        className="ternion-workbench course-studio-workbench flex min-h-0 min-w-0 flex-1 flex-col"
      />
    </CourseWorkbenchShellProvider>
  );
}
