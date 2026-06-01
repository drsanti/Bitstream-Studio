# Tier D — Physics stack foundation (Sensor Studio / node-animator parity)

**Status:** Planned — **Digital Twin gated** (Jolt / simulation hub in Bitstream Studio).  
**Related:** [`NODE_ANIMATOR_PARITY.md`](./NODE_ANIMATOR_PARITY.md), [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md), [`extension/docs/APPLICATION_MIGRATION_PLAN.md`](../../../docs/APPLICATION_MIGRATION_PLAN.md).

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

## Phased delivery (when Digital Twin un-gates)

| Phase | Deliverable |
|-------|-------------|
| **D0** | This doc + tracker row; no runtime |
| **D1** | Catalog stubs + NA import normalization + eval no-ops (parity count only) |
| **D2** | `physics-world` + static colliders; Ammo/Jolt WASM in preview iframe |
| **D3** | `rigid-body`, spawner, joints; Model Viewer optional **physics** input port |
| **D4** | IK + animation-physics blend; E84 / vehicle sim hub integration |

## Model Viewer integration (future)

Mirror scene FX ports:

| Port | Type | Source |
|------|------|--------|
| `phys` | `physicsScene` | `physics-world` → `out` |

Preview consumer: new `rotation-preview-physics-runtime.ts` stepping WASM and syncing Three.js mesh transforms (similar to `rotation-preview-particle-runtime.ts`).

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
