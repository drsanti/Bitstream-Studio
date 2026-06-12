export type PhysicsLabGizmoMode = "translate" | "rotate";

export type PhysicsLabAuthoringMode = "object" | "collider";

export function physicsLabDegToRad(deg: [number, number, number]): [number, number, number] {
  return [(deg[0] * Math.PI) / 180, (deg[1] * Math.PI) / 180, (deg[2] * Math.PI) / 180];
}

export function physicsLabRadToDeg(rad: { x: number; y: number; z: number }): [number, number, number] {
  return [
    Math.round(((rad.x * 180) / Math.PI) * 1000) / 1000,
    Math.round(((rad.y * 180) / Math.PI) * 1000) / 1000,
    Math.round(((rad.z * 180) / Math.PI) * 1000) / 1000,
  ];
}

export function roundPhysicsLabPosition(
  position: [number, number, number],
): [number, number, number] {
  return [
    Math.round(position[0] * 1000) / 1000,
    Math.round(position[1] * 1000) / 1000,
    Math.round(position[2] * 1000) / 1000,
  ];
}

export function sortPhysicsLabBodies<T extends { sortOrder?: number; id: string }>(
  bodies: readonly T[],
): T[] {
  return [...bodies].sort((a, b) => {
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (order !== 0) {
      return order;
    }
    return a.id.localeCompare(b.id);
  });
}
