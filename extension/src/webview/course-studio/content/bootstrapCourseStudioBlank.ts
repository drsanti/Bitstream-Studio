import type { PageV1 } from "../schemas/page.v1";
import {
  BMI270_DEFAULT_PAGE_ID,
  BMI270_DEFAULT_PAGE_SOURCE_PATH,
  loadBmi270OverviewPage,
} from "./loadBmi270ChapterPages";
import {
  BLANK_COURSE_PAGE_ID,
  BLANK_PAGE_SOURCE_PATH,
  loadBlankCoursePage,
} from "./loadBlankPage";
import { cloneCoursePage, listCoursePageIds } from "./pageRegistry";
import { useCoursePackStore } from "./useCoursePackStore";

export type CourseStudioBootstrapMode = "blank" | "pilot";

export function readCourseStudioBootstrapModeFromLocation(
  search = typeof window !== "undefined" ? window.location.search : "",
): CourseStudioBootstrapMode {
  const params = new URLSearchParams(search);
  return params.get("load") === "pilot" ? "pilot" : "blank";
}

export type CourseStudioBlankBootstrapResult = {
  primaryPageId: string;
  sourcePath: string;
  page: PageV1;
};

export function bootstrapCourseStudioBlankPage(): CourseStudioBlankBootstrapResult {
  useCoursePackStore.setState({
    activePackId: null,
    activePageId: BMI270_DEFAULT_PAGE_ID,
    readOnly: false,
    pageIds: listCoursePageIds(),
  });

  const page = loadBmi270OverviewPage();

  return {
    primaryPageId: BMI270_DEFAULT_PAGE_ID,
    sourcePath: BMI270_DEFAULT_PAGE_SOURCE_PATH,
    page: cloneCoursePage(page),
  };
}

/** Reset to an empty authoring page (Maintainer pack controls). */
export function bootstrapCourseStudioEmptyPage(): CourseStudioBlankBootstrapResult {
  useCoursePackStore.setState({
    activePackId: null,
    activePageId: BLANK_COURSE_PAGE_ID,
    readOnly: false,
    pageIds: listCoursePageIds(),
  });

  const page = loadBlankCoursePage();

  return {
    primaryPageId: BLANK_COURSE_PAGE_ID,
    sourcePath: BLANK_PAGE_SOURCE_PATH,
    page: cloneCoursePage(page),
  };
}

export function resetCourseStudioToBlankPage(): CourseStudioBlankBootstrapResult {
  return bootstrapCourseStudioEmptyPage();
}
