import type { FlowWireQuaternion, FlowWireVec3 } from "../live/flow-wire-types";
import {
  accelNearOneG,
  eulerHeadingRad,
  tiltFromAccel,
  vectorAdd,
  vectorAngleRad,
  vectorCross,
  vectorDistance,
  vectorDot,
  vectorLength,
  vectorLengthSquared,
  vectorLerp,
  vectorNormalize,
  vectorProject,
  vectorReject,
  vectorScale,
  vectorSubtract,
} from "./vector-math-operations";
import {
  axisAngleToQuaternion,
  eulerToQuaternion,
  quaternionConjugate,
  quaternionInverse,
  quaternionMultiply,
  quaternionNormalize,
  quaternionSlerp,
  quaternionToEuler,
  rotateVectorByQuaternion,
} from "./quaternion-math-operations";

export type FlowMathReadIncoming = (handleId: string) => unknown;

function asVec3(v: unknown): FlowWireVec3 {
  if (v != null && typeof v === "object" && "x" in v && "y" in v && "z" in v) {
    const o = v as { x: unknown; y: unknown; z: unknown };
    return {
      x: typeof o.x === "number" ? o.x : 0,
      y: typeof o.y === "number" ? o.y : 0,
      z: typeof o.z === "number" ? o.z : 0,
    };
  }
  return { x: 0, y: 0, z: 0 };
}

function asQuat(v: unknown): FlowWireQuaternion {
  if (v != null && typeof v === "object" && "w" in v) {
    const o = v as { x: unknown; y: unknown; z: unknown; w: unknown };
    return {
      x: typeof o.x === "number" ? o.x : 0,
      y: typeof o.y === "number" ? o.y : 0,
      z: typeof o.z === "number" ? o.z : 0,
      w: typeof o.w === "number" ? o.w : 1,
    };
  }
  return { x: 0, y: 0, z: 0, w: 1 };
}

function asNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function compareScalar(op: string | undefined, a: number, b: number): boolean {
  switch (op) {
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case ">=":
      return a >= b;
    case "==":
      return a === b;
    case "!=":
      return a !== b;
    case ">":
    default:
      return a > b;
  }
}

/** Evaluate a vector/quaternion math catalog node; returns pin value or null when unknown id. */
export function evaluateVectorQuaternionMathNode(
  nodeId: string,
  read: FlowMathReadIncoming,
  defaultConfig: Record<string, unknown>,
): number | boolean | FlowWireVec3 | FlowWireQuaternion | null {
  switch (nodeId) {
    case "vector-length":
      return vectorLength(asVec3(read("in")));
    case "vector-length-squared":
      return vectorLengthSquared(asVec3(read("in")));
    case "vector-normalize":
      return vectorNormalize(asVec3(read("in")));
    case "vector-scale":
      return vectorScale(asVec3(read("in")), asNumber(read("scale")));
    case "vector-add": {
      const op = defaultConfig.operation === "sub" ? "sub" : "add";
      const a = asVec3(read("a"));
      const b = asVec3(read("b"));
      return op === "sub" ? vectorSubtract(a, b) : vectorAdd(a, b);
    }
    case "vector-distance":
      return vectorDistance(asVec3(read("a")), asVec3(read("b")));
    case "vector-dot":
      return vectorDot(asVec3(read("a")), asVec3(read("b")));
    case "vector-cross":
      return vectorCross(asVec3(read("a")), asVec3(read("b")));
    case "vector-lerp":
      return vectorLerp(asVec3(read("a")), asVec3(read("b")), asNumber(read("t")));
    case "vector-project":
      return vectorProject(asVec3(read("onto")), asVec3(read("v")));
    case "vector-reject":
      return vectorReject(asVec3(read("onto")), asVec3(read("v")));
    case "vector-angle":
      return vectorAngleRad(asVec3(read("a")), asVec3(read("b")));
    case "compare-vector-length": {
      const len = vectorLength(asVec3(read("in")));
      const threshold = asNumber(read("threshold"));
      const op = typeof defaultConfig.operation === "string" ? defaultConfig.operation : ">";
      return compareScalar(op, len, threshold);
    }
    case "tilt-from-accel":
      return tiltFromAccel(asVec3(read("in")));
    case "euler-heading":
      return eulerHeadingRad(asVec3(read("in")));
    case "accel-near-1g":
      return accelNearOneG(asVec3(read("in")));
    case "degrees-to-radians":
      return (asNumber(read("in")) * Math.PI) / 180;
    case "radians-to-degrees":
      return (asNumber(read("in")) * 180) / Math.PI;
    case "quaternion-normalize":
      return quaternionNormalize(asQuat(read("in")));
    case "quaternion-multiply":
      return quaternionMultiply(asQuat(read("a")), asQuat(read("b")));
    case "quaternion-conjugate":
      return quaternionConjugate(asQuat(read("in")));
    case "quaternion-inverse":
      return quaternionInverse(asQuat(read("in")));
    case "quaternion-slerp":
      return quaternionSlerp(asQuat(read("a")), asQuat(read("b")), asNumber(read("t")));
    case "axis-angle-to-quaternion":
      return axisAngleToQuaternion(asVec3(read("axis")), asNumber(read("angle")));
    case "euler-to-quaternion":
      return eulerToQuaternion(asVec3(read("in")));
    case "quaternion-to-euler":
      return quaternionToEuler(asQuat(read("in")));
    case "rotate-vector-by-quaternion":
      return rotateVectorByQuaternion(asVec3(read("v")), asQuat(read("q")));
    default:
      return null;
  }
}

export const VECTOR_QUATERNION_MATH_NODE_IDS = [
  "vector-length",
  "vector-length-squared",
  "vector-normalize",
  "vector-scale",
  "vector-add",
  "vector-distance",
  "vector-dot",
  "vector-cross",
  "vector-lerp",
  "vector-project",
  "vector-reject",
  "vector-angle",
  "compare-vector-length",
  "tilt-from-accel",
  "euler-heading",
  "accel-near-1g",
  "degrees-to-radians",
  "radians-to-degrees",
  "quaternion-normalize",
  "quaternion-multiply",
  "quaternion-conjugate",
  "quaternion-inverse",
  "quaternion-slerp",
  "axis-angle-to-quaternion",
  "euler-to-quaternion",
  "quaternion-to-euler",
  "rotate-vector-by-quaternion",
] as const;

export type VectorQuaternionMathNodeId = (typeof VECTOR_QUATERNION_MATH_NODE_IDS)[number];

export function isVectorQuaternionMathNodeId(nodeId: string): nodeId is VectorQuaternionMathNodeId {
  return (VECTOR_QUATERNION_MATH_NODE_IDS as readonly string[]).includes(nodeId);
}

/** Single-output pin id for math nodes (scalar, vec3, quat, boolean). */
export function vectorQuaternionMathOutputHandleId(
  nodeId: string,
): "out" | null {
  if (!isVectorQuaternionMathNodeId(nodeId)) {
    return null;
  }
  return "out";
}
