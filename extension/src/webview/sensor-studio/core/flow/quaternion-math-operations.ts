import type { FlowWireQuaternion, FlowWireVec3 } from "../live/flow-wire-types";
import { finiteNumberOrZero } from "./switch-combine-operations";

export type FlowQuat = FlowWireQuaternion;
export type FlowVec3 = FlowWireVec3;

function finiteQuat(q: FlowQuat | null | undefined): FlowQuat {
  if (q == null) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  return {
    x: finiteNumberOrZero(q.x),
    y: finiteNumberOrZero(q.y),
    z: finiteNumberOrZero(q.z),
    w: finiteNumberOrZero(q.w),
  };
}

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

export function quaternionLengthSquared(q: FlowQuat): number {
  const a = finiteQuat(q);
  return a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
}

export function quaternionNormalize(q: FlowQuat): FlowQuat {
  const lenSq = quaternionLengthSquared(q);
  if (lenSq < 1e-12) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  const inv = 1 / Math.sqrt(lenSq);
  const a = finiteQuat(q);
  return { x: a.x * inv, y: a.y * inv, z: a.z * inv, w: a.w * inv };
}

export function quaternionConjugate(q: FlowQuat): FlowQuat {
  const a = finiteQuat(q);
  return { x: -a.x, y: -a.y, z: -a.z, w: a.w };
}

export function quaternionInverse(q: FlowQuat): FlowQuat {
  const a = finiteQuat(q);
  const lenSq = quaternionLengthSquared(a);
  if (lenSq < 1e-12) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  const inv = 1 / lenSq;
  return { x: -a.x * inv, y: -a.y * inv, z: -a.z * inv, w: a.w * inv };
}

export function quaternionMultiply(a: FlowQuat, b: FlowQuat): FlowQuat {
  const A = finiteQuat(a);
  const B = finiteQuat(b);
  return {
    w: A.w * B.w - A.x * B.x - A.y * B.y - A.z * B.z,
    x: A.w * B.x + A.x * B.w + A.y * B.z - A.z * B.y,
    y: A.w * B.y - A.x * B.z + A.y * B.w + A.z * B.x,
    z: A.w * B.z + A.x * B.y - A.y * B.x + A.z * B.w,
  };
}

function quatDot(a: FlowQuat, b: FlowQuat): number {
  const A = finiteQuat(a);
  const B = finiteQuat(b);
  return A.x * B.x + A.y * B.y + A.z * B.z + A.w * B.w;
}

/** Shortest-path slerp; t clamped to [0, 1]. */
export function quaternionSlerp(a: FlowQuat, b: FlowQuat, t: number): FlowQuat {
  const f = Math.min(1, Math.max(0, finiteNumberOrZero(t)));
  let A = quaternionNormalize(a);
  let B = quaternionNormalize(b);
  let dot = quatDot(A, B);
  if (dot < 0) {
    dot = -dot;
    B = { x: -B.x, y: -B.y, z: -B.z, w: -B.w };
  }
  if (dot > 0.9995) {
    return quaternionNormalize({
      x: A.x + (B.x - A.x) * f,
      y: A.y + (B.y - A.y) * f,
      z: A.z + (B.z - A.z) * f,
      w: A.w + (B.w - A.w) * f,
    });
  }
  const theta0 = Math.acos(dot);
  const theta = theta0 * f;
  const sinTheta = Math.sin(theta);
  const sinTheta0 = Math.sin(theta0);
  const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const s1 = sinTheta / sinTheta0;
  return {
    x: s0 * A.x + s1 * B.x,
    y: s0 * A.y + s1 * B.y,
    z: s0 * A.z + s1 * B.z,
    w: s0 * A.w + s1 * B.w,
  };
}

/** Axis vector (any length) + angle in radians → unit quaternion. */
export function axisAngleToQuaternion(axis: FlowVec3, angleRad: number): FlowQuat {
  const a = finiteVec3(axis);
  const len = Math.hypot(a.x, a.y, a.z);
  const half = finiteNumberOrZero(angleRad) * 0.5;
  if (len < 1e-12) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  const s = Math.sin(half) / len;
  return quaternionNormalize({
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
    w: Math.cos(half),
  });
}

/** Wire Euler (x=roll, y=pitch, z=heading/yaw) radians → quaternion {x,y,z,w}. Intrinsic ZYX. */
export function eulerToQuaternion(euler: FlowVec3): FlowQuat {
  const roll = finiteVec3(euler).x;
  const pitch = finiteVec3(euler).y;
  const yaw = finiteVec3(euler).z;
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);
  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);
  return quaternionNormalize({
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  });
}

/** Quaternion → wire Euler (x=roll, y=pitch, z=heading/yaw) radians, ZYX. */
export function quaternionToEuler(q: FlowQuat): FlowVec3 {
  const Q = quaternionNormalize(q);
  const { x, y, z, w } = Q;
  const sinPitch = 2 * (w * y - z * x);
  const pitch = Math.abs(sinPitch) >= 1 ? Math.sign(sinPitch) * (Math.PI / 2) : Math.asin(sinPitch);
  const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y));
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  return { x: roll, y: pitch, z: yaw };
}

/** Rotate vector v by unit quaternion q (q * v * q⁻¹). */
export function rotateVectorByQuaternion(v: FlowVec3, q: FlowQuat): FlowVec3 {
  const vec = finiteVec3(v);
  const Q = quaternionNormalize(q);
  const qx = Q.x;
  const qy = Q.y;
  const qz = Q.z;
  const qw = Q.w;
  const ix = qw * vec.x + qy * vec.z - qz * vec.y;
  const iy = qw * vec.y + qz * vec.x - qx * vec.z;
  const iz = qw * vec.z + qx * vec.y - qy * vec.x;
  const iw = -qx * vec.x - qy * vec.y - qz * vec.z;
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}
