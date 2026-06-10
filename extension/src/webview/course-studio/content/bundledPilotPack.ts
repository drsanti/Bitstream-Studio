import pilotPageJson from "./pilot-bmi-accel-theory.page.v1.json";
import pilotMemsDiagramJson from "./pilot-bmi-accel-mems.diagram.v1.json";
import pilotOrientation3dDiagramJson from "./pilot-bmi-orientation-3d.diagram.v1.json";
import pilotBmiPcbSceneJson from "./pilot-bmi-pcb-orientation.scene.v1.json";
import pilotTheoryMd from "./pilot-bmi-accel-theory.theory.md?raw";
import { parsePresentationPackV1, type PresentationPackV1 } from "../schemas/presentationPack.v1";

/** Default shipped pack — same assets as bundled content/, unified runtime path. */
export function createBundledPilotPresentationPack(): PresentationPackV1 {
  return parsePresentationPackV1({
    version: 1,
    id: "bmi-accel-theory-pack",
    title: "BMI270 accelerometer theory",
    description: "Pilot Course Studio page with MEMS diagram, 3D scene, and theory markdown.",
    createdAt: "2026-06-08T00:00:00.000Z",
    files: {
      "pages/pilot-bmi-accel-theory.page.v1.json": `${JSON.stringify(pilotPageJson, null, 2)}\n`,
      "diagrams/pilot-bmi-accel-mems.diagram.v1.json": `${JSON.stringify(pilotMemsDiagramJson, null, 2)}\n`,
      "diagrams/pilot-bmi-orientation-3d.diagram.v1.json": `${JSON.stringify(pilotOrientation3dDiagramJson, null, 2)}\n`,
      "scenes/pilot-bmi-pcb-orientation.scene.v1.json": `${JSON.stringify(pilotBmiPcbSceneJson, null, 2)}\n`,
      "markdown/pilot-bmi-accel-theory.theory.md": pilotTheoryMd.endsWith("\n")
        ? pilotTheoryMd
        : `${pilotTheoryMd}\n`,
    },
  });
}

export const BUNDLED_PILOT_PRESENTATION_PACK = createBundledPilotPresentationPack();

export const BUNDLED_PILOT_PRIMARY_PAGE_ID = "bmi-accel-theory";
