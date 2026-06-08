# Scene Editor mode (proposed)

**Status:** **Partial** — VN0–VN1 + **SE1–SE5** + **Edit | Simulate** shipped (procedural + **GLB part** gizmo/inspector via **`glb-part-transform`**); **SE6** Stage outliner still planned.  
**Related:** [`STAGE_VIEWPORT_AND_SCENE_OUTPUT.md`](./STAGE_VIEWPORT_AND_SCENE_OUTPUT.md), [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md), [`MODEL_OUTLINER.md`](./MODEL_OUTLINER.md), [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md).

## Product idea

After building a scene with **flow nodes** (primitives, materials, transforms, Scene Output), operators switch to a **Scene Editor** mode on the **Stage** workbench:

- **Raycast** select objects in the 3D view (like DCC tools)
- **Transform gizmo** (`TransformControls`: translate / rotate / scale)
- Edit **material** properties on the selection (color, roughness, …)
- **Add** primitives from a toolbar or context menu
- **Bidirectional sync** with the node graph: edits update nodes; graph eval updates the viewport

Goal: lower the barrier for layout and look-dev while keeping the graph as the durable, serializable program.

## What exists today (baseline)

| Capability | Today |
| ---------- | ----- |
| Graph → Stage | **One-way** — `evaluateStageSceneSnapshot()` after `tickSimulation()` |
| Stage pick | **Events only** — `on-stage-pick` (Domain C), `proc:{nodeId}` paths on procedural meshes |
| Transform authoring | **`object-transform`** node + wired `transform` on primitives |
| Material authoring | **`mesh-material-*`** nodes + inspector |
| GLB hierarchy UI | **Model Outliner** — spawn/drag extract nodes **from** GLB, not live scene sync |
| Gizmo | **E84 simulation** uses drei `TransformControls`; **Sensor Studio Stage** uses vanilla `TransformControls` on procedural mesh selection (SE2) |

## Design principles (recommended)

1. **Graph remains canonical** — Scene Editor is an **authoring lens**, not a second source of truth. Persisted projects save **flow JSON**, not a parallel scene file (unless explicit export).
2. **Explicit edit sessions** — Toggle **Simulate** vs **Edit** on Stage toolbar (session-persisted). **Edit** enables gizmo, spawn, and live inspector mirror during gizmo drag; passive telemetry ticks **freeze** the Stage snapshot until a graph flush or **Simulate** switch. **Simulate** is continuous graph-eval preview (no gizmo authoring).
3. **Stable object identity** — Every selectable Stage object maps to a **`SceneObjectRef`** (see below). No orphan meshes without a graph binding.
4. **Start procedural-only** — v1 sync scope: meshes with clear 1:1 node mapping (`mesh-box`, …). GLB per-part transforms and mesh-group fan-out are phase 2.
5. **Undo** — Reuse flow editor undo (`pushUndoSnapshot`) when scene edits mutate `defaultConfig` or spawn nodes.

## SceneObjectRef (proposed)

```ts
type SceneObjectRefV1 =
  | { kind: "procedural"; sourceNodeId: string; meshLeafIndex?: number }
  | { kind: "glb-instance"; sourceNodeId: string; objectPath: string }
  | { kind: "scene-root"; sceneOutputNodeId: string }; // global xf wire target
```

Maps to existing pick paths (`proc:…`, GLB hierarchy paths) and to **Inspector / flow selection** (`onSelectionChange([nodeId])`).

## Sync directions

### Graph → Scene (already shipped)

`tickSimulation` → pin eval → `liveMeshWire` / snapshot → `StudioSceneViewport`.

### Scene → Graph (new)

| Edit | Target node(s) | Field |
| ---- | -------------- | ----- |
| Move / rotate / scale procedural | Wired **`object-transform`** or primitive **`defaultConfig`** + optional transform wire | `FlowWireTransformV1` |
| Move / rotate / scale GLB part | **`glb-part-transform`** node scoped to **Model Source** + part path (auto-created from Stage gizmo) | `FlowWireTransformV1` |
| Material color / roughness | Upstream **`mesh-material-*`** | `meshMaterialColorHex`, … |
| Add box at hit point | **Spawn** `mesh-box` + `mesh-material-standard` + `object-transform`; wire to Scene Output **Meshes** | New nodes + edges |
| Delete selection | **Shipped (Edit)** — **Delete** removes procedural mesh node or existing **Part Transform** node | Graph mutation (undoable) |

**Mesh Bundle / Stage inspector:** flattened **`mesh-group`** (display **Mesh Bundle**) leaves resolve to wired primitive nodes in the lower **Object** pane (transform, material, geometry). **Flow** wiring chrome appears only when a graph node is explicitly selected on the canvas.

## Phased delivery (proposed)

| Phase | Scope |
| ----- | ----- |
| **SE0** | This doc + tracker; identity table (`SceneObjectRef`) |
| **SE1** | Stage **selection** (raycast highlight), Inspector shows bound node, **Focus in graph** |
| **SE2** | **`TransformControls`** on procedural selection → write transform node / config |
| **SE3** | Material quick-edit (TRN color / roughness) → upstream material node |
| **SE4** | **Shipped** — Stage toolbar **Box / Sphere / Plane** arms placement; LMB on a mesh or model surface spawns `mesh-material-standard` + `object-transform` + primitive wired to Scene Output **Meshes** at raycast hit; **Esc** cancels |
| **SE5** | **Shipped** — GLB instance selection + part-level transforms via **`glb-part-transform`** nodes (Stage gizmo auto-spawn, Object inspector, Model Viewer / Stage runtime) |
| **SE6** | Optional **Scene Outliner** pane (Stage objects, not only GLB catalog) |

## UI placement

- **Mode toggle** on Stage toolbar: `Simulate` | `Edit` (**shipped** — `stage-scene.store` + `stage-workbench-mode.persistence.ts`)
- Gizmo mode: translate / rotate / scale (toolbar icons; disable orbit while dragging — E84 pattern)
- Reuse **`Model Outliner`** patterns for a future **Stage Outliner** (procedural + committed models)

## Technical notes

- Implement gizmo in **`StudioSceneViewport`** (vanilla Three + `three-stdlib` `TransformControls`, not R3F — keep Sensor Studio host consistent).
- Reuse **`bindStageViewportPickHandler`** / `getStagePickTargets` for selection raycast.
- Scene edits call **`updateNodeConfigFieldByNodeId`** / **`addNodeFromCatalog`** — same store as graph edits.
- After mutation: **`flushFlowSimulationPins`** → snapshot refresh (existing pipeline).

## Viewport navigation (Blender-like)

**Goal:** Stage feels familiar to Blender users — orthographic / perspective switching, standard view snaps, and mouse navigation — without fighting VS Code or the Flow canvas.

### Current baseline

- **`StudioSceneViewport`** uses **`PerspectiveCamera`** + **`OrbitControls`** only (no viewport ortho today).
- Default mouse map (from `scene3d.controls`): **LMB rotate**, **MMB dolly**, **RMB pan** (Three.js convention, not Blender).
- `keyRotateSpeed` / `keyPanSpeed` exist in config but **keyboard view keys are not wired**.
- Stage toolbar already has **frame model** and **reset camera** (no projection toggle).

### Decisions (locked)

| Topic | Choice |
| ----- | ------ |
| **Mouse navigation** | **Three.js default** globally (`scene3d.controls`); optional **Blender preset** (MMB orbit, Shift+MMB pan, scroll zoom) — user-selectable, not forced |
| **Ortho / perspective persistence** | **Session-only** (`localStorage`); **not** written to `scene3d` or flow graph (keeps flows portable; viewport is an operator lens) |
| **View snap axis** | **Camera-relative** default (Blender-style relative to current orbit); optional **world-locked** snap — user-selectable |
| **Delivery order** | **VN0 → VN1** before **SE1** selection — ortho + framing helps everyone in Simulate mode; Scene Editor builds on the same navigation stack |

Session keys (pattern: `ternion.sensor-studio.stageViewport.*`, same style as `stage-inspector-ui-persistence.ts`):

- `navigation.projection.v1` — `"perspective"` \| `"orthographic"`
- `navigation.orthoZoom.v1` — last ortho zoom when toggling back
- `navigation.mousePreset.v1` — `"three"` \| `"blender"`
- `navigation.viewSnapMode.v1` — `"camera-relative"` \| `"world-locked"`

### Orthographic ↔ perspective

| Item | Spec |
| ---- | ---- |
| **Toggle** | Toolbar chip + **`Numpad 5`**; label `Persp` / `Ortho` |
| **Persistence** | Session `localStorage` only (see above); reset on new browser session |
| **Ortho sizing** | Derive from current orbit distance + FOV on first switch; remember `orthoZoom` for the session |
| **Runtime** | Swap or dual-maintain cameras in viewport; update compositor, CSS3D overlay, vision landmarks, and helper frustum to use active camera |
| **Orbit** | `OrbitControls` supports ortho — zoom adjusts `OrthographicCamera.zoom` instead of dolly distance |

**Simulate vs Edit:** projection is a **view** setting (same in both modes).

### Shortcut tiers (scope when Stage pane has focus)

**Tier A — navigation (ship with ortho toggle, before Scene Editor gizmo)**

| Input | Action |
| ----- | ------ |
| **Numpad 5** | Toggle perspective / orthographic |
| **Numpad 1 / 3 / 7 / 9** | Front / Right / Top / opposite — **camera-relative** by default; **world-locked** when user selects that mode |
| **Numpad .** | Frame selection (or primary model if nothing selected) |
| **Home** or **Numpad .** (alt) | Reset to `scene3d.camera.transform` |
| **Mouse: Blender preset** | MMB orbit, **Shift+MMB** pan, scroll zoom (optional preset in `scene3d.controls`) |

**Tier B — Scene Editor only (with SE2 `TransformControls`)**

| Input | Action |
| ----- | ------ |
| **G / R / S** | Translate / rotate / scale gizmo mode |
| **X / Y / Z** | Axis constraint (after G/R/S) |
| **Esc** | Cancel armed primitive placement (SE4) or transform / clear gizmo |

**Tier C — later**

- Numpad 0 (camera view), fly mode, view roll, quad view — out of v1.

### Focus and conflicts

- Shortcuts apply only when **Stage workbench is active** and pointer is over the Stage viewport (or Stage has **viewport focus** ring).
- **Do not steal** Flow canvas keys (`Delete`, `Ctrl+G`, etc.) when focus is on the graph.
- In **VS Code webview**, document keys that clash with host shortcuts; offer **toolbar equivalents** and Stage toolbar / inspector controls for **mouse preset** and **view snap mode**.

### Suggested phasing

| Phase | Deliverable |
| ----- | ----------- |
| **VN0** | Session ortho toggle + stable framing; toolbar `Persp`/`Ortho` + Numpad 5; `stage-viewport-navigation` persistence module |
| **VN1** | View snaps (numpad 1/3/7/9) with snap-mode toggle; frame selection (Numpad .); optional Blender mouse preset selector |
| **VN2** | Wire Tier B shortcuts with Scene Editor **Edit** mode + gizmo |
| **SE1+** | Selection + graph sync — **after VN0–VN1** so framing and ortho work before raycast UX |

**VN0 first (UX rationale):** operators get immediate value in **Simulate** (layout, inspection, screenshots) without waiting for pick/gizmo plumbing; SE1 frame-selection reuses VN0 framing helpers.

### UI surfaces (VN0–VN1)

| Control | Placement |
| ------- | --------- |
| Persp / Ortho | Stage toolbar chip |
| Mouse preset (`Three` \| `Blender`) | Stage toolbar dropdown or Stage inspector **Toolbar** tab card |
| View snap mode (`Camera-relative` \| `World-locked`) | Same — optional advanced row |
| Shortcut cheat sheet | `TRNHintText` on toolbar card (no native `title`) |

## Open questions

| # | Question | Lean |
| - | -------- | ---- |
| 1 | Auto-layout new nodes on spawn? | Simple grid offset from Scene Output; no ELK on every add |
| 2 | Edit Model Viewer embedded preview too? | **Stage first**; Model Viewer stays graph-card preview |
| 3 | Live telemetry while editing? | **Stage (shipped):** passive ticks skip Stage snapshot in **Edit**; graph flushes + **Simulate** force refresh. **Dashboard:** live widget values **always** update in **Edit** (layout chrome only; see [`DASHBOARD_VIEWPORT_AND_OUTPUT.md`](./DASHBOARD_VIEWPORT_AND_OUTPUT.md)). |
| 4 | Hidden “scene layer” subgraph vs visible nodes? | **Visible nodes** for v1 — aligns with reproducibility |
| 5 | Material edit on shared material wire? | Edit **source** material node; all meshes using it update |

## Dashboard vs Stage (edit-mode live data)

| Workbench | Edit mode | Live graph / telemetry on passive ticks |
| --------- | --------- | ---------------------------------------- |
| **Stage** | **Edit** | **Frozen** — snapshot holds until graph flush or **Simulate** |
| **Stage** | **Simulate** | Continuous refresh |
| **Dashboard** | **Edit** | **Live** — gauges, LEDs, plotters, status pills update every `tickSimulation` |
| **Dashboard** | **Preview** | Live + interactive controls (buttons, knobs, switches) |

Dashboard **Edit** disables widget **interaction** (`pointer-events-none`, disabled inputs) so drag/resize handles work; **display values** still mirror upstream pins.

## Non-goals (scene editor v1)

- Full Blender outliner (drivers, constraints, NLA)
- Mesh editing (vertex/edge mode)
- CSG / boolean in viewport
- Replacing flow canvas for logic/telemetry

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-06-07** | Initial proposal from product discussion (post primitives v1). |
| **2026-06-07** | Viewport navigation: Blender shortcuts, ortho/perspective, phasing VN0–VN2. |
| **2026-06-07** | Locked: Three default + Blender preset; session-only ortho; camera-relative snaps; VN0 before SE1. |
| **2026-06-07** | **VN0 shipped:** Stage toolbar Persp/Ortho, Numpad 5, session persistence, dual camera in `StudioSceneViewport`. |
| **2026-06-07** | **VN1 shipped:** View snaps, frame selection, Blender mouse preset, navigation inspector card. |
| **2026-06-07** | **SE1 shipped:** LMB selection, highlight, inspector node binding, Focus in graph. |
| **2026-06-07** | **SE2 shipped:** `TransformControls` on procedural primitives; graph write-back to wired **Object Transform** or mesh embedded transform; toolbar G/R/S + shortcuts. |
| **2026-06-07** | **SE3 shipped:** Inspector **Material** quick-edit on Stage procedural selection (color, opacity, roughness/metalness) → upstream **mesh-material-*** node. |
| **2026-06-07** | **SE4 shipped:** Stage toolbar primitive spawn (Box / Sphere / Plane) → click surface to place; auto-wires material + transform + mesh to Scene Output **Meshes**; placement banner + **Esc** cancel. |
| **2026-06-07** | **Stage fix:** Meshes-only Scene Output no longer loads baked-in demo GLB when **Models** is unwired. |
| **2026-06-07** | **Edit \| Simulate shipped:** Stage toolbar mode toggle; gizmo + spawn gated to **Edit**; live gizmo → Object inspector during drag; undo at drag start + silent graph commit on mouse up. |
| **2026-06-07** | **Edit snapshot freeze:** passive telemetry / rAF ticks skip Stage snapshot refresh in **Edit**; `flushFlowSimulationPins` and **Simulate** switch force refresh. |
| **2026-06-07** | **SE5 shipped:** **`glb-part-transform`** node; Stage GLB part gizmo + Object inspector; runtime `glbPartTransformByPath` after animation mixer. |
