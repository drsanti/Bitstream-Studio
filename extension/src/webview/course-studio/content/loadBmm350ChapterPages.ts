import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import bmm350ApplicationsPageJson from "./bmm350-applications.page.v1.json";
import bmm350FieldPageJson from "./bmm350-field.page.v1.json";
import bmm350LivePageJson from "./bmm350-live.page.v1.json";
import bmm350OverviewPageJson from "./bmm350-overview.page.v1.json";

export const BMM350_OVERVIEW_PAGE_ID = "bmm350-overview";
export const BMM350_FIELD_PAGE_ID = "bmm350-field";
export const BMM350_LIVE_PAGE_ID = "bmm350-live";
export const BMM350_APPLICATIONS_PAGE_ID = "bmm350-applications";

export const BMM350_OVERVIEW_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-overview.page.v1.json";
export const BMM350_FIELD_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-field.page.v1.json";
export const BMM350_LIVE_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-live.page.v1.json";
export const BMM350_APPLICATIONS_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-applications.page.v1.json";

export const BMM350_DEFAULT_PAGE_ID = BMM350_OVERVIEW_PAGE_ID;
export const BMM350_DEFAULT_PAGE_SOURCE_PATH = BMM350_OVERVIEW_PAGE_SOURCE_PATH;

export const BMM350_CHAPTER_PAGE_IDS = [
  BMM350_OVERVIEW_PAGE_ID,
  BMM350_FIELD_PAGE_ID,
  BMM350_LIVE_PAGE_ID,
  BMM350_APPLICATIONS_PAGE_ID,
] as const;

export function isBmm350ChapterPageId(pageId: string): boolean {
  return (BMM350_CHAPTER_PAGE_IDS as readonly string[]).includes(pageId);
}

export function loadBmm350OverviewPage(): PageV1 {
  return parsePageV1(bmm350OverviewPageJson);
}

export function loadBmm350FieldPage(): PageV1 {
  return parsePageV1(bmm350FieldPageJson);
}

export function loadBmm350LivePage(): PageV1 {
  return parsePageV1(bmm350LivePageJson);
}

export function loadBmm350ApplicationsPage(): PageV1 {
  return parsePageV1(bmm350ApplicationsPageJson);
}
