import { forwardRef, type Ref } from "react";
import { Arrow as KonvaArrow, Group, Line, Path } from "react-konva";
import type Konva from "konva";
import type { KonvaConnectorShapeV1 } from "../schemas/konvaShapes";
import {
  COURSE_KONVA_STROKE_COLOR,
  KONVA_CONNECTOR_HIT_STROKE_WIDTH,
} from "./courseKonvaTheme";
import {
  buildKonvaConnectorPathData,
  getKonvaConnectorPathMode,
  konvaConnectorArrowHeadPoints,
  konvaConnectorEndTangent,
} from "../runtime/diagram/konvaConnectorPath";

type KonvaConnectorShapeProps = {
  shape: KonvaConnectorShapeV1;
  readOnly: boolean;
  onSelect: (modifiers?: { shiftKey?: boolean }) => void;
  onAddBendPoint?: (shapeId: string, point: { x: number; y: number }) => void;
  onRemoveBendPoint?: (shapeId: string, point: { x: number; y: number }) => void;
  onGestureStart: () => void;
  onDragMove: (id: string, node: Konva.Node) => void;
  onDragEnd: (id: string, node: Konva.Node) => void;
};

type ConnectorPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;

function pointerEventToCanvas(event: ConnectorPointerEvent): { x: number; y: number } | null {
  const stage = event.target.getStage();
  if (stage == null) {
    return null;
  }
  const pointer = stage.getPointerPosition();
  if (pointer == null) {
    return null;
  }
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
}

export const KonvaConnectorShapeNode = forwardRef(function KonvaConnectorShapeNode(
  {
    shape,
    readOnly,
    onSelect,
    onAddBendPoint,
    onRemoveBendPoint,
    onGestureStart,
    onDragMove,
    onDragEnd,
  }: KonvaConnectorShapeProps,
  ref: Ref<Konva.Group>,
) {
  const stroke = shape.stroke ?? COURSE_KONVA_STROKE_COLOR;
  const strokeWidth = shape.strokeWidth ?? 2;
  const mode = getKonvaConnectorPathMode(shape);
  const isArrow = shape.type === "arrow";
  const pointerLength = shape.type === "arrow" ? (shape.pointerLength ?? 12) : 12;
  const pointerWidth = shape.type === "arrow" ? (shape.pointerWidth ?? 12) : 12;

  const handleSelect = (event: ConnectorPointerEvent) => {
    event.cancelBubble = true;
    onSelect({ shiftKey: "shiftKey" in event.evt ? event.evt.shiftKey : false });
  };

  const handleConnectorBendGesture = (event: ConnectorPointerEvent) => {
    event.cancelBubble = true;
    if (readOnly) {
      return;
    }
    const point = pointerEventToCanvas(event);
    if (point == null) {
      return;
    }
    const shiftKey = "shiftKey" in event.evt ? event.evt.shiftKey : false;
    onSelect({ shiftKey: false });
    if (shiftKey && onRemoveBendPoint != null) {
      onRemoveBendPoint(shape.id, point);
      return;
    }
    if (onAddBendPoint != null) {
      onAddBendPoint(shape.id, point);
    }
  };

  const selectEvents = {
    onClick: handleSelect,
    onTap: handleSelect,
  };

  const bendEvents =
    readOnly || (onAddBendPoint == null && onRemoveBendPoint == null)
      ? {}
      : {
          onDblClick: handleConnectorBendGesture,
          onDblTap: handleConnectorBendGesture,
        };

  const handleDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    onDragMove(shape.id, event.target);
  };

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(shape.id, event.target);
  };

  const dragProps = readOnly
    ? {}
    : {
        draggable: true as const,
        onDragStart: onGestureStart,
        onDragMove: handleDragMove,
        onDragEnd: handleDragEnd,
      };

  if (mode === "straight" && !isArrow) {
    return (
      <Group
        id={`connector-${shape.id}`}
        ref={ref}
        opacity={shape.opacity ?? 1}
        {...dragProps}
      >
        <Line
          points={[shape.x1, shape.y1, shape.x2, shape.y2]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineCap="round"
          hitStrokeWidth={KONVA_CONNECTOR_HIT_STROKE_WIDTH}
          perfectDrawEnabled={false}
          {...selectEvents}
          {...bendEvents}
        />
      </Group>
    );
  }

  if (mode === "straight" && isArrow) {
    return (
      <Group
        id={`connector-${shape.id}`}
        ref={ref}
        opacity={shape.opacity ?? 1}
        {...dragProps}
      >
        <KonvaArrow
          points={[shape.x1, shape.y1, shape.x2, shape.y2]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={stroke}
          pointerLength={pointerLength}
          pointerWidth={pointerWidth}
          lineCap="round"
          hitStrokeWidth={KONVA_CONNECTOR_HIT_STROKE_WIDTH}
          perfectDrawEnabled={false}
          {...selectEvents}
          {...bendEvents}
        />
      </Group>
    );
  }

  const pathData = buildKonvaConnectorPathData(shape);
  const tangent = konvaConnectorEndTangent(shape);
  const arrowHead =
    isArrow
      ? konvaConnectorArrowHeadPoints(
          tangent.x,
          tangent.y,
          tangent.angle,
          pointerLength,
          pointerWidth,
        )
      : null;

  return (
    <Group
      id={`connector-${shape.id}`}
      ref={ref}
      opacity={shape.opacity ?? 1}
      {...dragProps}
    >
      <Path
        data={pathData}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="transparent"
        lineJoin="round"
        lineCap="round"
        hitStrokeWidth={KONVA_CONNECTOR_HIT_STROKE_WIDTH}
        perfectDrawEnabled={false}
        {...selectEvents}
        {...bendEvents}
      />
      {arrowHead != null ? (
        <Line
          points={arrowHead}
          closed
          fill={stroke}
          stroke={stroke}
          strokeWidth={1}
          listening={false}
        />
      ) : null}
    </Group>
  );
});

export function refreshKonvaConnectorVisual(
  layer: Konva.Layer | null | undefined,
  shape: KonvaConnectorShapeV1,
): void {
  const node = layer?.findOne(`#connector-${shape.id}`);
  if (node == null) {
    return;
  }

  const mode = getKonvaConnectorPathMode(shape);
  if (mode === "straight") {
    const group = node as Konva.Group;
    const lineNode = group.getChildren().find(
      (child) => child.getClassName() === "Line" || child.getClassName() === "Arrow",
    );
    if (lineNode != null && "points" in lineNode) {
      (lineNode as Konva.Line).points([shape.x1, shape.y1, shape.x2, shape.y2]);
      node.getLayer()?.batchDraw();
    }
    return;
  }

  const pathNode =
    node.getClassName() === "Group" ? (node as Konva.Group).findOne("Path") : null;
  if (pathNode != null) {
    pathNode.setAttr("data", buildKonvaConnectorPathData(shape));
    if (shape.type === "arrow") {
      const tangent = konvaConnectorEndTangent(shape);
      const pointerLength = shape.pointerLength ?? 12;
      const pointerWidth = shape.pointerWidth ?? 12;
      const stroke = shape.stroke ?? COURSE_KONVA_STROKE_COLOR;
      const arrowHead = konvaConnectorArrowHeadPoints(
        tangent.x,
        tangent.y,
        tangent.angle,
        pointerLength,
        pointerWidth,
      );
      const headNode = (node as Konva.Group).findOne(
        (child: Konva.Node) => child.getClassName() === "Line",
      );
      headNode?.points(arrowHead);
      headNode?.fill(stroke);
      headNode?.stroke(stroke);
    }
    node.getLayer()?.batchDraw();
  }
}
