import {
  coerceFlowWireMaterialV1,
  type FlowWireMaterialV1,
} from "../material/flow-wire-material";
import {
  coerceFlowWireTransformV1,
  type FlowWireTransformV1,
} from "../transform/flow-wire-transform";

/** Procedural geometry kind on **`mesh`** flow wires. */
export type MeshPrimitiveKindV1 =
  | "box"
  | "sphere"
  | "plane"
  | "cylinder"
  | "cone"
  | "torus"
  | "capsule";

export type FlowWireMeshKindV1 = MeshPrimitiveKindV1 | "group";

export type FlowWireMeshBoxParamsV1 = {
  width: number;
  height: number;
  depth: number;
};

export type FlowWireMeshSphereParamsV1 = {
  radius: number;
  widthSegments: number;
  heightSegments: number;
};

export type FlowWireMeshPlaneParamsV1 = {
  width: number;
  height: number;
};

export type FlowWireMeshCylinderParamsV1 = {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
};

export type FlowWireMeshConeParamsV1 = {
  radius: number;
  height: number;
  radialSegments: number;
};

export type FlowWireMeshTorusParamsV1 = {
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
};

export type FlowWireMeshCapsuleParamsV1 = {
  radius: number;
  length: number;
  capSegments: number;
  radialSegments: number;
};

/** Serializable procedural mesh recipe (Phase 2+). */
export type FlowWireMeshV1 = {
  version: 1;
  kind: FlowWireMeshKindV1;
  box?: FlowWireMeshBoxParamsV1;
  sphere?: FlowWireMeshSphereParamsV1;
  plane?: FlowWireMeshPlaneParamsV1;
  cylinder?: FlowWireMeshCylinderParamsV1;
  cone?: FlowWireMeshConeParamsV1;
  torus?: FlowWireMeshTorusParamsV1;
  capsule?: FlowWireMeshCapsuleParamsV1;
  /** Present when `kind` is `group` — ordered primitive meshes (no nested groups). */
  children?: FlowWireMeshV1[];
  material?: FlowWireMaterialV1;
  transform?: FlowWireTransformV1;
};

export function isMeshPrimitiveKindV1(value: unknown): value is MeshPrimitiveKindV1 {
  return (
    value === "box" ||
    value === "sphere" ||
    value === "plane" ||
    value === "cylinder" ||
    value === "cone" ||
    value === "torus" ||
    value === "capsule"
  );
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asPositive(value: unknown, fallback: number): number {
  const n = asFiniteNumber(value, fallback);
  return n > 0 ? n : fallback;
}

function asNonNegative(value: unknown, fallback: number): number {
  const n = asFiniteNumber(value, fallback);
  return n >= 0 ? n : fallback;
}

function asSegmentCount(value: unknown, fallback: number, min = 3): number {
  const n = Math.round(asFiniteNumber(value, fallback));
  return n >= min ? n : fallback;
}

function coerceBoxParams(raw: unknown): FlowWireMeshBoxParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    width: asPositive(o.width, 1),
    height: asPositive(o.height, 1),
    depth: asPositive(o.depth, 1),
  };
}

function coerceSphereParams(raw: unknown): FlowWireMeshSphereParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    radius: asPositive(o.radius, 0.5),
    widthSegments: asSegmentCount(o.widthSegments, 32),
    heightSegments: asSegmentCount(o.heightSegments, 16),
  };
}

function coercePlaneParams(raw: unknown): FlowWireMeshPlaneParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    width: asPositive(o.width, 1),
    height: asPositive(o.height, 1),
  };
}

function coerceCylinderParams(raw: unknown): FlowWireMeshCylinderParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    radiusTop: asNonNegative(o.radiusTop, 0.5),
    radiusBottom: asNonNegative(o.radiusBottom, 0.5),
    height: asPositive(o.height, 1),
    radialSegments: asSegmentCount(o.radialSegments, 32),
  };
}

function coerceConeParams(raw: unknown): FlowWireMeshConeParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    radius: asPositive(o.radius, 0.5),
    height: asPositive(o.height, 1),
    radialSegments: asSegmentCount(o.radialSegments, 32),
  };
}

function coerceTorusParams(raw: unknown): FlowWireMeshTorusParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    radius: asPositive(o.radius, 0.5),
    tube: asPositive(o.tube, 0.2),
    radialSegments: asSegmentCount(o.radialSegments, 16),
    tubularSegments: asSegmentCount(o.tubularSegments, 48),
  };
}

function coerceCapsuleParams(raw: unknown): FlowWireMeshCapsuleParamsV1 | undefined {
  if (raw == null || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return {
    radius: asPositive(o.radius, 0.25),
    length: asPositive(o.length, 0.5),
    capSegments: asSegmentCount(o.capSegments, 8, 1),
    radialSegments: asSegmentCount(o.radialSegments, 16),
  };
}

function coercePrimitiveMeshWire(o: Record<string, unknown>): FlowWireMeshV1 | null {
  const kind = o.kind;
  if (!isMeshPrimitiveKindV1(kind)) {
    return null;
  }
  const wire: FlowWireMeshV1 = { version: 1, kind };

  if (kind === "box") {
    const box = coerceBoxParams(o.box);
    if (box == null) {
      return null;
    }
    wire.box = box;
  } else if (kind === "sphere") {
    const sphere = coerceSphereParams(o.sphere);
    if (sphere == null) {
      return null;
    }
    wire.sphere = sphere;
  } else if (kind === "plane") {
    const plane = coercePlaneParams(o.plane);
    if (plane == null) {
      return null;
    }
    wire.plane = plane;
  } else if (kind === "cylinder") {
    const cylinder = coerceCylinderParams(o.cylinder);
    if (cylinder == null) {
      return null;
    }
    wire.cylinder = cylinder;
  } else if (kind === "cone") {
    const cone = coerceConeParams(o.cone);
    if (cone == null) {
      return null;
    }
    wire.cone = cone;
  } else if (kind === "torus") {
    const torus = coerceTorusParams(o.torus);
    if (torus == null) {
      return null;
    }
    wire.torus = torus;
  } else {
    const capsule = coerceCapsuleParams(o.capsule);
    if (capsule == null) {
      return null;
    }
    wire.capsule = capsule;
  }

  const material = coerceFlowWireMaterialV1(o.material);
  if (material != null) {
    wire.material = material;
  }
  const transform = coerceFlowWireTransformV1(o.transform);
  if (transform != null) {
    wire.transform = transform;
  }
  return wire;
}

export function coerceFlowWireMeshV1(raw: unknown): FlowWireMeshV1 | null {
  if (raw == null || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) {
    return null;
  }
  if (o.kind === "group") {
    const rawChildren = o.children;
    if (!Array.isArray(rawChildren)) {
      return null;
    }
    const children: FlowWireMeshV1[] = [];
    for (const child of rawChildren) {
      if (child == null || typeof child !== "object") {
        continue;
      }
      const coerced = coercePrimitiveMeshWire(child as Record<string, unknown>);
      if (coerced != null) {
        children.push(coerced);
      }
    }
    return { version: 1, kind: "group", children };
  }
  return coercePrimitiveMeshWire(o);
}

export function isFlowWireMeshV1(value: unknown): value is FlowWireMeshV1 {
  return coerceFlowWireMeshV1(value) != null;
}

/** Expand a mesh wire into primitive leaves for Stage snapshot / viewport. */
export function flattenFlowWireMeshesForStage(wire: FlowWireMeshV1): FlowWireMeshV1[] {
  if (wire.kind === "group") {
    return (wire.children ?? []).filter((c) => isMeshPrimitiveKindV1(c.kind));
  }
  if (isMeshPrimitiveKindV1(wire.kind)) {
    return [wire];
  }
  return [];
}
