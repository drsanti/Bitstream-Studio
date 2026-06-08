# Three.js primitives and mesh materials — implementation plan

**Status:** **v1 complete** (**2026-06-07**, Phases 1–5). **v2 planned** — see § v2 roadmap below. **Scene Editor** (gizmo + graph sync) is a separate proposal — [`SCENE_EDITOR_MODE.md`](./SCENE_EDITOR_MODE.md).  
**Domains:** **Domain B** (procedural meshes on Stage) + **Domain D** (standalone mesh materials).  
**Related:** [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md), [`STAGE_VIEWPORT_AND_SCENE_OUTPUT.md`](./STAGE_VIEWPORT_AND_SCENE_OUTPUT.md), [`material-domain-eval.ts`](../core/flow/material-domain-eval.ts), [`stage-scene-snapshot.ts`](../core/stage/stage-scene-snapshot.ts), [`DEVELOPMENT_TRACKER.md`](../../../../docs/DEVELOPMENT_TRACKER.md).

**Product promise:** Add **composable flow nodes** for built-in Three.js **geometries** and **materials** so operators can build simple 3D scenes (helpers, debug shapes, floors, markers) on **Stage** without importing a GLB. **Not** a Blender Geometry Nodes or Shader Editor replacement.

---

## Goal

Give integrators and operators a clear workflow to:

1. Author **standalone materials** (Basic, Standard, Physical, …) as flow nodes.
2. Spawn **primitive meshes** (box, sphere, plane, …) with wired **material** and **transform**.
3. **Combine** multiple meshes and commit them to **Scene Output** alongside GLB **Models**.
4. Preview on **Stage** and **Model Viewer** (procedural **Meshes** input shipped Phase 5).

**GLB workflows stay unchanged** — `glb-material-*` nodes continue to target **named materials on imported models**.

---

## Shipped baseline (do not re-litigate)

| Piece | Role |
| ----- | ---- |
| **`model-select` (Model Source)** | GLB scope anchor; wired into Scene Output **Models** |
| **`scene-output`** | Commits models + environment / camera / animation / FX / physics to Stage |
| **`evaluateStageSceneSnapshot`** | Builds `StageSceneSnapshotV1` → `useStageSceneStore` |
| **`StudioSceneViewport`** | Vanilla Three.js renderer for Stage + flow previews |
| **`glb-material-param` / `color` / `texture`** | PBR drives on **named GLB materials** (Domain D v1) |
| **`material-mix`** | Blends two **numbers** (shader-graph primitive) — not material wires |
| **`box-collider` / `sphere-collider`** | Physics shapes only — cyan debug meshes, not general scene objects |
| **`object-transform` + `FlowWireTransformV1`** | Position / rotation / scale wires for scene objects |

This plan adds a **procedural mesh layer** parallel to GLB instances, not an extension of GLB extract drives.

---

## Architecture

```text
[Mesh Material Standard] ──material──► [Mesh Box]
[Object Transform]       ──transform─► [Mesh Box]
                                              │
[Mesh Sphere] ◄── material / transform        │
       │                                      │
       └──────────────► [Mesh Bundle] ──mesh──► [Scene Output Meshes]
                                                      │
                                                      ▼
                                              Stage (StudioSceneViewport)
```

### New port / wire types

| Port type | Wire | Purpose |
| --------- | ---- | ------- |
| **`material`** | `FlowWireMaterialV1` | Serializable material recipe — Three.js class + PBR params + optional texture URLs |
| **`mesh`** | `FlowWireMeshV1` | One renderable object — geometry kind + dimensions + transform + material reference |

### Scene snapshot extension

Extend `StageSceneSnapshotV1` (alongside `models[]`):

```ts
meshes: StageMeshEntryV1[];
```

`evaluateStageSceneSnapshot` collects nodes wired into Scene Output **`meshes`** (new input port, multi-wire like **Models**).

### Evaluator

| Evaluator | Trigger | Nodes |
| --------- | ------- | ----- |
| **Geometry (B extension)** | rAF coalesced with scene frame tick | `mesh-*`, `mesh-group` |
| **Mesh materials (D extension)** | Same loop or dedicated pass | `mesh-material-*` |

Reuse dispose patterns from physics debug meshes (`studio-viewport-physics-runtime.ts`) and GLB supersede (`StudioSceneViewport` geometry dispose).

---

## GLB materials vs mesh materials

| Use case | Node family |
| -------- | ----------- |
| Tweak material on imported GLB | **`glb-material-param`**, **`glb-material-color`**, **`glb-material-texture`**, **`material-video`** |
| Material for procedural mesh | **`mesh-material-*`** (new) |
| Animated PBR on GLB | `glb-material-param` + generators / `material-mix` on **Value** |
| Animated PBR on primitive | `mesh-material-standard` + wired roughness / metalness / color |

Do **not** overload `glb-material-param` for primitives — different binding model (no GLB material name).

---

## Node catalog (proposed)

### Palette placement

| Subgroup | New entries |
| -------- | ----------- |
| **Materials** (existing) | `mesh-material-basic`, `mesh-material-standard`, `mesh-material-physical`, … |
| **Primitives** (new subgroup) | `mesh-box`, `mesh-sphere`, `mesh-plane`, … |

Add **`primitives`** to `PaletteSceneSubgroup` in `palette-entry-meta.ts` (between **Sources** and **Viewports** or after **Materials** — TBD at implementation).

### Mesh material nodes (Phase 1)

One catalog entry per Three.js material family (matches `box-collider` / `sphere-collider` clarity).

| Node id | Three.js class | v1 params |
| ------- | -------------- | --------- |
| **`mesh-material-basic`** | `MeshBasicMaterial` | color, opacity, wireframe, `map` |
| **`mesh-material-standard`** | `MeshStandardMaterial` | color, roughness, metalness, emissive, normal / roughness / metalness maps |
| **`mesh-material-physical`** | `MeshPhysicalMaterial` | standard + clearcoat, transmission, ior, thickness |
| **`mesh-material-toon`** | `MeshToonMaterial` | color, gradientMap |
| **`mesh-material-normal`** | `MeshNormalMaterial` | debug overlay |

**Shared inputs:** optional wired `color` (`vector3`), `roughness`, `metalness`, `opacity` (`number`); texture URL per map slot (reuse asset picker from `glb-material-texture`).

**Output:** `material` port.

### Primitive geometry nodes (Phase 2)

| Node id | Three.js geometry | Key params |
| ------- | ----------------- | ---------- |
| **`mesh-box`** | `BoxGeometry` | width, height, depth, segments |
| **`mesh-sphere`** | `SphereGeometry` | radius, widthSeg, heightSeg |
| **`mesh-plane`** | `PlaneGeometry` | width, height, segments |
| **`mesh-cylinder`** | `CylinderGeometry` | radiusTop, radiusBottom, height, radialSegments |
| **`mesh-cone`** | `ConeGeometry` | radius, height, radialSegments |
| **`mesh-torus`** | `TorusGeometry` | radius, tube, radial / tubular segments |
| **`mesh-capsule`** | `CapsuleGeometry` | radius, length, cap segments |

**Each primitive:**

- **Inputs:** `material` (recommended), `transform` (optional), dimension overrides (`number`)
- **Inspector transform:** Node tab → **Transform** section on every primitive (`MeshPrimitiveTransformInspectorSection`) — position, rotation (deg), scale; edits wired **Object Transform** when connected, else embedded `defaultConfig` (`version: 1`)
- **Output:** `mesh` port
- **Card:** kind icon + primary dimension scrubs (TRN pattern)

**Design decision (locked for v1):** **Separate node per primitive** — not one `mesh-primitive` with kind dropdown (better palette discoverability; mirrors collider split).

### Combine + commit (Phase 3)

| Node / port | Role |
| ----------- | ---- |
| **`mesh-group`** | N× `mesh` in → 1× `mesh` out (ordered list wire) |
| **`scene-output`** | New input **`meshes`** (`mesh` port) |
| **`model-viewer`** | **`meshes`** input for canvas preview parity — **shipped Phase 5** |

---

## Three.js scope matrix

### Geometries

| Tier | Geometries |
| ---- | ---------- |
| **v1** | Box, Sphere, Plane, Cylinder, Cone, Torus, Capsule |
| **v2** | Circle, Ring, Icosahedron, Octahedron, Tetrahedron, Dodecahedron, Lathe |
| **Defer** | Extrude, Shape, Text, Parametric, custom `BufferGeometry` editor |

### Materials

| Tier | Materials |
| ---- | --------- |
| **v1** | Basic, Standard, Physical, Toon, Normal (debug) |
| **v2** | Lambert, Phong, Matcap, Points, LineBasic, Sprite |
| **Defer** | `ShaderMaterial`, `NodeMaterial`, full shader DAG compile |

---

## Phased implementation

### Phase 0 — Document and align (this file)

- [x] Capture wire types, node list, phased order (**2026-06-07**)
- [x] Cross-link `FLOW_DOMAINS.md` and `DEVELOPMENT_TRACKER.md` (**2026-06-07**)
- [ ] Open decisions sign-off before coding (see below)

### Phase 1 — Mesh material nodes

- [x] `FlowWireMaterialV1` + coercion helpers (`flow-wire-material.ts`) — **2026-06-07**
- [x] Catalog: `mesh-material-basic`, `mesh-material-standard` (vertical slice) — **2026-06-07**
- [x] Inspector + card UI (TRN color picker, roughness / metalness / opacity scrubs; map slots reserved) — **2026-06-07**
- [x] Extend `material-domain-eval.ts` + flow tick `liveMaterialWire` — **2026-06-07**
- [x] Unit tests: wire coercion, param merge (`mesh-material-config.test.ts`) — **2026-06-07**

### Phase 2 — Core primitives

- [x] `FlowWireMeshV1` + coercion helpers (`flow-wire-mesh.ts`) — **2026-06-07**
- [x] Catalog: `mesh-box`, `mesh-sphere`, `mesh-plane` (Scene → **Primitives**) — **2026-06-07**
- [x] Node panels + inspector dimension fields — **2026-06-07**
- [x] Shift+A search aliases (`box`, `sphere`, `plane`) — **2026-06-07**
- [x] Flow tick `liveMeshWire` + socket badges; `geometry-domain-eval.ts` rAF trigger — **2026-06-07**
- [x] Unit tests (`mesh-primitive-config.test.ts`) — **2026-06-07**

### Phase 3 — Stage commit + viewport runtime

- [x] `StageMeshEntryV1` + `evaluateStageSceneSnapshot` collection — **2026-06-07**
- [x] Scene Output **`meshes`** input port — **2026-06-07**
- [x] `studio-viewport-procedural-meshes.ts` — create / update / dispose `THREE.Mesh` pool in `StudioSceneViewport` — **2026-06-07**
- [x] Shadows on procedural meshes (cast/receive with scene shadow toggle) — **2026-06-07**
- [x] Demo template: **Primitives playground** (`primitives-playground`) — **2026-06-07**

### Phase 4 — Remaining primitives + group

- [x] `mesh-cylinder`, `mesh-cone`, `mesh-torus`, `mesh-capsule` — **2026-06-07**
- [x] `mesh-material-physical`, `mesh-material-toon`, `mesh-material-normal` — **2026-06-07**
- [x] **`mesh-group`** merge node (2–8 inputs, flatten at Stage commit) — **2026-06-07**
- [x] Model Viewer **`meshes`** input (canvas preview parity with Stage) — **2026-06-07**

### Phase 5 — Physics + picking glue

- [x] `rigid-body` optional **`mesh`** input → bounds-derived box half-extents + transform position — **2026-06-07**
- [x] Stage pick `objectPath` for procedural meshes (`proc:{nodeId}` / `proc:{nodeId}:{index}`) — **2026-06-07** (Phase 3 viewport)
- [x] Operator guide: GLB vs procedural vs physics collider — **2026-06-07** (below)

#### Operator guide — GLB vs procedural vs collider

| Source | Flow nodes | Committed to Stage | Model Viewer preview | Physics |
| ------ | ---------- | ------------------ | -------------------- | ------- |
| **Imported GLB** | **Model Source** → Scene Output **Models** | Yes (`StageModelEntry`) | **Model** input | GLB colliders (backlog) |
| **Procedural mesh** | **Mesh Box/Sphere/…** + **Mesh Material** → **Meshes** | Yes (`StageMeshEntry`, flattened from **Mesh Bundle**) | **Meshes** input | Wire **Mesh** into **Rigid Body** for Rapier box bounds |
| **Collider-only** | **Box/Sphere Collider** → Physics World **Shapes** | Via **Physics** wire on Scene Output | **Physics** input on Model Viewer | Static shapes only |

**Pick paths on Stage:** GLB parts use hierarchy paths; procedural meshes use `proc:{flowNodeId}` or `proc:{flowNodeId}:{leafIndex}` when a **Mesh Bundle** (`mesh-group` id) flattened to multiple bodies.

---

## v2 roadmap (procedural meshes + materials)

**Status:** **Planned** — v1 (Phases 1–5) shipped **2026-06-07**. v2 extends the same wire/eval/viewport stack; does **not** include a full shader DAG or geometry CSG (see **Non-goals**).

**Related (separate epic):** interactive **Scene Editor** on Stage (gizmo, raycast selection, graph sync) — [`SCENE_EDITOR_MODE.md`](./SCENE_EDITOR_MODE.md).

### v2a — Texture + PBR completeness (recommended first slice)

- [ ] Mesh material **map slots** UI (reuse `glb-material-texture` / asset picker patterns)
- [ ] Viewport: load `map`, `normalMap`, `roughnessMap`, `metalnessMap` on procedural materials
- [ ] **Emissive** color + intensity on Standard / Physical
- [ ] Physical: **ior**, **thickness** on wire + inspector
- [ ] Toon: **gradientMap** (asset URL)

### v2b — Additional primitives (polyhedra + 2D shapes)

- [ ] `mesh-circle`, `mesh-ring`
- [ ] `mesh-icosahedron`, `mesh-octahedron`, `mesh-tetrahedron`, `mesh-dodecahedron`
- [ ] Segment / detail params on box / plane where missing

### v2c — Lathe

- [ ] `mesh-lathe` + profile points (config or future `vector2[]` wire)
- [ ] Viewport `LatheGeometry` + validation tests

### v2d — Lines, points, sprites (architecture fork)

- [ ] Decide: extend **`mesh`** wire vs new **`sceneObject`** port for non-mesh drawables
- [ ] `mesh-line` / `mesh-points` / `mesh-sprite` nodes + Stage pool (not only `THREE.Mesh`)
- [ ] Materials: `mesh-material-line-basic`, `mesh-material-points`, `mesh-material-sprite`

### v2e — Instancing + physics fidelity

- [ ] `mesh-instancer` (one mesh wire + N transforms or scatter config)
- [ ] Rigid body: **sphere** / **capsule** collider from mesh kind (optional)
- [ ] Stage toolbar: frame selection (procedural leaf)

### v2f — Export (optional)

- [ ] Snapshot `meshes[]` → glTF (procedural only slice; GLB merge deferred)

### v2 non-goals (unchanged from v1)

Shader DAG, CSG/boolean geometry DAG, replacing GLB for mechanical twins, Blender-style full scene authoring without graph backing.

---

## First vertical slice (recommended)

**Box + sphere + plane** with **Mesh Material Standard** on **Stage** only:

- Proves `material` + `mesh` wires, snapshot eval, viewport dispose, and lighting
- Smallest catalog surface before Phase 4 expansion

---

## Non-goals (v1)

| Item | Notes |
| ---- | ----- |
| Blender-style geometry DAG | Boolean, subdivide, instancing graph |
| CSG | Constructive solid geometry |
| Procedural mesh → glTF export | Backlog |
| Replacing GLB for mechanical / digital-twin assets | GLB remains primary |
| `Line` / `Points` scene objects | v2 |
| Full shader DAG → `ShaderMaterial` | `FLOW_DOMAINS` Phase 6 v2 defer |

---

## Open design decisions

| # | Question | Recommendation |
| - | -------- | -------------- |
| 1 | Split vs unified primitive node | **Split** (`mesh-box`, …) — locked for v1 |
| 2 | Model Viewer in first slice | **Stage-only first**; viewer parity Phase 3 |
| 3 | Material node granularity | **Split** families (Basic / Standard / Physical) |
| 4 | Port name | **`mesh`** (not `sceneObject` / `primitive`) |
| 5 | Palette subgroup order | **Primitives** after **Materials** |

---

## Key implementation files (when coding starts)

| Layer | Path |
| ----- | ---- |
| Plan (this file) | `docs/PRIMITIVES_AND_MATERIALS_NODES.md` |
| Catalog | `config/node-catalog.config.ts`, `palette-entry-meta.ts` |
| Wires | `features/editor/nodes/mesh/flow-wire-mesh.ts`, `flow-wire-material.ts` |
| Eval | `core/stage/evaluate-stage-scene-snapshot.ts`, `core/flow/geometry-domain-eval.ts` |
| Runtime | `core/viewport/StudioSceneViewport.tsx`, `studio-viewport-procedural-meshes.ts` |
| UI | `features/editor/nodes/mesh/*`, inspector settings sections |

---

## Testing matrix (when implementation starts)

| Case | Dev (Vite) | VSIX |
| ---- | ---------- | ---- |
| Standard material + box on Stage | Wired graph → Stage shows lit box | Same |
| Transform wire moves primitive | Sine → position visible on rAF | Same |
| Mesh dispose on graph edit | Remove node → no WebGL leak (manual) | Same |
| GLB + primitive coexist | Model Source + mesh plane floor | Same |

---

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-06-07** | Initial plan — primitives, mesh materials, wire types, phased roadmap. |
| **2026-06-07** | **Phase 3 shipped** — Scene Output **Meshes**, `StageMeshEntryV1`, Stage viewport runtime, **Primitives playground** demo. |
| **2026-06-07** | **Phase 2 shipped** — `mesh-box`, `mesh-sphere`, `mesh-plane`, `mesh` port, `FlowWireMeshV1`, eval + UI + tests. |
| **2026-06-07** | **Phase 1 shipped** — `mesh-material-basic`, `mesh-material-standard`, `material` port, `FlowWireMaterialV1`, eval + UI + tests. |
