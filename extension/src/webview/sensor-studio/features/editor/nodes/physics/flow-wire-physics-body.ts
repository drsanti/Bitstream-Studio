/** Dynamic rigid body on **`physicsBody`** wires (rigid-body catalog → physics-world). */
export type FlowWirePhysicsRigidBodyV1 = {
  kindWire: "physicsBody";
  version: 1;
  sourceNodeId: string;
  label: string;
  mass: number;
  position: { x: number; y: number; z: number };
  halfExtents: { x: number; y: number; z: number };
};

export function flowWirePhysicsRigidBodyFromConfig(
  sourceNodeId: string,
  label: string,
  cfg: Record<string, unknown>,
): FlowWirePhysicsRigidBodyV1 {
  const read = (k: string, fb: number) => {
    const v = cfg[k];
    return typeof v === "number" && Number.isFinite(v) ? v : fb;
  };
  const he = Math.max(0.05, read("halfExtents", 0.25));
  return {
    kindWire: "physicsBody",
    version: 1,
    sourceNodeId,
    label,
    mass: Math.max(0.01, read("mass", 1)),
    position: {
      x: read("positionX", 0),
      y: read("positionY", 3),
      z: read("positionZ", 0),
    },
    halfExtents: { x: he, y: he, z: he },
  };
}

export function isFlowWirePhysicsRigidBodyV1(v: unknown): v is FlowWirePhysicsRigidBodyV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWirePhysicsRigidBodyV1).kindWire === "physicsBody" &&
    (v as FlowWirePhysicsRigidBodyV1).version === 1
  );
}
