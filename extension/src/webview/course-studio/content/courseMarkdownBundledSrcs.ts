/** Bundled markdown filenames under `course-studio/content/` (no Vite raw imports). */
export const PILOT_ACCEL_THEORY_MD_SRC = "pilot-bmi-accel-theory.theory.md";

export const BMI270_OVERVIEW_MD_SRC = "bmi270-overview.theory.md";
export const BMI270_MEMS_DESIGN_MD_SRC = "bmi270-mems-design.theory.md";
export const BMI270_LIVE_VISUALIZATION_MD_SRC = "bmi270-live-visualization.theory.md";
export const BMI270_APPLICATIONS_MD_SRC = "bmi270-applications.theory.md";

/** @deprecated Renamed to `BMI270_APPLICATIONS_MD_SRC`. */
export const BMI270_HOST_INTEGRATION_MD_SRC = BMI270_APPLICATIONS_MD_SRC;

export const SHT40_OVERVIEW_MD_SRC = "sht40-overview.theory.md";
export const SHT40_COMFORT_MD_SRC = "sht40-comfort.theory.md";
export const SHT40_LIVE_MD_SRC = "sht40-live.theory.md";
export const SHT40_APPLICATIONS_MD_SRC = "sht40-applications.theory.md";

export const BMM350_OVERVIEW_MD_SRC = "bmm350-overview.theory.md";
export const BMM350_FIELD_MD_SRC = "bmm350-field.theory.md";
export const BMM350_LIVE_MD_SRC = "bmm350-live.theory.md";
export const BMM350_APPLICATIONS_MD_SRC = "bmm350-applications.theory.md";

export const DPS368_OVERVIEW_MD_SRC = "dps368-overview.theory.md";
export const DPS368_ALTITUDE_MD_SRC = "dps368-altitude.theory.md";
export const DPS368_LIVE_MD_SRC = "dps368-live.theory.md";
export const DPS368_APPLICATIONS_MD_SRC = "dps368-applications.theory.md";

export const NEW_TOPIC_2_SANDBOX_MD_SRC = "new-topic-2.sandbox.md";

export const COURSE_MARKDOWN_BUNDLED_SRCS = [
  PILOT_ACCEL_THEORY_MD_SRC,
  BMI270_OVERVIEW_MD_SRC,
  BMI270_MEMS_DESIGN_MD_SRC,
  BMI270_LIVE_VISUALIZATION_MD_SRC,
  BMI270_APPLICATIONS_MD_SRC,
  BMM350_OVERVIEW_MD_SRC,
  BMM350_FIELD_MD_SRC,
  BMM350_LIVE_MD_SRC,
  BMM350_APPLICATIONS_MD_SRC,
  DPS368_OVERVIEW_MD_SRC,
  DPS368_ALTITUDE_MD_SRC,
  DPS368_LIVE_MD_SRC,
  DPS368_APPLICATIONS_MD_SRC,
  SHT40_OVERVIEW_MD_SRC,
  SHT40_COMFORT_MD_SRC,
  SHT40_LIVE_MD_SRC,
  SHT40_APPLICATIONS_MD_SRC,
  NEW_TOPIC_2_SANDBOX_MD_SRC,
] as const;

export type CourseMarkdownBundledSrc = (typeof COURSE_MARKDOWN_BUNDLED_SRCS)[number];
