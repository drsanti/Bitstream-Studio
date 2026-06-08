import {
  coerceFlowWireMeshV1,
  type FlowWireMeshV1,
  type MeshPrimitiveKindV1,
} from "./flow-wire-mesh";
import type { FlowWireMaterialV1 } from "../material/flow-wire-material";
import {
  flowWireTransformFromNodeDefaultConfig,
  type FlowWireTransformV1,
} from "../transform/flow-wire-transform";

export const MESH_BOX_WIDTH_KEY = "meshBoxWidth" as const;
export const MESH_BOX_HEIGHT_KEY = "meshBoxHeight" as const;
export const MESH_BOX_DEPTH_KEY = "meshBoxDepth" as const;

export const MESH_SPHERE_RADIUS_KEY = "meshSphereRadius" as const;
export const MESH_SPHERE_WIDTH_SEGMENTS_KEY = "meshSphereWidthSegments" as const;
export const MESH_SPHERE_HEIGHT_SEGMENTS_KEY = "meshSphereHeightSegments" as const;

export const MESH_PLANE_WIDTH_KEY = "meshPlaneWidth" as const;
export const MESH_PLANE_HEIGHT_KEY = "meshPlaneHeight" as const;

export const MESH_CYLINDER_RADIUS_TOP_KEY = "meshCylinderRadiusTop" as const;
export const MESH_CYLINDER_RADIUS_BOTTOM_KEY = "meshCylinderRadiusBottom" as const;
export const MESH_CYLINDER_HEIGHT_KEY = "meshCylinderHeight" as const;
export const MESH_CYLINDER_RADIAL_SEGMENTS_KEY = "meshCylinderRadialSegments" as const;

export const MESH_CONE_RADIUS_KEY = "meshConeRadius" as const;
export const MESH_CONE_HEIGHT_KEY = "meshConeHeight" as const;
export const MESH_CONE_RADIAL_SEGMENTS_KEY = "meshConeRadialSegments" as const;

export const MESH_TORUS_RADIUS_KEY = "meshTorusRadius" as const;
export const MESH_TORUS_TUBE_KEY = "meshTorusTube" as const;
export const MESH_TORUS_RADIAL_SEGMENTS_KEY = "meshTorusRadialSegments" as const;
export const MESH_TORUS_TUBULAR_SEGMENTS_KEY = "meshTorusTubularSegments" as const;

export const MESH_CAPSULE_RADIUS_KEY = "meshCapsuleRadius" as const;
export const MESH_CAPSULE_LENGTH_KEY = "meshCapsuleLength" as const;
export const MESH_CAPSULE_CAP_SEGMENTS_KEY = "meshCapsuleCapSegments" as const;
export const MESH_CAPSULE_RADIAL_SEGMENTS_KEY = "meshCapsuleRadialSegments" as const;

export const MESH_PRIMITIVE_KIND_BY_NODE_ID: Readonly<Record<string, MeshPrimitiveKindV1>> = {
  "mesh-box": "box",
  "mesh-sphere": "sphere",
  "mesh-plane": "plane",
  "mesh-cylinder": "cylinder",
  "mesh-cone": "cone",
  "mesh-torus": "torus",
  "mesh-capsule": "capsule",
};

export const MESH_PRIMITIVE_NODE_IDS: ReadonlySet<string> = new Set(
  Object.keys(MESH_PRIMITIVE_KIND_BY_NODE_ID),
);

export function isMeshPrimitiveNodeId(nodeId: string): boolean {
  return MESH_PRIMITIVE_NODE_IDS.has(nodeId);
}

export function isMeshWireOutputNodeId(nodeId: string): boolean {
  return isMeshPrimitiveNodeId(nodeId) || nodeId === "mesh-group";
}

export function meshPrimitiveKindForNodeId(nodeId: string): MeshPrimitiveKindV1 | null {
  return MESH_PRIMITIVE_KIND_BY_NODE_ID[nodeId] ?? null;
}

export function meshPrimitiveKindLabel(kind: MeshPrimitiveKindV1): string {
  if (kind === "box") {
    return "Box";
  }
  if (kind === "sphere") {
    return "Sphere";
  }
  if (kind === "plane") {
    return "Plane";
  }
  if (kind === "cylinder") {
    return "Cylinder";
  }
  if (kind === "cone") {
    return "Cone";
  }
  if (kind === "torus") {
    return "Torus";
  }
  return "Capsule";
}

function readPositive(config: Record<string, unknown>, key: string, fallback: number): number {
  const raw = config[key];
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return fallback;
}

function readNonNegative(config: Record<string, unknown>, key: string, fallback: number): number {
  const raw = config[key];
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  return fallback;
}

function readSegmentCount(config: Record<string, unknown>, key: string, fallback: number): number {
  const raw = config[key];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n >= 3 ? n : fallback;
  }
  return fallback;
}

function formatDim(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

export type MeshPrimitiveWiredInputs = {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  tube?: number;
  length?: number;
  material?: FlowWireMaterialV1;
  transform?: FlowWireTransformV1;
};

export function flowWireMeshFromMeshPrimitiveEval(args: {
  kind: MeshPrimitiveKindV1;
  defaultConfig: Record<string, unknown>;
  wired?: MeshPrimitiveWiredInputs;
}): FlowWireMeshV1 {
  const { kind, defaultConfig, wired } = args;
  const dc = defaultConfig;
  const wire: FlowWireMeshV1 = { version: 1, kind };

  if (kind === "box") {
    wire.box = {
      width:
        wired?.width != null && Number.isFinite(wired.width) && wired.width > 0
          ? wired.width
          : readPositive(dc, MESH_BOX_WIDTH_KEY, 1),
      height:
        wired?.height != null && Number.isFinite(wired.height) && wired.height > 0
          ? wired.height
          : readPositive(dc, MESH_BOX_HEIGHT_KEY, 1),
      depth:
        wired?.depth != null && Number.isFinite(wired.depth) && wired.depth > 0
          ? wired.depth
          : readPositive(dc, MESH_BOX_DEPTH_KEY, 1),
    };
  } else if (kind === "sphere") {
    wire.sphere = {
      radius:
        wired?.radius != null && Number.isFinite(wired.radius) && wired.radius > 0
          ? wired.radius
          : readPositive(dc, MESH_SPHERE_RADIUS_KEY, 0.5),
      widthSegments: readSegmentCount(dc, MESH_SPHERE_WIDTH_SEGMENTS_KEY, 32),
      heightSegments: readSegmentCount(dc, MESH_SPHERE_HEIGHT_SEGMENTS_KEY, 16),
    };
  } else if (kind === "cylinder") {
    wire.cylinder = {
      radiusTop:
        wired?.radiusTop != null && Number.isFinite(wired.radiusTop) && wired.radiusTop >= 0
          ? wired.radiusTop
          : readNonNegative(dc, MESH_CYLINDER_RADIUS_TOP_KEY, 0.5),
      radiusBottom:
        wired?.radiusBottom != null &&
        Number.isFinite(wired.radiusBottom) &&
        wired.radiusBottom >= 0
          ? wired.radiusBottom
          : readNonNegative(dc, MESH_CYLINDER_RADIUS_BOTTOM_KEY, 0.5),
      height:
        wired?.height != null && Number.isFinite(wired.height) && wired.height > 0
          ? wired.height
          : readPositive(dc, MESH_CYLINDER_HEIGHT_KEY, 1),
      radialSegments: readSegmentCount(dc, MESH_CYLINDER_RADIAL_SEGMENTS_KEY, 32),
    };
  } else if (kind === "cone") {
    wire.cone = {
      radius:
        wired?.radius != null && Number.isFinite(wired.radius) && wired.radius > 0
          ? wired.radius
          : readPositive(dc, MESH_CONE_RADIUS_KEY, 0.5),
      height:
        wired?.height != null && Number.isFinite(wired.height) && wired.height > 0
          ? wired.height
          : readPositive(dc, MESH_CONE_HEIGHT_KEY, 1),
      radialSegments: readSegmentCount(dc, MESH_CONE_RADIAL_SEGMENTS_KEY, 32),
    };
  } else if (kind === "torus") {
    wire.torus = {
      radius:
        wired?.radius != null && Number.isFinite(wired.radius) && wired.radius > 0
          ? wired.radius
          : readPositive(dc, MESH_TORUS_RADIUS_KEY, 0.5),
      tube:
        wired?.tube != null && Number.isFinite(wired.tube) && wired.tube > 0
          ? wired.tube
          : readPositive(dc, MESH_TORUS_TUBE_KEY, 0.2),
      radialSegments: readSegmentCount(dc, MESH_TORUS_RADIAL_SEGMENTS_KEY, 16),
      tubularSegments: readSegmentCount(dc, MESH_TORUS_TUBULAR_SEGMENTS_KEY, 48),
    };
  } else if (kind === "capsule") {
    wire.capsule = {
      radius:
        wired?.radius != null && Number.isFinite(wired.radius) && wired.radius > 0
          ? wired.radius
          : readPositive(dc, MESH_CAPSULE_RADIUS_KEY, 0.25),
      length:
        wired?.length != null && Number.isFinite(wired.length) && wired.length > 0
          ? wired.length
          : readPositive(dc, MESH_CAPSULE_LENGTH_KEY, 0.5),
      capSegments: readSegmentCount(dc, MESH_CAPSULE_CAP_SEGMENTS_KEY, 8),
      radialSegments: readSegmentCount(dc, MESH_CAPSULE_RADIAL_SEGMENTS_KEY, 16),
    };
  } else {
    wire.plane = {
      width:
        wired?.width != null && Number.isFinite(wired.width) && wired.width > 0
          ? wired.width
          : readPositive(dc, MESH_PLANE_WIDTH_KEY, 1),
      height:
        wired?.height != null && Number.isFinite(wired.height) && wired.height > 0
          ? wired.height
          : readPositive(dc, MESH_PLANE_HEIGHT_KEY, 1),
    };
  }

  if (wired?.material != null) {
    wire.material = wired.material;
  }
  if (wired?.transform != null) {
    wire.transform = wired.transform;
  } else if (
    typeof dc.version === "number" &&
    dc.version === 1 &&
    (dc.position != null || dc.rotationDeg != null || dc.scale != null)
  ) {
    wire.transform = flowWireTransformFromNodeDefaultConfig(dc);
  }

  return wire;
}

export function resolveMeshWireSocketLabel(wire: FlowWireMeshV1 | null | undefined): string {
  if (wire == null) {
    return "";
  }
  const coerced = coerceFlowWireMeshV1(wire);
  if (coerced == null) {
    return "";
  }
  if (coerced.kind === "group") {
    const count = coerced.children?.length ?? 0;
    return count > 0 ? `Bundle · ${count} meshes` : "Bundle";
  }
  const kind = meshPrimitiveKindLabel(coerced.kind);
  let dims = "";
  if (coerced.kind === "box" && coerced.box != null) {
    dims = `${formatDim(coerced.box.width)}×${formatDim(coerced.box.height)}×${formatDim(coerced.box.depth)}`;
  } else if (coerced.kind === "sphere" && coerced.sphere != null) {
    dims = `r${formatDim(coerced.sphere.radius)}`;
  } else if (coerced.kind === "plane" && coerced.plane != null) {
    dims = `${formatDim(coerced.plane.width)}×${formatDim(coerced.plane.height)}`;
  } else if (coerced.kind === "cylinder" && coerced.cylinder != null) {
    dims = `${formatDim(coerced.cylinder.radiusTop)}/${formatDim(coerced.cylinder.radiusBottom)} h${formatDim(coerced.cylinder.height)}`;
  } else if (coerced.kind === "cone" && coerced.cone != null) {
    dims = `r${formatDim(coerced.cone.radius)} h${formatDim(coerced.cone.height)}`;
  } else if (coerced.kind === "torus" && coerced.torus != null) {
    dims = `R${formatDim(coerced.torus.radius)} t${formatDim(coerced.torus.tube)}`;
  } else if (coerced.kind === "capsule" && coerced.capsule != null) {
    dims = `r${formatDim(coerced.capsule.radius)} L${formatDim(coerced.capsule.length)}`;
  }
  const suffix =
    coerced.material != null
      ? ` · ${coerced.material.colorHex.toLowerCase()}`
      : "";
  return dims.length > 0 ? `${kind} · ${dims}${suffix}` : kind;
}
