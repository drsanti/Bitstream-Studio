import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import sht40ApplicationsPageJson from "./sht40-applications.page.v1.json";
import sht40ComfortPageJson from "./sht40-comfort.page.v1.json";
import sht40LivePageJson from "./sht40-live.page.v1.json";
import sht40OverviewPageJson from "./sht40-overview.page.v1.json";

export const SHT40_OVERVIEW_PAGE_ID = "sht40-overview";
export const SHT40_COMFORT_PAGE_ID = "sht40-comfort";
export const SHT40_LIVE_PAGE_ID = "sht40-live";
export const SHT40_APPLICATIONS_PAGE_ID = "sht40-applications";

export const SHT40_OVERVIEW_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-overview.page.v1.json";
export const SHT40_COMFORT_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-comfort.page.v1.json";
export const SHT40_LIVE_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-live.page.v1.json";
export const SHT40_APPLICATIONS_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-applications.page.v1.json";

export const SHT40_DEFAULT_PAGE_ID = SHT40_OVERVIEW_PAGE_ID;
export const SHT40_DEFAULT_PAGE_SOURCE_PATH = SHT40_OVERVIEW_PAGE_SOURCE_PATH;

export const SHT40_CHAPTER_PAGE_IDS = [
  SHT40_OVERVIEW_PAGE_ID,
  SHT40_COMFORT_PAGE_ID,
  SHT40_LIVE_PAGE_ID,
  SHT40_APPLICATIONS_PAGE_ID,
] as const;

export function isSht40ChapterPageId(pageId: string): boolean {
  return (SHT40_CHAPTER_PAGE_IDS as readonly string[]).includes(pageId);
}

export function loadSht40OverviewPage(): PageV1 {
  return parsePageV1(sht40OverviewPageJson);
}

export function loadSht40ComfortPage(): PageV1 {
  return parsePageV1(sht40ComfortPageJson);
}

export function loadSht40LivePage(): PageV1 {
  return parsePageV1(sht40LivePageJson);
}

export function loadSht40ApplicationsPage(): PageV1 {
  return parsePageV1(sht40ApplicationsPageJson);
}
