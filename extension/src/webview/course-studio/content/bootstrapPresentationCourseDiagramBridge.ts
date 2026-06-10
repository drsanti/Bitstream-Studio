import {
  BUNDLED_PILOT_PRIMARY_PAGE_ID,
  BUNDLED_PILOT_PRESENTATION_PACK,
} from "./bundledPilotPack";
import { initCourseDiagramRegistryFromPack } from "./diagramRegistry";
import { registerCoursePresentationPack } from "./useCoursePackStore";

/**
 * Presentation v1 bridge (7e): register bundled Course Studio diagrams so theory
 * slides can embed live `diagram.v1` assets without opening Course Studio.
 */
export function bootstrapPresentationCourseDiagramBridge(): void {
  registerCoursePresentationPack(BUNDLED_PILOT_PRESENTATION_PACK, {
    readOnly: !import.meta.env.DEV,
    primaryPageId: BUNDLED_PILOT_PRIMARY_PAGE_ID,
    sourcePathMode: import.meta.env.DEV ? "content" : "virtual",
  });

  initCourseDiagramRegistryFromPack();
}
