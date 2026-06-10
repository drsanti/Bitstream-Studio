import type { CourseV1 } from "../schemas/course.v1";
import { parseCourseV1 } from "../schemas/course.v1";
import type { DiagramV1 } from "../schemas/diagram.v1";
import { parseDiagramV1 } from "../schemas/diagram.v1";
import type { PageV1 } from "../schemas/page.v1";
import { parsePageV1 } from "../schemas/page.v1";
import type { SceneV1 } from "../schemas/scene.v1";
import { parseSceneV1 } from "../schemas/scene.v1";
import { useCourseDiagramEditorStore } from "../maintainer/useCourseDiagramEditorStore";
import { useCoursePageEditorStore } from "../maintainer/useCoursePageEditorStore";
import { useCourseSceneEditorStore } from "../maintainer/useCourseSceneEditorStore";
import { useCoursePackStore } from "./useCoursePackStore";
import type { CourseStudioBootstrapMode } from "./bootstrapCourseStudioBlank";
import { isBmi270ChapterPageId } from "./loadBmi270ChapterPages";
import { BLANK_COURSE_PAGE_ID } from "./loadBlankPage";
import { listCoursePageIds, type RuntimeCoursePageSnapshot } from "./pageRegistry";

export const COURSE_STUDIO_SESSION_DRAFT_STORAGE_KEY = "course-studio:maintainer-session-v1";

export type CourseStudioSessionOutlineDraftV1 = {
  courseId: string;
  sourcePath: string;
  course: CourseV1;
  courseDirty: boolean;
  activeNodeId: string | null;
  expandedNodeIds: Record<string, boolean>;
  runtimePages: Record<string, RuntimeCoursePageSnapshot>;
};

export type CourseStudioSessionDraftV1 = {
  version: 1;
  savedAtMs: number;
  bootstrapMode: CourseStudioBootstrapMode;
  sourcePath: string;
  page: PageV1;
  pageDirty: boolean;
  /** Block selected in the content grid when the draft was saved (maintainer mode). */
  selectedBlockId?: string | null;
  /** Course outline + in-memory pages — survives browser refresh before repo Save. */
  outline?: CourseStudioSessionOutlineDraftV1;
  diagrams: {
    drafts: Record<string, DiagramV1>;
    sourcePaths: Record<string, string>;
    baselines: Record<string, DiagramV1>;
    dirty: Record<string, boolean>;
  };
  scenes: {
    drafts: Record<string, SceneV1>;
    sourcePaths: Record<string, string>;
    baselines: Record<string, SceneV1>;
    dirty: Record<string, boolean>;
  };
};

function cloneDiagramRecord(record: Record<string, DiagramV1>): Record<string, DiagramV1> {
  const out: Record<string, DiagramV1> = {};
  for (const [id, diagram] of Object.entries(record)) {
    out[id] = parseDiagramV1(structuredClone(diagram));
  }
  return out;
}

function cloneSceneRecord(record: Record<string, SceneV1>): Record<string, SceneV1> {
  const out: Record<string, SceneV1> = {};
  for (const [id, scene] of Object.entries(record)) {
    out[id] = parseSceneV1(structuredClone(scene));
  }
  return out;
}

function cloneRuntimePageRecord(
  record: Record<string, RuntimeCoursePageSnapshot>,
): Record<string, RuntimeCoursePageSnapshot> {
  const out: Record<string, RuntimeCoursePageSnapshot> = {};
  for (const [pageId, entry] of Object.entries(record)) {
    out[pageId] = {
      page: parsePageV1(structuredClone(entry.page)),
      sourcePath: entry.sourcePath,
    };
  }
  return out;
}

export function parseOutlineSessionDraft(
  raw: CourseStudioSessionOutlineDraftV1 | undefined,
): CourseStudioSessionOutlineDraftV1 | undefined {
  if (raw?.course == null || raw.sourcePath == null || raw.courseId == null) {
    return undefined;
  }
  return {
    courseId: raw.courseId,
    sourcePath: raw.sourcePath,
    course: parseCourseV1(raw.course),
    courseDirty: raw.courseDirty === true,
    activeNodeId: typeof raw.activeNodeId === "string" ? raw.activeNodeId : null,
    expandedNodeIds: { ...(raw.expandedNodeIds ?? {}) },
    runtimePages: cloneRuntimePageRecord(raw.runtimePages ?? {}),
  };
}

export function buildCourseStudioSessionDraft(
  bootstrapMode: CourseStudioBootstrapMode,
  outlineDraft?: CourseStudioSessionOutlineDraftV1,
): CourseStudioSessionDraftV1 | null {
  const pageState = useCoursePageEditorStore.getState();
  if (pageState.page == null) {
    return null;
  }

  const outline = parseOutlineSessionDraft(outlineDraft);
  const diagramState = useCourseDiagramEditorStore.getState();
  const sceneState = useCourseSceneEditorStore.getState();
  const hasDiagramDrafts = Object.keys(diagramState.drafts).length > 0;
  const hasSceneDrafts = Object.keys(sceneState.drafts).length > 0;
  const hasPageContent = pageState.page.blocks.length > 0;
  const hasUnsavedEdits =
    pageState.dirty ||
    Object.values(diagramState.dirty).some(Boolean) ||
    Object.values(sceneState.dirty).some(Boolean);
  const hasOutlineDraft = outline != null;

  if (
    !hasDiagramDrafts &&
    !hasSceneDrafts &&
    !hasPageContent &&
    !hasUnsavedEdits &&
    !hasOutlineDraft
  ) {
    return null;
  }

  return {
    version: 1,
    savedAtMs: Date.now(),
    bootstrapMode,
    sourcePath: pageState.sourcePath,
    page: parsePageV1(structuredClone(pageState.page)),
    pageDirty: pageState.dirty,
    selectedBlockId: pageState.selectedBlockId,
    outline,
    diagrams: {
      drafts: cloneDiagramRecord(diagramState.drafts),
      sourcePaths: { ...diagramState.sourcePaths },
      baselines: cloneDiagramRecord(diagramState.baselines),
      dirty: { ...diagramState.dirty },
    },
    scenes: {
      drafts: cloneSceneRecord(sceneState.drafts),
      sourcePaths: { ...sceneState.sourcePaths },
      baselines: cloneSceneRecord(sceneState.baselines),
      dirty: { ...sceneState.dirty },
    },
  };
}

export function persistCourseStudioSessionDraft(
  bootstrapMode: CourseStudioBootstrapMode,
  outlineDraft?: CourseStudioSessionOutlineDraftV1,
): boolean {
  if (typeof window === "undefined" || window.localStorage == null) {
    return false;
  }

  const draft = buildCourseStudioSessionDraft(bootstrapMode, outlineDraft);
  if (draft == null) {
    window.localStorage.removeItem(COURSE_STUDIO_SESSION_DRAFT_STORAGE_KEY);
    return false;
  }

  window.localStorage.setItem(
    COURSE_STUDIO_SESSION_DRAFT_STORAGE_KEY,
    JSON.stringify(draft),
  );
  return true;
}

export function clearCourseStudioSessionDraft(): void {
  if (typeof window === "undefined" || window.localStorage == null) {
    return;
  }
  window.localStorage.removeItem(COURSE_STUDIO_SESSION_DRAFT_STORAGE_KEY);
}

export function loadCourseStudioSessionDraft(): CourseStudioSessionDraftV1 | null {
  if (typeof window === "undefined" || window.localStorage == null) {
    return null;
  }

  const raw = window.localStorage.getItem(COURSE_STUDIO_SESSION_DRAFT_STORAGE_KEY);
  if (raw == null || raw.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CourseStudioSessionDraftV1;
    if (parsed.version !== 1 || parsed.bootstrapMode == null || parsed.page == null) {
      return null;
    }
    return {
      version: 1,
      savedAtMs: parsed.savedAtMs,
      bootstrapMode: parsed.bootstrapMode,
      sourcePath: parsed.sourcePath,
      page: parsePageV1(parsed.page),
      pageDirty: parsed.pageDirty === true,
      selectedBlockId:
        typeof parsed.selectedBlockId === "string" ? parsed.selectedBlockId : null,
      outline: parseOutlineSessionDraft(parsed.outline),
      diagrams: {
        drafts: cloneDiagramRecord(parsed.diagrams?.drafts ?? {}),
        sourcePaths: { ...(parsed.diagrams?.sourcePaths ?? {}) },
        baselines: cloneDiagramRecord(parsed.diagrams?.baselines ?? {}),
        dirty: { ...(parsed.diagrams?.dirty ?? {}) },
      },
      scenes: {
        drafts: cloneSceneRecord(parsed.scenes?.drafts ?? {}),
        sourcePaths: { ...(parsed.scenes?.sourcePaths ?? {}) },
        baselines: cloneSceneRecord(parsed.scenes?.baselines ?? {}),
        dirty: { ...(parsed.scenes?.dirty ?? {}) },
      },
    };
  } catch {
    return null;
  }
}

export function shouldRestoreCourseStudioSessionDraft(
  draft: CourseStudioSessionDraftV1,
): boolean {
  const hasOutlineDraft =
    draft.outline?.courseDirty === true ||
    Object.keys(draft.outline?.runtimePages ?? {}).length > 0;

  const hasUnsavedEdits =
    draft.pageDirty ||
    Object.values(draft.diagrams?.dirty ?? {}).some(Boolean) ||
    Object.values(draft.scenes?.dirty ?? {}).some(Boolean);

  if (hasUnsavedEdits || hasOutlineDraft) {
    return true;
  }

  // Default shipped page — always restore so refresh keeps the course layout.
  if (isBmi270ChapterPageId(draft.page.id)) {
    return true;
  }

  // Legacy blank / element-test sessions — prefer bundled default course page.
  if (draft.page.id === BLANK_COURSE_PAGE_ID || draft.page.blocks.length === 0) {
    return false;
  }

  // Other bundled pages (e.g. pilot) without dirty flag — reload from disk on bootstrap.
  return false;
}

/** Pure helper for unit tests — builds an outline draft without loading the outline store. */
export function outlineSessionDraftForTest(options: {
  courseId: string;
  sourcePath: string;
  course: CourseV1;
  courseDirty?: boolean;
  activeNodeId?: string | null;
  expandedNodeIds?: Record<string, boolean>;
  runtimePages?: Record<string, RuntimeCoursePageSnapshot>;
}): CourseStudioSessionOutlineDraftV1 {
  return {
    courseId: options.courseId,
    sourcePath: options.sourcePath,
    course: parseCourseV1(structuredClone(options.course)),
    courseDirty: options.courseDirty === true,
    activeNodeId: options.activeNodeId ?? null,
    expandedNodeIds: { ...(options.expandedNodeIds ?? {}) },
    runtimePages: options.runtimePages ?? {},
  };
}

export function restoreCourseStudioSessionDraft(draft: CourseStudioSessionDraftV1): void {
  useCoursePackStore.setState({
    activePackId: null,
    activePageId: draft.page.id ?? BLANK_COURSE_PAGE_ID,
    readOnly: false,
    pageIds: listCoursePageIds(),
  });

  useCoursePageEditorStore.getState().initPage(draft.page, draft.sourcePath);
  if (draft.pageDirty) {
    useCoursePageEditorStore.setState({ dirty: true });
  }
  if (draft.selectedBlockId != null) {
    const blockExists = draft.page.blocks.some((block) => block.id === draft.selectedBlockId);
    if (blockExists) {
      useCoursePageEditorStore.setState({ selectedBlockId: draft.selectedBlockId });
    }
  }

  useCourseDiagramEditorStore.setState({
    sourcePaths: draft.diagrams.sourcePaths,
    baselines: draft.diagrams.baselines,
    drafts: draft.diagrams.drafts,
    dirty: draft.diagrams.dirty,
    selectedNodeIds: {},
    selected3dNodeIds: {},
    historyStacks: {},
  });

  useCourseSceneEditorStore.setState({
    sourcePaths: draft.scenes.sourcePaths,
    baselines: draft.scenes.baselines,
    drafts: draft.scenes.drafts,
    dirty: draft.scenes.dirty,
    selectedNodeIdLists: {},
    activeNodeIds: {},
    historyStacks: {},
  });
}
