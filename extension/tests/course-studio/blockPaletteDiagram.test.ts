import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCourseDiagramFromTemplate,
  registerNewCourseDiagram,
} from "../../src/webview/course-studio/content/diagramTemplates";
import { useCourseDiagramEditorStore } from "../../src/webview/course-studio/maintainer/useCourseDiagramEditorStore";
import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import { useCoursePageEditorStore } from "../../src/webview/course-studio/maintainer/useCoursePageEditorStore";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";
import blankPage from "../../src/webview/course-studio/content/blank.page.v1.json";

test("registerNewCourseDiagram + addBlock adds diagram-2d without awaiting dev save", () => {
  const page = parsePageV1(blankPage);
  useCoursePageEditorStore.getState().initPage(
    page,
    "src/webview/course-studio/content/blank.page.v1.json",
  );

  const built = registerNewCourseDiagram("blank");
  const block = createPageBlock("diagram-2d", page, { diagramId: built.diagramId });
  useCoursePageEditorStore.getState().addBlock(block);

  const next = useCoursePageEditorStore.getState().page;
  assert.ok(next != null);
  assert.equal(next.blocks.some((entry) => entry.kind === "diagram-2d"), true);
  assert.ok(useCourseDiagramEditorStore.getState().drafts[built.diagramId] != null);
});

test("buildCourseDiagramFromTemplate blank is konva freeform", () => {
  const built = buildCourseDiagramFromTemplate("blank");
  assert.equal(built.diagram.freeform?.engine, "konva");
});
