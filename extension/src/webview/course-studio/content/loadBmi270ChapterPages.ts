import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import bmi270ApplicationsPageJson from "./bmi270-applications.page.v1.json";
import bmi270LiveVisualizationPageJson from "./bmi270-live-visualization.page.v1.json";
import bmi270MemsDesignPageJson from "./bmi270-mems-design.page.v1.json";
import bmi270OverviewPageJson from "./bmi270-overview.page.v1.json";

export const BMI270_OVERVIEW_PAGE_ID = "bmi270-overview";
export const BMI270_MEMS_DESIGN_PAGE_ID = "bmi270-mems-design";
export const BMI270_LIVE_VISUALIZATION_PAGE_ID = "bmi270-live-visualization";
export const BMI270_APPLICATIONS_PAGE_ID = "bmi270-applications";

/** @deprecated Renamed to `bmi270-applications`. */
export const BMI270_HOST_INTEGRATION_PAGE_ID = BMI270_APPLICATIONS_PAGE_ID;

export const BMI270_OVERVIEW_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-overview.page.v1.json";
export const BMI270_MEMS_DESIGN_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-mems-design.page.v1.json";
export const BMI270_LIVE_VISUALIZATION_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-live-visualization.page.v1.json";
export const BMI270_APPLICATIONS_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-applications.page.v1.json";

/** @deprecated Renamed to `BMI270_APPLICATIONS_PAGE_SOURCE_PATH`. */
export const BMI270_HOST_INTEGRATION_PAGE_SOURCE_PATH = BMI270_APPLICATIONS_PAGE_SOURCE_PATH;

/** First topic in the BMI270 chapter outline. */
export const BMI270_DEFAULT_PAGE_ID = BMI270_OVERVIEW_PAGE_ID;
export const BMI270_DEFAULT_PAGE_SOURCE_PATH = BMI270_OVERVIEW_PAGE_SOURCE_PATH;

/** @deprecated Use `BMI270_OVERVIEW_PAGE_ID`. */
export const BMI270_COURSE_PAGE_ID = BMI270_OVERVIEW_PAGE_ID;
/** @deprecated Use `BMI270_OVERVIEW_PAGE_SOURCE_PATH`. */
export const BMI270_COURSE_PAGE_SOURCE_PATH = BMI270_OVERVIEW_PAGE_SOURCE_PATH;

export const BMI270_CHAPTER_PAGE_IDS = [
  BMI270_OVERVIEW_PAGE_ID,
  BMI270_MEMS_DESIGN_PAGE_ID,
  BMI270_LIVE_VISUALIZATION_PAGE_ID,
  BMI270_APPLICATIONS_PAGE_ID,
] as const;

const LEGACY_BMI270_PAGE_IDS = [
  "bmi270-student",
  "bmi270-engineering",
  "bmi270-programmer",
  "bmi270-course",
  "bmi270-host-integration",
] as const;

export function isBmi270ChapterPageId(pageId: string): boolean {
  return (
    (BMI270_CHAPTER_PAGE_IDS as readonly string[]).includes(pageId) ||
    (LEGACY_BMI270_PAGE_IDS as readonly string[]).includes(pageId)
  );
}

/** @deprecated Use `isBmi270ChapterPageId`. */
export const isBmi270TrackPageId = isBmi270ChapterPageId;

export function loadBmi270OverviewPage(): PageV1 {
  return parsePageV1(bmi270OverviewPageJson);
}

export function loadBmi270MemsDesignPage(): PageV1 {
  return parsePageV1(bmi270MemsDesignPageJson);
}

export function loadBmi270LiveVisualizationPage(): PageV1 {
  return parsePageV1(bmi270LiveVisualizationPageJson);
}

export function loadBmi270ApplicationsPage(): PageV1 {
  return parsePageV1(bmi270ApplicationsPageJson);
}

/** @deprecated Use `loadBmi270ApplicationsPage`. */
export function loadBmi270HostIntegrationPage(): PageV1 {
  return loadBmi270ApplicationsPage();
}

/** @deprecated Use `loadBmi270OverviewPage`. */
export function loadBmi270StudentPage(): PageV1 {
  return loadBmi270OverviewPage();
}

/** @deprecated Use `loadBmi270MemsDesignPage`. */
export function loadBmi270EngineeringPage(): PageV1 {
  return loadBmi270MemsDesignPage();
}

/** @deprecated Use `loadBmi270ApplicationsPage`. */
export function loadBmi270ProgrammerPage(): PageV1 {
  return loadBmi270ApplicationsPage();
}

/** @deprecated Use `loadBmi270OverviewPage`. */
export function loadBmi270CoursePage(): PageV1 {
  return loadBmi270OverviewPage();
}
