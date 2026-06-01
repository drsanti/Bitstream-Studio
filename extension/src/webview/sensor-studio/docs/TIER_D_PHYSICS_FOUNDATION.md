# Tier D — Physics stack foundation (Sensor Studio / node-animator parity)

**Status:** **Future development** — design + tracker only (**D0 complete 2026-05-31**). No flow-canvas WASM runtime yet.  
**Tracker:** [`extension/docs/DEVELOPMENT_TRACKER.md`](../../../docs/DEVELOPMENT_TRACKER.md) — *Planned / next → physics domain*, *Future / ideas → physics stack*.  
**Related:** [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md), [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md), [`extension/docs/APPLICATION_MIGRATION_PLAN.md`](../../../docs/APPLICATION_MIGRATION_PLAN.md).

## Current status (2026-05-31)

| Milestone | State |
|-----------|--------|
| Scene FX preview (fog, bloom, contact shadows, camera-switch, particles) | **Shipped** — see scene wiring slices 1–3 |
| Tier D physics nodes / evaluator | **Not started** (D1 next when scheduled) |
| Digital Twin Jolt vehicle sim | **Partial** — `webview/simulations/vehicle-physics/` |
| Rapier npm deps | Retained; no Sensor Studio integration |

**Start condition:** Product un-gates physics after D1 stub slice is scheduled, or Digital Twin Phase 3 shares a reusable WASM bundle for Model Viewer preview.

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
3. **Wire types, not raw numbers** — Follow Tier C scene FX: `FlowWireRigidBodyV1`, `FlowWireColliderV1`, merged into a `Scene3DConfigV1.physics` block or a parallel `PhysicsSceneV1` snapshot consumed by `RotationPreviewPanelV4` (or a dedicated physics viewport).
4. **Reuse migration sources** — Port graph semantics from **node-animator** (`D:/CODE/2026/node-animator`) and **ternion-t3d** simulation stubs only as reference; canonical implementation lives under `extension/src/webview/sensor-studio/` when un-gated.

## Phased delivery

| Phase | Deliverable | Touch points (when implemented) |
|-------|-------------|----------------------------------|
| **D0** | This doc + tracker rows | **Done 2026-05-31** |
| **D1** | Catalog stubs + NA import + eval no-ops | `node-catalog.config.ts`, `normalize-node-asset-for-studio.ts`, `flow-editor.store.ts`, `na-parity-tier-d.test.ts` |
| **D2** | `physics-world` + static colliders; WASM in preview | `flow-wire-physics-scene.ts`, `scene3d-config.ts` **`physics`**, `rotation-preview-physics-runtime.ts`, Model Viewer **`phys`** port |
| **D3** | Rigid bodies, spawner, joints | `physics-domain-eval.ts`, fixed-step tick in `useSensorStudioFlowTickScheduler` |
| **D4** | IK + animation blend; hub integration | `studio-glb-preview-runtime.ts`, `simulations/vehicle-physics/` shared collider schema |

### D1 checklist (first coding slice)

- [ ] Add hidden catalog entries: `physics-world`, `rigid-body`, `box-collider`, `sphere-collider`, `object-spawner`, `fixed-joint`, `hinge-joint`, `ik-chain`
- [ ] NA import mappings (`physics`, `rigidBody`, collider/joint types) in `normalize-node-asset-for-studio.ts`
- [ ] Eval branches return empty / passthrough; no preview side effects
- [ ] Port type **`physicsScene`** in schema + `data-type-colors` (wire color only)
- [ ] Unit test: import round-trip + eval smoke

### D2 checklist (first visible preview)

- [ ] `FlowWirePhysicsSceneV1` merge into `scene3d.physics` (or parallel snapshot)
- [ ] Lazy WASM init only when `physics-world.enabled` in merged config
- [ ] Debug mesh for static colliders; no dynamics yet
- [ ] Dev + VSIX smoke: graph without physics unchanged (no WASM load)

## Model Viewer integration (future)

Mirror scene FX ports:

| Port | Type | Source |
|------|------|--------|
| `phys` | `physicsScene` | `physics-world` → `out` |

Preview consumer: new `rotation-preview-physics-runtime.ts` stepping WASM and syncing Three.js mesh transforms (similar to `rotation-preview-particle-runtime.ts`).

## Engine and product boundaries

| Surface | Role |
|---------|------|
| **Hardware setup** | Physical truth — wheelbase, track width, wheel radius → collider placement |
| **Physics setup (TRN)** | Engine gravity, solver iterations, debug draw (future) |
| **Flow `physics-world`** | Graph-authoritative scene + body/collider/joint wiring |
| **Simulation hub** | Standalone demos (E84, vehicle); may share WASM with D2+ |

**Engine decision (open):** Prefer **Jolt** if vehicle hub WASM is packaged for webview reuse; **Rapier** remains fallback if flow-canvas needs lighter static/dynamic preview without hub coupling.

## Testing matrix (minimum when D2 ships)

| Case | Verify |
|------|--------|
| Static box collider + dropped rigid body | Rest contact in Model Viewer |
| Dev + VSIX | Same WASM bundle path |
| No `physics-world` | Preview unchanged (no WASM load) |

## References

- node-animator physics evaluators: `apps/node-animator/src/engine/nodeEvaluators/physics*.ts`
- Bitstream simulation hub: `extension/src/webview/simulations/**`
- Vehicle / Jolt backlog: `APPLICATION_MIGRATION_PLAN.md` Phase 3
