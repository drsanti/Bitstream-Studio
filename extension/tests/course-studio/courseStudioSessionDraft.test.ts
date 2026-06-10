import { strict as assert } from "node:assert";
import test from "node:test";

import {
  buildCourseStudioSessionDraft,
  restoreCourseStudioSessionDraft,
  shouldRestoreCourseStudioSessionDraft,
  type CourseStudioSessionDraftV1,
  outlineSessionDraftForTest,
} from "../../src/webview/course-studio/content/courseStudioSessionDraft";
import { createBlankCoursePage } from "../../src/webview/course-studio/content/loadBlankPage";
import { loadBmi270OverviewPage } from "../../src/webview/course-studio/content/loadBmi270ChapterPages";
import { createBlankDiagramV1 } from "../../src/webview/course-studio/content/diagramTemplates";
import { useCourseDiagramEditorStore } from "../../src/webview/course-studio/maintainer/useCourseDiagramEditorStore";
import { useCoursePageEditorStore } from "../../src/webview/course-studio/maintainer/useCoursePageEditorStore";
import { parseCourseV1 } from "../../src/webview/course-studio/schemas/course.v1";
import { loadDefaultCourse } from "../../src/webview/course-studio/content/courseRegistry";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

function resetEditorStores(): void {
  useCoursePageEditorStore.setState({
    sourcePath: "",
    baseline: null,
    page: null,
    selectedBlockId: null,
    dirty: false,
    historyStacks: { past: [], future: [] },
  });
  useCourseDiagramEditorStore.setState({
    sourcePaths: {},
    baselines: {},
    drafts: {},
    dirty: {},
    selectedNodeIds: {},
    selected3dNodeIds: {},
    historyStacks: {},
  });
}

test("buildCourseStudioSessionDraft returns null for empty blank page", () => {
  resetEditorStores();
  const page = createBlankCoursePage();
  useCoursePageEditorStore.getState().initPage(page, "src/webview/course-studio/content/blank.page.v1.json");
  assert.equal(buildCourseStudioSessionDraft("blank"), null);
});

test("buildCourseStudioSessionDraft captures page blocks and diagram drafts", () => {
  resetEditorStores();
  const page = parsePageV1({
    ...createBlankCoursePage(),
    blocks: [
      {
        id: "block-diagram",
        kind: "diagram-2d",
        diagramId: "diagram-test",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 6 },
      },
    ],
  });
  useCoursePageEditorStore.getState().initPage(page, "src/webview/course-studio/content/blank.page.v1.json");
  useCoursePageEditorStore.setState({ dirty: true });

  const diagram = createBlankDiagramV1("diagram-test", "Session diagram");
  useCourseDiagramEditorStore.getState().initDiagram(
    diagram,
    "src/webview/course-studio/content/diagram-test.diagram.v1.json",
  );

  const draft = buildCourseStudioSessionDraft("blank");
  assert.ok(draft != null);
  assert.equal(draft.page.blocks.length, 1);
  assert.equal(draft.pageDirty, true);
  assert.ok(draft.diagrams.drafts["diagram-test"] != null);
});

test("restoreCourseStudioSessionDraft rehydrates page and diagram editor stores", () => {
  resetEditorStores();
  const page = parsePageV1({
    ...createBlankCoursePage(),
    title: "Restored page",
    blocks: [
      {
        id: "block-diagram",
        kind: "diagram-2d",
        diagramId: "diagram-test",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 6 },
      },
    ],
  });
  const diagram = createBlankDiagramV1("diagram-test", "Session diagram");

  restoreCourseStudioSessionDraft({
    version: 1,
    savedAtMs: Date.now(),
    bootstrapMode: "blank",
    sourcePath: "src/webview/course-studio/content/blank.page.v1.json",
    page,
    pageDirty: true,
    diagrams: {
      drafts: { "diagram-test": diagram },
      sourcePaths: {
        "diagram-test": "src/webview/course-studio/content/diagram-test.diagram.v1.json",
      },
      baselines: { "diagram-test": diagram },
      dirty: { "diagram-test": false },
    },
    scenes: {
      drafts: {},
      sourcePaths: {},
      baselines: {},
      dirty: {},
    },
  });

  const pageState = useCoursePageEditorStore.getState();
  assert.equal(pageState.page?.title, "Restored page");
  assert.equal(pageState.dirty, true);
  assert.equal(pageState.page?.blocks.length, 1);
  assert.ok(useCourseDiagramEditorStore.getState().drafts["diagram-test"] != null);
});

test("buildCourseStudioSessionDraft captures selectedBlockId", () => {
  resetEditorStores();
  const page = parsePageV1({
    ...createBlankCoursePage(),
    blocks: [
      {
        id: "scene-3d-1",
        kind: "scene-3d",
        documentId: "pilot-bmi-pcb-orientation",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 4 },
      },
    ],
  });
  useCoursePageEditorStore.getState().initPage(page, "src/webview/course-studio/content/blank.page.v1.json");
  useCoursePageEditorStore.setState({ selectedBlockId: "scene-3d-1", dirty: true });

  const draft = buildCourseStudioSessionDraft("blank");
  assert.ok(draft != null);
  assert.equal(draft.selectedBlockId, "scene-3d-1");
});

test("restoreCourseStudioSessionDraft rehydrates selectedBlockId", () => {
  resetEditorStores();
  const page = parsePageV1({
    ...createBlankCoursePage(),
    blocks: [
      {
        id: "scene-3d-1",
        kind: "scene-3d",
        documentId: "pilot-bmi-pcb-orientation",
        placement: { column: 1, row: 1, columnSpan: 5, rowSpan: 4 },
      },
    ],
  });

  restoreCourseStudioSessionDraft({
    version: 1,
    savedAtMs: Date.now(),
    bootstrapMode: "blank",
    sourcePath: "src/webview/course-studio/content/blank.page.v1.json",
    page,
    pageDirty: true,
    selectedBlockId: "scene-3d-1",
    diagrams: {
      drafts: {},
      sourcePaths: {},
      baselines: {},
      dirty: {},
    },
    scenes: {
      drafts: {},
      sourcePaths: {},
      baselines: {},
      dirty: {},
    },
  });

  assert.equal(useCoursePageEditorStore.getState().selectedBlockId, "scene-3d-1");
});

function emptySessionDiagramsAndScenes(): CourseStudioSessionDraftV1["diagrams"] {
  return { drafts: {}, sourcePaths: {}, baselines: {}, dirty: {} };
}

test("shouldRestoreCourseStudioSessionDraft keeps default BMI270 overview page", () => {
  const page = loadBmi270OverviewPage();
  const draft = {
    version: 1 as const,
    savedAtMs: Date.now(),
    bootstrapMode: "blank" as const,
    sourcePath: "src/webview/course-studio/content/bmi270-overview.page.v1.json",
    page,
    pageDirty: false,
    diagrams: emptySessionDiagramsAndScenes(),
    scenes: emptySessionDiagramsAndScenes(),
  };
  assert.equal(shouldRestoreCourseStudioSessionDraft(draft), true);
});

test("shouldRestoreCourseStudioSessionDraft skips stale element-test session", () => {
  const page = parsePageV1({
    ...createBlankCoursePage(),
    blocks: [
      {
        id: "heading-1",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        eyebrow: "SECTION",
        title: "New heading",
        subtitle: "Subtitle",
      },
      {
        id: "diagram-1",
        kind: "diagram-2d",
        diagramId: "diagram-mq64yl82-1",
        placement: { column: 1, row: 3, columnSpan: 12, rowSpan: 4 },
        caption: "Live canvas demo",
      },
    ],
  });
  const draft = {
    version: 1 as const,
    savedAtMs: Date.now(),
    bootstrapMode: "blank" as const,
    sourcePath: "src/webview/course-studio/content/blank.page.v1.json",
    page,
    pageDirty: false,
    diagrams: emptySessionDiagramsAndScenes(),
    scenes: emptySessionDiagramsAndScenes(),
  };
  assert.equal(shouldRestoreCourseStudioSessionDraft(draft), false);
});

test("buildCourseStudioSessionDraft captures dirty course outline and runtime pages", () => {
  resetEditorStores();
  const { courseId, course, sourcePath } = loadDefaultCourse();
  const page = parsePageV1({
    ...createBlankCoursePage(),
    id: "page-new-topic",
    title: "New topic",
    blocks: [
      {
        id: "heading-1",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        eyebrow: "Topic",
        title: "New topic",
        subtitle: "Edit this page in the Page Editor.",
      },
    ],
  });

  const overview = loadBmi270OverviewPage();
  useCoursePageEditorStore.getState().initPage(
    overview,
    "src/webview/course-studio/content/bmi270-overview.page.v1.json",
  );

  const outline = outlineSessionDraftForTest({
    courseId,
    sourcePath,
    course,
    courseDirty: true,
    runtimePages: {
      "page-new-topic": {
        page,
        sourcePath: "src/webview/course-studio/content/page-new-topic.page.v1.json",
      },
    },
  });

  const draft = buildCourseStudioSessionDraft("blank", outline);
  assert.ok(draft != null);
  assert.ok(draft.outline != null);
  assert.equal(draft.outline.courseDirty, true);
  assert.ok(draft.outline.runtimePages["page-new-topic"] != null);
});

test("shouldRestoreCourseStudioSessionDraft restores outline-only sessions", () => {
  const { course, sourcePath, courseId } = loadDefaultCourse();
  const draft = {
    version: 1 as const,
    savedAtMs: Date.now(),
    bootstrapMode: "blank" as const,
    sourcePath: "src/webview/course-studio/content/bmi270-overview.page.v1.json",
    page: loadBmi270OverviewPage(),
    pageDirty: false,
    outline: {
      courseId,
      sourcePath,
      course: parseCourseV1(structuredClone(course)),
      courseDirty: true,
      activeNodeId: course.root.id,
      expandedNodeIds: { [course.root.id]: true },
      runtimePages: {},
    },
    diagrams: emptySessionDiagramsAndScenes(),
    scenes: emptySessionDiagramsAndScenes(),
  };
  assert.equal(shouldRestoreCourseStudioSessionDraft(draft), true);
});
