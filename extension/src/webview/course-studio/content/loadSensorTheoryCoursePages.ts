import { parsePageV1, type PageV1 } from "../schemas/page.v1";

/**
 * Sensor Theory pages use the default Course Studio live-article layout.
 * @see `courseStudioPageTemplates.ts` — `createCourseStudioLiveArticlePage`
 * @see `st-intro-core-ideas.page.v1.json` — canonical reference
 * @see `template-live-article.page.v1.json` — duplicate starter
 */

export const SENSOR_THEORY_COURSE_ID = "tesaiot-sensor-theory";

export const ST_INTRO_CORE_IDEAS_PAGE_ID = "st-intro-core-ideas";
export const ST_SHT40_OVERVIEW_PAGE_ID = "st-sht40-overview";
export const ST_SHT40_ENGINEERING_PAGE_ID = "st-sht40-engineering";
export const ST_SHT40_LABS_PAGE_ID = "st-sht40-labs";
export const ST_SHT40_REFERENCE_PAGE_ID = "st-sht40-reference";

export const SENSOR_THEORY_PAGE_IDS = [
  ST_INTRO_CORE_IDEAS_PAGE_ID,
  ST_SHT40_OVERVIEW_PAGE_ID,
  ST_SHT40_ENGINEERING_PAGE_ID,
  ST_SHT40_LABS_PAGE_ID,
  ST_SHT40_REFERENCE_PAGE_ID,
  "st-dps368-overview",
  "st-dps368-engineering",
  "st-dps368-labs",
  "st-dps368-reference",
  "st-bmi270-overview",
  "st-bmi270-engineering",
  "st-bmi270-labs",
  "st-bmi270-reference",
  "st-bmm350-overview",
  "st-bmm350-engineering",
  "st-bmm350-labs",
  "st-bmm350-reference",
  "st-four-sensor-dashboard",
] as const;

export const ST_FOUR_SENSOR_DASHBOARD_PAGE_ID = "st-four-sensor-dashboard";

export const SENSOR_THEORY_DEFAULT_PAGE_ID = ST_INTRO_CORE_IDEAS_PAGE_ID;

export function isSensorTheoryPageId(pageId: string): boolean {
  return (SENSOR_THEORY_PAGE_IDS as readonly string[]).includes(pageId);
}

/** Markdown-only sensor-theory pages are discovered via `content/*.page.v1.json` glob. */
export function loadSensorTheoryMarkdownPage(pageJson: unknown): PageV1 {
  return parsePageV1(pageJson);
}
