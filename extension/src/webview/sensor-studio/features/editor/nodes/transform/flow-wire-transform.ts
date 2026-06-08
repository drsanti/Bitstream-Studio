import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";
import type { FlowWireVec3 } from "../../../../core/live/flow-wire-types";
import type { FusionEulerHundredths } from "../../../../../bitstream-app/components/3d-rotation/shared/bmi270FusionExtract";
import { fusionWireEulerHundredthsToThreeEulerRadComponents } from "../../../../../bitstream-app/components/3d-rotation/shared/fusionEulerWireToThreeEulerRad";

/** How **Transform from Euler** maps a vec3 wire into preview rotation. */
export type FlowWireTransformEulerMapping = "literal" | "fusion";

export const DEFAULT_FLOW_WIRE_TRANSFORM_EULER_MAPPING: FlowWireTransformEulerMapping = "fusion";

/** Serialized model root transform on **`transform`** flow wires (subset of `scene3d.model.transform`). */
export type FlowWireTransformV1 = {
  version: 1;
  position: { x: number; y: number; z: number };
  /** Editor-friendly degrees. Applied as scene XYZ when `eulerMapping` is absent or `literal`. */
  rotationDeg: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  /** Present when emitted by **Transform from Euler** — selects preview rotation path. */
  eulerMapping?: FlowWireTransformEulerMapping;
  /** Fusion wire scalars (rad ×100) when `eulerMapping` is `fusion` — used for preview parity with 3D Rotation · Euler. */
  fusionEulerHundredths?: FusionEulerHundredths;
};

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asVec3(
  v: unknown,
  fallback: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  if (v != null && typeof v === "object" && "x" in v && "y" in v && "z" in v) {
    const o = v as Record<string, unknown>;
    return {
      x: asFiniteNumber(o.x, fallback.x),
      y: asFiniteNumber(o.y, fallback.y),
      z: asFiniteNumber(o.z, fallback.z),
    };
  }
  return { ...fallback };
}

function asFusionEulerHundredths(v: unknown): FusionEulerHundredths | undefined {
  if (v == null || typeof v !== "object") {
    return undefined;
  }
  const o = v as Record<string, unknown>;
  return {
    roll: asFiniteNumber(o.roll, 0),
    pitch: asFiniteNumber(o.pitch, 0),
    heading: asFiniteNumber(o.heading, 0),
  };
}

export function readFlowWireTransformEulerMapping(raw: unknown): FlowWireTransformEulerMapping {
  return raw === "literal" ? "literal" : DEFAULT_FLOW_WIRE_TRANSFORM_EULER_MAPPING;
}

export function defaultFlowWireTransformV1(): FlowWireTransformV1 {
  const t = defaultScene3DConfig().model.transform;
  return {
    version: 1,
    position: { ...t.position },
    rotationDeg: { ...t.rotationDeg },
    scale: { ...t.scale },
  };
}

export function coerceFlowWireTransformV1(raw: unknown): FlowWireTransformV1 {
  const d = defaultFlowWireTransformV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  const posRaw = o.position;
  const rotRaw = o.rotationDeg;
  const scaleRaw = o.scale;
  const mappingRaw = o.eulerMapping;
  const eulerMapping =
    mappingRaw === "literal" || mappingRaw === "fusion" ? mappingRaw : undefined;
  const fusionEulerHundredths = asFusionEulerHundredths(o.fusionEulerHundredths);
  return {
    version: 1,
    position: asVec3(posRaw, d.position),
    rotationDeg: asVec3(rotRaw, d.rotationDeg),
    scale: asVec3(scaleRaw, d.scale),
    ...(eulerMapping != null ? { eulerMapping } : {}),
    ...(fusionEulerHundredths != null ? { fusionEulerHundredths } : {}),
  };
}

export function flowWireTransformFromNodeDefaultConfig(dc: Record<string, unknown>): FlowWireTransformV1 {
  return coerceFlowWireTransformV1({ version: 1, ...dc });
}

/** Flat `defaultConfig` patch for Object Transform / mesh embedded transform authoring. */
export function flowWireTransformFieldsForNodeConfigPatch(
  transform: FlowWireTransformV1,
): Record<string, unknown> {
  return {
    version: 1,
    position: { ...transform.position },
    rotationDeg: { ...transform.rotationDeg },
    scale: { ...transform.scale },
  };
}

/** Build a transform wire from Euler radians (Sensor Studio vec3: x=roll, y=pitch, z=heading/yaw). */
export function flowWireTransformFromEulerRad(
  euler: FlowWireVec3,
  base: FlowWireTransformV1 = defaultFlowWireTransformV1(),
  eulerMapping: FlowWireTransformEulerMapping = DEFAULT_FLOW_WIRE_TRANSFORM_EULER_MAPPING,
): FlowWireTransformV1 {
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  if (eulerMapping === "fusion") {
    const hundredths = {
      roll: Math.round(euler.x * 100),
      pitch: Math.round(euler.y * 100),
      heading: Math.round(euler.z * 100),
    };
    const { ex, ey, ez } = fusionWireEulerHundredthsToThreeEulerRadComponents(hundredths);
    return {
      ...base,
      rotationDeg: { x: toDeg(ex), y: toDeg(ey), z: toDeg(ez) },
      eulerMapping: "fusion",
      fusionEulerHundredths: hundredths,
    };
  }
  return {
    ...base,
    rotationDeg: {
      x: toDeg(euler.x),
      y: toDeg(euler.y),
      z: toDeg(euler.z),
    },
    eulerMapping: "literal",
  };
}

export function mergeFlowWireTransformIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireTransformV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    model: {
      ...scene3d.model,
      transform: {
        position: { ...wire.position },
        rotationDeg: { ...wire.rotationDeg },
        scale: { ...wire.scale },
      },
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireTransformV1(v: unknown): v is FlowWireTransformV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireTransformV1).version === 1 &&
    typeof (v as FlowWireTransformV1).position === "object" &&
    typeof (v as FlowWireTransformV1).rotationDeg === "object" &&
    typeof (v as FlowWireTransformV1).scale === "object"
  );
}
