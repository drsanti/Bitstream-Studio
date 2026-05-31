# Sensor Studio — flow domains (multi-evaluator plan)

**Status:** **In progress** — Phase 0 aligned **2026-05-31**; Phase 1 foundation started **2026-05-31**.

**Goal:** One React Flow canvas can host **sensor dataflow**, **3D scene control**, **input/event logic**, and (later) **material authoring** — but each domain needs its **own evaluation model and tick source**, not a single global loop.

**Related:** [`SENSOR_STUDIO_NODE_UI_RULES.md`](./SENSOR_STUDIO_NODE_UI_RULES.md) (current dataflow), [`ROTATION_SCENE3D_CONFIG.md`](./ROTATION_SCENE3D_CONFIG.md), [`../../../../docs/DEVELOPMENT_TRACKER.md`](../../../../docs/DEVELOPMENT_TRACKER.md) (*Planned / next → Flow domains*).

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
| **3D preview** | Partial | `model-viewer`, `environment`, `camera-view`, rotation nodes |
| **GLB animation wire** | Partial | `FlowWireAnimationV1`, `glb-animation-bundle`, mixer drives |
| **GLB scalar drives** | Partial | Morph, light, anim time, part visibility, emissive, camera |
| **Transform graph** | Partial | Quaternion / Euler rotation — not full loc/scale/parent |
| **Keyboard / mouse in graph** | No | Orbit lives in viewer chrome, not flow nodes |
| **PBR material graph** | No | Import GLB materials; limited emissive scalar drive |
| **Geometry nodes** | No | No procedural mesh DAG |

Device **`publishMode`** (periodic / on_change / hybrid) controls **UART event rate**, not engine type. See **`extension/src/bitstream2/docs/SENSOR_CFG_V2.md`**.

---

## Target domains (one canvas, four evaluators)

```text
Telemetry tick   →  Sensor dataflow     (tickSimulation @ sample / graph flush)
Frame tick       →  Scene + animation   (requestAnimationFrame)
Event dispatch   →  Input + logic       (exec graph, on demand)
Material compile →  Shader / PBR DAG    (on edit or bake — not every UART frame)
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

**Touches:** `Model Viewer composable wires` plan (**P2 Transform wire** in tracker), `RotationPreviewPanelV4`, `collectGlbScalarDrivesForModel`.

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

### Domain D — Material / PBR (later)

**Purpose:** Blender **Shader Editor**–like authoring or parameter wiring on imported materials.

| Item | Detail |
| ---- | ------ |
| **v1 (practical)** | Parameter nodes on GLB materials (roughness, emissive, texture swap) |
| **v2 (large)** | Full node graph → compile to Three.js `MeshStandardMaterial` / node material |
| **Eval** | On graph edit or explicit bake — **not** tied to telemetry tick |

**Recommendation:** Ship **parameter wiring** before a full in-app BSDF graph.

---

## Fit matrix (user targets)

| Target | Same canvas? | Same engine as today? | Path |
| ------ | ------------ | --------------------- | ---- |
| Sensors → Plotter / gauge | Yes | Yes | Shipped (Domain A) |
| Keyboard / mouse logic | Yes | No | Domain C — event/exec layer |
| 3D transform control | Yes | Partial | Domain B — transform wires + rAF tick |
| GLB animation control | Yes | Partial | Domain B — extend `glbAnimation` + drives |
| PBR material authoring | Yes | No | Domain D — separate material eval |

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
- [ ] Geometry-style mesh ops (backlog)
- [ ] Full shader DAG compile (backlog)

---

## Testing matrix (when implementation starts)

| Domain | Dev (Vite) | VSIX |
| ------ | ---------- | ---- |
| A — Telemetry dataflow | Sample → Plotter updates | Same |
| B — Scene / anim | rAF preview without UART | Same |
| C — Events | Key/mouse nodes fire subgraph | Same |
| D — Material params | GLB material tweak visible in viewer | Same |

UART vs Simulator telemetry rules (**`bitstream-dual-runtime.mdc`**) apply to Domain A only.

---

## Tick subscription (Phase 1)

| Trigger | Driver | Nodes / behavior |
| ------- | ------ | ---------------- |
| **Telemetry (A)** | `sampleCount` ↑, BMI270 wire tap seq, graph flush, stale-health poll | Sensor inputs, transforms, Plotter history, gauges, health badges |
| **Scene frame (B)** | `requestAnimationFrame` while `graphNeedsSceneFrameTick()` | `model-viewer`, `rotation-3d-*`, `environment`, `camera-view`, `glb-animation-bundle`, `object-transform`, `transform-from-euler`, `sine-wave` |
| **Material (D partial)** | Same rAF coalesced loop when `graphNeedsMaterialDomainEvalInGraph()` | `glb-material-param`, `glb-material-texture`, `glb-material-color`, `material-mix` |

Implementation: **`useSensorStudioFlowTickScheduler`** (app) + **`scene-flow-frame-subscribers.ts`** (catalog). Both triggers coalesce into one rAF **`tickSimulation()`** per display frame. Three.js preview rendering remains in **`RotationPreviewPanelV4`** (separate inner rAF).

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
| **2026-05-31** | Phase 6 slice 1: `material-domain-eval`, `glb-material-color`, `material-mix`, GLB **Clr** spawn, wired param **Value**. |
| **2026-05-31** | Phase 5 slice 3: demo template `material-glb-drives`. |
| **2026-05-31** | Phase 2: `FlowWireTransformV1`, transform utility nodes, model-viewer + rotation `xf` input. |
| **2026-05-31** | Initial plan from architecture review (keyboard/mouse, Blender-like geometry/shader targets). |
