import type { FlowWireVec3 } from "../live/flow-wire-types";
import { finiteNumberOrZero } from "./switch-combine-operations";

export type FlowVec3 = FlowWireVec3;

function finiteVec3(v: FlowVec3 | null | undefined): FlowVec3 {
  if (v == null) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: finiteNumberOrZero(v.x),
    y: finiteNumberOrZero(v.y),
    z: finiteNumberOrZero(v.z),
  };
}

export function vectorLengthSquared(v: FlowVec3): number {
  const a = finiteVec3(v);
  return a.x * a.x + a.y * a.y + a.z * a.z;
}

export function vectorLength(v: FlowVec3): number {
  const lenSq = vectorLengthSquared(v);
  return lenSq > 0 ? Math.sqrt(lenSq) : 0;
}

export function vectorNormalize(v: FlowVec3): FlowVec3 {
  const len = vectorLength(v);
  if (len < 1e-12) {
    return { x: 0, y: 0, z: 0 };
  }
  const a = finiteVec3(v);
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

export function vectorScale(v: FlowVec3, scale: number): FlowVec3 {
  const s = finiteNumberOrZero(scale);
  const a = finiteVec3(v);
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function vectorAdd(a: FlowVec3, b: FlowVec3): FlowVec3 {
  const A = finiteVec3(a);
  const B = finiteVec3(b);
  return { x: A.x + B.x, y: A.y + B.y, z: A.z + B.z };
}

export function vectorSubtract(a: FlowVec3, b: FlowVec3): FlowVec3 {
  const A = finiteVec3(a);
  const B = finiteVec3(b);
  return { x: A.x - B.x, y: A.y - B.y, z: A.z - B.z };
}

export function vectorDistance(a: FlowVec3, b: FlowVec3): number {
  return vectorLength(vectorSubtract(a, b));
}

export function vectorDot(a: FlowVec3, b: FlowVec3): number {
  const A = finiteVec3(a);
  const B = finiteVec3(b);
  return A.x * B.x + A.y * B.y + A.z * B.z;
}

export function vectorCross(a: FlowVec3, b: FlowVec3): FlowVec3 {
  const A = finiteVec3(a);
  const B = finiteVec3(b);
  return {
    x: A.y * B.z - A.z * B.y,
    y: A.z * B.x - A.x * B.z,
    z: A.x * B.y - A.y * B.x,
  };
}

export function vectorLerp(a: FlowVec3, b: FlowVec3, t: number): FlowVec3 {
  const f = Math.min(1, Math.max(0, finiteNumberOrZero(t)));
  const A = finiteVec3(a);
  const B = finiteVec3(b);
  return {
    x: A.x + (B.x - A.x) * f,
    y: A.y + (B.y - A.y) * f,
    z: A.z + (B.z - A.z) * f,
  };
}

export function vectorProject(onto: FlowVec3, v: FlowVec3): FlowVec3 {
  const O = finiteVec3(onto);
  const V = finiteVec3(v);
  const denom = vectorLengthSquared(O);
  if (denom < 1e-12) {
    return { x: 0, y: 0, z: 0 };
  }
  const scale = vectorDot(V, O) / denom;
  return vectorScale(O, scale);
}

export function vectorReject(onto: FlowVec3, v: FlowVec3): FlowVec3 {
  return vectorSubtract(v, vectorProject(onto, v));
}

export function vectorAngleRad(a: FlowVec3, b: FlowVec3): number {
  const A = vectorNormalize(a);
  const B = vectorNormalize(b);
  const dot = Math.min(1, Math.max(-1, vectorDot(A, B)));
  return Math.acos(dot);
}

/** Sensor Studio wire Euler: x = roll, y = pitch, z = heading (yaw), radians — intrinsic ZYX. */
export function tiltFromAccel(accel: FlowVec3): FlowVec3 {
  const a = finiteVec3(accel);
  const roll = Math.atan2(a.y, a.z);
  const pitch = Math.atan2(-a.x, Math.hypot(a.y, a.z));
  return { x: roll, y: pitch, z: 0 };
}

export function eulerHeadingRad(euler: FlowVec3): number {
  return finiteVec3(euler).z;
}

export function accelNearOneG(accel: FlowVec3, low = 9, high = 10.5): boolean {
  const mag = vectorLength(accel);
  return mag >= low && mag <= high;
}
