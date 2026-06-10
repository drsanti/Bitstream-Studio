import type { DiagramV1 } from "../schemas/diagram.v1";
import { diagramHasKonvaFreeform } from "../schemas/diagramFreeform";

/** Course Studio Konva live canvas — owned dark stage, cyan accent stroke. */

export const COURSE_KONVA_CANVAS_BG = "#000000";

export const COURSE_KONVA_STROKE_COLOR = "#22d3ee";

export const COURSE_KONVA_TEXT_COLOR = "#f5f5f5";

/** Invisible pick slop around line/arrow strokes — visual width stays unchanged. */
export const KONVA_CONNECTOR_HIT_STROKE_WIDTH = 16;

export const COURSE_KONVA_DEFAULT_VIEW = {
  width: 800,
  height: 600,
  background: COURSE_KONVA_CANVAS_BG,
} as const;

export function normalizeKonvaCanvasView(
  view?: { width?: number; height?: number; background?: string } | null,
): { width: number; height: number; background: string } {
  return {
    width: view?.width ?? COURSE_KONVA_DEFAULT_VIEW.width,
    height: view?.height ?? COURSE_KONVA_DEFAULT_VIEW.height,
    background: view?.background ?? COURSE_KONVA_CANVAS_BG,
  };
}

export function readKonvaCanvasBackground(diagram: DiagramV1 | null | undefined): string | null {
  if (diagram == null || !diagramHasKonvaFreeform(diagram)) {
    return null;
  }
  return normalizeKonvaCanvasView(diagram.freeform?.view).background;
}

/** Normalize fill/stroke for TRNColorRingPicker when alpha is enabled. */
export function konvaColorPickerValue(color: string | undefined, _fallback: string): string {
  if (color == null || color === "transparent") {
    return "#00000000";
  }
  return color;
}

export function isFullyTransparentKonvaColor(value: string): boolean {
  if (value.length === 9 && value.startsWith("#")) {
    return parseInt(value.slice(7, 9), 16) === 0;
  }
  return value === "transparent";
}

export function konvaFillFromPicker(value: string): string {
  return isFullyTransparentKonvaColor(value) ? "transparent" : value;
}
