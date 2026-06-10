import { Circle } from "react-konva";
import type Konva from "konva";
import type { KonvaConnectorShapeV1 } from "../schemas/konvaShapes";
import { snapKonvaCanvasPoint } from "../runtime/diagram/konvaAlignmentSnap";
import type { DiagramAlignBounds, DiagramAlignmentGuide } from "../runtime/diagram/diagramAlignmentSnap";
import {
  getKonvaConnectorPathMode,
  removeKonvaConnectorBendPointAt,
} from "../runtime/diagram/konvaConnectorPath";
import { refreshKonvaConnectorVisual } from "./KonvaConnectorShape";

const PATH_HANDLE_RADIUS = 7;
const PATH_HANDLE_FILL = "#22d3ee";
const PATH_HANDLE_STROKE = "#000000";

type ConnectorShape = KonvaConnectorShapeV1;

type CommitOptions = { recordUndo?: boolean };

function commitShape(
  layer: Konva.Layer | null | undefined,
  shape: ConnectorShape,
  next: ConnectorShape,
  onCommit: (next: ConnectorShape, options?: CommitOptions) => void,
  options?: CommitOptions,
) {
  onCommit(next, options);
  refreshKonvaConnectorVisual(layer, next);
}

export function KonvaConnectorPathHandles({
  shape,
  alignTargets,
  snapEnabled = true,
  onGestureStart,
  onGuidesChange,
  onCommit,
}: {
  shape: ConnectorShape;
  alignTargets: DiagramAlignBounds[];
  snapEnabled?: boolean;
  onGestureStart: () => void;
  onGuidesChange: (guides: DiagramAlignmentGuide[]) => void;
  onCommit: (next: ConnectorShape, options?: CommitOptions) => void;
}) {
  const mode = getKonvaConnectorPathMode(shape);
  const snapPoint = (x: number, y: number) =>
    snapKonvaCanvasPoint({ x, y, targets: alignTargets, snapEnabled });

  const removeAtIndex = (index: number) => (event: Konva.KonvaEventObject<MouseEvent>) => {
    event.cancelBubble = true;
    const next = removeKonvaConnectorBendPointAt(shape, index);
    if (next != null) {
      onCommit(next, { recordUndo: true });
    }
  };

  if (mode === "quadratic") {
    const curve = shape.curve;
    if (curve == null) {
      return null;
    }
    return (
      <Circle
        x={curve.cx}
        y={curve.cy}
        radius={PATH_HANDLE_RADIUS}
        fill={PATH_HANDLE_FILL}
        stroke={PATH_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDblClick={removeAtIndex(0)}
        onDblTap={removeAtIndex(0)}
        onDragMove={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          node.position({ x: snapped.x, y: snapped.y });
          onGuidesChange(snapped.guides);
          commitShape(
            node.getLayer(),
            shape,
            { ...shape, curve: { cx: snapped.x, cy: snapped.y } },
            onCommit,
          );
        }}
        onDragEnd={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          onGuidesChange([]);
          onCommit({ ...shape, curve: { cx: snapped.x, cy: snapped.y } });
          node.position({ x: snapped.x, y: snapped.y });
        }}
      />
    );
  }

  if (mode === "spline") {
    return (shape.waypoints ?? []).map((point, index) => (
      <Circle
        key={`waypoint-${index}`}
        x={point.x}
        y={point.y}
        radius={PATH_HANDLE_RADIUS}
        fill={PATH_HANDLE_FILL}
        stroke={PATH_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDblClick={removeAtIndex(index)}
        onDblTap={removeAtIndex(index)}
        onDragMove={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          node.position({ x: snapped.x, y: snapped.y });
          onGuidesChange(snapped.guides);
          const waypoints = [...(shape.waypoints ?? [])];
          waypoints[index] = { x: snapped.x, y: snapped.y };
          commitShape(node.getLayer(), shape, { ...shape, waypoints }, onCommit);
        }}
        onDragEnd={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          onGuidesChange([]);
          const waypoints = [...(shape.waypoints ?? [])];
          waypoints[index] = { x: snapped.x, y: snapped.y };
          onCommit({ ...shape, waypoints });
        }}
      />
    ));
  }

  if (mode === "tension") {
    return (shape.vertices ?? []).map((point, index) => (
      <Circle
        key={`vertex-${index}`}
        x={point.x}
        y={point.y}
        radius={PATH_HANDLE_RADIUS}
        fill={PATH_HANDLE_FILL}
        stroke={PATH_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDblClick={removeAtIndex(index)}
        onDblTap={removeAtIndex(index)}
        onDragMove={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          node.position({ x: snapped.x, y: snapped.y });
          onGuidesChange(snapped.guides);
          const vertices = [...(shape.vertices ?? [])];
          vertices[index] = { x: snapped.x, y: snapped.y };
          commitShape(node.getLayer(), shape, { ...shape, vertices }, onCommit);
        }}
        onDragEnd={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          onGuidesChange([]);
          const vertices = [...(shape.vertices ?? [])];
          vertices[index] = { x: snapped.x, y: snapped.y };
          onCommit({ ...shape, vertices });
        }}
      />
    ));
  }

  if (mode === "bezier") {
    return (shape.knots ?? []).map((knot, index) => (
      <Circle
        key={`knot-${index}`}
        x={knot.x}
        y={knot.y}
        radius={PATH_HANDLE_RADIUS}
        fill={PATH_HANDLE_FILL}
        stroke={PATH_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDblClick={removeAtIndex(index)}
        onDblTap={removeAtIndex(index)}
        onDragMove={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          node.position({ x: snapped.x, y: snapped.y });
          onGuidesChange(snapped.guides);
          const knots = [...(shape.knots ?? [])];
          knots[index] = { ...knots[index]!, x: snapped.x, y: snapped.y };
          commitShape(node.getLayer(), shape, { ...shape, knots }, onCommit);
        }}
        onDragEnd={(event) => {
          const node = event.target as Konva.Circle;
          const snapped = snapPoint(node.x(), node.y());
          onGuidesChange([]);
          const knots = [...(shape.knots ?? [])];
          knots[index] = { ...knots[index]!, x: snapped.x, y: snapped.y };
          onCommit({ ...shape, knots });
        }}
      />
    ));
  }

  return null;
}
