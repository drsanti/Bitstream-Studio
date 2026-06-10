import type { DiagramKonvaFreeformV1 } from "../../schemas/diagramFreeform";
import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import {
  COURSE_KONVA_DEFAULT_VIEW,
  COURSE_KONVA_STROKE_COLOR,
  COURSE_KONVA_TEXT_COLOR,
} from "../../maintainer/courseKonvaTheme";

function migrateExcalidrawElement(element: Record<string, unknown>): KonvaShapeV1 | null {
  const id = typeof element.id === "string" ? element.id : null;
  const type = typeof element.type === "string" ? element.type : null;
  if (id == null || type == null) {
    return null;
  }
  const x = typeof element.x === "number" ? element.x : 0;
  const y = typeof element.y === "number" ? element.y : 0;
  const stroke =
    typeof element.strokeColor === "string" ? element.strokeColor : COURSE_KONVA_STROKE_COLOR;
  const opacityRaw = element.opacity;
  const opacity =
    typeof opacityRaw === "number"
      ? opacityRaw > 1
        ? opacityRaw / 100
        : opacityRaw
      : undefined;

  if (type === "rectangle") {
    return {
      id,
      type: "rect",
      x,
      y,
      width: typeof element.width === "number" ? element.width : 120,
      height: typeof element.height === "number" ? element.height : 80,
      stroke,
      fill: "transparent",
      opacity,
    };
  }
  if (type === "diamond") {
    return {
      id,
      type: "diamond",
      x,
      y,
      width: typeof element.width === "number" ? element.width : 120,
      height: typeof element.height === "number" ? element.height : 120,
      stroke,
      fill: "transparent",
      opacity,
    };
  }
  if (type === "text") {
    return {
      id,
      type: "text",
      x,
      y,
      text: typeof element.text === "string" ? element.text : "",
      fontSize: typeof element.fontSize === "number" ? element.fontSize : 20,
      fill: stroke ?? COURSE_KONVA_TEXT_COLOR,
      opacity,
    };
  }
  if (type === "line" || type === "arrow") {
    const x2 = typeof element.x2 === "number" ? element.x2 : x + 120;
    const y2 = typeof element.y2 === "number" ? element.y2 : y;
    return {
      id,
      type: type === "arrow" ? "arrow" : "line",
      x1: x,
      y1: y,
      x2,
      y2,
      stroke,
      opacity,
    };
  }
  if (type === "ellipse") {
    const w = typeof element.width === "number" ? element.width : 80;
    const h = typeof element.height === "number" ? element.height : 80;
    return {
      id,
      type: "circle",
      x: x + w / 2,
      y: y + h / 2,
      radius: Math.min(w, h) / 2,
      stroke,
      fill: "transparent",
      opacity,
    };
  }
  return null;
}

/** Convert legacy excalidraw freeform JSON to Konva (best-effort). */
export function migrateLegacyFreeformToKonva(
  freeform: Record<string, unknown>,
): DiagramKonvaFreeformV1 {
  const elements = Array.isArray(freeform.elements) ? freeform.elements : [];
  const shapes: KonvaShapeV1[] = [];
  for (const entry of elements) {
    if (entry != null && typeof entry === "object") {
      const shape = migrateExcalidrawElement(entry as Record<string, unknown>);
      if (shape != null) {
        shapes.push(shape);
      }
    }
  }
  return {
    engine: "konva",
    shapes,
    view: { ...COURSE_KONVA_DEFAULT_VIEW },
    ...(freeform.propertyBindings != null
      ? { propertyBindings: freeform.propertyBindings as DiagramKonvaFreeformV1["propertyBindings"] }
      : {}),
  };
}
