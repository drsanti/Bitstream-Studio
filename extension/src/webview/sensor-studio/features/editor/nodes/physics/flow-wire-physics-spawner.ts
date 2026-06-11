/** Runtime spawner on physics scene wires (object-spawner nodes). */
export type FlowWirePhysicsSpawnerV1 = {
  kindWire: "physicsSpawner";
  version: 1;
  sourceNodeId: string;
  label: string;
  /** Spawns per second when > 0. */
  rate: number;
  maxCount: number;
  position: { x: number; y: number; z: number };
  halfExtents: { x: number; y: number; z: number };
  mass: number;
};

export function flowWirePhysicsSpawnerFromConfig(
  sourceNodeId: string,
  label: string,
  cfg: Record<string, unknown>,
  rateOverride?: number,
): FlowWirePhysicsSpawnerV1 {
  const read = (k: string, fb: number) => {
    const v = cfg[k];
    return typeof v === "number" && Number.isFinite(v) ? v : fb;
  };
  const he = Math.max(0.05, read("halfExtents", 0.2));
  const rate =
    typeof rateOverride === "number" && Number.isFinite(rateOverride)
      ? Math.max(0, rateOverride)
      : Math.max(0, read("rate", 0));
  return {
    kindWire: "physicsSpawner",
    version: 1,
    sourceNodeId,
    label,
    rate,
    maxCount: Math.max(1, Math.floor(read("maxCount", 8))),
    position: {
      x: read("spawnPositionX", 0),
      y: read("spawnPositionY", 4),
      z: read("spawnPositionZ", 0),
    },
    halfExtents: { x: he, y: he, z: he },
    mass: Math.max(0.01, read("mass", 1)),
  };
}

export function isFlowWirePhysicsSpawnerV1(v: unknown): v is FlowWirePhysicsSpawnerV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWirePhysicsSpawnerV1).kindWire === "physicsSpawner" &&
    (v as FlowWirePhysicsSpawnerV1).version === 1
  );
}
