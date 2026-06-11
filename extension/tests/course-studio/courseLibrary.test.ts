import test from "node:test";
import assert from "node:assert/strict";

import { parseCourseV1 } from "../../src/webview/course-studio/schemas/course.v1";
import {
  findCourseIdForOutlineNode,
  selectLibraryBookRoots,
} from "../../src/webview/course-studio/content/courseLibrary";
import type { CourseLibraryMap } from "../../src/webview/course-studio/content/courseLibrary";

const embedded = parseCourseV1({
  version: 1,
  id: "tesaiot-embedded",
  title: "TESAIoT Embedded",
  root: {
    id: "book-embedded",
    kind: "book",
    title: "TESAIoT Embedded",
    children: [
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

const sensorTheory = parseCourseV1({
  version: 1,
  id: "tesaiot-sensor-theory",
  title: "TESAIoT DevKit — Sensor Theory",
  root: {
    id: "book-sensor-theory",
    kind: "book",
    title: "TESAIoT DevKit — Sensor Theory",
    children: [
      {
        id: "chapter-st-intro",
        kind: "chapter",
        title: "Before you start",
        children: [
          {
            id: "topic-st-intro-core-ideas",
            kind: "topic",
            title: "Core ideas",
            pageId: "st-intro-core-ideas",
          },
        ],
      },
    ],
  },
});

const library: CourseLibraryMap = {
  "tesaiot-embedded": { course: embedded, sourcePath: "embedded.json" },
  "tesaiot-sensor-theory": { course: sensorTheory, sourcePath: "sensor-theory.json" },
};

test("selectLibraryBookRoots returns every bundled book root", () => {
  const roots = selectLibraryBookRoots(library);
  assert.equal(roots.length, 2);
  assert.equal(roots[0]?.id, "book-embedded");
  assert.equal(roots[1]?.id, "book-sensor-theory");
});

test("findCourseIdForOutlineNode resolves owning course", () => {
  assert.equal(
    findCourseIdForOutlineNode(library, "topic-st-intro-core-ideas"),
    "tesaiot-sensor-theory",
  );
  assert.equal(
    findCourseIdForOutlineNode(library, "topic-sht40-overview"),
    "tesaiot-embedded",
  );
  assert.equal(findCourseIdForOutlineNode(library, "missing-node"), null);
});
