import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import dps368ApplicationsPageJson from "./dps368-applications.page.v1.json";
import dps368AltitudePageJson from "./dps368-altitude.page.v1.json";
import dps368LivePageJson from "./dps368-live.page.v1.json";
import dps368OverviewPageJson from "./dps368-overview.page.v1.json";

export const DPS368_OVERVIEW_PAGE_ID = "dps368-overview";
export const DPS368_ALTITUDE_PAGE_ID = "dps368-altitude";
export const DPS368_LIVE_PAGE_ID = "dps368-live";
export const DPS368_APPLICATIONS_PAGE_ID = "dps368-applications";

export const DPS368_OVERVIEW_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-overview.page.v1.json";
export const DPS368_ALTITUDE_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-altitude.page.v1.json";
export const DPS368_LIVE_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-live.page.v1.json";
export const DPS368_APPLICATIONS_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-applications.page.v1.json";

export const DPS368_DEFAULT_PAGE_ID = DPS368_OVERVIEW_PAGE_ID;
export const DPS368_DEFAULT_PAGE_SOURCE_PATH = DPS368_OVERVIEW_PAGE_SOURCE_PATH;

export const DPS368_CHAPTER_PAGE_IDS = [
  DPS368_OVERVIEW_PAGE_ID,
  DPS368_ALTITUDE_PAGE_ID,
  DPS368_LIVE_PAGE_ID,
  DPS368_APPLICATIONS_PAGE_ID,
] as const;

export function isDps368ChapterPageId(pageId: string): boolean {
  return (DPS368_CHAPTER_PAGE_IDS as readonly string[]).includes(pageId);
}

export function loadDps368OverviewPage(): PageV1 {
  return parsePageV1(dps368OverviewPageJson);
}

export function loadDps368AltitudePage(): PageV1 {
  return parsePageV1(dps368AltitudePageJson);
}

export function loadDps368LivePage(): PageV1 {
  return parsePageV1(dps368LivePageJson);
}

export function loadDps368ApplicationsPage(): PageV1 {
  return parsePageV1(dps368ApplicationsPageJson);
}
