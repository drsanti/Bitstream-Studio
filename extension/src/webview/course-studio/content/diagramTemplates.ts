import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
import { registerCourseDiagram } from "./diagramRegistry";
import { saveCourseDiagramDev } from "../maintainer/saveCourseDiagramDev";
import pilotMemsDiagramJson from "./pilot-bmi-accel-mems.diagram.v1.json";

export type CourseDiagramTemplate = "blank" | "from-pilot";

export function courseDiagramSourcePathForId(diagramId: string): string {
  return `src/webview/course-studio/content/${diagramId}.diagram.v1.json`;
}

export function createBlankDiagramV1(diagramId: string, title = "New diagram"): DiagramV1 {
  return parseDiagramV1({
    version: 1,
    id: diagramId,
    title,
    viewBox: [0, 0, 400, 300],
    nodes: [
      {
        id: "canvas-hint",
        type: "text",
        x: 200,
        y: 150,
        content: "Add shapes from the Diagram inspector",
        fontSize: 12,
        fill: "muted",
        textAnchor: "middle",
      },
    ],
  });
}

export function duplicateDiagramV1(source: DiagramV1, newId: string, title?: string): DiagramV1 {
  const cloned = parseDiagramV1(JSON.parse(JSON.stringify(source)));
  cloned.id = newId;
  if (title != null) {
    cloned.title = title;
  } else if (source.title != null) {
    cloned.title = `${source.title} (copy)`;
  }
  return cloned;
}

let diagramIdSequence = 0;

function nextDiagramId(): string {
  diagramIdSequence += 1;
  return `diagram-${Date.now().toString(36)}-${diagramIdSequence}`;
}

export function buildCourseDiagramFromTemplate(template: CourseDiagramTemplate): {
  diagramId: string;
  diagram: DiagramV1;
  sourcePath: string;
} {
  const diagramId = nextDiagramId();
  const diagram =
    template === "blank"
      ? createBlankDiagramV1(diagramId)
      : duplicateDiagramV1(
          parseDiagramV1(pilotMemsDiagramJson),
          diagramId,
          "MEMS accelerometer (copy)",
        );
  const sourcePath = courseDiagramSourcePathForId(diagramId);
  return { diagramId, diagram, sourcePath };
}

/** Register in-memory (+ dev save to content/) for a new diagram file. */
export async function prepareNewCourseDiagram(
  template: CourseDiagramTemplate,
): Promise<{ diagramId: string; diagram: DiagramV1; sourcePath: string }> {
  const built = buildCourseDiagramFromTemplate(template);
  registerCourseDiagram(built.diagram, built.sourcePath);
  if (import.meta.env.DEV) {
    const result = await saveCourseDiagramDev(built.sourcePath, built.diagram);
    if (!result.ok) {
      console.warn("[course-studio] Failed to save new diagram:", result.error);
    }
  }
  return built;
}
