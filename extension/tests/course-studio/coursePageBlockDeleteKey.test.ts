import assert from "node:assert/strict";
import { test } from "node:test";
import { createPageBlock } from "../../src/webview/course-studio/maintainer/blockFactory";
import {
  shouldDeferCoursePageBlockDeleteKey,
  tryDeleteSelectedCoursePageBlock,
} from "../../src/webview/course-studio/maintainer/coursePageBlockDeleteKey";
import { useCoursePageEditorStore } from "../../src/webview/course-studio/maintainer/useCoursePageEditorStore";
import { loadBlankCoursePage } from "../../src/webview/course-studio/content/loadBlankPage";
import type { PageV1 } from "../../src/webview/course-studio/schemas/page.v1";

function mockElement(options: {
  tagName?: string;
  contentEditable?: boolean;
  ancestors?: Record<string, boolean>;
}): EventTarget {
  const tagName = options.tagName ?? "DIV";
  const ancestors = options.ancestors ?? {};
  return {
    tagName,
    isContentEditable: options.contentEditable ?? false,
    closest(selector: string) {
      return ancestors[selector] ? { tagName: "DIV" } : null;
    },
  } as unknown as EventTarget;
}

function mockDeleteEvent(target: EventTarget | null): KeyboardEvent {
  let prevented = false;
  return {
    key: "Delete",
    target,
    preventDefault: () => {
      prevented = true;
    },
    stopImmediatePropagation: () => {},
    stopPropagation: () => {},
    get defaultPrevented() {
      return prevented;
    },
  } as KeyboardEvent;
}

function pageWithSingleCard(): PageV1 {
  const base = loadBlankCoursePage();
  const card = createPageBlock("card", base);
  return { ...base, blocks: [card] };
}

test("shouldDeferCoursePageBlockDeleteKey allows delete when focus is on a grid cell", () => {
  const target = mockElement({ ancestors: { "[data-course-block-id]": true } });
  assert.equal(shouldDeferCoursePageBlockDeleteKey(target), false);
});

test("shouldDeferCoursePageBlockDeleteKey defers when editing block content fields", () => {
  const target = mockElement({
    tagName: "INPUT",
    ancestors: { "[data-course-block-content-fields]": true },
  });
  assert.equal(shouldDeferCoursePageBlockDeleteKey(target), true);
});

test("shouldDeferCoursePageBlockDeleteKey defers when editing placement scrub inputs", () => {
  const target = mockElement({
    tagName: "INPUT",
    ancestors: { ".course-block-placement-strip": true },
  });
  assert.equal(shouldDeferCoursePageBlockDeleteKey(target), true);
});

test("shouldDeferCoursePageBlockDeleteKey defers when editing markdown workbench source", () => {
  const target = mockElement({
    tagName: "TEXTAREA",
    ancestors: { ".course-md-editor-shell": true },
  });
  assert.equal(shouldDeferCoursePageBlockDeleteKey(target), true);
});

test("Delete is ignored while typing in the markdown editor", () => {
  const page = pageWithSingleCard();
  const cardId = page.blocks[0]!.id;
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock(cardId);

  const target = mockElement({
    tagName: "TEXTAREA",
    ancestors: { ".course-md-editor-shell": true },
  });
  const event = mockDeleteEvent(target);
  const handled = tryDeleteSelectedCoursePageBlock(event, "markdown");

  assert.equal(handled, false);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 1);
});

test("Delete removes the only block on the page", () => {
  const page = pageWithSingleCard();
  const cardId = page.blocks[0]!.id;
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock(cardId);

  const event = mockDeleteEvent(null);
  const handled = tryDeleteSelectedCoursePageBlock(event, "content");

  assert.equal(handled, true);
  assert.equal(event.defaultPrevented, true);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 0);
  assert.equal(useCoursePageEditorStore.getState().selectedBlockId, null);
});

test("Delete is ignored while the diagram editor pane is active", () => {
  const page = pageWithSingleCard();
  const cardId = page.blocks[0]!.id;
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock(cardId);

  const event = mockDeleteEvent(null);
  const handled = tryDeleteSelectedCoursePageBlock(event, "diagram");

  assert.equal(handled, false);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 1);
});

test("Delete is ignored while the 3D Scene editor pane is active", () => {
  const page = pageWithSingleCard();
  const cardId = page.blocks[0]!.id;
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock(cardId);

  const event = mockDeleteEvent(null);
  const handled = tryDeleteSelectedCoursePageBlock(event, "scene-3d");

  assert.equal(handled, false);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 1);
});

test("Delete is ignored when focus is inside the 3D Scene editor pane", () => {
  const page = pageWithSingleCard();
  const cardId = page.blocks[0]!.id;
  useCoursePageEditorStore.getState().initPage(page, "test.page.json");
  useCoursePageEditorStore.getState().selectBlock(cardId);

  const target = mockElement({
    ancestors: { ".course-workbench-scene-pane": true },
  });
  const event = mockDeleteEvent(target);
  const handled = tryDeleteSelectedCoursePageBlock(event, "content");

  assert.equal(handled, false);
  assert.equal(useCoursePageEditorStore.getState().page?.blocks.length, 1);
});
