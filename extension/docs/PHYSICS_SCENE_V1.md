# Physics scene schema v1 (Rapier)

**Status:** Specification (not fully implemented)  
**Consumers:** Physics Lab (`simulations/physics-lab/`), Sensor Studio graph (`physics-world` → Stage / Model Viewer)  
**Engine:** Rapier (`@dimforge/rapier3d-compat`, `@react-three/rapier`)  
**Related:** [`PHYSICS_LAB.md`](../src/webview/simulations/physics-lab/docs/PHYSICS_LAB.md), [`TIER_D_PHYSICS_FOUNDATION.md`](../src/webview/sensor-studio/docs/TIER_D_PHYSICS_FOUNDATION.md), [`VEHICLE_GLB_AUTHORING.md`](../src/webview/simulations/vehicle-physics/docs/VEHICLE_GLB_AUTHORING.md)

## Purpose

One **portable physics scene description** powers:

1. **Physics Lab** — game-engine-style authoring (spawn, gizmo, simulate).
2. **Node graph** — declarative `physics-world` + collider / body / joint nodes.
3. **Stage / Model Viewer** — runtime preview from evaluated graph wires.

Physics Lab **does not** use a private format. Scenes authored in the Lab export to this schema; graph evaluators **merge** node outputs into the same shape.

Today’s partial type: `FlowWirePhysicsSceneV1` in `flow-wire-physics-scene.ts` (box/sphere colliders, box rigid bodies only). This document defines the **target superset**.

---

## Top-level document

```ts
type PhysicsSceneV1 = {
  version: 1;
  id: string;                    // stable scene id (preset name, graph id)
  label: string;
  world: PhysicsWorldSettingsV1;
  bodies: PhysicsBodyV1[];
  joints: PhysicsJointV1[];
  spawners: PhysicsSpawnerV1[];
  /** Optional GLB instances referenced by bodies (visual + collider discovery). */
  glbRefs?: PhysicsGlbRefV1[];
  /** Which Physics Lab factory authored this scene (optional). */
  factory?: PhysicsFactoryMetaV1;
  /** Domain mechanisms (vehicle controller, thrusters, buoyancy) — optional extensions. */
  mechanisms?: PhysicsMechanismV1[];
  /** Named collision layers + pairwise matrix (Physics Lab). */
  collisionLayers?: PhysicsCollisionLayerV1[];
  collisionMatrix?: PhysicsCollisionMatrixV1;
};
```

```ts
type PhysicsFactoryMetaV1 = {
  kind: "primitive" | "car" | "drone" | "robot-arm" | "environment";
  templateId?: string;
  templateVersion?: number;
};

/** Handled by shared Rapier builder when present; ignored by minimal graph eval. */
type PhysicsMechanismV1 = {
  id: string;
  kind: "rapierVehicle" | "quadcopter" | "forceField" | "buoyancy";
  config: Record<string, unknown>;
};
```

### World settings

```ts
type PhysicsWorldSettingsV1 = {
  enabled: boolean;
  gravity: { x: number; y: number; z: number }; // default (0, -9.81, 0)
  timestepHz?: number;                          // fixed step, default 60
};

type PhysicsCollisionLayerV1 = {
  bit: number;                   // 0..15
  name: string;
  color?: string;                // debug viewport tint
};

type PhysicsCollisionMatrixV1 = {
  /** For each membership bit, bitmask of layers it collides with. */
  collidesWith: Record<number, number>;
};
```

---

## Bodies and colliders

A **body** is a rigid-body container. **Colliders** are shapes attached to a body (compound = many colliders, one body).

```ts
type PhysicsBodyMotion = "fixed" | "dynamic" | "kinematic";

type PhysicsBodyV1 = {
  id: string;                    // stable id for graph node / Lab object
  label: string;
  motion: PhysicsBodyMotion;
  transform: PhysicsTransformV1;
  mass?: number;                 // dynamic; optional density on colliders instead
  linearDamping?: number;
  angularDamping?: number;
  ccdEnabled?: boolean;
  canSleep?: boolean;
  gravityScale?: number;
  /** Lock translation / rotation axes (Rapier locked axes). */
  locks?: { translation?: boolean[]; rotation?: boolean[] };
  colliders: PhysicsColliderV1[];
  /** Visual-only: mesh ref, GLB path, or procedural stub id. */
  visual?: PhysicsVisualRefV1;
  /** Graph provenance (when exported from Lab → graph). */
  sourceNodeId?: string;
  /** Factory role within a template (e.g. chassis, wheel_fl). */
  factoryRole?: string;
  tags?: string[];
};

type PhysicsTransformV1 = {
  position: { x: number; y: number; z: number };
  rotationDeg: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
};
```

### Collider kinds (target)

| `kind` | Params | Rapier | Typical motion |
|--------|--------|--------|----------------|
| `box` | `halfExtents` | `ColliderDesc.cuboid` | any |
| `sphere` | `radius` | `ColliderDesc.ball` | any |
| `capsule` | `radius`, `halfHeight` | `ColliderDesc.capsule` | any |
| `cylinder` | `radius`, `halfHeight` | `ColliderDesc.cylinder` | any |
| `convexHull` | `points: Vec3[]` or mesh ref | `ColliderDesc.convexHull` | dynamic preferred |
| `trimesh` | `vertices`, `indices` or mesh ref | `ColliderDesc.trimesh` | **fixed** only |
| `compound` | `children: PhysicsColliderV1[]` | multiple colliders on same body | any |

```ts
type PhysicsColliderV1 = {
  id: string;
  kind: "box" | "sphere" | "capsule" | "cylinder" | "convexHull" | "trimesh" | "compound";
  /** Local transform relative to parent body. */
  localTransform?: PhysicsTransformV1;
  /** Shape-specific params (discriminated by kind). */
  params: Record<string, unknown>;
  material?: {
    friction?: number;
    restitution?: number;
    density?: number;
    frictionCombineRule?: "average" | "min" | "max" | "multiply";
    restitutionCombineRule?: "average" | "min" | "max" | "multiply";
    contactSkin?: number;
  };
  sensor?: boolean;              // trigger volume
  /** Rapier interaction groups — see PHYSICS_LAB_PROFESSIONAL_FEATURES.md */
  collision?: {
    membershipBits?: number;     // OR of layer bits 0..15
    filterBits?: number;
    solverMembershipBits?: number;
    solverFilterBits?: number;
  };
};
```

**Rules:**

- **Trimesh** colliders on **fixed** bodies only (terrain, static mesh world).
- **Convex hull** for dynamic complex shapes and GLB `*_collider` proxies.
- **Compound** = one `PhysicsBodyV1` with multiple `colliders` entries (not a separate Rapier type).

---

## Joints

```ts
type PhysicsJointV1 = {
  id: string;
  label: string;
  kind: "fixed" | "revolute" | "prismatic" | "spring"; // phase by phase
  bodyAId: string;
  bodyBId: string;
  anchorA?: { x: number; y: number; z: number };
  anchorB?: { x: number; y: number; z: number };
  axis?: "x" | "y" | "z";       // revolute / prismatic
  limits?: { min?: number; max?: number };
  sourceNodeId?: string;
};
```

Maps to existing graph nodes: `fixed-joint`, `hinge-joint` (revolute).

---

## Spawners

```ts
type PhysicsSpawnerV1 = {
  id: string;
  label: string;
  rate: number;                  // bodies per second
  maxCount: number;
  position: { x: number; y: number; z: number };
  /** Template body (usually dynamic box/sphere). */
  templateBodyId?: string;
  template?: Partial<PhysicsBodyV1>;
  sourceNodeId?: string;
};
```

---

## GLB references

```ts
type PhysicsGlbRefV1 = {
  url: string;
  /** Discovery: suffix `_collider`, material `collider_material`, or extras.collider. */
  colliderDiscovery: "name_suffix" | "material" | "extras";
  /** Part names per VEHICLE_GLB_AUTHORING.md when applicable. */
  partNames?: {
    body?: string;
    wheels?: string[];
  };
};

type PhysicsVisualRefV1 =
  | { type: "glb"; url: string; objectPath?: string }
  | { type: "primitive"; primitive: "box" | "sphere" | "cylinder"; params: Record<string, number> }
  | { type: "none" };              // collider-only debug
```

---

## Mapping from node graph (today → target)

| Graph node | Maps to |
|------------|---------|
| `physics-world` | `world` + merges wired shapes/bodies/joints/spawners |
| `box-collider` | `PhysicsBodyV1` fixed + one `box` collider **or** collider on shared static body |
| `sphere-collider` | same with `sphere` |
| `rigid-body` | `PhysicsBodyV1` dynamic + box collider |
| `object-spawner` | `PhysicsSpawnerV1` |
| `fixed-joint` / `hinge-joint` | `PhysicsJointV1` |
| *(future)* `capsule-collider`, `glb-physics-body`, `collider-group` | extended collider / body entries |

Eval output: `FlowWirePhysicsSceneV1` → **coerce** → `PhysicsSceneV1` for Rapier builder.

---

## Scene graph (editor hierarchy)

The Lab **outliner** uses an optional node tree; Rapier bake still consumes **world transforms** on bodies/colliders.

```ts
type PhysicsSceneNodeKind = "group" | "body" | "colliderRef" | "visualRef";

type PhysicsSceneNodeV1 = {
  id: string;
  label: string;
  kind: PhysicsSceneNodeKind;
  parentId: string | null;
  sortOrder: number;
  bodyId?: string;
  colliderId?: string;
  localTransform: PhysicsTransformV1;
  visible?: boolean;
  pickLocked?: boolean;
  tags?: string[];
};
```

Add to top-level document:

```ts
nodes?: PhysicsSceneNodeV1[];
```

When `nodes` is omitted, treat each `bodies[]` entry as a root-level body (flat scene). Full UX: [`PHYSICS_LAB_SCENE_EDITOR.md`](../src/webview/simulations/physics-lab/docs/PHYSICS_LAB_SCENE_EDITOR.md).

---

## Lab ↔ graph round-trip

| Direction | Mechanism |
|-----------|-----------|
| **Lab → graph** | Export preset JSON (`PhysicsSceneV1`) → **Import to graph** spawns equivalent nodes + wires to `physics-world` → Scene Output |
| **Graph → Lab** | **Open in Physics Lab** loads evaluated `PhysicsSceneV1` from active graph (or selected `physics-world` subgraph) |
| **Runtime** | Single `buildRapierWorldFromPhysicsSceneV1(scene)` used by Lab and Stage |

**Stable ids:** `PhysicsBodyV1.id` and `sourceNodeId` keep Lab edits and graph nodes aligned across round-trip.

---

## Versioning

- Increment `version` only on breaking wire/schema changes.
- v1 is backward-compatible with current `FlowWirePhysicsSceneV1` when `colliders` / `rigidBodies` arrays are populated from legacy eval paths.

---

## Implementation checklist

- [ ] TypeScript types module (`physics-scene-v1.ts`) in `webview/shared/physics/` (shared by Lab + Sensor Studio)
- [ ] `physicsSceneV1FromFlowWire()` adapter from current eval
- [ ] `buildRapierWorldFromPhysicsSceneV1()` — single Rapier entry
- [ ] Physics Lab load/save preset files (`.physics-scene.v1.json`)
- [ ] Graph import/export UI

---

## Reference: 3DPhysicsEngine adapter (planned)

External repo `D:\CODE\2026\3DPhysicsEngine` uses **`SceneDoc` v2** (entity scene graph). For imports from that editor, provide:

```text
sceneDocToPhysicsSceneV1(doc: SceneDoc): PhysicsSceneV1
physicsSceneV1ToSceneDoc(scene: PhysicsSceneV1): SceneDoc  // optional, Lab-only round-trip
```

See [`REFERENCE_3D_PHYSICS_ENGINE.md`](../src/webview/simulations/physics-lab/docs/REFERENCE_3D_PHYSICS_ENGINE.md).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | 3DPhysicsEngine reference + adapter note |
| 2026-06-11 | Initial v1 spec (game-engine Lab + graph parity) |
