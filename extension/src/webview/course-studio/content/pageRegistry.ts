import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import {
  BMI270_APPLICATIONS_PAGE_ID,
  BMI270_APPLICATIONS_PAGE_SOURCE_PATH,
  BMI270_LIVE_VISUALIZATION_PAGE_ID,
  BMI270_LIVE_VISUALIZATION_PAGE_SOURCE_PATH,
  BMI270_MEMS_DESIGN_PAGE_ID,
  BMI270_MEMS_DESIGN_PAGE_SOURCE_PATH,
  BMI270_OVERVIEW_PAGE_ID,
  BMI270_OVERVIEW_PAGE_SOURCE_PATH,
  loadBmi270ApplicationsPage,
  loadBmi270LiveVisualizationPage,
  loadBmi270MemsDesignPage,
  loadBmi270OverviewPage,
} from "./loadBmi270ChapterPages";
import {
  BMM350_APPLICATIONS_PAGE_ID,
  BMM350_APPLICATIONS_PAGE_SOURCE_PATH,
  BMM350_FIELD_PAGE_ID,
  BMM350_FIELD_PAGE_SOURCE_PATH,
  BMM350_LIVE_PAGE_ID,
  BMM350_LIVE_PAGE_SOURCE_PATH,
  BMM350_OVERVIEW_PAGE_ID,
  BMM350_OVERVIEW_PAGE_SOURCE_PATH,
  loadBmm350ApplicationsPage,
  loadBmm350FieldPage,
  loadBmm350LivePage,
  loadBmm350OverviewPage,
} from "./loadBmm350ChapterPages";
import {
  DPS368_APPLICATIONS_PAGE_ID,
  DPS368_APPLICATIONS_PAGE_SOURCE_PATH,
  DPS368_ALTITUDE_PAGE_ID,
  DPS368_ALTITUDE_PAGE_SOURCE_PATH,
  DPS368_LIVE_PAGE_ID,
  DPS368_LIVE_PAGE_SOURCE_PATH,
  DPS368_OVERVIEW_PAGE_ID,
  DPS368_OVERVIEW_PAGE_SOURCE_PATH,
  loadDps368ApplicationsPage,
  loadDps368AltitudePage,
  loadDps368LivePage,
  loadDps368OverviewPage,
} from "./loadDps368ChapterPages";
import {
  loadSht40ApplicationsPage,
  loadSht40ComfortPage,
  loadSht40LivePage,
  loadSht40OverviewPage,
  SHT40_APPLICATIONS_PAGE_ID,
  SHT40_APPLICATIONS_PAGE_SOURCE_PATH,
  SHT40_COMFORT_PAGE_ID,
  SHT40_COMFORT_PAGE_SOURCE_PATH,
  SHT40_LIVE_PAGE_ID,
  SHT40_LIVE_PAGE_SOURCE_PATH,
  SHT40_OVERVIEW_PAGE_ID,
  SHT40_OVERVIEW_PAGE_SOURCE_PATH,
} from "./loadSht40ChapterPages";
import { BLANK_PAGE_SOURCE_PATH, loadBlankCoursePage } from "./loadBlankPage";
import { getActiveCoursePackOverlay } from "./presentationPackLoad";
import { loadPilotBmiAccelTheoryPage, PILOT_PAGE_SOURCE_PATH } from "./loadPilotPage";

/** Pages discovered from `content/*.page.v1.json` at Vite bootstrap (see registerContentFolderPages). */
const contentFolderPages: Record<string, { page: PageV1; sourcePath: string }> = {};

export function mergeContentFolderPages(
  entries: Record<string, { page: PageV1; sourcePath: string }>,
): void {
  for (const [pageId, entry] of Object.entries(entries)) {
    contentFolderPages[pageId] = {
      page: parsePageV1(structuredClone(entry.page)),
      sourcePath: entry.sourcePath,
    };
  }
}

const BUNDLED_PAGES: Record<string, { page: PageV1; sourcePath: string }> = {
  [BMI270_OVERVIEW_PAGE_ID]: {
    page: loadBmi270OverviewPage(),
    sourcePath: BMI270_OVERVIEW_PAGE_SOURCE_PATH,
  },
  [BMI270_MEMS_DESIGN_PAGE_ID]: {
    page: loadBmi270MemsDesignPage(),
    sourcePath: BMI270_MEMS_DESIGN_PAGE_SOURCE_PATH,
  },
  [BMI270_LIVE_VISUALIZATION_PAGE_ID]: {
    page: loadBmi270LiveVisualizationPage(),
    sourcePath: BMI270_LIVE_VISUALIZATION_PAGE_SOURCE_PATH,
  },
  [BMI270_APPLICATIONS_PAGE_ID]: {
    page: loadBmi270ApplicationsPage(),
    sourcePath: BMI270_APPLICATIONS_PAGE_SOURCE_PATH,
  },
  [BMM350_OVERVIEW_PAGE_ID]: {
    page: loadBmm350OverviewPage(),
    sourcePath: BMM350_OVERVIEW_PAGE_SOURCE_PATH,
  },
  [BMM350_FIELD_PAGE_ID]: {
    page: loadBmm350FieldPage(),
    sourcePath: BMM350_FIELD_PAGE_SOURCE_PATH,
  },
  [BMM350_LIVE_PAGE_ID]: {
    page: loadBmm350LivePage(),
    sourcePath: BMM350_LIVE_PAGE_SOURCE_PATH,
  },
  [BMM350_APPLICATIONS_PAGE_ID]: {
    page: loadBmm350ApplicationsPage(),
    sourcePath: BMM350_APPLICATIONS_PAGE_SOURCE_PATH,
  },
  [DPS368_OVERVIEW_PAGE_ID]: {
    page: loadDps368OverviewPage(),
    sourcePath: DPS368_OVERVIEW_PAGE_SOURCE_PATH,
  },
  [DPS368_ALTITUDE_PAGE_ID]: {
    page: loadDps368AltitudePage(),
    sourcePath: DPS368_ALTITUDE_PAGE_SOURCE_PATH,
  },
  [DPS368_LIVE_PAGE_ID]: {
    page: loadDps368LivePage(),
    sourcePath: DPS368_LIVE_PAGE_SOURCE_PATH,
  },
  [DPS368_APPLICATIONS_PAGE_ID]: {
    page: loadDps368ApplicationsPage(),
    sourcePath: DPS368_APPLICATIONS_PAGE_SOURCE_PATH,
  },
  [SHT40_OVERVIEW_PAGE_ID]: {
    page: loadSht40OverviewPage(),
    sourcePath: SHT40_OVERVIEW_PAGE_SOURCE_PATH,
  },
  [SHT40_COMFORT_PAGE_ID]: {
    page: loadSht40ComfortPage(),
    sourcePath: SHT40_COMFORT_PAGE_SOURCE_PATH,
  },
  [SHT40_LIVE_PAGE_ID]: {
    page: loadSht40LivePage(),
    sourcePath: SHT40_LIVE_PAGE_SOURCE_PATH,
  },
  [SHT40_APPLICATIONS_PAGE_ID]: {
    page: loadSht40ApplicationsPage(),
    sourcePath: SHT40_APPLICATIONS_PAGE_SOURCE_PATH,
  },
  "bmi270-host-integration": {
    page: loadBmi270ApplicationsPage(),
    sourcePath: BMI270_APPLICATIONS_PAGE_SOURCE_PATH,
  },
  blank: {
    page: loadBlankCoursePage(),
    sourcePath: BLANK_PAGE_SOURCE_PATH,
  },
  "bmi-accel-theory": {
    page: loadPilotBmiAccelTheoryPage(),
    sourcePath: PILOT_PAGE_SOURCE_PATH,
  },
};

function resolveBundledPageEntry(pageId: string): { page: PageV1; sourcePath: string } | undefined {
  return BUNDLED_PAGES[pageId] ?? contentFolderPages[pageId];
}

export const BUNDLED_COURSE_PAGE_IDS = Object.keys(BUNDLED_PAGES);

export function listRegisteredContentFolderPageIds(): string[] {
  return Object.keys(contentFolderPages).sort();
}

const runtimePageOverlay: Record<string, { page: PageV1; sourcePath: string }> = {};

export type RuntimeCoursePageSnapshot = {
  page: PageV1;
  sourcePath: string;
};

/** Snapshot in-memory pages created or duplicated during this dev session. */
export function snapshotRuntimeCoursePages(): Record<string, RuntimeCoursePageSnapshot> {
  const out: Record<string, RuntimeCoursePageSnapshot> = {};
  for (const [pageId, entry] of Object.entries(runtimePageOverlay)) {
    out[pageId] = {
      page: parsePageV1(structuredClone(entry.page)),
      sourcePath: entry.sourcePath,
    };
  }
  return out;
}

export function restoreRuntimeCoursePages(
  snapshot: Record<string, RuntimeCoursePageSnapshot>,
): void {
  for (const [pageId, entry] of Object.entries(snapshot)) {
    registerRuntimeCoursePage(pageId, entry.page, entry.sourcePath);
  }
}

/** Dev authoring: register a page saved during this session before content reload. */
export function registerRuntimeCoursePage(
  pageId: string,
  page: PageV1,
  sourcePath: string,
): void {
  runtimePageOverlay[pageId] = {
    page: parsePageV1(structuredClone(page)),
    sourcePath,
  };
}

/** True when the page exists only in the in-memory runtime overlay (not yet written to disk). */
export function isRuntimeCoursePage(pageId: string): boolean {
  return pageId in runtimePageOverlay;
}

export function loadCoursePage(pageId: string): PageV1 | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayPage = overlay?.pages[pageId];
  if (overlayPage != null) {
    return overlayPage.page;
  }
  const runtimePage = runtimePageOverlay[pageId];
  if (runtimePage != null) {
    return runtimePage.page;
  }
  return resolveBundledPageEntry(pageId)?.page ?? null;
}

export function getCoursePageSourcePath(pageId: string): string | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayPage = overlay?.pages[pageId];
  if (overlayPage != null) {
    return overlayPage.sourcePath;
  }
  const runtimePage = runtimePageOverlay[pageId];
  if (runtimePage != null) {
    return runtimePage.sourcePath;
  }
  return resolveBundledPageEntry(pageId)?.sourcePath ?? null;
}

export function listCoursePageIds(): string[] {
  const overlay = getActiveCoursePackOverlay();
  const ids = new Set<string>(BUNDLED_COURSE_PAGE_IDS);
  for (const pageId of Object.keys(runtimePageOverlay)) {
    ids.add(pageId);
  }
  if (overlay != null) {
    for (const pageId of overlay.pageIds) {
      ids.add(pageId);
    }
  }
  return [...ids].sort();
}

export function isCoursePageReadOnly(pageId: string): boolean {
  const overlay = getActiveCoursePackOverlay();
  if (overlay?.pages[pageId] != null) {
    return overlay.readOnly;
  }
  return false;
}

export function cloneCoursePage(page: PageV1): PageV1 {
  return parsePageV1(structuredClone(page));
}
