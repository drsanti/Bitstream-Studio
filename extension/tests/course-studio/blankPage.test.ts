import { strict as assert } from "node:assert";
import test from "node:test";

import {
  bootstrapCourseStudioBlankPage,
  readCourseStudioBootstrapModeFromLocation,
  resetCourseStudioToBlankPage,
} from "../../src/webview/course-studio/content/bootstrapCourseStudioBlank";
import {
  BMI270_OVERVIEW_PAGE_ID,
  BMI270_OVERVIEW_PAGE_SOURCE_PATH,
} from "../../src/webview/course-studio/content/loadBmi270ChapterPages";
import {
  BLANK_COURSE_PAGE_ID,
  BLANK_PAGE_SOURCE_PATH,
  createBlankCoursePage,
  loadBlankCoursePage,
} from "../../src/webview/course-studio/content/loadBlankPage";
import { findPageGridOverlaps } from "../../src/webview/course-studio/validate/pageGridValidate";

test("blank course page loads with zero blocks", () => {
  const page = loadBlankCoursePage();
  assert.equal(page.id, BLANK_COURSE_PAGE_ID);
  assert.equal(page.blocks.length, 0);
  assert.deepEqual(findPageGridOverlaps(page), []);
});

test("createBlankCoursePage accepts title override", () => {
  const page = createBlankCoursePage({ title: "Chapter intro" });
  assert.equal(page.title, "Chapter intro");
  assert.equal(page.blocks.length, 0);
});

test("bootstrap default page returns BMI270 overview topic session", () => {
  const boot = bootstrapCourseStudioBlankPage();
  assert.equal(boot.primaryPageId, BMI270_OVERVIEW_PAGE_ID);
  assert.equal(boot.sourcePath, BMI270_OVERVIEW_PAGE_SOURCE_PATH);
  assert.equal(boot.page.id, BMI270_OVERVIEW_PAGE_ID);
  assert.ok(boot.page.blocks.length > 0);
});

test("readCourseStudioBootstrapModeFromLocation respects ?load=pilot", () => {
  assert.equal(readCourseStudioBootstrapModeFromLocation("?workspace=course-studio"), "blank");
  assert.equal(readCourseStudioBootstrapModeFromLocation("?load=pilot"), "pilot");
});

test("resetCourseStudioToBlankPage returns empty editable page", () => {
  const boot = resetCourseStudioToBlankPage();
  assert.equal(boot.page.id, BLANK_COURSE_PAGE_ID);
  assert.equal(boot.page.blocks.length, 0);
});
