# Reference: 3DPhysicsEngine (`collision-engine`)

**External path:** `D:\CODE\2026\3DPhysicsEngine`  
**Role:** Canonical **game-engine authoring** reference for Bitstream **Physics Lab**  
**Status:** Private prototype v0.1.0 (Rapier + Three.js, Godot-style scene graph)  
**Parent plan:** [`PHYSICS_LAB.md`](./PHYSICS_LAB.md) · [`PHYSICS_SCENE_V1.md`](../../../../../docs/PHYSICS_SCENE_V1.md)

Read **`AGENTS.md`** in that repo before porting patterns.

---

## Summary

`3DPhysicsEngine` is the most complete Rapier physics editor in the workspace today. It already implements most of what Physics Lab plans — collider compounds, mesh baking, VHACD, joints, play validation, gizmo picking, and a strict **core / editor** split.

Bitstream should **borrow core physics and authoring patterns**, not copy the app wholesale:

| Keep from 3DPhysicsEngine | Change for Bitstream |
|---------------------------|----------------------|
| Rapier backend seam, shape rules, GLTF/VHACD baking | Wire format = **`PhysicsSceneV1`**, not `SceneDoc` v2 |
| Command + undo, collider editor, validate-before-play | Rendering via **R3F** + `@react-three/rapier` (not imperative `Viewport.tsx`) |
| TRN workbench panels | Live inside **simulation hub** + **graph export** |
| Vehicle raycast in Rapier | **Jolt** remains hub vehicle sim; optional Rapier vehicle preset only |

---

## Tech stack comparison

| | 3DPhysicsEngine | Bitstream Physics Lab |
|--|-----------------|------------------------|
| Physics | `@dimforge/rapier3d-compat` 0.19 | Same |
| Render | Imperative Three.js in `Viewport.tsx` | R3F + `SimulationCanvas` |
| UI | React workbench + **imports Bitstream TRN** (`@trn/*`) | Native TRN in extension |
| Scene schema | `SceneDoc` v2 (entity tree + components) | `PhysicsSceneV1` (flat bodies/joints) |
| Graph integration | None | **Required** — `physics-world` nodes |

---

## Borrow matrix

Legend: **Port** = move/adapt into `webview/shared/physics/` · **Pattern** = reimplement to spec · **Skip** = out of scope or different product

### Core physics (high value — **Port**)

| Module | Path | What it gives Physics Lab |
|--------|------|---------------------------|
| Backend seam | `src/core/physics/PhysicsBackend.ts` | Engine-agnostic interface + debug telemetry types |
| Rapier impl | `src/core/physics/RapierBackend.ts` | ColliderDesc mapping, joints, compound bodies, vehicle controller, actuators |
| Shape validation | `src/core/physics/shapes.ts` | e.g. dynamic + trimesh forbidden |
| Mesh recipes | `src/core/physics/meshColliderRecipe.ts` | Visual → hull / trimesh recipe |
| Runtime bridge | `src/core/runtime/World.ts` | Scene data → live Rapier world |
| Fixed step | `src/core/runtime/loop.ts` | 60 Hz accumulator |
| Play validation | `src/core/runtime/validatePlayScene.ts` | Pre-sim issues + repair hints |
| Entity types | `src/core/scene/Entity.ts` | `ShapeDesc`, `BodyComponent`, joint types — **map to PhysicsSceneV1** |

### Serialization ( **Pattern** + adapter )

| Module | Path | Notes |
|--------|------|-------|
| Serialize | `src/core/serialize/*.ts` | Strict migrate/validate pattern — apply to `PhysicsSceneV1` |
| Scene graph | `SceneDoc` v2 | Do **not** adopt as wire format; write **`sceneDocToPhysicsSceneV1()`** if importing old saves |

### GLTF / colliders (high value — **Port**)

| Module | Path | What it gives |
|--------|------|---------------|
| GLTF introspect | `src/editor/assets/gltfIntrospect.ts` | Mesh parts, vertex bake |
| Node paths | `src/editor/assets/gltfNodePath.ts` | Stable paths (aligns with `VEHICLE_GLB_AUTHORING.md`) |
| VHACD | `gltfVhacdWorker.ts`, `vhacdDecompose.ts` | Dynamic concave → convex compound |
| Collider editor model | `src/editor/colliders/editorModel.ts` | Compound reorder, numeric commit (tested) |

### Editor UX ( **Pattern** — behavioral spec for R3F Lab )

| Module | Path | Borrow behavior |
|--------|------|-----------------|
| Viewport | `src/editor/panels/Viewport.tsx` | Pick order, gizmo commit-on-release, play loop, debug overlays |
| Collider pane | `src/editor/panels/ColliderEditor.tsx` | Per-shape list, compound authoring |
| Inspector | `src/editor/panels/Inspector.tsx` | Body motion, joint limits, validation repairs |
| Commands | `src/editor/commands/sceneCommands.ts`, `History.ts` | Undo/redo for Lab edits |
| Hierarchy | `src/editor/panels/Hierarchy.tsx` | Scene tree + `TRNTree` |

### Architecture process ( **Port** ideas )

| Item | Path |
|------|------|
| Core/editor boundary | `scripts/architecture-check.mjs` |
| Invariants | `AGENTS.md` (scale never in physics, recipe-is-truth, fixed timestep) |

### Skip or defer

| Feature | Reason |
|---------|--------|
| Rapier raycast **vehicle** in Lab v1 | Bitstream **Jolt** `vehicle-physics` hub |
| Quadcopter actuators / force fields / buoyancy | Extension fields on `PhysicsSceneV1` later, not v1 |
| Telemetry HTML/CSV suite | Optional Lab diagnostics phase |
| Imperative `Viewport.tsx` as-is | Rewrite on R3F |
| SceneDoc as graph wire format | Graph uses **`PhysicsSceneV1`** |

### Bitstream must add (not in 3DPhysicsEngine)

| Feature | Physics Lab / graph plan |
|---------|--------------------------|
| **Spawners** | `object-spawner` node + Lab rain preset |
| **Ortho / persp toggle** | `VIEWPORT_PROJECTION_TOGGLE.md` |
| **Export to node graph** | Lab → `physics-world` subgraph |
| **Open graph in Lab** | Eval → `PhysicsSceneV1` |
| **Shared builder with Stage** | `buildRapierWorldFromPhysicsSceneV1()` |

---

## Feature coverage estimate

Approximate overlap with Physics Lab “full functions” checklist:

| Area | Coverage from reference |
|------|-------------------------|
| Primitive colliders | **~100%** — implemented |
| Compound colliders | **~100%** — `shapes[]` + Collider Editor |
| Convex hull / trimesh | **~90%** — recipes + baking; VHACD for concave |
| Joints (fixed, hinge, prismatic, spherical) | **~85%** — Rapier wired; graph has fixed/hinge only today |
| Rigid body motion types | **~100%** |
| Gizmo + raycast pick | **~80%** — full in imperative viewport; reimplement on R3F |
| Edit vs Play | **~100%** |
| Play validation | **~100%** |
| GLB import | **~85%** — asset pipeline; align with `*_collider` naming |
| Undo/redo commands | **~90%** |
| Spawners | **0%** — build in Bitstream |
| Orthographic camera | **0%** — build from Bitstream viewport shared code |
| Node graph round-trip | **0%** — Bitstream-specific |
| Vehicle drive (Jolt-class) | **N/A** — different engine in hub |

**Overall:** roughly **70–75%** of Physics Lab **runtime/authoring mechanics** can be adapted from `3DPhysicsEngine` core + editor patterns; **25–30%** is Bitstream-specific (schema, graph, R3F shell, spawners, ortho, Stage sharing).

---

## Recommended port order

1. **`webview/shared/physics/`** — `PhysicsBackend` + `RapierBackend` (trim vehicle/actuators for v1 if needed).
2. **`PhysicsSceneV1` types** + **`physicsSceneV1FromSceneDoc()`** adapter (optional import path).
3. **`validatePlayScene`** port — map codes to TRN inspector hints.
4. **GLTF introspect + collider discovery** — `*_collider`, `collider_material`, `VEHICLE_GLB_AUTHORING.md`.
5. **Physics Lab P0–P1** R3F viewport using ported builder (not copying `Viewport.tsx` verbatim).
6. **Collider Editor UX** — port `editorModel.ts` + panel patterns.
7. **VHACD worker** — when dynamic mesh colliders are required.
8. **Graph export/import** — serialize `PhysicsSceneV1` to nodes.

---

## License

No `LICENSE` file in `3DPhysicsEngine` (`package.json`: `"private": true`). Treat as **internal reference** until explicit license / ownership is documented for code ports.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | Initial borrow analysis vs Physics Lab plan |
