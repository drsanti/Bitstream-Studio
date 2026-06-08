import type { FlowWireMeshV1 } from "./flow-wire-mesh";

const MIN_HALF = 0.05;

function clampHalf(value: number): number {
  return value >= MIN_HALF ? value : MIN_HALF;
}

function readScale(wire: FlowWireMeshV1): { x: number; y: number; z: number } {
  const s = wire.transform?.scale;
  if (s == null) {
    return { x: 1, y: 1, z: 1 };
  }
  return {
    x: Number.isFinite(s.x) && s.x !== 0 ? Math.abs(s.x) : 1,
    y: Number.isFinite(s.y) && s.y !== 0 ? Math.abs(s.y) : 1,
    z: Number.isFinite(s.z) && s.z !== 0 ? Math.abs(s.z) : 1,
  };
}

function scaledHalf(
  hx: number,
  hy: number,
  hz: number,
  scale: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  return {
    x: clampHalf(hx * scale.x),
    y: clampHalf(hy * scale.y),
    z: clampHalf(hz * scale.z),
  };
}

/** Axis-aligned half extents for Rapier box colliders derived from a procedural mesh wire. */
export function halfExtentsFromFlowWireMeshV1(
  wire: FlowWireMeshV1,
): { x: number; y: number; z: number } {
  const scale = readScale(wire);
  if (wire.kind === "box" && wire.box != null) {
    return scaledHalf(wire.box.width / 2, wire.box.height / 2, wire.box.depth / 2, scale);
  }
  if (wire.kind === "sphere" && wire.sphere != null) {
    const r = wire.sphere.radius;
    return scaledHalf(r, r, r, scale);
  }
  if (wire.kind === "plane" && wire.plane != null) {
    return scaledHalf(wire.plane.width / 2, MIN_HALF, wire.plane.height / 2, scale);
  }
  if (wire.kind === "cylinder" && wire.cylinder != null) {
    const r = Math.max(wire.cylinder.radiusTop, wire.cylinder.radiusBottom);
    return scaledHalf(r, wire.cylinder.height / 2, r, scale);
  }
  if (wire.kind === "cone" && wire.cone != null) {
    return scaledHalf(wire.cone.radius, wire.cone.height / 2, wire.cone.radius, scale);
  }
  if (wire.kind === "torus" && wire.torus != null) {
    const outer = wire.torus.radius + wire.torus.tube;
    return scaledHalf(outer, wire.torus.tube, outer, scale);
  }
  if (wire.kind === "capsule" && wire.capsule != null) {
    const r = wire.capsule.radius;
    const halfY = wire.capsule.length / 2 + r;
    return scaledHalf(r, halfY, r, scale);
  }
  const fallback = Math.max(MIN_HALF, readScale(wire).x);
  return { x: fallback, y: fallback, z: fallback };
}

export function positionFromFlowWireMeshV1(
  wire: FlowWireMeshV1,
  fallback: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  const p = wire.transform?.position;
  if (p == null) {
    return fallback;
  }
  return {
    x: Number.isFinite(p.x) ? p.x : fallback.x,
    y: Number.isFinite(p.y) ? p.y : fallback.y,
    z: Number.isFinite(p.z) ? p.z : fallback.z,
  };
}
