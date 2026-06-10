import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import blankPageJson from "./blank.page.v1.json";

export const BLANK_COURSE_PAGE_ID = "blank";

export const BLANK_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/blank.page.v1.json";

export function loadBlankCoursePage(): PageV1 {
  return parsePageV1(blankPageJson);
}

export function createBlankCoursePage(overrides?: Partial<Pick<PageV1, "id" | "title">>): PageV1 {
  const base = loadBlankCoursePage();
  return parsePageV1({
    ...base,
    ...overrides,
  });
}
