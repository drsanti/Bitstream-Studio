# Tier D — Physics stack foundation (Sensor Studio / node-animator parity)

**Status:** **Deferred after D1 (2026-06-02)** — parity shell + **`physicsScene`** wire type shipped; **Rapier D2+** and dynamics **on plan, complete later**. No flow-canvas physics runtime yet.  
**Tracker:** [`extension/docs/DEVELOPMENT_TRACKER.md`](../../../docs/DEVELOPMENT_TRACKER.md) — *Planned / next → physics domain*, *Future / ideas → physics stack*.  
**Related:** [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md), [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md), [`extension/docs/APPLICATION_MIGRATION_PLAN.md`](../../../docs/APPLICATION_MIGRATION_PLAN.md).

## Current status (2026-06-02)

| Milestone | State |
|-----------|--------|
| Scene FX preview (fog, bloom, contact shadows, camera-switch, particles) | **Shipped** — see scene wiring slices 1–3 |
| Tier D physics nodes / evaluator | **D1 shipped 2026-06-02** (stubs + `physicsScene` wire); D2+ preview not started |
| **Sensor Studio flow physics engine** | **Rapier** (`@dimforge/rapier3d`, `@react-three/rapier`) — **locked 2026-06-02** |
| Digital Twin Jolt vehicle sim | **Partial** — `webview/simulations/vehicle-physics/` (separate from Sensor Studio) |
| Rapier npm deps | Present in extension; Sensor Studio integration starts at **D2** |

**Start condition (for D2 when resumed):** D1 shipped; engine choice locked (**Rapier** Sensor Studio, **Jolt** hub). Product explicitly re-prioritizes Tier D implementation.

## Scope (node-animator Tier D)

| NA root type | Planned Studio node | Evaluator domain |
|--------------|---------------------|------------------|
| `physics` | `physics-world` | Physics (rAF + fixed step) |
| `rigidBody` | `rigid-body` | Physics |
| `objectSpawner` | `object-spawner` | Physics + scene |
| Collider variants | `box-collider`, `sphere-collider`, … | Physics |
| `joint` / variants | `fixed-joint`, `hinge-joint`, … | Physics |
| `ik` | `ik-chain` | Physics / animation blend |

Sensor Studio **does not** ship a physics engine in the flow canvas today. Digital Twin simulations (`webview/simulations/**`) use separate R3F shells; **Phase 3 vehicle** targets **Jolt** behind the simulation hub, not inside Sensor Studio preview nodes.

## Design principles

1. **Fifth evaluator (E)** — Add a **physics domain** tick alongside dataflow (A), scene/animation (B), events (C), and material (D). See [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md).
2. **Mutually exclusive preview backends** — Physics preview runs only when the graph declares an active `physics-world` (or user selects **Simulation**-linked mode in a future toolbar). UART / external sim parity rules from Bitstream dual-runtime do **not** apply here; physics is host-side only.
3. **Wire types, not raw numbers** — Follow Tier C scene FX: `FlowWireRigidBodyV1`, `FlowWireColliderV1`, merged into a `Scene3DConfigV1.physics` block or a parallel `PhysicsSceneV1` snapshot consumed by `StudioSceneViewport` (or a dedicated physics viewport).
4. **Reuse migration sources** — Port graph semantics from **node-animator** (`D:/CODE/2026/node-animator`) and **ternion-t3d** simulation stubs only as reference; canonical implementation lives under `extension/src/webview/sensor-studio/` when un-gated.

## Phased delivery

| Phase | Deliverable | Touch points (when implemented) |
|-------|-------------|----------------------------------|
| **D0** | This doc + tracker rows | **Done 2026-05-31** |
| **D1** | Catalog stubs + NA import + eval no-ops | `node-catalog.config.ts`, `normalize-node-asset-for-studio.ts`, `flow-editor.store.ts`, `na-parity-tier-d.test.ts` |
| **D2** | `physics-world` + static colliders; **Rapier** in Stage preview (**2026-06-02** partial — `@dimforge/rapier3d-compat`, ground + graph colliders; Model Viewer **`phys`** port backlog) | `flow-wire-physics-scene.ts`, `stage-physics-colliders.ts`, `studio-viewport-physics-runtime.ts` |
| **D3** | Rigid bodies, spawner, joints | `physics-domain-eval.ts`, fixed-step tick in `useSensorStudioFlowTickScheduler` |
| **D4** | IK + animation blend; hub integration | `studio-glb-preview-runtime.ts`, `simulations/vehicle-physics/` shared collider schema |
| **D5** | **Physics Lab** hub app — professional authoring (layers, modes, validation); round-trip `PhysicsSceneV1` ↔ graph | [`PHYSICS_LAB.md`](../../simulations/physics-lab/docs/PHYSICS_LAB.md), [`PHYSICS_LAB_PROFESSIONAL_FEATURES.md`](../../simulations/physics-lab/docs/PHYSICS_LAB_PROFESSIONAL_FEATURES.md), [`PHYSICS_SCENE_V1.md`](../../../docs/PHYSICS_SCENE_V1.md) |

### D1 checklist (first coding slice)

- [x] Add hidden catalog entries: `physics-world`, `rigid-body`, `box-collider`, `sphere-collider`, `object-spawner`, `fixed-joint`, `hinge-joint`, `ik-chain` (**2026-06-02**)
- [x] NA import mappings (`physics`, `rigidBody`, collider/joint types) in `normalize-node-asset-for-studio.ts` (**2026-06-02**)
- [x] Eval branches return empty / passthrough; `physics-world` emits `FlowWirePhysicsSceneV1` stub (**2026-06-02**)
- [x] Port type **`physicsScene`** in schema + `data-type-colors` (wire color only) (**2026-06-02**)
- [x] Unit test: import round-trip + eval smoke — **`na-parity-tier-d.test.ts`** (**2026-06-02**)

### D2 checklist (first visible preview — Rapier)

- [ ] `FlowWirePhysicsSceneV1` merge into `scene3d.physics` (or parallel snapshot)
- [ ] Lazy **Rapier** init only when `physics-world.enabled` in merged config (`@react-three/rapier` in preview subtree)
- [ ] Debug mesh for static colliders; no dynamics yet
- [ ] Dev + VSIX smoke: graph without physics unchanged (no Rapier load)

## Model Viewer integration (future)

Mirror scene FX ports:

| Port | Type | Source |
|------|------|--------|
| `phys` | `physicsScene` | `physics-world` → `out` |

Preview consumer: new `studio-viewport-physics-runtime.ts` stepping **Rapier** and syncing Three.js mesh transforms (similar to `studio-viewport-particle-runtime.ts`).

## Engine and product boundaries

| Surface | Role | Engine |
|---------|------|--------|
| **Sensor Studio flow canvas / Model Viewer** | Graph-authoritative scene + body/collider/joint wiring; **`phys`** preview | **Rapier** (locked **2026-06-02**) |
| **Hardware setup** | Physical truth — wheelbase, track width, wheel radius → collider placement | Engine-agnostic |
| **Physics setup (TRN)** | Engine-specific gravity, solver, debug draw (future) | **Rapier** options for flow preview |
| **Simulation hub** | Standalone demos (E84, vehicle) | **Jolt** today for vehicle; other hub sims as needed |

### Engine decision (locked 2026-06-02)

| Product area | Engine | Notes |
|--------------|--------|--------|
| **Sensor Studio** (Tier D flow physics, D2+) | **Rapier** | `@dimforge/rapier3d` + `@react-three/rapier`; lighter npm-native path; no COI/worker coupling to vehicle hub |
| **Digital Twin vehicle sim** (and selected future hub cases) | **Jolt** | `webview/simulations/vehicle-physics/`; keep isolated from Sensor Studio Rapier stack |
| **Cross-engine reuse** | **Not planned** | Collider *schema* and hardware dimensions may align; do **not** share WASM/runtime between Rapier flow preview and Jolt vehicle sim |

**Rationale:** Sensor Studio needs a self-contained preview in the flow editor; vehicle hub already invested in Jolt. Two engines are acceptable when surfaces stay separate (hub vs flow canvas).

## Testing matrix (minimum when D2 ships)

| Case | Verify |
|------|--------|
| Static box collider + dropped rigid body | Rest contact in Model Viewer |
| Dev + VSIX | Same Rapier load path |
| No `physics-world` | Preview unchanged (no WASM load) |

## References

- node-animator physics evaluators: `apps/node-animator/src/engine/nodeEvaluators/physics*.ts`
- Bitstream simulation hub: `extension/src/webview/simulations/**`
- **Physics Lab (planned):** [`physics-lab/docs/PHYSICS_LAB.md`](../../simulations/physics-lab/docs/PHYSICS_LAB.md)
- **Shared scene schema:** [`PHYSICS_SCENE_V1.md`](../../../docs/PHYSICS_SCENE_V1.md)
- Vehicle / Jolt hub: `APPLICATION_MIGRATION_PLAN.md` Phase 3
- Rapier deps: `extension/package.json` — `@dimforge/rapier3d`, `@react-three/rapier`
