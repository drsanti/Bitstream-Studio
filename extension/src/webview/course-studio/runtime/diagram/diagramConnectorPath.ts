import type { ArrowNodeV1, LineNodeV1 } from "../../schemas/diagram.v1";

export type ConnectorCurveV1 = {
  cx: number;
  cy: number;
};

export type ConnectorEndpoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function hasConnectorCurve(
  node: LineNodeV1 | ArrowNodeV1,
): node is (LineNodeV1 | ArrowNodeV1) & { curve: ConnectorCurveV1 } {
  return node.curve != null;
}

export function defaultQuadraticControl(
  endpoints: ConnectorEndpoints,
  bend = 24,
): ConnectorCurveV1 {
  const { x1, y1, x2, y2 } = endpoints;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return { cx: midX, cy: midY - bend };
  }
  const nx = -dy / length;
  const ny = dx / length;
  return { cx: midX + nx * bend, cy: midY + ny * bend };
}

export function buildQuadraticConnectorPath(
  endpoints: ConnectorEndpoints,
  curve: ConnectorCurveV1,
): string {
  const { x1, y1, x2, y2 } = endpoints;
  return `M ${x1} ${y1} Q ${curve.cx} ${curve.cy} ${x2} ${y2}`;
}

export function connectorBounds(
  endpoints: ConnectorEndpoints,
  curve?: ConnectorCurveV1 | null,
): { x: number; y: number; width: number; height: number } {
  const xs = [endpoints.x1, endpoints.x2];
  const ys = [endpoints.y1, endpoints.y2];
  if (curve != null) {
    xs.push(curve.cx);
    ys.push(curve.cy);
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = 10;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function translateConnectorCurve(
  curve: ConnectorCurveV1,
  dx: number,
  dy: number,
): ConnectorCurveV1 {
  return { cx: curve.cx + dx, cy: curve.cy + dy };
}
