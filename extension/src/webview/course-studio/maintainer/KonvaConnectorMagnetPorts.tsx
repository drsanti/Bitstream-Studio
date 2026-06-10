import { Circle } from "react-konva";
import type { KonvaShapeV1 } from "../schemas/konvaShapes";
import { listKonvaShapeMagnetPorts } from "../runtime/diagram/konvaConnectorAnchor";
import { COURSE_KONVA_STROKE_COLOR } from "./courseKonvaTheme";

const MAGNET_PORT_RADIUS = 4;

/** Edge/corner ports shown while the line/arrow tool is active. */
export function KonvaConnectorMagnetPorts({ shapes }: { shapes: KonvaShapeV1[] }) {
  const ports = shapes.flatMap((shape) =>
    listKonvaShapeMagnetPorts(shape).map((port, index) => ({
      key: `${shape.id}-${port.anchor}-${index}`,
      ...port,
    })),
  );

  if (ports.length === 0) {
    return null;
  }

  return (
    <>
      {ports.map((port) => (
        <Circle
          key={port.key}
          x={port.x}
          y={port.y}
          radius={MAGNET_PORT_RADIUS}
          stroke={COURSE_KONVA_STROKE_COLOR}
          strokeWidth={1.5}
          fill="rgba(34, 211, 238, 0.2)"
          listening={false}
        />
      ))}
    </>
  );
}
