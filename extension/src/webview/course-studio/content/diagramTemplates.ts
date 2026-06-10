import {
  COURSE_KONVA_CANVAS_BG,
  COURSE_KONVA_DEFAULT_VIEW,
  COURSE_KONVA_STROKE_COLOR,
  COURSE_KONVA_TEXT_COLOR,
} from "../maintainer/courseKonvaTheme";
import { parseDiagramV1, type DiagramV1 } from "../schemas/diagram.v1";
import { loadCourseDiagram, registerCourseDiagram } from "./diagramRegistry";
import { saveCourseDiagramDev } from "../maintainer/saveCourseDiagramDev";
import pilotMemsDiagramJson from "./pilot-bmi-accel-mems.diagram.v1.json";

export type CourseDiagramTemplate = "blank" | "from-pilot" | "live-canvas-demo";

export function courseDiagramSourcePathForId(diagramId: string): string {
  return `src/webview/course-studio/content/${diagramId}.diagram.v1.json`;
}

export function createBlankDiagramV1(diagramId: string, title = "New diagram"): DiagramV1 {
  return parseDiagramV1({
    version: 1,
    id: diagramId,
    title,
    viewBox: [0, 0, 800, 600],
    freeform: {
      engine: "konva",
      shapes: [],
      view: { ...COURSE_KONVA_DEFAULT_VIEW, background: COURSE_KONVA_CANVAS_BG },
    },
  });
}

export function createLiveCanvasDemoDiagramV1(
  diagramId: string,
  title = "Live canvas demo",
): DiagramV1 {
  return parseDiagramV1({
    version: 1,
    id: diagramId,
    title,
    viewBox: [0, 0, 800, 600],
    freeform: {
      engine: "konva",
      shapes: [
        {
          id: "proof-indicator",
          type: "diamond",
          x: 340,
          y: 240,
          width: 120,
          height: 120,
          stroke: COURSE_KONVA_STROKE_COLOR,
          fill: "transparent",
        },
        {
          id: "ax-label",
          type: "text",
          x: 280,
          y: 400,
          text: "aX — connect Simulator or Bitstream",
          fontSize: 20,
          fill: COURSE_KONVA_TEXT_COLOR,
        },
        {
          id: "accel-arrow",
          type: "arrow",
          x1: 400,
          y1: 300,
          x2: 520,
          y2: 300,
          stroke: COURSE_KONVA_STROKE_COLOR,
        },
      ],
      view: { ...COURSE_KONVA_DEFAULT_VIEW, background: COURSE_KONVA_CANVAS_BG },
      propertyBindings: {
        "proof-indicator": {
          y: {
            base: 240,
            mode: "add",
            binding: {
              path: "bmi270.ax",
              map: [{ op: "scale", inMin: -1, inMax: 1, outMin: 60, outMax: -60 }],
              fallback: 0,
            },
          },
        },
        "ax-label": {
          text: {
            binding: { path: "bmi270.ax", format: "0.00", unit: "g", fallback: 0 },
            prefix: "aX ",
          },
        },
        "accel-arrow": {
          x2: {
            base: 400,
            mode: "add",
            binding: {
              path: "bmi270.ax",
              map: [{ op: "scale", inMin: -1, inMax: 1, outMin: 40, outMax: 160 }],
              fallback: 0,
            },
          },
        },
      },
    },
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
      : template === "live-canvas-demo"
        ? createLiveCanvasDemoDiagramV1(diagramId)
        : duplicateDiagramV1(
            parseDiagramV1(pilotMemsDiagramJson),
            diagramId,
            "MEMS accelerometer (copy)",
          );
  const sourcePath = courseDiagramSourcePathForId(diagramId);
  return { diagramId, diagram, sourcePath };
}

/** Register a new diagram in the session store (synchronous — safe before addBlock). */
export function registerNewCourseDiagram(template: CourseDiagramTemplate): {
  diagramId: string;
  diagram: DiagramV1;
  sourcePath: string;
} {
  const built = buildCourseDiagramFromTemplate(template);
  registerCourseDiagram(built.diagram, built.sourcePath);
  return built;
}

/** Dev-only write to content/ — failures are non-fatal for in-memory editing. */
export async function persistNewCourseDiagramToDev(built: {
  sourcePath: string;
  diagram: DiagramV1;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: true };
  }
  try {
    return await saveCourseDiagramDev(built.sourcePath, built.diagram);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Register in-memory (+ dev save to content/) for a new diagram file. */
export async function prepareNewCourseDiagram(
  template: CourseDiagramTemplate,
): Promise<{ diagramId: string; diagram: DiagramV1; sourcePath: string }> {
  const built = registerNewCourseDiagram(template);
  const result = await persistNewCourseDiagramToDev(built);
  if (!result.ok) {
    console.warn("[course-studio] Failed to save new diagram:", result.error);
  }
  return built;
}

/** Deep-copy an in-memory diagram for a duplicated diagram-2d block. */
export function cloneRegisteredCourseDiagram(sourceDiagramId: string): {
  diagramId: string;
  diagram: DiagramV1;
  sourcePath: string;
} | null {
  const source = loadCourseDiagram(sourceDiagramId);
  if (source == null) {
    return null;
  }
  const diagramId = nextDiagramId();
  const diagram = duplicateDiagramV1(source, diagramId);
  const sourcePath = courseDiagramSourcePathForId(diagramId);
  registerCourseDiagram(diagram, sourcePath);
  return { diagramId, diagram, sourcePath };
}
