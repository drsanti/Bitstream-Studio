import { Circle } from "react-konva";
import type Konva from "konva";
import type { KonvaConnectorShapeV1 } from "../schemas/konvaShapes";
import type { DiagramAlignBounds, DiagramAlignmentGuide } from "../runtime/diagram/diagramAlignmentSnap";
import { snapKonvaCanvasPoint } from "../runtime/diagram/konvaAlignmentSnap";
import { patchKonvaConnectorEndpoints } from "../runtime/diagram/konvaConnectorPath";
import { snapKonvaConnectorPoint } from "../runtime/diagram/konvaConnectorSnap";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import { refreshKonvaConnectorVisual } from "./KonvaConnectorShape";

const ENDPOINT_HANDLE_RADIUS = 8;
const ENDPOINT_HANDLE_FILL = "#f59e0b";
const ENDPOINT_HANDLE_STROKE = "#000000";

type ConnectorShape = KonvaConnectorShapeV1;

export function KonvaConnectorEndpointHandles({
  shape,
  shapes,
  alignTargets,
  snapEnabled = true,
  magnetEnabled = true,
  onGestureStart,
  onGuidesChange,
  onCommit,
}: {
  shape: ConnectorShape;
  shapes: KonvaShapeV1[];
  alignTargets: DiagramAlignBounds[];
  snapEnabled?: boolean;
  magnetEnabled?: boolean;
  onGestureStart: () => void;
  onGuidesChange: (guides: DiagramAlignmentGuide[]) => void;
  onCommit: (next: ConnectorShape) => void;
}) {
  const snapPoint = (x: number, y: number, endpoint: "start" | "end") => {
    const aligned = snapKonvaCanvasPoint({ x, y, targets: alignTargets, snapEnabled });
    const magnet = snapKonvaConnectorPoint({
      x: aligned.x,
      y: aligned.y,
      shapes,
      excludeIds: [shape.id],
      magnetEnabled: snapEnabled && magnetEnabled,
    });
    return {
      x: magnet.x,
      y: magnet.y,
      guides: aligned.guides,
      attach: magnet.attach,
      endpoint,
    };
  };

  const previewShape = (endpoint: "start" | "end", x: number, y: number): ConnectorShape => {
    if (endpoint === "start") {
      return { ...shape, x1: x, y1: y };
    }
    return { ...shape, x2: x, y2: y };
  };

  const commitEndpoint = (endpoint: "start" | "end", node: Konva.Circle) => {
    onGuidesChange([]);
    const snapped = snapPoint(node.x(), node.y(), endpoint);
    node.position({ x: snapped.x, y: snapped.y });
    if (endpoint === "start") {
      onCommit(
        patchKonvaConnectorEndpoints(shape, {
          x1: snapped.x,
          y1: snapped.y,
          startAttach: snapped.attach ?? null,
        }),
      );
      return;
    }
    onCommit(
      patchKonvaConnectorEndpoints(shape, {
        x2: snapped.x,
        y2: snapped.y,
        endAttach: snapped.attach ?? null,
      }),
    );
  };

  const syncDuringDrag = (endpoint: "start" | "end", node: Konva.Circle) => {
    const snapped = snapPoint(node.x(), node.y(), endpoint);
    node.position({ x: snapped.x, y: snapped.y });
    onGuidesChange(snapped.guides);
    refreshKonvaConnectorVisual(node.getLayer(), previewShape(endpoint, snapped.x, snapped.y));
  };

  return (
    <>
      <Circle
        x={shape.x1}
        y={shape.y1}
        radius={ENDPOINT_HANDLE_RADIUS}
        fill={ENDPOINT_HANDLE_FILL}
        stroke={ENDPOINT_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDragMove={(event) => syncDuringDrag("start", event.target as Konva.Circle)}
        onDragEnd={(event) => commitEndpoint("start", event.target as Konva.Circle)}
      />
      <Circle
        x={shape.x2}
        y={shape.y2}
        radius={ENDPOINT_HANDLE_RADIUS}
        fill={ENDPOINT_HANDLE_FILL}
        stroke={ENDPOINT_HANDLE_STROKE}
        strokeWidth={1.5}
        draggable
        onDragStart={onGestureStart}
        onDragMove={(event) => syncDuringDrag("end", event.target as Konva.Circle)}
        onDragEnd={(event) => commitEndpoint("end", event.target as Konva.Circle)}
      />
    </>
  );
}
