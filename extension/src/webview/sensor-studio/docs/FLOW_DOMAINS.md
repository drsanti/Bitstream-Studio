# Sensor Studio — flow domains (multi-evaluator plan)

**Status:** **In progress** — Phase 0 aligned **2026-05-31**; Phase 1 foundation started **2026-05-31**.

**Goal:** One React Flow canvas can host **sensor dataflow**, **3D scene control**, **input/event logic**, **material authoring**, and (future) **physics** — but each domain needs its **own evaluation model and tick source**, not a single global loop.

**Related:** [`SENSOR_STUDIO_NODE_UI_RULES.md`](./SENSOR_STUDIO_NODE_UI_RULES.md) (current dataflow), [`STUDIO_SCENE3D_CONFIG.md`](./STUDIO_SCENE3D_CONFIG.md), [`GLB_ANIMATION_FLOW_IMPLEMENTATION_PLAN.md`](./GLB_ANIMATION_FLOW_IMPLEMENTATION_PLAN.md) (Phase 4+ backlog), [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md) (Three.js mesh + material nodes backlog), [`TIER_D_PHYSICS_FOUNDATION.md`](./TIER_D_PHYSICS_FOUNDATION.md), [`../../../../docs/DEVELOPMENT_TRACKER.md`](../../../../docs/DEVELOPMENT_TRACKER.md) (*Planned / next → physics domain*).

---

## Why multiple domains

Blender and Unreal combine several graph semantics in one editor:

| Reference | Wire style | When it runs | Typical output |
| --------- | ---------- | ------------ | -------------- |
| **Unreal Blueprint** | Exec + data | Events, Tick | Actions, side effects |
| **Blender Geometry Nodes** | Data DAG | On geometry update | Mesh / attributes |
| **Blender Shader Editor** | Data DAG | Shader / bake context | BSDF, textures, PBR |
| **Sensor Studio (today)** | Data only | Telemetry + graph edits | Scalars, wires, previews |

Trying to drive **keyboard events**, **per-frame animation**, **UART samples**, and **shader compilation** from one **`tickSimulation()`** loop will not scale. The canvas shell (React Flow, typed ports, inspector, persistence) is reusable; **evaluators** are domain-specific.

---

## Current baseline (shipped / partial)

| Capability | Status | Notes |
| ---------- | ------ | ----- |
| Continuous **dataflow** | Shipped | `tickSimulation()` — pull eval, `readIncoming` on wired pins |
| Telemetry-driven ticks | Shipped | `sampleCount` ↑, wire taps, graph flush — not fixed Hz |
| **`event` port type** | Shipped (slice 1) | **`on-key`**, **`event-toggle-boolean`**, **`dispatchFlowKeyboardEvent`** |
| **Plotter** | Shipped | One point per channel per dataflow tick |
| **3D preview** | Partial | `model-viewer`, `environment`, `camera-view`, rotation nodes; **fog / exposure / studio light / morph / bloom / contact shadows / camera-switch / particles** wired (**2026-05-31**) |
| **GLB animation wire** | Partial | `FlowWireAnimationV1`, `glb-animation-bundle`, mixer drives |
| **GLB scalar drives** | Partial | Morph, light, anim time, part visibility, emissive, camera |
| **Transform graph** | Partial | Quaternion / Euler rotation — not full loc/scale/parent |
| **Keyboard / mouse in graph** | No | Orbit lives in viewer chrome, not flow nodes |
| **PBR material graph** | Partial | GLB material drives shipped; standalone **mesh materials** backlog — [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md) |
| **Physics (flow canvas)** | Partial | Rapier on Stage (B3); full Domain E deferred — [`TIER_D_PHYSICS_FOUNDATION.md`](./TIER_D_PHYSICS_FOUNDATION.md) |
| **Procedural meshes (Three.js primitives)** | No | Plan captured **2026-06-07** — box/sphere/plane + Stage commit; not a geometry DAG |

Device **`publishMode`** (periodic / on_change / hybrid) controls **UART event rate**, not engine type. See **`extension/src/bitstream2/docs/SENSOR_CFG_V2.md`**.

---

## Target domains (one canvas, six evaluators)

```text
Telemetry tick   →  Sensor dataflow     (tickSimulation @ sample / graph flush)
Frame tick       →  Scene + animation   (requestAnimationFrame)
Event dispatch   →  Input + logic       (exec graph, on demand)
Material compile →  Shader / PBR DAG    (on edit or bake — not every UART frame)
Dashboard eval   →  2D operator HMI     (after tickSimulation — grid layout)
Physics step     →  Rigid bodies + joints (fixed dt, coalesced with rAF — PLANNED)
```

### Domain A — Telemetry dataflow (keep)

**Purpose:** Live sensors → transforms → Plotter, gauge, wires to 3D inputs.

| Item | Detail |
| ---- | ------ |
| **Trigger** | Sample decode, BMI270 tap seq, `flushFlowSimulationPins` |
| **Port types** | `number`, `boolean`, `vector3`, `quaternion`, … (existing) |
| **Non-goals** | Fixed global Hz loop; scope-style acquisition (future instrument node owns its clock) |

**Action:** Preserve current model; add nodes here first when they are **value-only** and **sample-driven**.

---

### Domain B — Scene and animation (extend)

**Purpose:** Blender-like **object transform** and **GLB animation** control from the graph (not fusion-specific rotation shapes only).

| Item | Detail |
| ---- | ------ |
| **Trigger** | **`requestAnimationFrame`** (decouple from UART `sampleCount`) |
| **New / extended wires** | `FlowWireTransformV1` (position, rotation, scale or matrix); scene object binding |
| **Existing** | `env`, `cam`, `anim` merges into `scene3d` / mixer |
| **GLB interchange** | Keep GLB as export path; extend animation wire + drive nodes for clips, weight, trim, solo |
| **Gaps vs “all Blender animation”** | NLA strips, action layers, physics, drivers — backlog after clip bundle parity |

**Touches:** `Model Viewer composable wires` plan (**P2 Transform wire** in tracker), `StudioSceneViewport`, `collectGlbScalarDrivesForModel`.

---

### Domain C — Events and input (new)

**Purpose:** **Keyboard and mouse** (and later scene pick) as **event sources** — Unreal Blueprint–style **exec** or event-triggered subgraphs.

| Item | Detail |
| ---- | ------ |
| **Trigger** | Key down/up, click, pointer move, custom UI actions |
| **Pattern** | Event source nodes → optional exec chain (`Sequence`, `Branch`) → actions |
| **Data wires** | Still pass values (key code, pointer, sensor readings) alongside exec |
| **Viewer chrome** | Orbit / pan stays in 3D viewport unless product adds **pick → event** |

**Prerequisite:** Minimal **event runner** (separate from pull dataflow); use existing **`event`** port type in schema or introduce **exec pin** convention (design choice before coding).

---

### Domain F — UI Dashboard (new)

**Purpose:** Node-RED Dashboard–style **2D operator HMI** committed from the flow graph (sensors + logic + 3D on one canvas).

| Item | Detail |
| ---- | ------ |
| **Trigger** | End of **`tickSimulation()`** (same as Stage snapshot); rAF optional for animated widgets |
| **Commit node** | **`dashboard-output`** — wired **`dashboardWidget`** pins |
| **Layout** | CSS grid on Dashboard Output (`columns`, `gap`, `padding`); per-widget `placement` |
| **Interactions** | Dashboard pane clicks → Domain C event dispatch |
| **Independence** | Does not read flow-card positions — wired `dashboard-*` widgets plus optional **`publishToDashboard`** on flow output nodes |

**Canonical:** **`DASHBOARD_VIEWPORT_AND_OUTPUT.md`**.

---

### Domain D — Material / PBR (extend)

**Purpose:** Parameter wiring on **imported GLB materials** and, in a later slice, **standalone mesh materials** for procedural geometry.

| Item | Detail |
| ---- | ------ |
| **v1 (shipped)** | `glb-material-param`, `glb-material-color`, `glb-material-texture`, `material-video`; `material-domain-eval.ts` |
| **v1.5 (partial)** | **`mesh-material-basic`** + **`mesh-material-standard`** shipped **2026-06-07**; more families + primitives backlog — [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md) |
| **v2 (large)** | Full node graph → compile to Three.js `ShaderMaterial` / node material |
| **Eval** | rAF coalesced material pass — **not** tied to telemetry tick |

**Recommendation:** Ship **mesh materials + primitives** before a full in-app BSDF graph.

---

## Fit matrix (user targets)

| Target | Same canvas? | Same engine as today? | Path |
| ------ | ------------ | --------------------- | ---- |
| Sensors → Plotter / gauge | Yes | Yes | Shipped (Domain A) |
| Keyboard / mouse logic | Yes | No | Domain C — event/exec layer |
| 3D transform control | Yes | Partial | Domain B — transform wires + rAF tick |
| GLB animation control | Yes | Partial | Domain B — extend `glbAnimation` + drives |
| PBR material authoring | Yes | Partial | Domain D — GLB params shipped; mesh materials backlog |
| Three.js primitive meshes | Yes | No | Domain B extension — [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md) |

---

## Phased roadmap (implementation order)

### Phase 0 — Document and align (this file)

- [x] Capture domain split and fit matrix (**2026-05-31**)
- [x] Review against `MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md` — MVP1 deferred exec pins and 3D; this epic **extends** post-MVP1 without breaking dataflow (**2026-05-31**)
- [x] Confirm exec vs pure-`event` port strategy — **Decision:** Phase C uses existing **`event`** port type + imperative **event runner** (no exec pins in v1 of Domain C); exec pins remain backlog if subgraph ordering needs them

### Phase 1 — Frame loop for 3D (Domain B foundation)

- [x] **`useSensorStudioFlowTickScheduler`** — rAF driver for scene subscribers, coalesced with telemetry ticks (**2026-05-31**)
- [x] **`graphNeedsSceneFrameTick`** / subscriber node catalog (**2026-05-31**)
- [x] Document which nodes subscribe to frame vs telemetry tick (see **Tick subscription** below)
- [x] Manual smoke: sine → Plotter / rotation without UART (user verified **2026-05-31**)

### Phase 2 — Transform wire (Domain B)

- [x] **`FlowWireTransformV1`** + **`object-transform`** / **`transform-from-euler`** utility nodes (**2026-05-31**)
- [x] **`model-viewer`** + 3D rotation nodes merge transform over `scene3d` (**2026-05-31**)
- [ ] Deprecation path for fusion-only rotation nodes in **new** templates (keep legacy graphs)

### Phase 2b — Stage viewport + Scene Output (Domain B runtime)

- [x] Workbench **`stage`** pane + default layout (Stage over Flow) — **2026-06-02**
- [x] Catalog **`scene-output`** node + `evaluateStageSceneSnapshot` → `useStageSceneStore` — **2026-06-02**
- [x] **`StageViewport`** (`StudioSceneViewport`) — **2026-06-02**
- [x] Multi-model Stage instances, toolbar, physics wire, stage pick (B2–B4 in **`STAGE_VIEWPORT_AND_SCENE_OUTPUT.md`**) — **2026-06-02**

### Phase 3 — Event layer (Domain C)

- [x] Event runner + catalog stubs — **`on-key`**, **`event-toggle-boolean`** (**2026-05-31** slice 1)
- [x] Wire event sources to actions (toggle / set boolean → indicator) (**2026-05-31**)
- [x] Inspector + persistence for **On Key** / **On Click** / **Set Boolean** (**2026-05-31**)
- [x] GLB part visibility on event — **`event-toggle-glb-part`**, **`event-set-glb-part`**, GLB **Parts → Evt** spawn (**2026-05-31** slice 3)
- [x] One-shot animation trigger — **`event-trigger-glb-anim`**, GLB **Animations → Evt**, mixer **`restartNonce`** (**2026-05-31** slice 4)

### Phase 4 — Animation depth (Domain B)

- [x] Animation merge utility (`mergeGlbAnimationClipDrivesForPreview`) — scalar + bundle wire + event triggers (**2026-05-31** slice 1)
- [x] Optional `anim` on rotation nodes — **3D Rotation (Euler / Quaternion)** **`anim`** input + shared merge path (**2026-05-31** slice 2)
- [x] Expand GLB drive kinds — part **opacity** (0–1), multi-camera **blend**, scalar drives on **3D Rotation** previews (**2026-05-31** slice 3)
- [x] Multi-clip playback modes — **`parallel-all`** + **`sequence`** on **GLB Animation Bundle**; inspector **Playback mode**; mixer filter/advance in preview (**2026-05-31** slice 4)

### Phase 4+ — GLB animation flow nodes

**Status:** **Phase A shipped 2026-06-06** — canonical plan **[`GLB_ANIMATION_FLOW_IMPLEMENTATION_PLAN.md`](./GLB_ANIMATION_FLOW_IMPLEMENTATION_PLAN.md)** (extended **2026-06-06**: mechanical **Part Spin**, full Blender/glTF channel matrix; Blender IK/drivers/NLA deferred).

- [x] **Animation Clip** node — per-clip `glbAnimation` wire (time, speed, loop, weight, enabled); spawn from Library **Animations → Clip**
- [x] **Animation Merge** / **Animation Blend** — combine partial wires; mixer crossfade from wire fades (**2026-06-06** Phase B)
- [ ] **Part Spin** — continuous per-part rotation (drone propellers, belts); spawn from Library **Parts**
- [ ] **Model catalog → Animations** guided workflow — **Phase C shipped** (wizard + demo template); optional catalog wizard polish backlog
- [ ] Full **glTF channel** smoke (armature, object TRS, morph-in-action, static morph) — see plan § R5
- [ ] Blender / glTF export operator doc

### Phase 5 — Material parameters (Domain D v1)

- [x] PBR **parameter** nodes — **`glb-material-param`** (emissive, roughness, metalness, opacity) + preview apply (**2026-05-31** slice 1)
- [x] **Texture swap** — **`glb-material-texture`** + Library **Materials → Tex** + preview map apply (**2026-05-31** slice 2)
- [x] Demo template **`material-glb-drives`** — Model Viewer + param + texture (**2026-05-31** slice 3)
- [ ] Full shader graph (backlog)

### Phase 6 — Material domain v2 foundation (optional / far)

Practical **Domain D v2** slice before a full BSDF DAG: separate material evaluator, RGB color drives, and shader-graph-style numeric blend.

- [x] **`material-domain-eval.ts`** — `evaluateMaterialGraphForModel`, `compactMaterialGraphEvaluation`, `MATERIAL_DOMAIN_NODE_IDS` (**2026-05-31** slice 1)
- [x] **`glb-material-color`** — base / emissive RGB on named GLB materials; Library **Materials → Clr** spawn; preview apply (**2026-05-31** slice 1)
- [x] **`material-mix`** — blend two numbers with factor; wire into **`glb-material-param`** **Value** (**2026-05-31** slice 1)
- [x] **`glb-material-param`** — optional wired **Value** input (**2026-05-31** slice 1)
- [x] Material domain nodes trigger coalesced rAF **`tickSimulation`** via **`graphNeedsMaterialDomainEvalInGraph`** (**2026-05-31**)
- [ ] **Procedural meshes + mesh materials** — canonical plan **[`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md)** (design **2026-06-07**; implementation not started)
  - [x] Phase 1 — `mesh-material-basic` / `mesh-material-standard` + `FlowWireMaterialV1` (**2026-06-07**)
  - [x] Phase 2 — `mesh-box` / `mesh-sphere` / `mesh-plane` + `FlowWireMeshV1` (**2026-06-07**)
  - [x] Phase 3 — Scene Output **`meshes`** + Stage viewport runtime (**2026-06-07**)
  - [ ] Phase 4 — remaining primitives + `mesh-group`
  - [ ] Phase 5 — physics / pick glue + demo template
- [ ] Full shader DAG compile (backlog)

### Phase 2c — Dashboard viewport + Dashboard Output (Domain F)

- [x] Workbench **`dashboard`** pane + **Dashboard focus** layout preset (**2026-06-07**)
- [x] Catalog **`dashboard-output`** + `evaluateDashboardSnapshot` → `useDashboardSceneStore` (**2026-06-07**)
- [x] **`dashboard-button`**, **`dashboard-led`**, **`dashboard-text`** widget nodes + grid placement (**2026-06-07**)
- [x] **`dispatchDashboardWidgetEvent`** (Domain C) for dashboard button clicks (**2026-06-07**)
- [x] Demo template **`dashboard-button-led`** (**2026-06-07**)
- [x] **`dashboard-gauge`**, **`dashboard-knob`** widgets (**2026-06-07**)
- [x] Flex root layout + flex placement on widgets (**2026-06-07**)
- [x] Dashboard pane **Preview / Edit** + grid overlay + **`DashboardOpenLink`** (**2026-06-07**)
- [x] **`dashboard-group`** nested grid + **`dashboard-theme`** wire + pane CSS theme vars (**2026-06-07**)
- [x] **`publishToDashboard`** on flow output nodes (gauge, LED, numeric, knob, bar, sparkline, plotter) + **`dashboardGroupId`** / **`dashboardTabId`** nest + **`dashboard-operator`** preset (**2026-06-07** F4–F6)
- [x] **`dashboard-tab`** multi-page HMI + layout JSON export (**2026-06-07** F7)
- [x] Layout JSON import + local save library; plotter follow-wire colors on Dashboard (**2026-06-07** F8)
- [x] **`dashboard-switch`** / **`dashboard-slider`**; edit-mode grid placement + Stack layout (**2026-06-07** F9)
- [x] Grid resize handles; **`dashboard-status`** + publish compare/indicator/threshold; **`dashboard-controls-demo`** (**2026-06-07** F10)
- [x] **Dashboard Inspector** (Overview / Widgets / Controls / Layout); 8-handle resize; edit UX; overlap warnings; tab switcher; **Esc** deselect (**2026-06-07** F11)

Canonical design: **`DASHBOARD_VIEWPORT_AND_OUTPUT.md`**.

---

### Phase 7 — Physics domain (Domain E) — **deferred (complete later)**

**Canonical plan:** [`TIER_D_PHYSICS_FOUNDATION.md`](./TIER_D_PHYSICS_FOUNDATION.md). **D1 shipped 2026-06-02**; **Rapier** locked for Sensor Studio D2+; **Jolt** for vehicle hub. **D2–D4 not scheduled** — resume per tracker **Deferred** section.

- [x] **D1** — Catalog stubs + NA import + eval no-ops + `physicsScene` port type (**2026-06-02**)
- [ ] **D2** — `FlowWirePhysicsSceneV1`, Model Viewer **`phys`**, static colliders + lazy **Rapier** load
- [ ] **D3** — Rigid bodies, spawner, joints; fixed-step physics tick
- [ ] **D4** — IK, animation blend, Digital Twin / hardware collider integration

**Trigger (future):** Fixed timestep while `graphNeedsPhysicsDomainEvalInGraph()`; coalesce with scene rAF (same scheduler pattern as material domain).

---

## Testing matrix (when implementation starts)

| Domain | Dev (Vite) | VSIX |
| ------ | ---------- | ---- |
| A — Telemetry dataflow | Sample → Plotter updates | Same |
| B — Scene / anim | rAF preview without UART | Same |
| C — Events | Key/mouse nodes fire subgraph | Same |
| D — Material params | GLB material tweak visible in viewer | Same |
| E — Physics (planned) | Static collider debug draw; one dynamic body | Same; WASM bundle in VSIX |

UART vs Simulator telemetry rules (**`bitstream-dual-runtime.mdc`**) apply to Domain A only.

---

## Tick subscription (Phase 1)

| Trigger | Driver | Nodes / behavior |
| ------- | ------ | ---------------- |
| **Telemetry (A)** | `sampleCount` ↑, BMI270 wire tap seq, graph flush, stale-health poll | Sensor inputs, transforms, Plotter history, gauges, health badges |
| **Scene frame (B)** | `requestAnimationFrame` while `graphNeedsSceneFrameTick()` | `model-viewer`, `rotation-3d-*`, `environment`, `camera-view`, `glb-animation-bundle`, `object-transform`, `transform-from-euler`, `sine-wave` |
| **Material (D partial)** | Same rAF coalesced loop when `graphNeedsMaterialDomainEvalInGraph()` | `glb-material-param`, `glb-material-texture`, `glb-material-color`, `material-mix`, `material-video`, `mesh-material-basic`, `mesh-material-standard` |
| **Geometry (B extension, partial)** | Same rAF loop when `graphNeedsGeometryDomainEvalInGraph()` | `mesh-box`, `mesh-sphere`, `mesh-plane`; Phase 3+ `mesh-group`, Stage commit — **`PRIMITIVES_AND_MATERIALS_NODES.md`** |

Implementation: **`useSensorStudioFlowTickScheduler`** (app) + **`scene-flow-frame-subscribers.ts`** (catalog). Both triggers coalesce into one rAF **`tickSimulation()`** per display frame. Three.js preview rendering remains in **`StudioSceneViewport`** (separate inner rAF).

### Performance caps and canvas interaction (2026-06-08)

Session prefs (**Inspector → View → Performance**): **`flowSimulationMaxFps`**, **`stage3dMaxFps`**, and **While editing canvas** policy (**Keep running** / **Pause** / **Reduce rate** with drag/pan triggers). **`readFlowInteractionTickGate()`** may block or throttle **`tickSimulation`** during node drag or viewport pan. Live node scalars patch **`useFlowNodeLiveStore`** instead of rewriting the full **`nodes`** array each tick. Full operator guide: **`SENSOR_STUDIO_PERFORMANCE.md`**.

---

## Open design decisions

1. ~~**Exec pins** vs **`event`-only**~~ — **Resolved:** `event` port + event runner for Phase C.
2. **Single graph** vs **subgraph / “blueprint”** boundaries — **Default:** one canvas; optional palette filter later.
3. **Pick ray → event** — **Deferred** to Phase 4+ (after basic key/mouse sources).
4. **Real oscilloscope instrument** — separate node with own acquisition clock (Domain A extension, not Domain B).

---

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-06-08** | Performance prefs + canvas interaction tick gate; live store sidecar — [`SENSOR_STUDIO_PERFORMANCE.md`](./SENSOR_STUDIO_PERFORMANCE.md). |
| **2026-06-07** | Phase 6 **Phase 1 shipped**: `mesh-material-basic`, `mesh-material-standard`, `material` port — [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md). |
| **2026-06-07** | Phase 6 backlog: Three.js **primitives + mesh materials** plan — [`PRIMITIVES_AND_MATERIALS_NODES.md`](./PRIMITIVES_AND_MATERIALS_NODES.md). |
| **2026-05-31** | Phase 6 slice 1: `material-domain-eval`, `glb-material-color`, `material-mix`, GLB **Clr** spawn, wired param **Value**. |
| **2026-05-31** | Phase 5 slice 3: demo template `material-glb-drives`. |
| **2026-05-31** | Phase 2: `FlowWireTransformV1`, transform utility nodes, model-viewer + rotation `xf` input. |
| **2026-05-31** | Initial plan from architecture review (keyboard/mouse, Blender-like geometry/shader targets). |
