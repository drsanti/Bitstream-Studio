"use no memo";

import { CapsuleCollider, CuboidCollider, BallCollider, RigidBody } from "@react-three/rapier";
import { Edges } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";
import type { PhysicsLabBodyDef } from "../types/physicsLabBody.js";
import { isPhysicsLabFloor } from "../types/physicsLabBody.js";

type PhysicsLabBodyProps = {
  body: PhysicsLabBodyDef;
  onObjectPointerDown?: () => void;
};

function bodyMeshColor(body: PhysicsLabBodyDef, selected: boolean, active: boolean): string {
  if (isPhysicsLabFloor(body.id)) {
    return selected ? "#64748b" : "#3f3f46";
  }
  if (active) {
    return "#38bdf8";
  }
  if (selected) {
    return "#0ea5e9";
  }
  return "#71717a";
}

function PhysicsLabColliders({ body }: { body: PhysicsLabBodyDef }) {
  if (body.shape === "sphere") {
    return <BallCollider args={[body.radius ?? 0.5]} />;
  }
  if (body.shape === "capsule") {
    return (
      <CapsuleCollider args={[body.halfHeight ?? 0.5, body.radius ?? 0.35]} />
    );
  }
  const half = body.halfExtents ?? [0.5, 0.5, 0.5];
  return <CuboidCollider args={half} />;
}

function PhysicsLabVisualMesh({
  body,
  color,
  showWireframe,
  wireColor,
}: {
  body: PhysicsLabBodyDef;
  color: string;
  showWireframe: boolean;
  wireColor: string;
}) {
  if (body.shape === "sphere") {
    const radius = body.radius ?? 0.5;
    return (
      <mesh castShadow={!isPhysicsLabFloor(body.id)} receiveShadow={isPhysicsLabFloor(body.id)}>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
        {showWireframe ? <Edges color={wireColor} threshold={15} /> : null}
      </mesh>
    );
  }
  if (body.shape === "capsule") {
    const radius = body.radius ?? 0.35;
    const halfHeight = body.halfHeight ?? 0.5;
    return (
      <mesh castShadow receiveShadow={false}>
        <capsuleGeometry args={[radius, halfHeight * 2, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
        {showWireframe ? <Edges color={wireColor} threshold={15} /> : null}
      </mesh>
    );
  }
  const half = body.halfExtents ?? [0.5, 0.5, 0.5];
  return (
    <mesh castShadow={!isPhysicsLabFloor(body.id)} receiveShadow={isPhysicsLabFloor(body.id)}>
      <boxGeometry args={[half[0] * 2, half[1] * 2, half[2] * 2]} />
      <meshStandardMaterial
        color={color}
        roughness={isPhysicsLabFloor(body.id) ? 0.85 : 0.45}
        metalness={isPhysicsLabFloor(body.id) ? 0.05 : 0.1}
      />
      {showWireframe ? <Edges color={wireColor} threshold={15} /> : null}
    </mesh>
  );
}

export function PhysicsLabBody({ body, onObjectPointerDown }: PhysicsLabBodyProps) {
  const selectedIds = usePhysicsLabStore((s) => s.selectedIds);
  const activeId = usePhysicsLabStore((s) => s.activeId);
  const showColliderWireframes = usePhysicsLabStore((s) => s.showColliderWireframes);
  const pickBody = usePhysicsLabStore((s) => s.pickBody);

  const selected = selectedIds.includes(body.id);
  const active = activeId === body.id;
  const color = bodyMeshColor(body, selected, active);
  const showWireframe = selected && showColliderWireframes;
  const wireColor = active ? "#f59e0b" : "#38bdf8";

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onObjectPointerDown?.();
    pickBody(body.id, {
      extend: event.nativeEvent.shiftKey,
      toggle: event.nativeEvent.ctrlKey || event.nativeEvent.metaKey,
    });
  };

  return (
    <RigidBody
      type={body.motion === "fixed" ? "fixed" : "dynamic"}
      colliders={false}
      position={body.position}
      userData={{ physicsLabId: body.id }}
    >
      <group onPointerDown={onPointerDown}>
        <PhysicsLabVisualMesh
          body={body}
          color={color}
          showWireframe={showWireframe}
          wireColor={wireColor}
        />
      </group>
      <PhysicsLabColliders body={body} />
    </RigidBody>
  );
}
