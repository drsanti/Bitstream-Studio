import type { KonvaShapeV1 } from "../../schemas/konvaShapes";

export const KONVA_CORNER_RADIUS_PRESETS = [0, 4, 8, 16] as const;

/** Konva order: top-left, top-right, bottom-right, bottom-left. */
export type KonvaRectCornerIndex = 0 | 1 | 2 | 3;

export type KonvaRectCornerRadii = [number, number, number, number];

type KonvaRectLike = Extract<KonvaShapeV1, { type: "rect" }>;

export function konvaRectMaxCornerRadius(width: number, height: number): number {
  return Math.max(0, Math.min(width, height) / 2);
}

function clampRadius(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(0, value), max);
}

export function clampKonvaRectCornerRadii(
  radii: KonvaRectCornerRadii,
  width: number,
  height: number,
): KonvaRectCornerRadii {
  const max = konvaRectMaxCornerRadius(width, height);
  return [
    clampRadius(radii[0], max),
    clampRadius(radii[1], max),
    clampRadius(radii[2], max),
    clampRadius(radii[3], max),
  ];
}

export function getKonvaRectCornerRadii(shape: KonvaRectLike): KonvaRectCornerRadii {
  const max = konvaRectMaxCornerRadius(shape.width, shape.height);
  if (shape.cornerRadii != null) {
    return clampKonvaRectCornerRadii(shape.cornerRadii, shape.width, shape.height);
  }
  const uniform = clampRadius(shape.cornerRadius ?? 0, max);
  return [uniform, uniform, uniform, uniform];
}

export function konvaRectCornerRadiiAreUniform(radii: KonvaRectCornerRadii): boolean {
  return radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3];
}

export function konvaRectHasIndividualCorners(shape: KonvaRectLike): boolean {
  return shape.cornerRadii != null;
}

export function konvaRectUsesMixedCornerRadii(shape: KonvaRectLike): boolean {
  return (
    shape.cornerRadii != null && !konvaRectCornerRadiiAreUniform(getKonvaRectCornerRadii(shape))
  );
}

export function konvaRectKonvaCornerRadius(
  shape: KonvaRectLike,
): number | KonvaRectCornerRadii {
  const radii = getKonvaRectCornerRadii(shape);
  return konvaRectCornerRadiiAreUniform(radii) ? radii[0] : radii;
}

export function clampKonvaRectCornerRadiusFields(shape: KonvaRectLike): KonvaRectLike {
  const radii = getKonvaRectCornerRadii(shape);
  if (shape.cornerRadii != null) {
    const clamped = clampKonvaRectCornerRadii(shape.cornerRadii, shape.width, shape.height);
    if (konvaRectCornerRadiiAreUniform(clamped)) {
      const { cornerRadii: _removed, ...rest } = shape;
      return { ...rest, cornerRadius: clamped[0] };
    }
    return { ...shape, cornerRadii: clamped };
  }
  const uniform = clampRadius(shape.cornerRadius ?? 0, konvaRectMaxCornerRadius(shape.width, shape.height));
  return { ...shape, cornerRadius: uniform };
}

export function setKonvaRectUniformCornerRadius(
  shape: KonvaRectLike,
  cornerRadius: number,
): KonvaRectLike {
  const max = konvaRectMaxCornerRadius(shape.width, shape.height);
  const { cornerRadii: _removed, ...rest } = shape;
  return { ...rest, cornerRadius: clampRadius(cornerRadius, max) };
}

export function setKonvaRectCornerRadiusAt(
  shape: KonvaRectLike,
  corner: KonvaRectCornerIndex,
  value: number,
): KonvaRectLike {
  const radii = getKonvaRectCornerRadii(shape);
  radii[corner] = value;
  const clamped = clampKonvaRectCornerRadii(radii, shape.width, shape.height);
  if (konvaRectCornerRadiiAreUniform(clamped)) {
    const { cornerRadii: _removed, ...rest } = shape;
    return { ...rest, cornerRadius: clamped[0] };
  }
  return { ...shape, cornerRadius: undefined, cornerRadii: clamped };
}

export function enableKonvaRectMixedCornerRadii(shape: KonvaRectLike): KonvaRectLike {
  const radii = getKonvaRectCornerRadii(shape);
  return { ...shape, cornerRadius: undefined, cornerRadii: radii };
}

export function disableKonvaRectMixedCornerRadii(shape: KonvaRectLike): KonvaRectLike {
  const radii = getKonvaRectCornerRadii(shape);
  const { cornerRadii: _removed, ...rest } = shape;
  return { ...rest, cornerRadius: radii[0] };
}

/** Local handle position inside an unrotated rect (origin top-left). */
export function konvaRectCornerHandleLocalPoint(
  corner: KonvaRectCornerIndex,
  width: number,
  height: number,
  radii: KonvaRectCornerRadii,
): { x: number; y: number } {
  switch (corner) {
    case 0:
      return { x: radii[0], y: radii[0] };
    case 1:
      return { x: width - radii[1], y: radii[1] };
    case 2:
      return { x: width - radii[2], y: height - radii[2] };
    case 3:
      return { x: radii[3], y: height - radii[3] };
  }
}

/** Infer corner radius from a pointer in rect-local coordinates. */
export function konvaRectRadiusFromLocalPoint(
  corner: KonvaRectCornerIndex,
  localX: number,
  localY: number,
  width: number,
  height: number,
): number {
  const max = konvaRectMaxCornerRadius(width, height);
  switch (corner) {
    case 0:
      return clampRadius(Math.min(localX, localY), max);
    case 1:
      return clampRadius(Math.min(width - localX, localY), max);
    case 2:
      return clampRadius(Math.min(width - localX, height - localY), max);
    case 3:
      return clampRadius(Math.min(localX, height - localY), max);
  }
}

export function konvaRectLocalPointFromWorld(
  worldX: number,
  worldY: number,
  rectX: number,
  rectY: number,
  rotationDeg: number,
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = worldX - rectX;
  const dy = worldY - rectY;
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

export function konvaRectWorldPointFromLocal(
  localX: number,
  localY: number,
  rectX: number,
  rectY: number,
  rotationDeg: number,
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: rectX + localX * cos - localY * sin,
    y: rectY + localX * sin + localY * cos,
  };
}

export function nudgeKonvaRectCornerRadius(
  shape: KonvaRectLike,
  delta: number,
): KonvaRectLike {
  if (shape.cornerRadii != null) {
    const radii = clampKonvaRectCornerRadii(
      [
        shape.cornerRadii[0] + delta,
        shape.cornerRadii[1] + delta,
        shape.cornerRadii[2] + delta,
        shape.cornerRadii[3] + delta,
      ],
      shape.width,
      shape.height,
    );
    if (konvaRectCornerRadiiAreUniform(radii)) {
      const { cornerRadii: _removed, ...rest } = shape;
      return { ...rest, cornerRadius: radii[0] };
    }
    return { ...shape, cornerRadius: undefined, cornerRadii: radii };
  }
  return setKonvaRectUniformCornerRadius(shape, (shape.cornerRadius ?? 0) + delta);
}
