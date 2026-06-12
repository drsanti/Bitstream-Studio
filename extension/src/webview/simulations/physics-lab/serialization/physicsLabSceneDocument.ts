import type { PhysicsLabBodyDef } from "../types/physicsLabBody.js";

export type PhysicsLabSceneDocumentV1 = {
  version: 1;
  label: string;
  bodies: PhysicsLabBodyDef[];
};

export function exportPhysicsLabSceneDocument(
  bodies: readonly PhysicsLabBodyDef[],
  label = "Physics Lab scene",
): PhysicsLabSceneDocumentV1 {
  return {
    version: 1,
    label,
    bodies: bodies.map((body) => ({
      ...body,
      position: [...body.position],
      rotationDeg: body.rotationDeg ? ([...body.rotationDeg] as [number, number, number]) : [0, 0, 0],
      halfExtents: body.halfExtents
        ? ([...body.halfExtents] as [number, number, number])
        : undefined,
      sortOrder: body.sortOrder ?? 0,
    })),
  };
}

export function serializePhysicsLabSceneDocument(doc: PhysicsLabSceneDocumentV1): string {
  return JSON.stringify(doc, null, 2);
}

export function parsePhysicsLabSceneDocument(json: string): PhysicsLabSceneDocumentV1 {
  const parsed: unknown = JSON.parse(json);
  if (
    typeof parsed !== "object" ||
    parsed == null ||
    (parsed as PhysicsLabSceneDocumentV1).version !== 1 ||
    !Array.isArray((parsed as PhysicsLabSceneDocumentV1).bodies)
  ) {
    throw new Error("Invalid Physics Lab scene document (expected version 1).");
  }
  return parsed as PhysicsLabSceneDocumentV1;
}

export function downloadPhysicsLabSceneJson(doc: PhysicsLabSceneDocumentV1, filename?: string): void {
  const blob = new Blob([serializePhysicsLabSceneDocument(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `physics-lab-scene-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
