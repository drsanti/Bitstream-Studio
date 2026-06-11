export type PhysicsLabShapeKind = "box" | "sphere" | "capsule";

export type PhysicsLabBodyMotion = "fixed" | "dynamic";

export type PhysicsLabBodyDef = {
  id: string;
  label: string;
  motion: PhysicsLabBodyMotion;
  shape: PhysicsLabShapeKind;
  position: [number, number, number];
  /** Box half extents (m). */
  halfExtents?: [number, number, number];
  /** Sphere / capsule radius (m). */
  radius?: number;
  /** Capsule cylindrical half-height (m), Rapier Y-axis. */
  halfHeight?: number;
};

export const PHYSICS_LAB_FLOOR_ID = "floor";

export function isPhysicsLabFloor(bodyId: string): boolean {
  return bodyId === PHYSICS_LAB_FLOOR_ID;
}

export function physicsLabBodySummary(body: PhysicsLabBodyDef): string {
  const motion = body.motion;
  if (body.shape === "box") {
    const h = body.halfExtents ?? [0.5, 0.5, 0.5];
    return `${motion} · box ${(h[0] * 2).toFixed(1)}×${(h[1] * 2).toFixed(1)}×${(h[2] * 2).toFixed(1)} m`;
  }
  if (body.shape === "sphere") {
    return `${motion} · sphere r ${(body.radius ?? 0.5).toFixed(2)} m`;
  }
  return `${motion} · capsule r ${(body.radius ?? 0.35).toFixed(2)} m`;
}

export function createPhysicsLabSpawnBody(
  shape: PhysicsLabShapeKind,
  spawnIndex: number,
): PhysicsLabBodyDef {
  const id = `body-${Date.now().toString(36)}-${spawnIndex}`;
  const y = 2 + spawnIndex * 0.15;
  if (shape === "sphere") {
    return {
      id,
      label: "Sphere",
      motion: "dynamic",
      shape,
      position: [spawnIndex * 0.2, y, 0],
      radius: 0.5,
    };
  }
  if (shape === "capsule") {
    return {
      id,
      label: "Capsule",
      motion: "dynamic",
      shape,
      position: [spawnIndex * 0.2, y, 0],
      radius: 0.35,
      halfHeight: 0.5,
    };
  }
  return {
    id,
    label: "Box",
    motion: "dynamic",
    shape,
    position: [spawnIndex * 0.2, y, 0],
    halfExtents: [0.5, 0.5, 0.5],
  };
}

export const PHYSICS_LAB_INITIAL_BODIES: PhysicsLabBodyDef[] = [
  {
    id: PHYSICS_LAB_FLOOR_ID,
    label: "Floor",
    motion: "fixed",
    shape: "box",
    position: [0, 0, 0],
    halfExtents: [12, 0.05, 12],
  },
  {
    id: "dynamic-box",
    label: "Dynamic Box",
    motion: "dynamic",
    shape: "box",
    position: [0, 2, 0],
    halfExtents: [0.5, 0.5, 0.5],
  },
];
