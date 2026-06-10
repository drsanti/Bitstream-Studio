import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import { isKonvaGroupShape } from "../../schemas/konvaShapes";
import { clampKonvaRectCornerRadiusFields } from "./konvaCornerRadius";
import {
  convertKonvaConnectorPathMode,
  getKonvaConnectorPathMode,
  translateKonvaConnectorGeometry,
} from "./konvaConnectorPath";
import type { KonvaConnectorPathMode } from "../../schemas/konvaConnector";
import { duplicateKonvaGroupShape } from "./konvaShapeGroup";

type KonvaRectLike = Extract<KonvaShapeV1, { type: "rect" }>;

function normalizeKonvaRectCornerStorage(
  shape: KonvaRectLike,
  patch?: Partial<KonvaRectLike>,
): KonvaRectLike {
  if (patch?.cornerRadius !== undefined && patch.cornerRadii === undefined) {
    const { cornerRadii: _removed, ...rest } = shape;
    return clampKonvaRectCornerRadiusFields({ ...rest, cornerRadius: patch.cornerRadius });
  }
  if (patch?.cornerRadii !== undefined || shape.cornerRadii != null) {
    const radii = patch?.cornerRadii ?? shape.cornerRadii;
    if (radii == null) {
      return clampKonvaRectCornerRadiusFields(shape);
    }
    const { cornerRadius: _removed, ...rest } = shape;
    return clampKonvaRectCornerRadiusFields({ ...rest, cornerRadii: radii });
  }
  const { cornerRadii: _removed, ...rest } = shape;
  return clampKonvaRectCornerRadiusFields(rest);
}

const DUPLICATE_OFFSET = 16;

let duplicateSequence = 0;

function nextDuplicateId(): string {
  duplicateSequence += 1;
  return `konva-dup-${Date.now().toString(36)}-${duplicateSequence}`;
}

function mergeKonvaShapePatch(
  shape: KonvaShapeV1,
  patch: Partial<KonvaShapeV1>,
): KonvaShapeV1 {
  const merged = { ...shape, ...patch } as KonvaShapeV1;
  if (merged.type === "rect") {
    return normalizeKonvaRectCornerStorage(merged, patch as Partial<KonvaRectLike>);
  }
  if (merged.type === "line" || merged.type === "arrow") {
    const nextPathMode = (patch as { pathMode?: KonvaConnectorPathMode }).pathMode;
    if (
      nextPathMode != null &&
      nextPathMode !== getKonvaConnectorPathMode(shape as Extract<KonvaShapeV1, { type: "line" | "arrow" }>)
    ) {
      return convertKonvaConnectorPathMode(merged, nextPathMode);
    }
  }
  return merged;
}

export function patchKonvaShape(
  shapes: KonvaShapeV1[],
  shapeId: string,
  patch: Partial<KonvaShapeV1>,
): KonvaShapeV1[] {
  const existing = shapes.find((entry) => entry.id === shapeId);
  if (existing != null) {
    return shapes.map((shape) =>
      shape.id === shapeId ? mergeKonvaShapePatch(shape, patch) : shape,
    );
  }

  let patched: KonvaShapeV1 | null = null;
  const walk = (entries: KonvaShapeV1[]): KonvaShapeV1[] =>
    entries.map((shape) => {
      if (shape.id === shapeId) {
        patched = mergeKonvaShapePatch(shape, patch);
        return patched;
      }
      if (isKonvaGroupShape(shape)) {
        return { ...shape, children: walk(shape.children) };
      }
      return shape;
    });

  if (patched == null) {
    return shapes;
  }
  return walk(shapes);
}

export function duplicateKonvaShape(shape: KonvaShapeV1, offset = DUPLICATE_OFFSET): KonvaShapeV1 {
  const id = nextDuplicateId();
  if (isKonvaGroupShape(shape)) {
    return duplicateKonvaGroupShape(shape, () => nextDuplicateId(), offset);
  }
  if (shape.type === "line" || shape.type === "arrow") {
    const duplicated = translateKonvaConnectorGeometry(shape, offset, offset);
    const { startAttach: _startAttach, endAttach: _endAttach, ...rest } = duplicated;
    return { ...rest, id };
  }
  if (shape.type === "circle") {
    return { ...shape, id, x: shape.x + offset, y: shape.y + offset };
  }
  return { ...shape, id, x: shape.x + offset, y: shape.y + offset };
}
