import type { KonvaConnectorAttach } from "../../schemas/konvaConnector";
import type { KonvaShapeV1 } from "../../schemas/konvaShapes";
import { closestKonvaShapeMagnet } from "./konvaConnectorAnchor";

export const KONVA_CONNECTOR_MAGNET_THRESHOLD = 16;

export type KonvaConnectorMagnetSnap = {
  x: number;
  y: number;
  shapeId: string;
  anchor: NonNullable<KonvaConnectorAttach["anchor"]>;
};

export function snapKonvaConnectorMagnet(args: {
  x: number;
  y: number;
  shapes: KonvaShapeV1[];
  excludeIds?: string[];
  threshold?: number;
  enabled?: boolean;
}): KonvaConnectorMagnetSnap | null {
  if (args.enabled === false) {
    return null;
  }
  const threshold = args.threshold ?? KONVA_CONNECTOR_MAGNET_THRESHOLD;
  const excluded = new Set(args.excludeIds ?? []);
  let best: KonvaConnectorMagnetSnap | null = null;
  let bestDist = threshold;

  for (const shape of args.shapes) {
    if (excluded.has(shape.id)) {
      continue;
    }
    const magnet = closestKonvaShapeMagnet(args.x, args.y, shape);
    if (magnet == null) {
      continue;
    }
    const dist = Math.hypot(args.x - magnet.x, args.y - magnet.y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = {
        x: magnet.x,
        y: magnet.y,
        shapeId: shape.id,
        anchor: magnet.anchor === "auto" ? "center" : magnet.anchor,
      };
    }
  }

  return best;
}

export function snapKonvaConnectorPoint(args: {
  x: number;
  y: number;
  shapes: KonvaShapeV1[];
  excludeIds?: string[];
  magnetEnabled?: boolean;
}): { x: number; y: number; attach?: KonvaConnectorAttach } {
  const magnet = snapKonvaConnectorMagnet({
    x: args.x,
    y: args.y,
    shapes: args.shapes,
    excludeIds: args.excludeIds,
    enabled: args.magnetEnabled,
  });
  if (magnet == null) {
    return { x: args.x, y: args.y };
  }
  return {
    x: magnet.x,
    y: magnet.y,
    attach: { shapeId: magnet.shapeId, anchor: magnet.anchor },
  };
}
