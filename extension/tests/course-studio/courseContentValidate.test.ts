import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import {
  buildPresentationPackFromCourse,
  buildPresentationPackFromPageIds,
} from "../../src/webview/course-studio/content/presentationPackBuild";
import { parsePresentationPackV1 } from "../../src/webview/course-studio/schemas/presentationPack.v1";
import {
  findDuplicateBlockIds,
  findPageGridOverlaps,
} from "../../src/webview/course-studio/validate/pageGridValidate";
import {
  discoverCourseContent,
  validateCourseContent,
} from "../../src/webview/course-studio/validate/courseContentValidate";
import { parsePageV1 } from "../../src/webview/course-studio/schemas/page.v1";

const contentDir = join(
  process.cwd(),
  "src/webview/course-studio/content",
);

test("validateCourseContent passes pilot content directory", () => {
  const result = validateCourseContent(contentDir);
  assert.equal(result.ok, true, formatIssues(result.issues));
  assert.ok(result.index.pages.size >= 1);
  assert.ok(result.index.diagrams.size >= 1);
  assert.ok(result.index.scenes.size >= 1);
});

test("findPageGridOverlaps detects overlapping blocks", () => {
  const page = parsePageV1({
    version: 1,
    id: "overlap-test",
    title: "Overlap",
    grid: { columns: 12, rowHeightPx: 48, gapPx: 12, paddingPx: 32 },
    blocks: [
      {
        id: "a",
        kind: "markdown",
        placement: { column: 1, row: 1, columnSpan: 4, rowSpan: 2 },
        markdown: "A",
      },
      {
        id: "b",
        kind: "markdown",
        placement: { column: 3, row: 1, columnSpan: 4, rowSpan: 2 },
        markdown: "B",
      },
    ],
  });

  const overlaps = findPageGridOverlaps(page);
  assert.ok(overlaps.length > 0);
  assert.equal(findDuplicateBlockIds(page).length, 0);
});

test("buildPresentationPackFromCourse bundles outline pages and course manifest", () => {
  const { pack, missingRefs } = buildPresentationPackFromCourse(
    contentDir,
    "tesaiot-embedded",
    { id: "tesaiot", title: "TESAIoT Embedded" },
  );

  assert.deepEqual(missingRefs, []);
  assert.equal(pack.courseId, "tesaiot-embedded");
  assert.ok(Object.keys(pack.files).some((path) => path.startsWith("courses/")));
  assert.ok(pack.files["courses/tesaiot-embedded.course.v1.json"]?.includes('"tesaiot-embedded"'));
  assert.ok(Object.keys(pack.files).filter((path) => path.startsWith("pages/")).length >= 16);
});

test("buildPresentationPackFromPageIds bundles page assets", () => {
  const index = discoverCourseContent(contentDir);
  const { pack, missingRefs } = buildPresentationPackFromPageIds(
    contentDir,
    ["bmi-accel-theory"],
    { id: "pilot", title: "Pilot" },
    index,
  );

  assert.deepEqual(missingRefs, []);
  const parsed = parsePresentationPackV1(pack);
  assert.equal(parsed.version, 1);
  assert.ok(Object.keys(parsed.files).some((path) => path.startsWith("pages/")));
  assert.ok(Object.keys(parsed.files).some((path) => path.startsWith("diagrams/")));
  assert.ok(Object.keys(parsed.files).some((path) => path.startsWith("scenes/")));
  assert.ok(Object.keys(parsed.files).some((path) => path.startsWith("markdown/")));
});

function formatIssues(
  issues: Array<{ severity: string; code: string; message: string }>,
): string {
  return issues.map((issue) => `${issue.severity} ${issue.code}: ${issue.message}`).join("\n");
}
