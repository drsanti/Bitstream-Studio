import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import pilotPageJson from "./pilot-bmi-accel-theory.page.v1.json";

export const PILOT_PAGE_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-accel-theory.page.v1.json";

export function loadPilotBmiAccelTheoryPage(): PageV1 {
  return parsePageV1(pilotPageJson);
}
