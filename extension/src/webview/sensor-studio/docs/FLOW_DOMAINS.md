# Sensor Studio — flow domains (multi-evaluator plan)

**Status:** **Planned** — design captured **2026-05-31**; **do not implement** until the team explicitly starts this epic.

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
| **`event` port type** | Schema only | No catalog nodes or exec runner |
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

**Gate:** No code for this epic until explicitly started (tracker + team sign-off).

### Phase 0 — Document and align (this file)

- [x] Capture domain split and fit matrix (**2026-05-31**)
- [ ] Review against `MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md` (exec pins were deferred in MVP1)
- [ ] Confirm exec vs pure-`event` port strategy

### Phase 1 — Frame loop for 3D (Domain B foundation)

- [ ] **`useSceneFlowFrameTick`** (or equivalent) — rAF driver independent of `sampleCount`
- [ ] Document which nodes subscribe to frame vs telemetry tick
- [ ] Ensure dual-runtime (dev + VSIX) parity for preview updates

### Phase 2 — Transform wire (Domain B)

- [ ] **`FlowWireTransformV1`** + transform utility node(s)
- [ ] **`model-viewer`** (primary consumer) merge transform over `scene3d`
- [ ] Deprecation path for fusion-only rotation nodes in **new** templates (keep legacy graphs)

### Phase 3 — Event layer (Domain C)

- [ ] Event runner + catalog stubs (`On Key`, `On Click`, …)
- [ ] Wire event sources to actions (toggle visibility, set constant, trigger one-shot anim)
- [ ] Inspector + persistence for event node config

### Phase 4 — Animation depth (Domain B)

- [ ] Animation merge utility; optional `anim` on rotation nodes if needed
- [ ] Expand GLB drive kinds per product feedback (part opacity, multi-camera blend)

### Phase 5 — Material parameters (Domain D v1)

- [ ] PBR **parameter** nodes bound to GLB material slots
- [ ] No full shader graph until v1 proves value

### Phase 6 — Geometry / full shader (optional, far)

- [ ] Geometry-style mesh ops only if in-app procedural mesh is required
- [ ] Full shader DAG only if Blender-export + parameter wiring is insufficient

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

## Open design decisions

1. **Exec pins** vs **`event`-only** dataflow triggers for Domain C.
2. **Single graph** vs **subgraph / “blueprint”** boundaries per domain (filter palette by mode?).
3. **Pick ray → event** — in scope for Phase 3 or later?
4. **Real oscilloscope instrument** — separate node with own acquisition clock (Domain A extension, not Domain B).

---

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-05-31** | Initial plan from architecture review (keyboard/mouse, Blender-like geometry/shader targets). |
