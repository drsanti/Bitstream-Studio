import { z } from "zod";

export const DIAGRAM_3D_CATALOG_MODEL_ID_PREFIX = "catalog:" as const;

export const DIAGRAM_3D_PROCEDURAL_MODEL_IDS = [
  "procedural-box",
  "procedural-sphere",
  "procedural-cylinder",
  "procedural-cone",
  "procedural-plane",
  "procedural-torus",
  "procedural-capsule",
  "procedural-ring",
  "procedural-icosahedron",
  "procedural-torus-knot",
  "procedural-pcb",
  "procedural-axis-triad",
  "procedural-gyro-gimbal",
] as const;

export const diagram3dProceduralModelIdSchema = z.enum(DIAGRAM_3D_PROCEDURAL_MODEL_IDS);

export const diagram3dCatalogModelIdSchema = z
  .string()
  .regex(/^catalog:.+/, "Catalog model ids must start with catalog:");

export const diagram3dModelIdSchema = z.union([
  diagram3dProceduralModelIdSchema,
  diagram3dCatalogModelIdSchema,
]);

export type Diagram3dProceduralModelIdV1 = z.infer<typeof diagram3dProceduralModelIdSchema>;
export type Diagram3dModelIdV1 = z.infer<typeof diagram3dModelIdSchema>;

export function isProceduralDiagram3dModelId(
  modelId: string,
): modelId is Diagram3dProceduralModelIdV1 {
  return (DIAGRAM_3D_PROCEDURAL_MODEL_IDS as readonly string[]).includes(modelId);
}

export function isCatalogDiagram3dModelId(modelId: string): modelId is `catalog:${string}` {
  return modelId.startsWith(DIAGRAM_3D_CATALOG_MODEL_ID_PREFIX);
}

export function catalogKeyFromDiagram3dModelId(modelId: string): string {
  return modelId.slice(DIAGRAM_3D_CATALOG_MODEL_ID_PREFIX.length);
}

export function toCatalogDiagram3dModelId(catalogKey: string): string {
  return `${DIAGRAM_3D_CATALOG_MODEL_ID_PREFIX}${catalogKey}`;
}

export function diagram3dModelIdLabel(modelId: Diagram3dModelIdV1): string {
  if (modelId === "procedural-pcb") {
    return "PCB + axis triad";
  }
  if (modelId === "procedural-box") {
    return "Simple box";
  }
  if (modelId === "procedural-sphere") {
    return "Sphere";
  }
  if (modelId === "procedural-cylinder") {
    return "Cylinder";
  }
  if (modelId === "procedural-cone") {
    return "Cone";
  }
  if (modelId === "procedural-plane") {
    return "Plane";
  }
  if (modelId === "procedural-torus") {
    return "Torus";
  }
  if (modelId === "procedural-capsule") {
    return "Capsule";
  }
  if (modelId === "procedural-ring") {
    return "Ring";
  }
  if (modelId === "procedural-icosahedron") {
    return "Icosahedron";
  }
  if (modelId === "procedural-torus-knot") {
    return "Torus knot";
  }
  if (modelId === "procedural-axis-triad") {
    return "Axis triad (XYZ)";
  }
  if (modelId === "procedural-gyro-gimbal") {
    return "Gyro gimbal rings";
  }
  if (isCatalogDiagram3dModelId(modelId)) {
    const key = catalogKeyFromDiagram3dModelId(modelId);
    const tail = key.split("/").pop() ?? key;
    return `Catalog · ${tail}`;
  }
  return modelId;
}
