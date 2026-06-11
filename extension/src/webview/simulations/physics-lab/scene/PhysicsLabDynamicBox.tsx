"use no memo";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";

const HALF = 0.5;
const HALF_EXTENTS: [number, number, number] = [HALF, HALF, HALF];

export function PhysicsLabDynamicBox() {
  const selectedObjectId = usePhysicsLabStore((s) => s.selectedObjectId);
  const selectObject = usePhysicsLabStore((s) => s.selectObject);
  const selected = selectedObjectId === "dynamic-box";

  return (
    <RigidBody
      type="dynamic"
      colliders={false}
      position={[0, 2, 0]}
      userData={{ physicsLabId: "dynamic-box" }}
    >
      <mesh
        castShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          selectObject("dynamic-box");
        }}
      >
        <boxGeometry args={[HALF * 2, HALF * 2, HALF * 2]} />
        <meshStandardMaterial
          color={selected ? "#38bdf8" : "#0ea5e9"}
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>
      <CuboidCollider args={HALF_EXTENTS} />
    </RigidBody>
  );
}
