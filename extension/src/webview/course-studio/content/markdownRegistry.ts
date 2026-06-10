import { useCourseMarkdownEditorStore } from "../maintainer/useCourseMarkdownEditorStore";
import { getActiveCoursePackOverlay } from "./presentationPackLoad";
import {
  BMI270_APPLICATIONS_MD_SRC,
  BMI270_LIVE_VISUALIZATION_MD_SRC,
  BMI270_MEMS_DESIGN_MD_SRC,
  BMI270_OVERVIEW_MD_SRC,
  COURSE_MARKDOWN_BUNDLED_SRCS,
  PILOT_ACCEL_THEORY_MD_SRC,
  SHT40_APPLICATIONS_MD_SRC,
  SHT40_COMFORT_MD_SRC,
  SHT40_LIVE_MD_SRC,
  SHT40_OVERVIEW_MD_SRC,
  BMM350_APPLICATIONS_MD_SRC,
  BMM350_FIELD_MD_SRC,
  BMM350_LIVE_MD_SRC,
  BMM350_OVERVIEW_MD_SRC,
  DPS368_APPLICATIONS_MD_SRC,
  DPS368_ALTITUDE_MD_SRC,
  DPS368_LIVE_MD_SRC,
  DPS368_OVERVIEW_MD_SRC,
} from "./courseMarkdownBundledSrcs";
import bmi270ApplicationsMd from "./bmi270-applications.theory.md?raw";
import bmi270LiveVisualizationMd from "./bmi270-live-visualization.theory.md?raw";
import bmi270MemsDesignMd from "./bmi270-mems-design.theory.md?raw";
import bmi270OverviewMd from "./bmi270-overview.theory.md?raw";
import bmm350ApplicationsMd from "./bmm350-applications.theory.md?raw";
import bmm350FieldMd from "./bmm350-field.theory.md?raw";
import bmm350LiveMd from "./bmm350-live.theory.md?raw";
import bmm350OverviewMd from "./bmm350-overview.theory.md?raw";
import dps368ApplicationsMd from "./dps368-applications.theory.md?raw";
import dps368AltitudeMd from "./dps368-altitude.theory.md?raw";
import dps368LiveMd from "./dps368-live.theory.md?raw";
import dps368OverviewMd from "./dps368-overview.theory.md?raw";
import pilotTheoryMd from "./pilot-bmi-accel-theory.theory.md?raw";
import sht40ApplicationsMd from "./sht40-applications.theory.md?raw";
import sht40ComfortMd from "./sht40-comfort.theory.md?raw";
import sht40LiveMd from "./sht40-live.theory.md?raw";
import sht40OverviewMd from "./sht40-overview.theory.md?raw";

export { PILOT_ACCEL_THEORY_MD_SRC };

export const PILOT_ACCEL_THEORY_MD_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-accel-theory.theory.md";

const BMI270_OVERVIEW_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-overview.theory.md";
const BMI270_MEMS_DESIGN_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-mems-design.theory.md";
const BMI270_LIVE_VISUALIZATION_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-live-visualization.theory.md";
const BMI270_APPLICATIONS_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmi270-applications.theory.md";
const BMM350_OVERVIEW_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-overview.theory.md";
const BMM350_FIELD_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-field.theory.md";
const BMM350_LIVE_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-live.theory.md";
const BMM350_APPLICATIONS_MD_SOURCE_PATH =
  "src/webview/course-studio/content/bmm350-applications.theory.md";
const DPS368_OVERVIEW_MD_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-overview.theory.md";
const DPS368_ALTITUDE_MD_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-altitude.theory.md";
const DPS368_LIVE_MD_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-live.theory.md";
const DPS368_APPLICATIONS_MD_SOURCE_PATH =
  "src/webview/course-studio/content/dps368-applications.theory.md";
const SHT40_OVERVIEW_MD_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-overview.theory.md";
const SHT40_COMFORT_MD_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-comfort.theory.md";
const SHT40_LIVE_MD_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-live.theory.md";
const SHT40_APPLICATIONS_MD_SOURCE_PATH =
  "src/webview/course-studio/content/sht40-applications.theory.md";

const BUNDLED_MARKDOWN: Record<string, string> = {
  [PILOT_ACCEL_THEORY_MD_SRC]: pilotTheoryMd,
  [BMI270_OVERVIEW_MD_SRC]: bmi270OverviewMd,
  [BMI270_MEMS_DESIGN_MD_SRC]: bmi270MemsDesignMd,
  [BMI270_LIVE_VISUALIZATION_MD_SRC]: bmi270LiveVisualizationMd,
  [BMI270_APPLICATIONS_MD_SRC]: bmi270ApplicationsMd,
  [BMM350_OVERVIEW_MD_SRC]: bmm350OverviewMd,
  [BMM350_FIELD_MD_SRC]: bmm350FieldMd,
  [BMM350_LIVE_MD_SRC]: bmm350LiveMd,
  [BMM350_APPLICATIONS_MD_SRC]: bmm350ApplicationsMd,
  [DPS368_OVERVIEW_MD_SRC]: dps368OverviewMd,
  [DPS368_ALTITUDE_MD_SRC]: dps368AltitudeMd,
  [DPS368_LIVE_MD_SRC]: dps368LiveMd,
  [DPS368_APPLICATIONS_MD_SRC]: dps368ApplicationsMd,
  [SHT40_OVERVIEW_MD_SRC]: sht40OverviewMd,
  [SHT40_COMFORT_MD_SRC]: sht40ComfortMd,
  [SHT40_LIVE_MD_SRC]: sht40LiveMd,
  [SHT40_APPLICATIONS_MD_SRC]: sht40ApplicationsMd,
};

const MARKDOWN_SOURCE_PATHS: Record<string, string> = {
  [PILOT_ACCEL_THEORY_MD_SRC]: PILOT_ACCEL_THEORY_MD_SOURCE_PATH,
  [BMI270_OVERVIEW_MD_SRC]: BMI270_OVERVIEW_MD_SOURCE_PATH,
  [BMI270_MEMS_DESIGN_MD_SRC]: BMI270_MEMS_DESIGN_MD_SOURCE_PATH,
  [BMI270_LIVE_VISUALIZATION_MD_SRC]: BMI270_LIVE_VISUALIZATION_MD_SOURCE_PATH,
  [BMI270_APPLICATIONS_MD_SRC]: BMI270_APPLICATIONS_MD_SOURCE_PATH,
  [BMM350_OVERVIEW_MD_SRC]: BMM350_OVERVIEW_MD_SOURCE_PATH,
  [BMM350_FIELD_MD_SRC]: BMM350_FIELD_MD_SOURCE_PATH,
  [BMM350_LIVE_MD_SRC]: BMM350_LIVE_MD_SOURCE_PATH,
  [BMM350_APPLICATIONS_MD_SRC]: BMM350_APPLICATIONS_MD_SOURCE_PATH,
  [DPS368_OVERVIEW_MD_SRC]: DPS368_OVERVIEW_MD_SOURCE_PATH,
  [DPS368_ALTITUDE_MD_SRC]: DPS368_ALTITUDE_MD_SOURCE_PATH,
  [DPS368_LIVE_MD_SRC]: DPS368_LIVE_MD_SOURCE_PATH,
  [DPS368_APPLICATIONS_MD_SRC]: DPS368_APPLICATIONS_MD_SOURCE_PATH,
  [SHT40_OVERVIEW_MD_SRC]: SHT40_OVERVIEW_MD_SOURCE_PATH,
  [SHT40_COMFORT_MD_SRC]: SHT40_COMFORT_MD_SOURCE_PATH,
  [SHT40_LIVE_MD_SRC]: SHT40_LIVE_MD_SOURCE_PATH,
  [SHT40_APPLICATIONS_MD_SRC]: SHT40_APPLICATIONS_MD_SOURCE_PATH,
};

function resolveBundledMarkdown(src: string): string | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayMarkdown = overlay?.markdown[src];
  if (overlayMarkdown != null) {
    return overlayMarkdown.text;
  }
  return BUNDLED_MARKDOWN[src] ?? null;
}

export function loadCourseMarkdown(src: string): string | null {
  const draft = useCourseMarkdownEditorStore.getState().drafts[src];
  if (draft != null) {
    return draft;
  }
  return resolveBundledMarkdown(src);
}

export function getCourseMarkdownSourcePath(src: string): string | null {
  const overlay = getActiveCoursePackOverlay();
  const overlayMarkdown = overlay?.markdown[src];
  if (overlayMarkdown != null) {
    return overlayMarkdown.sourcePath;
  }
  return MARKDOWN_SOURCE_PATHS[src] ?? null;
}

export const COURSE_MARKDOWN_SRCS: readonly string[] = COURSE_MARKDOWN_BUNDLED_SRCS;

export function initCourseMarkdownRegistryFromPack(): void {
  initCourseMarkdownRegistryRespectingOverlay();
}

export function initCourseMarkdownRegistryRespectingOverlay(): void {
  const overlay = getActiveCoursePackOverlay();
  const { initMarkdown } = useCourseMarkdownEditorStore.getState();

  if (overlay == null) {
    for (const src of COURSE_MARKDOWN_SRCS) {
      const text = BUNDLED_MARKDOWN[src];
      const sourcePath = MARKDOWN_SOURCE_PATHS[src];
      if (text != null && sourcePath != null) {
        initMarkdown(src, text, sourcePath);
      }
    }
    return;
  }

  for (const [src, entry] of Object.entries(overlay.markdown)) {
    initMarkdown(src, entry.text, entry.sourcePath);
  }

  for (const src of COURSE_MARKDOWN_SRCS) {
    if (overlay.markdown[src] != null) {
      continue;
    }
    const text = BUNDLED_MARKDOWN[src];
    const sourcePath = MARKDOWN_SOURCE_PATHS[src];
    if (text != null && sourcePath != null) {
      initMarkdown(src, text, sourcePath);
    }
  }
}

/** @deprecated Use initCourseMarkdownRegistryRespectingOverlay */
export function initBundledCourseMarkdowns(): void {
  initCourseMarkdownRegistryRespectingOverlay();
}

export function useCourseMarkdown(src: string): string | null {
  const draft = useCourseMarkdownEditorStore((s) => (src ? s.drafts[src] : undefined));
  if (!src) {
    return null;
  }
  if (draft != null) {
    return draft;
  }
  return resolveBundledMarkdown(src);
}

export function isCourseMarkdownReadOnly(src: string): boolean {
  const overlay = getActiveCoursePackOverlay();
  if (overlay?.markdown[src] != null && BUNDLED_MARKDOWN[src] == null) {
    return overlay.readOnly;
  }
  const sourcePath = getCourseMarkdownSourcePath(src);
  return sourcePath?.startsWith("pack:") ?? false;
}
