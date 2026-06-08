/** Procedural primitives spawnable from the Stage toolbar (SE4). */
export type StageProceduralSpawnKind = "box" | "sphere" | "plane";

export const STAGE_PROCEDURAL_SPAWN_KINDS: readonly StageProceduralSpawnKind[] = [
  "box",
  "sphere",
  "plane",
] as const;

export function isStageProceduralSpawnKind(v: unknown): v is StageProceduralSpawnKind {
  return v === "box" || v === "sphere" || v === "plane";
}

export function meshCatalogIdForSpawnKind(kind: StageProceduralSpawnKind): string {
  if (kind === "sphere") {
    return "mesh-sphere";
  }
  if (kind === "plane") {
    return "mesh-plane";
  }
  return "mesh-box";
}

export function spawnKindTitle(kind: StageProceduralSpawnKind): string {
  if (kind === "sphere") {
    return "Sphere";
  }
  if (kind === "plane") {
    return "Plane";
  }
  return "Box";
}
