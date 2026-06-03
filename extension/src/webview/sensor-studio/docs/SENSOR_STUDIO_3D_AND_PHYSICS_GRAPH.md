# Sensor Studio — 3D scene and physics node graph

This document describes how **Three.js** scene authoring and **Rapier** physics preview flow from the node graph into **Stage** and **Model Viewer**.

## Commit points

| Node | Role |
|------|------|
| **Scene Output** | Runtime commit to the **Stage** workbench (`evaluateStageSceneSnapshot`). |
| **Model Viewer** | In-canvas GLB preview (same viewport stack, separate scope). |
| **Rotation / Quaternion preview** | Live orientation preview; same scene FX input ports as Model Viewer. |

Stage reads **only** Scene Output (not Model Viewer). Both use `StudioSceneViewport` (vanilla Three.js + optional Rapier).

## Scene wires (Three.js)

Wire these catalog outputs into **Scene Output** or **Model Viewer** inputs:

| Port | Wire kind | Merges into `scene3d` |
|------|-----------|------------------------|
| `env` | environment | backdrop, IBL, cubemap |
| `cam` | camera | orbit / projection |
| `xf` | transform | model placement |
| `anim` | glbAnimation | clip drives |
| `settings` | number | exposure |
| `fog` | fog | scene fog |
| `lite` | studioLight | authored directionals |
| `post` | postProcessing | bloom, etc. |
| `cshadow` | contactShadows | ground contact shadow |
| `emitter` | particleEmitter | particle VFX |
| `models` | string (URL) | Scene Output only — multi-model Stage layout |

Evaluation: `mergeFlowSceneWiresIntoScene3d` + environment/camera/transform merges in `evaluate-stage-scene-snapshot.ts` (Stage) or `ModelViewerNodePanel` (card preview).

## Physics graph (Rapier)

```
box-collider ──physicsCollider──┐
sphere-collider ───────────────┼── shapes ──► physics-world ──physicsScene──► Scene Output.phys
rigid-body ──physicsBody─────────┘                              └──► Model Viewer.phys
```

1. **Box / Sphere Collider** — emit `physicsCollider` wires (static shapes).
2. **Rigid Body** — emit `physicsBody` wires (dynamic boxes; mass, spawn pose).
3. **Physics World** — merges wired shapes/bodies + gravity into one `physicsScene` wire.
4. **Scene Output** / **Model Viewer** — `phys` input enables Rapier in the viewport.

`scene3d.physics` stores `{ enabled, gravityY }` for persistence. Collider/body lists travel on the live `physicsScene` wire and snapshot fields `physicsColliders` / `rigidBodies`.

Preview implementation: `@dimforge/rapier3d-compat` in `studio-viewport-physics-runtime.ts` (ground plane, static colliders, dynamic bodies, debug wireframes).

Unwired collider nodes in the graph are still picked up when physics is enabled (authoring convenience); prefer wiring into **Physics World → shapes**.

## Related docs

- `STAGE_VIEWPORT_AND_SCENE_OUTPUT.md` — Stage independence and toolbar
- `TIER_D_PHYSICS_FOUNDATION.md` — Tier D backlog checklist
- `STUDIO_SCENE3D_CONFIG.md` — `Scene3DConfigV1` fields
