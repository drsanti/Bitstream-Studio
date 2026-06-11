# Physics Lab — professional feature catalog

**Status:** Design (canonical checklist for implementation)  
**Parent:** [`PHYSICS_LAB.md`](./PHYSICS_LAB.md)  
**Scene editor:** [`PHYSICS_LAB_SCENE_EDITOR.md`](./PHYSICS_LAB_SCENE_EDITOR.md)  
**Factories:** [`PHYSICS_LAB_FACTORIES.md`](./PHYSICS_LAB_FACTORIES.md)  
**Schema:** [`PHYSICS_SCENE_V1.md`](../../../../../docs/PHYSICS_SCENE_V1.md)  
**Reference:** `D:\CODE\2026\3DPhysicsEngine` (`collision-engine` v0.1.0)

This document is the **full professional Physics Lab** requirement set — everything a production game/DCC physics editor needs, phased for delivery. Implementation must follow **core / editor** split and **command + undo** for all mutations (see 3DPhysicsEngine `AGENTS.md` invariants).

---

## Workbench layout

Resizable panels (persist layout in `localStorage`; upgrade path: dockview).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Back · Factory · Authoring mode · Edit|Simulate · Play controls │
├────────────┬──────────────────────────────────────────────┬───────────────┤
│ Outliner   │                                              │ Inspector     │
│ Collections│              Viewport + status HUD           │ (contextual)  │
│ Factory    │                                              │               │
├────────────┼──────────────────────────────────────────────┼───────────────┤
│ Collider   │  Bottom: Validation · Console · Asset refs   │ (optional 4th │
│ list       │                                              │  column)      │
└────────────┴──────────────────────────────────────────────┴───────────────┘
```

| Panel | Role |
|-------|------|
| **Outliner** | Scene tree, DnD, visibility, pick lock — [`PHYSICS_LAB_SCENE_EDITOR.md`](./PHYSICS_LAB_SCENE_EDITOR.md) |
| **Collections** | Named layers for filter, visibility, bulk assign collision group |
| **Factory** | Car / Drone / … presets when factory ≠ Primitive |
| **Collider list** | Compound shape stack per body — port `ColliderEditor.tsx` |
| **Inspector** | World, body, collider, joint, mechanism — `CourseInspectorCard` / TRN |
| **Validation** | `validatePlayScene` issues + one-click repair |
| **Viewport HUD** | FPS, bodies, contacts, step ms, sim state |

---

## Authoring modes

Toolbar **`TRNSegmentedControl`** — one active mode drives pick target, gizmo behavior, and inspector default tab.

| Mode | Id | Pick | Gizmo | Inspector focus |
|------|-----|------|-------|-----------------|
| **Object** | `object` | Bodies / groups | World transform | Motion, mass, locks |
| **Collider** | `collider` | Collider children | Local offset + param bake | Shape kind, material, sensor |
| **Joint** | `joint` | Joint anchors / axes | Anchor + axis | Limits, motor, connected bodies |
| **Simulate** | `simulate` | Optional kinematic grab (P4+) | Disabled (default) | Debug overlays, forces |

**Rules:**

- Switching mode does **not** clear selection; filters what is pickable.
- **Edit** global state pauses Rapier; **Simulate** mode only meaningful when toolbar is **Simulate** + Play.
- Keyboard: **1** Object · **2** Collider · **3** Joint · **4** Simulate (when not conflicting with view snaps — use **Alt+1..4** if needed).

---

## Collision groups and filtering

Rapier uses **InteractionGroups** (32-bit): upper 16 bits = membership, lower 16 = filter mask. Collision allowed when both directions match bitwise rule (see Rapier `interaction_groups.d.ts`).

### Named groups (editor UX)

Up to **16 named layers** in project/scene defaults:

| Bit | Default name | Typical use |
|-----|--------------|-------------|
| 0 | `Default` | General props |
| 1 | `StaticWorld` | Floor, walls |
| 2 | `DynamicProps` | Boxes, crates |
| 3 | `Character` | Player proxy |
| 4 | `Vehicle` | Chassis + wheels |
| 5 | `Wheel` | Raycast vehicle rays |
| 6 | `Trigger` | Sensor volumes |
| 7 | `Debris` | Small fragments |
| 8–15 | `User8`…`User15` | Team-defined |

Scene stores definitions in `PhysicsSceneV1.collisionLayers`.

### Collision matrix UI

**Project Settings → Collision Matrix** (or World inspector card):

- 16×16 grid: row collides with column when both masks allow.
- Click cell toggles pairwise collision (symmetric).
- **Presets:** All, None, Static-only, Triggers-ignore-Dynamic.
- **Highlight mode:** select a layer → viewport tints colliders in that group.

Per **collider** inspector (advanced):

- **Membership** — multi-select checkboxes (which groups this collider belongs to).
- **Filter mask** — which groups this collider collides with.
- **Solver groups** — optional separate mask for solver (Rapier `setSolverGroups`).

### Schema

```ts
type PhysicsCollisionLayerV1 = {
  bit: number;           // 0..15
  name: string;
  color?: string;        // debug tint
};

type PhysicsCollisionMatrixV1 = {
  /** layerBit → bitmask of layers it collides with (editor-derived; baked to InteractionGroups). */
  collidesWith: Record<number, number>;
};

// On collider:
collision?: {
  membershipBits?: number;   // OR of layer bits
  filterBits?: number;
  solverMembershipBits?: number;
  solverFilterBits?: number;
};
```

**Bake:** `membershipBits` + `filterBits` → single `InteractionGroups` per Rapier docs. Graph export preserves layer names on collider nodes.

---

## Collections (scene organization)

Orthogonal to collision layers — **editor-only** buckets unless exported as tags.

| Feature | Behavior |
|---------|----------|
| Named collection | e.g. `Environment`, `Vehicles`, `Triggers` |
| Multi-membership | Body can be in multiple collections |
| Outliner filter | Show only selected collection |
| Bulk ops | Assign collision layer, hide, duplicate, export subset |
| Color chip | Row accent in outliner |

Stored as `tags` on `PhysicsSceneNodeV1` or `collections[]` on scene with node id refs.

---

## Collider authoring (compound editor)

Port **`ColliderEditor.tsx`** + **`editorModel.ts`** from 3DPhysicsEngine.

| Feature | Detail |
|---------|--------|
| Shape list | Sortable stack (`TRNSortableContainer`); each row: icon, kind, params summary |
| Add shape | Box, sphere, capsule, cylinder, convex hull, trimesh |
| Reorder | Changes compound evaluation order (visual only; Rapier compound is unordered) |
| Local transform | Per-shape offset; numeric commit on blur |
| **Scale bake** | Gizmo scale → bake into `params`, reset scale to 1 (invariant) |
| Mesh source | `ShapeSource` recipe: hull / trimesh / vhacd + optional baked cache |
| **VHACD** | Worker decompose concave visual → convex hull compound (dynamic bodies) |
| Regenerate | Re-bake from recipe when GLB updates |
| Sensor toggle | `isSensor` — trigger volume, no contact response |
| Material | Friction, restitution, density; combine rules (average / min / max / multiply) |

**Trimesh rule:** static/kinematic only — enforced in UI + `validateBodyShapeRules`.

---

## Body inspector (advanced)

| Field | Rapier mapping |
|-------|----------------|
| Motion | fixed / dynamic / kinematic |
| Mass vs density | Mass on body or per-collider density |
| Linear / angular damping | `RigidBodyDesc` |
| Locked axes | translation / rotation `[x,y,z]` |
| **CCD** | Continuous collision detection for fast thin objects |
| **Sleeping** | Can sleep toggle; wake on edit |
| **Gravity scale** | Per-body multiplier |
| **Dominance** | Optional solver priority |

---

## Joint inspector (full surface)

| Kind | Fields |
|------|--------|
| Fixed | bodyA, bodyB, anchors, frames |
| Revolute (hinge) | axis, limits, motor (target vel, max force) |
| Prismatic | axis, limits, motor |
| Spherical | cone limits (phase 2) |
| Spring / rope | stiffness, damping (extension) |

**Joint mode** authoring: click body A → body B → place anchors in viewport.

Validation: missing body refs, zero-length axis, limits min > max.

---

## Materials and contact

| Feature | UI |
|---------|-----|
| Friction / restitution | Per collider; body default inherit |
| Combine rules | Dropdown per collider |
| **Contact skin** | Rapier `contact_skin` for stable stacking |
| **Contact force events** | Threshold for debug / telemetry |
| **Physics material presets** | Rubber, ice, metal, wood — friction/restitution bundles |

---

## World and simulation

| Feature | Detail |
|---------|--------|
| Gravity vector | Numeric + presets (Earth, Moon, Zero) |
| **Fixed timestep** | Default 60 Hz; accumulator decoupled from render FPS |
| **Play / Pause / Step** | Step = one fixed dt while paused |
| **Reset** | Restore pre-play transforms; discard sim state |
| **Edit vs Simulate** | No `PhysicsWorld` in Edit; build on Play entry |
| **Substeps** | Advanced: integration substeps (if exposed by Rapier version) |
| **Determinism flag** | Document non-guarantees; same scene + seed for tests |

**Invariant (from reference):** simulation **never** mutates authored recipe — only read poses back during Play; Stop restores edit poses.

---

## Debug visualization

Toolbar chips + Viewport inspector card.

| Overlay | Content |
|---------|---------|
| **Colliders** | All / selected / none wireframes |
| **Collider fill** | Semi-transparent hull (x-ray) |
| **COM** | Center of mass markers |
| **Contacts** | Points + normals |
| **Joint axes** | Lines + limit arcs |
| **Sleep state** | Dim sleeping bodies |
| **Velocity** | Linear / angular arrows |
| **AABBs** | Broad-phase bounds (dev) |
| **Vehicle debug** | Wheel rays, contact green/red (Car Factory) |
| **Drone debug** | Thruster arrows, force mix (Drone Factory) |
| **Force fields** | Wind / water arrows, region boxes |
| **Buoyancy** | Water plane |
| **Collision layer tint** | Color by membership bit |

Reference: `Viewport.tsx` vehicle/drone/environment debug helpers.

---

## Validation and repair

Port **`validatePlayScene.ts`** — issue codes + inspector repair buttons.

| Category | Example codes |
|----------|----------------|
| Body | `body_empty`, `body_shape_rule`, trimesh on dynamic |
| Shape | `shape_scale_unbaked`, `mesh_source_missing`, degenerate hull |
| Joint | `joint_body_a_missing`, invalid limits |
| Vehicle | `vehicle_wheels_missing`, `vehicle_body_not_dynamic` |
| Visual | `visual_asset_missing` |
| Transform | `entity_transform_non_finite` |

**Validation panel:**

- List all issues; click → select entity; filter by severity.
- **Repair all** (safe fixes only): bake scale, remove broken refs, clamp params.
- **Block Play** when errors remain (warn on warnings).

Outliner **badge** per node with issue count.

---

## Asset pipeline

| Feature | Source |
|---------|--------|
| **Asset browser** | GLB list, drag into viewport |
| **GLTF introspect** | Mesh parts, node paths — `gltfIntrospect.ts` |
| **Collider discovery** | `*_collider`, `collider_material`, extras — `VEHICLE_GLB_AUTHORING.md` |
| **VHACD worker** | Async; progress in collider panel |
| **Re-import diff** | Merge new mesh; keep manual joint/collider edits where possible |
| **Thumbnail** | Optional preview in asset row |

---

## Prefabs and templates

| Feature | Detail |
|---------|-----|
| Save selection as prefab | `physics-lab/presets/*.physics.json` |
| Insert prefab | Spawn subtree with new ids |
| Linked vs unique | Duplicate: shared recipe vs deep copy |
| Factory templates | Car, Drone ship with `factory` metadata |
| Starter scenes | Empty, domino row, car drop, quad hover |

---

## Transform tools

| Tool | Shortcut | Notes |
|------|----------|-------|
| Translate / Rotate / Scale | G / R / S | Multi-selection |
| **Snap** | Toggle + increment | Grid, ground (Y=0), angle 5°/15°/45° |
| **Align** | Panel | Min/max/center per axis on selection |
| **Distribute** | Panel | Even spacing on axis |
| **Measure** | M | Two-point distance; optional pin label |
| **Drop to ground** | | Raycast down to static colliders |
| **Duplicate** | Ctrl+D | |
| **Mirror** | | Across world X/Y/Z (phase 2) |

Actuator snap (reference): thruster placement snap step for Drone Factory.

---

## Selection and navigation

Full detail: [`PHYSICS_LAB_SCENE_EDITOR.md`](./PHYSICS_LAB_SCENE_EDITOR.md).

Additional professional items:

| Feature | Detail |
|---------|--------|
| **Isolation** | `/` — hide unselected subtrees |
| **Focus** | `.` frame selection |
| **Pick depth** | Cycle through stacked hits (Alt+click) |
| **Filter pick** | Respect collection / collision layer filter |
| **Stats HUD** | `ViewportStatusHud.tsx` pattern |

---

## Command system and persistence

| Feature | Requirement |
|---------|-------------|
| **Undo / redo** | All scene mutations via commands; 50+ steps |
| **Save / load** | `PhysicsSceneV1` JSON; download / upload |
| **Autosave** | Session draft in `sessionStorage` |
| **Version migrate** | `version` field + migrate on load |
| **Copy/paste** | Fragment JSON for body/subtree |
| **History scrubber** | Optional: named checkpoints (P5+) |

---

## Graph and runtime integration

| Feature | Detail |
|---------|-----|
| Export to graph | Stable ids; collision layers → node config |
| Open in Lab | Eval `physics-world` subgraph |
| Shared builder | `buildRapierWorldFromPhysicsSceneV1` |
| Stage parity | Same overlays toggles (subset) in Model Viewer |
| Mechanisms | Vehicle, quadcopter, buoyancy on `mechanisms[]` |

---

## Factories (domain packs)

See [`PHYSICS_LAB_FACTORIES.md`](./PHYSICS_LAB_FACTORIES.md). Professional extras per factory:

| Factory | Professional features |
|---------|----------------------|
| **Car** | Wheel layout wizard, raycast controller, wheel debug, link to Jolt vehicle sim |
| **Drone** | Thruster auto-layout, hover assist tuning, force mix HUD |
| **Robot arm** | Joint chain generator, motor test pose |
| **Environment** | Trimesh floor import, wind/water volumes, buoyancy plane |

---

## Telemetry and diagnostics (optional phase)

Port subset of 3DPhysicsEngine telemetry toolbar when needed for regression:

- Record contact forces / body poses during Play
- Export CSV / JSON
- Baseline compare for vehicle/drone tuning

Not required for P0–P4 MVP; useful for Car/Drone factory QA.

---

## Keyboard and accessibility

| Area | Standard |
|------|----------|
| View navigation | Alt+LMB orbit, Alt+Shift+LMB pan, scroll zoom — `SCENE_3D_EDITOR.md` |
| View snaps | Numpad 1/3/7/9 |
| Projection | **5** persp ↔ ortho |
| Shortcut overlay | **?** modal |
| TRN hints | No native `title` — `TRNHintTooltip` |

---

## Implementation phases (professional roadmap)

Consolidated delivery order. Each phase is shippable in dev hub.

| Phase | Scope |
|-------|--------|
| **P0 — Boot** | Catalog, canvas, floor, one dynamic box, Edit/Simulate, flat outliner, Play/Pause |
| **P1 — Editor core** | Multi/box select, undo/redo, collider wireframe, spawn palette, body inspector, validation (read-only) |
| **P2 — Scene graph** | Tree DnD, groups, gizmo, ortho/persp, `nodes[]`, save/load, **authoring modes Object/Collider** |
| **P3 — Colliders** | Compound editor, hull/trimesh, VHACD, materials, sensor toggle, scale-bake invariant |
| **P4 — Filtering** | **Collision layers + matrix UI**, collections, hide/lock, snap, prefabs |
| **P5 — Joints + sim** | Full joint UI, **Joint authoring mode**, CCD, debug overlays (contacts, COM, velocity) |
| **P6 — Graph** | Export/import, shared Rapier builder, Stage parity |
| **P7 — Factories** | Car GLB, Drone thrusters, validation repair, factory debug HUDs |
| **P8 — Studio** | Environment factory, telemetry, measure/align, isolation, shortcut overlay, session replay |

---

## Core invariants (do not regress)

From 3DPhysicsEngine `AGENTS.md` — apply to Bitstream shared physics core:

1. **Recipe is truth** — colliders are data until Simulate builds Rapier objects.
2. **Scale never reaches physics** — bake into params on gizmo release.
3. **Trimesh = static/kinematic only** — dynamic concave → VHACD compound.
4. **Fixed timestep** with accumulator.
5. **Manual WASM cleanup** on Stop and delete.
6. **Commands for every edit** — undo/redo.
7. **`webview/shared/physics/` imports no React** — editor in `physics-lab/`.

---

## Testing matrix (professional)

| Area | Cases |
|------|-------|
| Collision matrix | Layer A ignores B; triggers detect without physical response |
| Authoring modes | Collider mode picks child only; joint mode picks joints |
| Compound | Reorder, local offset, VHACD regenerate |
| Validation | Block play on trimesh+dynamic; repair bakes scale |
| Round-trip | Save → load → Play identical settle |
| Graph | Export layers + mechanisms → Stage eval |
| VSIX | Same as dev for P0–P6 smoke |

---

## Related code to port

| Reference | Target |
|-----------|--------|
| `src/core/physics/*` | `webview/shared/physics/` |
| `validatePlayScene.ts` | `shared/physics/validatePhysicsSceneV1.ts` |
| `ColliderEditor.tsx` | `physics-lab/panels/ColliderListPanel.tsx` |
| `Hierarchy.tsx` | `physics-lab/panels/OutlinerPanel.tsx` |
| `ViewportToolbar.tsx` | `physics-lab/toolbar/PhysicsLabToolbar.tsx` |
| `sceneCommands.ts` | `physics-lab/commands/` |
| `gltfIntrospect.ts` | `shared/physics/gltf/` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | Full professional catalog — authoring modes, collision matrix, collider editor, validation, phases P0–P8 |
