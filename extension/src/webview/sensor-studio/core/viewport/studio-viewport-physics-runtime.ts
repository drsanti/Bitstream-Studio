import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { FlowWirePhysicsRigidBodyV1 } from "../../features/editor/nodes/physics/flow-wire-physics-body";
import type { FlowWirePhysicsSceneV1 } from "../../features/editor/nodes/physics/flow-wire-physics-scene";
import {
  stagePhysicsCollidersLayoutKey,
  type StagePhysicsColliderV1,
} from "../stage/stage-physics-colliders";

export type PreviewPhysicsRuntimeState = {
  enabledKey: string;
  colliderKey: string;
  world: RAPIER.World | null;
  debugGroup: THREE.Group | null;
  dynamicMeshes: THREE.Mesh[];
  dynamicBodies: RAPIER.RigidBody[];
};

const GROUND_HALF = { x: 25, y: 0.05, z: 25 };

export function createPreviewPhysicsRuntimeState(): PreviewPhysicsRuntimeState {
  return {
    enabledKey: "off",
    colliderKey: "",
    world: null,
    debugGroup: null,
    dynamicMeshes: [],
    dynamicBodies: [],
  };
}

function physicsEnabledKey(wire: FlowWirePhysicsSceneV1 | null | undefined): string {
  if (wire == null || !wire.enabled) {
    return "off";
  }
  const bodyCount = Array.isArray(wire.rigidBodies) ? wire.rigidBodies.length : 0;
  return `on:${wire.gravityY}:b${bodyCount}`;
}

function physicsBodiesLayoutKey(bodies: readonly FlowWirePhysicsRigidBodyV1[]): string {
  return bodies
    .map(
      (b) =>
        `${b.sourceNodeId}:${b.position.x},${b.position.y},${b.position.z}:${b.halfExtents.x},${b.mass}`,
    )
    .join("|");
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rebuildDebugMeshes(
  group: THREE.Group,
  colliders: readonly StagePhysicsColliderV1[],
  rigidBodies: readonly FlowWirePhysicsRigidBodyV1[],
): void {
  while (group.children.length > 0) {
    const child = group.children[0]!;
    group.remove(child);
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        m.dispose?.();
      }
    } else {
      (mat as THREE.Material | undefined)?.dispose?.();
    }
  }

  const groundMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    wireframe: true,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(GROUND_HALF.x * 2, GROUND_HALF.y * 2, GROUND_HALF.z * 2),
    groundMat,
  );
  ground.position.y = -GROUND_HALF.y;
  group.add(ground);

  const colliderMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  for (const c of colliders) {
    let mesh: THREE.Mesh;
    if (c.kind === "sphere" && c.radius != null) {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(c.radius, 12, 8),
        colliderMat.clone(),
      );
    } else {
      const he = c.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 };
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2),
        colliderMat.clone(),
      );
    }
    mesh.position.set(c.position.x, c.position.y, c.position.z);
    mesh.rotation.set(
      degToRad(c.rotationDeg.x),
      degToRad(c.rotationDeg.y),
      degToRad(c.rotationDeg.z),
    );
    mesh.name = c.label;
    group.add(mesh);
  }

  const bodyMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  for (const b of rigidBodies) {
    const he = b.halfExtents;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2),
      bodyMat.clone(),
    );
    mesh.position.set(b.position.x, b.position.y, b.position.z);
    mesh.name = b.label;
    group.add(mesh);
  }
}

function spawnRapierColliders(
  world: RAPIER.World,
  colliders: readonly StagePhysicsColliderV1[],
): void {
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -GROUND_HALF.y, 0));
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(GROUND_HALF.x, GROUND_HALF.y, GROUND_HALF.z),
    groundBody,
  );

  for (const c of colliders) {
    const pos = c.position;
    const euler = new THREE.Euler(
      degToRad(c.rotationDeg.x),
      degToRad(c.rotationDeg.y),
      degToRad(c.rotationDeg.z),
      "XYZ",
    );
    const quat = new THREE.Quaternion().setFromEuler(euler);
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }),
    );
    if (c.kind === "sphere" && c.radius != null) {
      world.createCollider(RAPIER.ColliderDesc.ball(c.radius), body);
    } else {
      const he = c.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 };
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z),
        body,
      );
    }
  }
}

function spawnRapierDynamicBodies(
  world: RAPIER.World,
  rigidBodies: readonly FlowWirePhysicsRigidBodyV1[],
  state: PreviewPhysicsRuntimeState,
): void {
  const bodyMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  for (const b of rigidBodies) {
    const he = b.halfExtents;
    const rb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(b.position.x, b.position.y, b.position.z)
        .setAdditionalMass(b.mass, true),
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z), rb);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(he.x * 2, he.y * 2, he.z * 2),
      bodyMat.clone(),
    );
    mesh.name = b.label;
    state.dynamicMeshes.push(mesh);
    state.dynamicBodies.push(rb);
    state.debugGroup?.add(mesh);
  }
}

export function disposePreviewPhysicsRuntime(
  scene: THREE.Scene,
  state: PreviewPhysicsRuntimeState,
): void {
  for (const mesh of state.dynamicMeshes) {
    state.debugGroup?.remove(mesh);
    mesh.geometry?.dispose?.();
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        m.dispose?.();
      }
    } else {
      (mat as THREE.Material | undefined)?.dispose?.();
    }
  }
  state.dynamicMeshes = [];
  state.dynamicBodies = [];

  if (state.debugGroup != null) {
    scene.remove(state.debugGroup);
    state.debugGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          m.dispose?.();
        }
      } else {
        (mat as THREE.Material | undefined)?.dispose?.();
      }
    });
    state.debugGroup = null;
  }
  if (state.world != null) {
    state.world.free();
    state.world = null;
  }
  state.enabledKey = "off";
  state.colliderKey = "";
}

export function syncPreviewPhysicsRuntime(params: {
  scene: THREE.Scene;
  state: PreviewPhysicsRuntimeState;
  wire: FlowWirePhysicsSceneV1 | null | undefined;
  colliders: readonly StagePhysicsColliderV1[];
}): void {
  const { scene, state, wire, colliders } = params;
  const rigidBodies = Array.isArray(wire?.rigidBodies) ? wire!.rigidBodies : [];
  const nextEnabledKey = physicsEnabledKey(wire);
  const nextColliderKey = `${stagePhysicsCollidersLayoutKey(colliders)}::${physicsBodiesLayoutKey(rigidBodies)}`;
  if (nextEnabledKey === state.enabledKey && nextColliderKey === state.colliderKey) {
    return;
  }

  disposePreviewPhysicsRuntime(scene, state);
  state.enabledKey = nextEnabledKey;
  state.colliderKey = nextColliderKey;

  if (nextEnabledKey === "off" || wire == null) {
    return;
  }

  const world = new RAPIER.World({ x: 0, y: wire.gravityY, z: 0 });
  spawnRapierColliders(world, colliders);

  const debugGroup = new THREE.Group();
  debugGroup.name = "StagePhysicsDebug";
  rebuildDebugMeshes(debugGroup, colliders, rigidBodies);
  scene.add(debugGroup);

  state.world = world;
  state.debugGroup = debugGroup;
  spawnRapierDynamicBodies(world, rigidBodies, state);
}

export function stepPreviewPhysicsRuntime(
  state: PreviewPhysicsRuntimeState,
  deltaSec: number,
): void {
  if (state.world == null || state.enabledKey === "off") {
    return;
  }
  const dt = Math.min(0.05, Math.max(0, deltaSec));
  if (dt <= 0) {
    return;
  }
  state.world.timestep = dt;
  state.world.step();

  for (let i = 0; i < state.dynamicBodies.length; i++) {
    const rb = state.dynamicBodies[i]!;
    const mesh = state.dynamicMeshes[i];
    if (mesh == null) {
      continue;
    }
    const t = rb.translation();
    mesh.position.set(t.x, t.y, t.z);
    const r = rb.rotation();
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
