import { create } from "zustand";
import type { CourseNodeKindV1, CourseV1 } from "../schemas/course.v1";
import { parseCourseV1 } from "../schemas/course.v1";
import type { CardBlockColors } from "../schemas/cardBlockColors";
import { slugifyCourseThemePresetId } from "../schemas/courseThemes.v1";
import type { MarkdownBlockColors } from "../schemas/markdownBlockColors";
import {
  cloneCourseDocument,
  getCourseSourcePath,
  loadCourse,
  readCourseIdFromLocation,
} from "../content/courseRegistry";
import {
  buildBundledCourseLibrary,
  defaultExpandedForLibrary,
  findCourseIdForOutlineNode,
  type CourseLibraryMap,
  writeCourseIdToLocation,
} from "../content/courseLibrary";
import {
  duplicateCourseNode,
  findCourseNode,
  findFirstNavigableNodeId,
  insertCourseChildNode,
  pageIdForCourseNode,
  removeCourseNode,
  parentIdForCourseNode,
  renameCourseNode,
  reorderCourseSiblings,
  sanitizeCourseOutline,
} from "../runtime/course/courseOutlineTree";
import { loadCoursePage, registerRuntimeCoursePage } from "../content/pageRegistry";
import { parsePageV1 } from "../schemas/page.v1";
import { useCourseWorkbenchFocusStore } from "../workbench/course-workbench-focus.store";
import { coursePageSourcePathForId, createTopicPageTemplate } from "./coursePageTemplate";
import { navigateCoursePage } from "./navigateCoursePage";
import { saveCourseDev } from "./saveCourseDev";

function cloneCourse(course: CourseV1): CourseV1 {
  return parseCourseV1(structuredClone(course));
}

type CourseOutlineState = {
  courseId: string;
  sourcePath: string;
  baseline: CourseV1 | null;
  course: CourseV1 | null;
  /** All bundled course manifests — powers multi-book reader outline. */
  library: CourseLibraryMap;
  activeNodeId: string | null;
  expandedNodeIds: Record<string, boolean>;
  dirty: boolean;
  renamingNodeId: string | null;
  initCourse: (
    courseId: string,
    course: CourseV1,
    sourcePath: string,
    options?: { activeNodeId?: string | null; navigate?: boolean },
  ) => void;
  switchToCourse: (
    courseId: string,
    options?: { activeNodeId?: string | null; navigate?: boolean },
  ) => boolean;
  selectNode: (nodeId: string) => boolean;
  setRenamingNodeId: (nodeId: string | null) => void;
  toggleExpanded: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  renameNode: (nodeId: string, title: string) => void;
  deleteNode: (nodeId: string) => void;
  addChildNode: (
    parentId: string,
    kind: CourseNodeKindV1,
    options?: { title?: string },
  ) => Promise<{ ok: true; nodeId: string } | { ok: false; error: string }>;
  duplicateNode: (
    nodeId: string,
  ) => Promise<{ ok: true; nodeId: string } | { ok: false; error: string }>;
  reorderNode: (activeNodeId: string, overNodeId: string) => void;
  markClean: (course?: CourseV1) => void;
  discardChanges: () => void;
  saveCourse: () => Promise<{ ok: true } | { ok: false; error: string }>;
  upsertCardThemePreset: (title: string, colors: CardBlockColors) => string;
  upsertMarkdownThemePreset: (title: string, colors: MarkdownBlockColors) => string;
};

function defaultExpandedForCourse(course: CourseV1): Record<string, boolean> {
  const expanded: Record<string, boolean> = {
    [course.root.id]: true,
  };
  for (const chapter of course.root.children ?? []) {
    expanded[chapter.id] = true;
  }
  return expanded;
}

function persistActiveCourseInLibrary(
  library: CourseLibraryMap,
  courseId: string,
  course: CourseV1,
  sourcePath: string,
): CourseLibraryMap {
  return {
    ...library,
    [courseId]: {
      course: cloneCourse(sanitizeCourseOutline(course)),
      sourcePath,
    },
  };
}

export const useCourseOutlineStore = create<CourseOutlineState>((set, get) => ({
  courseId: "",
  sourcePath: "",
  baseline: null,
  course: null,
  library: {},
  activeNodeId: null,
  expandedNodeIds: {},
  dirty: false,
  renamingNodeId: null,

  initCourse: (courseId, course, sourcePath, options) => {
    const snapshot = cloneCourse(sanitizeCourseOutline(course));
    const activeNodeId =
      options?.activeNodeId ??
      findFirstNavigableNodeId(snapshot.root) ??
      snapshot.root.id;
    const shouldNavigate = options?.navigate !== false;
    let library = get().library;
    if (Object.keys(library).length === 0) {
      library = buildBundledCourseLibrary();
    }
    library = persistActiveCourseInLibrary(library, courseId, snapshot, sourcePath);
    const expandedNodeIds = {
      ...defaultExpandedForLibrary(library),
      ...get().expandedNodeIds,
      ...defaultExpandedForCourse(snapshot),
    };
    set({
      courseId,
      sourcePath,
      baseline: snapshot,
      course: cloneCourse(snapshot),
      library,
      activeNodeId,
      expandedNodeIds,
      dirty: false,
      renamingNodeId: null,
    });
    if (shouldNavigate && activeNodeId != null) {
      const pageId = pageIdForCourseNode(snapshot.root, activeNodeId);
      if (pageId != null) {
        navigateCoursePage(pageId);
      }
    }
  },

  switchToCourse: (courseId, options) => {
    const state = get();
    let library = state.library;
    if (Object.keys(library).length === 0) {
      library = buildBundledCourseLibrary();
    }
    if (state.course != null && state.courseId.length > 0) {
      library = persistActiveCourseInLibrary(
        library,
        state.courseId,
        state.course,
        state.sourcePath,
      );
    }
    const entry = library[courseId];
    if (entry == null) {
      return false;
    }
    const snapshot = cloneCourse(entry.course);
    const activeNodeId =
      options?.activeNodeId ??
      findFirstNavigableNodeId(snapshot.root) ??
      snapshot.root.id;
    const shouldNavigate = options?.navigate !== false;
    set({
      courseId,
      sourcePath: entry.sourcePath,
      baseline: cloneCourse(snapshot),
      course: snapshot,
      library,
      activeNodeId,
      dirty: false,
      renamingNodeId: null,
    });
    writeCourseIdToLocation(courseId);
    get().expandNode(activeNodeId);
    if (shouldNavigate && activeNodeId != null) {
      const pageId = pageIdForCourseNode(snapshot.root, activeNodeId);
      if (pageId != null) {
        const ok = navigateCoursePage(pageId);
        if (ok) {
          useCourseWorkbenchFocusStore.getState().setActiveEditorType("content");
        }
        return ok;
      }
    }
    return true;
  },

  selectNode: (nodeId) => {
    const state = get();
    const owningCourseId =
      findCourseIdForOutlineNode(state.library, nodeId) ?? state.courseId;
    if (owningCourseId !== state.courseId) {
      return state.switchToCourse(owningCourseId, {
        activeNodeId: nodeId,
        navigate: true,
      });
    }
    const course = state.course;
    if (course == null) {
      return false;
    }
    const pageId = pageIdForCourseNode(course.root, nodeId);
    get().expandNode(nodeId);
    if (pageId == null) {
      set({ activeNodeId: nodeId });
      return true;
    }
    const ok = navigateCoursePage(pageId);
    if (ok) {
      set({ activeNodeId: nodeId });
      useCourseWorkbenchFocusStore.getState().setActiveEditorType("content");
    }
    return ok;
  },

  setRenamingNodeId: (nodeId) => set({ renamingNodeId: nodeId }),

  toggleExpanded: (nodeId) => {
    set((state) => ({
      expandedNodeIds: {
        ...state.expandedNodeIds,
        [nodeId]: !state.expandedNodeIds[nodeId],
      },
    }));
  },

  expandNode: (nodeId) => {
    set((state) => ({
      expandedNodeIds: {
        ...state.expandedNodeIds,
        [nodeId]: true,
      },
    }));
  },

  renameNode: (nodeId, title) => {
    const current = get().course;
    if (current == null) {
      return;
    }
    set({
      course: renameCourseNode(current, nodeId, title),
      dirty: true,
      renamingNodeId: null,
    });
  },

  deleteNode: (nodeId) => {
    const current = get().course;
    if (current == null) {
      return;
    }
    const next = removeCourseNode(current, nodeId);
    const activeNodeId = get().activeNodeId;
    let nextActive = activeNodeId;
    if (activeNodeId === nodeId) {
      nextActive = findFirstNavigableNodeId(next.root);
    }
    set({
      course: next,
      dirty: true,
      activeNodeId: nextActive,
      renamingNodeId: null,
    });
    if (nextActive != null && nextActive !== activeNodeId) {
      get().selectNode(nextActive);
    }
  },

  addChildNode: async (parentId, kind, options) => {
    const current = get().course;
    if (current == null) {
      return { ok: false, error: "No course loaded" };
    }

    try {
      const inserted = insertCourseChildNode(current, parentId, kind, {
        title: options?.title,
      });
      const nextCourse = inserted.course;

      if (inserted.pageId != null) {
        const page = createTopicPageTemplate({
          pageId: inserted.pageId,
          title:
            options?.title ??
            (kind === "subtopic" ? "New subtopic" : kind === "topic" ? "New topic" : "New page"),
        });
        const sourcePath = coursePageSourcePathForId(inserted.pageId);
        registerRuntimeCoursePage(inserted.pageId, page, sourcePath);
      }

      set({
        course: nextCourse,
        dirty: true,
        activeNodeId: inserted.nodeId,
        expandedNodeIds: {
          ...get().expandedNodeIds,
          [parentId]: true,
          [inserted.nodeId]: true,
        },
      });

      if (inserted.pageId != null) {
        const ok = navigateCoursePage(inserted.pageId, { dirty: true });
        if (!ok) {
          return { ok: false, error: `Failed to open new page "${inserted.pageId}"` };
        }
      } else {
        get().selectNode(inserted.nodeId);
      }
      return { ok: true, nodeId: inserted.nodeId };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to add outline node",
      };
    }
  },

  reorderNode: (activeNodeId, overNodeId) => {
    const current = get().course;
    if (current == null || activeNodeId === overNodeId) {
      return;
    }
    const parentId = parentIdForCourseNode(current.root, activeNodeId);
    const overParentId = parentIdForCourseNode(current.root, overNodeId);
    if (parentId == null || parentId !== overParentId) {
      return;
    }
    set({
      course: reorderCourseSiblings(current, parentId, activeNodeId, overNodeId),
      dirty: true,
    });
  },

  duplicateNode: async (nodeId) => {
    const current = get().course;
    if (current == null) {
      return { ok: false, error: "No course loaded" };
    }

    try {
      const pageIdMap: Record<string, string> = {};
      const duplicated = duplicateCourseNode(current, nodeId, pageIdMap);
      for (const [sourcePageId, targetPageId] of Object.entries(pageIdMap)) {
        const loaded = loadCoursePage(sourcePageId);
        if (loaded == null) {
          return { ok: false, error: `Source page "${sourcePageId}" not found for duplicate` };
        }
        const copyPage = parsePageV1({
          ...loaded,
          id: targetPageId,
          title: `${loaded.title} (copy)`,
          blocks: structuredClone(loaded.blocks),
        });
        const sourcePath = coursePageSourcePathForId(targetPageId);
        registerRuntimeCoursePage(targetPageId, copyPage, sourcePath);
      }

      set({
        course: duplicated.course,
        dirty: true,
        activeNodeId: duplicated.nodeId,
      });
      const duplicatedPageId = pageIdForCourseNode(duplicated.course.root, duplicated.nodeId);
      if (duplicatedPageId != null) {
        const ok = navigateCoursePage(duplicatedPageId, { dirty: true });
        if (!ok) {
          return { ok: false, error: `Failed to open duplicated page "${duplicatedPageId}"` };
        }
      } else {
        get().selectNode(duplicated.nodeId);
      }
      return { ok: true, nodeId: duplicated.nodeId };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to duplicate node",
      };
    }
  },

  markClean: (course) => {
    const snapshot = cloneCourse(course ?? get().course!);
    set({
      baseline: snapshot,
      course: cloneCourse(snapshot),
      dirty: false,
    });
  },

  discardChanges: () => {
    const baseline = get().baseline;
    if (baseline == null) {
      return;
    }
    set({
      course: cloneCourse(baseline),
      dirty: false,
      renamingNodeId: null,
    });
  },

  saveCourse: async () => {
    const { course, sourcePath, dirty } = get();
    if (course == null || !dirty) {
      return { ok: true };
    }
    const result = await saveCourseDev(sourcePath, course);
    if (!result.ok) {
      return result;
    }
    get().markClean(course);
    return { ok: true };
  },

  upsertCardThemePreset: (title, colors) => {
    const course = get().course;
    if (course == null) {
      return "";
    }
    const trimmed = title.trim();
    const id = slugifyCourseThemePresetId(trimmed);
    const themes = course.themes ?? {};
    const card = [...(themes.card ?? [])];
    const entry = { id, title: trimmed, colors: structuredClone(colors) };
    const index = card.findIndex((preset) => preset.id === id);
    if (index >= 0) {
      card[index] = entry;
    } else {
      card.push(entry);
    }
    set({
      course: { ...course, themes: { ...themes, card } },
      dirty: true,
    });
    return id;
  },

  upsertMarkdownThemePreset: (title, colors) => {
    const course = get().course;
    if (course == null) {
      return "";
    }
    const trimmed = title.trim();
    const id = slugifyCourseThemePresetId(trimmed);
    const themes = course.themes ?? {};
    const markdown = [...(themes.markdown ?? [])];
    const entry = { id, title: trimmed, colors: structuredClone(colors) };
    const index = markdown.findIndex((preset) => preset.id === id);
    if (index >= 0) {
      markdown[index] = entry;
    } else {
      markdown.push(entry);
    }
    set({
      course: { ...course, themes: { ...themes, markdown } },
      dirty: true,
    });
    return id;
  },

}));

export function bootstrapCourseOutlineFromRegistry(courseId?: string): void {
  bootstrapCourseOutlineLibrary(courseId);
}

export function bootstrapCourseOutlineLibrary(courseId?: string): void {
  const resolvedId = courseId ?? readCourseIdFromLocation();
  const library = buildBundledCourseLibrary();
  const course = library[resolvedId]?.course ?? loadCourse(resolvedId);
  const sourcePath = library[resolvedId]?.sourcePath ?? getCourseSourcePath(resolvedId);
  if (course == null || sourcePath == null) {
    return;
  }
  useCourseOutlineStore.setState({ library });
  useCourseOutlineStore
    .getState()
    .initCourse(resolvedId, cloneCourseDocument(course), sourcePath);
}
