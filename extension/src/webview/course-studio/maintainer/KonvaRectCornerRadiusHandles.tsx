import { Circle } from "react-konva";
import type Konva from "konva";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import {
  getKonvaRectCornerRadii,
  konvaRectCornerHandleLocalPoint,
  konvaRectRadiusFromLocalPoint,
  konvaRectHasIndividualCorners,
  setKonvaRectCornerRadiusAt,
  setKonvaRectUniformCornerRadius,
  type KonvaRectCornerIndex,
} from "../runtime/diagram/konvaCornerRadius";

const CORNER_HANDLE_RADIUS = 5;
const CORNER_HANDLE_FILL = "#f59e0b";
const CORNER_HANDLE_STROKE = "#000000";

type KonvaRectShape = Extract<KonvaShapeV1, { type: "rect" }>;

const CORNER_ORDER: KonvaRectCornerIndex[] = [0, 1, 2, 3];

function rectNode(group: Konva.Group | null | undefined, shapeId: string): Konva.Rect | undefined {
  return group?.findOne(`#shape-${shapeId}`) as Konva.Rect | undefined;
}

function shapeFromLocalHandlePosition(
  shape: KonvaRectShape,
  corner: KonvaRectCornerIndex,
  mixedMode: boolean,
  localX: number,
  localY: number,
): KonvaRectShape {
  const nextRadius = konvaRectRadiusFromLocalPoint(
    corner,
    localX,
    localY,
    shape.width,
    shape.height,
  );
  if (mixedMode) {
    return setKonvaRectCornerRadiusAt(shape, corner, nextRadius);
  }
  return setKonvaRectUniformCornerRadius(shape, nextRadius);
}

function syncHandlePosition(
  handle: Konva.Circle,
  shape: KonvaRectShape,
  corner: KonvaRectCornerIndex,
): void {
  const radii = getKonvaRectCornerRadii(shape);
  const local = konvaRectCornerHandleLocalPoint(corner, shape.width, shape.height, radii);
  handle.position(local);
}

function syncRectCornerRadius(rect: Konva.Rect, shape: KonvaRectShape): void {
  const radii = getKonvaRectCornerRadii(shape);
  const allSame = radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3];
  rect.cornerRadius(allSame ? radii[0] : radii);
}

function KonvaRectCornerHandle({
  shape,
  corner,
  mixedMode,
  onGestureStart,
  onCommit,
}: {
  shape: KonvaRectShape;
  corner: KonvaRectCornerIndex;
  mixedMode: boolean;
  onGestureStart: () => void;
  onCommit: (next: KonvaRectShape) => void;
}) {
  const radii = getKonvaRectCornerRadii(shape);
  const local = konvaRectCornerHandleLocalPoint(corner, shape.width, shape.height, radii);

  const previewFromHandle = (node: Konva.Circle) => {
    const group = node.getParent() as Konva.Group | null;
    const rect = rectNode(group, shape.id);
    if (rect == null) {
      return;
    }
    const nextShape = shapeFromLocalHandlePosition(shape, corner, mixedMode, node.x(), node.y());
    syncHandlePosition(node, nextShape, corner);
    syncRectCornerRadius(rect, nextShape);
    rect.getLayer()?.batchDraw();
  };

  return (
    <Circle
      x={local.x}
      y={local.y}
      radius={CORNER_HANDLE_RADIUS}
      fill={CORNER_HANDLE_FILL}
      stroke={CORNER_HANDLE_STROKE}
      strokeWidth={1.5}
      draggable
      onMouseDown={(event) => event.cancelBubble = true}
      onTouchStart={(event) => event.cancelBubble = true}
      onDragStart={(event) => {
        event.cancelBubble = true;
        onGestureStart();
      }}
      onDragMove={(event) => {
        event.cancelBubble = true;
        previewFromHandle(event.target as Konva.Circle);
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true;
        const node = event.target as Konva.Circle;
        const nextShape = shapeFromLocalHandlePosition(shape, corner, mixedMode, node.x(), node.y());
        syncHandlePosition(node, nextShape, corner);
        onCommit(nextShape);
      }}
    />
  );
}

/** Corner-radius handles in the parent group's local coordinates (same space as the rect body). */
export function KonvaRectCornerRadiusHandles({
  shape,
  onGestureStart,
  onCommit,
}: {
  shape: KonvaRectShape;
  onGestureStart: () => void;
  onCommit: (next: KonvaRectShape) => void;
}) {
  const mixedMode = konvaRectHasIndividualCorners(shape);
  const corners: KonvaRectCornerIndex[] = mixedMode ? CORNER_ORDER : [2];

  return (
    <>
      {corners.map((corner) => (
        <KonvaRectCornerHandle
          key={`${shape.id}-corner-${corner}`}
          shape={shape}
          corner={corner}
          mixedMode={mixedMode}
          onGestureStart={onGestureStart}
          onCommit={onCommit}
        />
      ))}
    </>
  );
}
