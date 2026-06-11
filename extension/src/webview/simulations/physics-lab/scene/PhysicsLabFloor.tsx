"use no memo";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";

const HALF_EXTENTS: [number, number, number] = [12, 0.05, 12];

export function PhysicsLabFloor() {
  const selectedObjectId = usePhysicsLabStore((s) => s.selectedObjectId);
  const selectObject = usePhysicsLabStore((s) => s.selectObject);
  const selected = selectedObjectId === "floor";

  return (
    <RigidBody type="fixed" colliders={false} userData={{ physicsLabId: "floor" }}>
      <mesh
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          selectObject("floor");
        }}
      >
        <boxGeometry args={[HALF_EXTENTS[0] * 2, HALF_EXTENTS[1] * 2, HALF_EXTENTS[2] * 2]} />
        <meshStandardMaterial
          color={selected ? "#64748b" : "#3f3f46"}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <CuboidCollider args={HALF_EXTENTS} position={[0, 0, 0]} />
    </RigidBody>
  );
}
