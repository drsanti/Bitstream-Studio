import test from "node:test";
import assert from "node:assert/strict";

import { parseCourseV1 } from "../../src/webview/course-studio/schemas/course.v1";
import {
  collectCoursePageIds,
  findCourseNodeIdForPageId,
  canAddChildToNode,
  insertCourseChildNode,
  mergeCourseOutlineWithBundled,
  sanitizeCourseOutline,
  removeCourseNode,
  renameCourseNode,
  reorderCourseSiblings,
} from "../../src/webview/course-studio/runtime/course/courseOutlineTree";

const sampleCourse = parseCourseV1({
  version: 1,
  id: "demo",
  title: "Demo course",
  root: {
    id: "book-1",
    kind: "book",
    title: "Book",
    children: [
      {
        id: "chapter-1",
        kind: "chapter",
        title: "Chapter 1",
        children: [
          {
            id: "topic-1",
            kind: "topic",
            title: "Topic 1",
            pageId: "page-one",
          },
        ],
      },
    ],
  },
});

test("collectCoursePageIds returns topic page ids", () => {
  assert.deepEqual(collectCoursePageIds(sampleCourse.root), ["page-one"]);
});

test("findCourseNodeIdForPageId resolves outline node", () => {
  assert.equal(findCourseNodeIdForPageId(sampleCourse.root, "page-one"), "topic-1");
});

test("mergeCourseOutlineWithBundled appends bundled chapters missing from draft", () => {
  const draft = parseCourseV1({
    version: 1,
    id: "demo",
    title: "Demo",
    root: {
      id: "book-1",
      kind: "book",
      title: "Book",
      children: [
        {
          id: "chapter-bmi270",
          kind: "chapter",
          title: "BMI270",
          children: [
            {
              id: "topic-custom",
              kind: "topic",
              title: "Tesring 3D Scene Block",
              pageId: "page-custom",
            },
          ],
        },
      ],
    },
  });
  const bundled = parseCourseV1({
    version: 1,
    id: "demo",
    title: "Demo",
    root: {
      id: "book-1",
      kind: "book",
      title: "Book",
      children: [
        {
          id: "chapter-bmi270",
          kind: "chapter",
          title: "BMI270",
          children: [
            {
              id: "topic-bmi270-overview",
              kind: "topic",
              title: "Overview",
              pageId: "bmi270-overview",
            },
          ],
        },
        {
          id: "chapter-sht40",
          kind: "chapter",
          title: "SHT40",
          children: [
            {
              id: "topic-sht40-overview",
              kind: "topic",
              title: "Overview",
              pageId: "sht40-overview",
            },
          ],
        },
      ],
    },
  });

  const merged = mergeCourseOutlineWithBundled(draft, bundled);
  const chapterIds = (merged.root.children ?? []).map((node) => node.id);
  assert.deepEqual(chapterIds, ["chapter-bmi270", "chapter-sht40"]);

  const bmi270 = merged.root.children?.find((node) => node.id === "chapter-bmi270");
  assert.equal(bmi270?.children?.length, 2);
  assert.ok(bmi270?.children?.some((node) => node.id === "topic-custom"));
  assert.ok(bmi270?.children?.some((node) => node.id === "topic-bmi270-overview"));
});

test("canAddChildToNode allows multiple subtopics under a topic", () => {
  const topicWithSubtopic = {
    id: "topic-container",
    kind: "topic" as const,
    title: "Container",
    children: [{ id: "sub-1", kind: "subtopic" as const, title: "One", pageId: "page-one" }],
  };
  assert.equal(canAddChildToNode(topicWithSubtopic, "subtopic"), true);
});

test("insertCourseChildNode adds topic with generated page id", () => {
  const result = insertCourseChildNode(sampleCourse, "chapter-1", "topic", {
    title: "Second topic",
  });
  assert.equal(result.pageId, "second-topic");
  assert.equal(result.nodeId, "topic-2");
  const pageIds = collectCoursePageIds(result.course.root);
  assert.ok(pageIds.includes("page-one"));
  assert.ok(pageIds.includes("second-topic"));
});

test("rename and remove course nodes", () => {
  const renamed = renameCourseNode(sampleCourse, "topic-1", "Renamed topic");
  assert.equal(
    renamed.root.children?.[0]?.children?.[0]?.title,
    "Renamed topic",
  );
  const removed = removeCourseNode(renamed, "topic-1");
  assert.equal(removed.root.children?.[0]?.children?.length, 0);
});

test("insertCourseChildNode adds multiple subtopics under the same topic", () => {
  const withTopic = insertCourseChildNode(sampleCourse, "chapter-1", "topic", {
    title: "Container topic",
  });
  const topicId = withTopic.nodeId;
  const first = insertCourseChildNode(withTopic.course, topicId, "subtopic", {
    title: "Subtopic A",
  });
  const topicAfterFirst = first.course.root.children?.[0]?.children?.find(
    (node) => node.id === topicId,
  );
  assert.equal(topicAfterFirst?.pageId, undefined);
  assert.equal(topicAfterFirst?.children?.length, 1);

  const second = insertCourseChildNode(first.course, topicId, "subtopic", {
    title: "Subtopic B",
  });
  const topicAfterSecond = second.course.root.children?.[0]?.children?.find(
    (node) => node.id === topicId,
  );
  assert.equal(topicAfterSecond?.children?.length, 2);
  assert.equal(
    topicAfterSecond?.children?.map((node) => node.title).join(","),
    "Subtopic A,Subtopic B",
  );
});

test("reorderCourseSiblings moves topic within chapter", () => {
  const withSecond = insertCourseChildNode(sampleCourse, "chapter-1", "topic", {
    title: "Topic 2",
  });
  const chapterId = withSecond.course.root.children?.[0]?.id ?? "chapter-1";
  const topicIds = withSecond.course.root.children?.[0]?.children?.map((node) => node.id) ?? [];
  assert.equal(topicIds.length, 2);
  const reordered = reorderCourseSiblings(
    withSecond.course,
    chapterId,
    topicIds[1]!,
    topicIds[0]!,
  );
  const titles = reordered.root.children?.[0]?.children?.map((node) => node.title) ?? [];
  assert.deepEqual(titles, ["Topic 2", "Topic 1"]);
});

test("sanitizeCourseOutline strips pageId when topic has subtopics", () => {
  const invalid = {
    version: 1,
    id: "demo",
    title: "Demo",
    root: {
      id: "book-1",
      kind: "book",
      title: "Book",
      children: [
        {
          id: "chapter-1",
          kind: "chapter",
          title: "Chapter",
          children: [
            {
              id: "topic-1",
              kind: "topic",
              title: "Workshop",
              pageId: "new-topic-3",
              children: [
                {
                  id: "sub-1",
                  kind: "subtopic",
                  title: "Live HTML",
                  pageId: "workshop-live-html",
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const fixed = parseCourseV1(sanitizeCourseOutline(invalid as never));
  const topic = fixed.root.children?.[0]?.children?.[0];
  assert.equal(topic?.pageId, undefined);
  assert.equal(topic?.children?.[0]?.pageId, "workshop-live-html");
});

test("mergeCourseOutlineWithBundled sanitizes topic pageId after subtopic merge", () => {
  const draft = {
    version: 1,
    id: "tesaiot-embedded",
    title: "TESAIoT",
    root: {
      id: "book-1",
      kind: "book",
      title: "Book",
      children: [
        {
          id: "chapter-1",
          kind: "chapter",
          title: "Tesring",
          children: [
            {
              id: "topic-3",
              kind: "topic",
              title: "Workshop HTML",
              pageId: "new-topic-3",
              children: [
                {
                  id: "subtopic-user",
                  kind: "subtopic",
                  title: "New subtopic",
                  pageId: "new-subtopic-page",
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const bundled = parseCourseV1({
    version: 1,
    id: "tesaiot-embedded",
    title: "TESAIoT",
    root: {
      id: "book-1",
      kind: "book",
      title: "Book",
      children: [
        {
          id: "chapter-1",
          kind: "chapter",
          title: "Tesring",
          children: [
            {
              id: "topic-3",
              kind: "topic",
              title: "Workshop HTML",
              children: [
                {
                  id: "subtopic-workshop-live-html",
                  kind: "subtopic",
                  title: "Live sensor dashboards",
                  pageId: "workshop-live-html",
                },
              ],
            },
          ],
        },
      ],
    },
  });
  const merged = parseCourseV1(
    mergeCourseOutlineWithBundled(draft as never, bundled),
  );
  const topic = merged.root.children?.[0]?.children?.[0];
  assert.equal(topic?.pageId, undefined);
  assert.ok((topic?.children?.length ?? 0) >= 1);
});

test("parseCourseV1 rejects topic without page or children", () => {
  assert.throws(() =>
    parseCourseV1({
      version: 1,
      id: "bad",
      title: "Bad",
      root: {
        id: "book-1",
        kind: "book",
        title: "Book",
        children: [
          {
            id: "chapter-1",
            kind: "chapter",
            title: "Chapter",
            children: [{ id: "topic-1", kind: "topic", title: "Empty topic" }],
          },
        ],
      },
    }),
  );
});
