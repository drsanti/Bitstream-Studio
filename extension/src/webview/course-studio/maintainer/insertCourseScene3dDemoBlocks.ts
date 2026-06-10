import type { PageV1 } from "../schemas/page.v1";
import { createPageBlock } from "./blockFactory";

const PILOT_PCB_SCENE_DOCUMENT_ID = "pilot-bmi-pcb-orientation";

export function insertCourseScene3dBlock(page: PageV1) {
  const block = createPageBlock("scene-3d", page, {
    documentId: PILOT_PCB_SCENE_DOCUMENT_ID,
  });
  return { ...block, caption: "PCB orientation" };
}
