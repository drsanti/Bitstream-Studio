import type { PageV1 } from "../schemas/page.v1";
import {
  BUNDLED_PILOT_PRIMARY_PAGE_ID,
  BUNDLED_PILOT_PRESENTATION_PACK,
} from "./bundledPilotPack";
import {
  bootstrapCourseStudioBlankPage,
  readCourseStudioBootstrapModeFromLocation,
  type CourseStudioBootstrapMode,
} from "./bootstrapCourseStudioBlank";
import { initCourseDiagramRegistryFromPack } from "./diagramRegistry";
import { initCourseMarkdownRegistryFromPack } from "./markdownRegistry";
import { initCourseSceneRegistryFromPack } from "./sceneRegistry";
import {
  cloneCoursePage,
  getCoursePageSourcePath,
  loadCoursePage,
} from "./pageRegistry";
import { registerCoursePresentationPack } from "./useCoursePackStore";

export type { CourseStudioBootstrapMode } from "./bootstrapCourseStudioBlank";
export { readCourseStudioBootstrapModeFromLocation } from "./bootstrapCourseStudioBlank";

export type CourseStudioBootstrapResult = {
  mode: CourseStudioBootstrapMode;
  primaryPageId: string;
  sourcePath: string;
  page: PageV1;
};

function bootstrapCourseStudioPilotPack(): CourseStudioBootstrapResult {
  registerCoursePresentationPack(BUNDLED_PILOT_PRESENTATION_PACK, {
    readOnly: !import.meta.env.DEV,
    primaryPageId: BUNDLED_PILOT_PRIMARY_PAGE_ID,
    sourcePathMode: import.meta.env.DEV ? "content" : "virtual",
  });

  initCourseDiagramRegistryFromPack();
  initCourseMarkdownRegistryFromPack();
  initCourseSceneRegistryFromPack();

  const primaryPageId = BUNDLED_PILOT_PRIMARY_PAGE_ID;
  const page = loadCoursePage(primaryPageId);
  const sourcePath = getCoursePageSourcePath(primaryPageId);

  if (page == null || sourcePath == null) {
    throw new Error(`Course Studio bootstrap failed: page "${primaryPageId}" is missing.`);
  }

  return {
    mode: "pilot",
    primaryPageId,
    sourcePath,
    page: cloneCoursePage(page),
  };
}

export function bootstrapCourseStudioContent(options?: {
  mode?: CourseStudioBootstrapMode;
}): CourseStudioBootstrapResult {
  const mode = options?.mode ?? readCourseStudioBootstrapModeFromLocation();
  if (mode === "pilot") {
    return bootstrapCourseStudioPilotPack();
  }
  const blank = bootstrapCourseStudioBlankPage();
  return { mode: "blank", ...blank };
}

export { resetCourseStudioToBlankPage, bootstrapCourseStudioBlankPage } from "./bootstrapCourseStudioBlank";
