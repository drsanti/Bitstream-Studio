# GLB / glTF animation flow — implementation plan (future)

**Status:** **Backlog** — requirements and design captured **2026-06-02**; extended **2026-06-06** (mechanical multi-part + full Blender/glTF channel coverage). Implementation **not started**.  
**Domain:** Sensor Studio flow canvas — **Domain B** (scene + animation).  
**Related:** [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md) (Phase 4 shipped baseline), [`flow-wire-animation.ts`](../features/editor/nodes/animation/flow-wire-animation.ts), [`GLB_ANIMATION_LAB.md`](../../../bitstream-app/components/animation-lab/GLB_ANIMATION_LAB.md), [`studio-gltf-extract.ts`](../features/editor/gltf/studio-gltf-extract.ts), [`DEVELOPMENT_TRACKER.md`](../../../../docs/DEVELOPMENT_TRACKER.md).

**Product promise:** Play and combine **everything the GLB actually contains** — skeletal clips, object TRS, morph weights in actions, plus **parallel drives** (static morph, part visibility, lights, cameras, continuous part spin). **Not** live Blender IK, drivers, or NLA editing on the graph.

---

## Goal

Give **animators and integrators** a clear, graph-visible workflow to:

1. Pick a **model** from the catalog.
2. Work with **animations extracted from the GLB**.
3. Control **each clip independently** (time, speed, direction, loop, weight, trim, enable).
4. **Blend** and **merge** multiple clip states into one viewport.
5. Cover **real Blender / glTF export use cases** without pretending to replicate Blender NLA or IK in the graph.
6. Support **mechanical / multi-part** assets (robot arm, drone propellers) — independent per-part control via **clips** and **continuous part drives**.

**Authoring / audition** stays in **GLB Animation Lab** and Model Catalog; the **flow graph** owns **runtime** behavior (sensors, events, logic → playback).

---

## Shipped baseline (do not re-litigate)

| Piece | Role |
| ----- | ---- |
| **`Studio Model`** | Catalog / `studioAssetId` scope for a GLB |
| **`glb-animation-bundle`** | Multi-clip `FlowWireAnimationV1`; inspector **Animation** tab; playback modes `per-clip`, `parallel-all`, `sequence` |
| **`event-trigger-glb-anim`** | One-shot clip restart on **`event`** pulse |
| **`FlowWireAnimationV1`** | Per-clip: `timeS`, `speed`, `loopMode`, `weight`, `trim`, `enabled`, `fadeInMs` / `fadeOutMs` (fades partially consumed) |
| **`mergeGlbAnimationClipDrivesForPreview`** | Scalar time → bundle wire → event drives → **Model Viewer** / **3D Rotation** mixer |
| **GLB Library → Animations** | Extract clip list; spawn bundle or **Evt** trigger |
| **GLB Animation Lab** | Solo / parallel / sequence, scrub, digital twin — **not** a flow node |
| **`morph-target`** + GLB extract morph drives | Static morph weight 0–1 (`mesh:morph` ref); merged in preview |
| **Part visibility / opacity** | **`event-toggle-glb-part`**, **`event-set-glb-part`**, scalar part drives |
| **Lights / cameras / materials** | GLB Library extract + scalar / event drives (sibling to animation) |

Phase 4 slices (1–4) in **`FLOW_DOMAINS.md`** are **done**; this plan is **Phase 4+** (per-clip nodes + merge + mechanical drives + guided workflow).

---

## Three motion families (character + mechanical)

All paths anchor on **`model-select` (Model Source)** and merge in the viewport eval stack (mixer + part/morph drives).

| Family | Examples | Graph primitive | Runtime |
| ------ | -------- | ----------------- | ------- |
| **A — Baked timeline (clip)** | Arm pick, door open, character walk, shape-key act | **Animation Clip** / Bundle → **`glbAnimation`** | `AnimationMixer` + clip tracks |
| **B — Continuous mechanism** | Drone propeller spin, belt, idle rotor | **`part-spin`** (proposed) | Per-frame local rotation on part path |
| **C — Static / scalar drive** | Morph smile dial, hide gear, emissive blink | **`morph-target`**, part events, material scalars | Direct property write each frame |

**Mechanical UX:** Library **Parts** row → **Clip** (if an action exists for that object), **Spin** (continuous), **Evt** (visibility). Do not force propellers through clip semantics when integrators need arbitrary speed/direction.

```text
Model Source
  ├─ Animation Clip "arm_pick"     (baked)
  ├─ Part Spin "propeller_FL"       (continuous, speed wired)
  ├─ Part Spin "propeller_FR"      (speed × -1)
  ├─ Morph Target "body:Hatch"     (static weight)
  └─ Merge (clips) + scene drives ──► Model Viewer / Stage
```

---

## User / animator workflow (target)

```text
Model catalog (dropdown)  →  Studio Model on canvas (scope anchor)
        ↓
Animations list (GLB extract)  →  spawn clip nodes OR bundle OR triggers
        ↓
Logic (sensors, events, Map Range, …)  →  wired into clip parameters
        ↓
Animation Merge / Blend  →  single glbAnimation wire
        ↓
Model Viewer / 3D Rotation (anim in)
```

Optional: **“Add animation setup…”** wizard — model picker → multi-select clips → auto-place Model + Clips + Merge + Viewer.

**Typical node counts**

| Scenario | Nodes (approx.) |
| -------- | ---------------- |
| Minimal loop | 3 — Model + Bundle + Viewer |
| Per-clip + logic | 5–7 — Model + 2–4 Clip + Merge + Viewer |
| Events + continuous | + Trigger / On Click (no duplicate bundle per clip) |

**Do not** auto-spawn one node per clip for entire robots (40+ clips); spawn **selected** clips or use **Bundle** for bulk.

---

## Requirements

### R1 — Model-first entry

- **Studio Model** remains the **single canvas anchor** for `studioAssetId` / GLB URL (catalog dropdown in inspector).
- **GLB Library → Animations** (and palette when Model is selected) lists clips from **`extractStudioGltfComponents`**.
- No parallel “Model Catalog” flow node that duplicates scope without linking to Studio Model.

### R2 — Per-clip independent control on the graph

Each clip the operator cares about must be adjustable **on the canvas** (not only inside Bundle inspector):

| Parameter | Semantics | Notes |
| --------- | --------- | ----- |
| **Time** | Local clip time (s) | Scrub / hold pose when transport paused |
| **Speed** | Mixer time scale | **Signed speed = reverse** (or explicit Reverse bool) |
| **Loop** | `once` / `loop` / `pingpong` | Maps to `StudioGlbAnimationLoopModeV1` |
| **Weight** | 0–1 blend into mixer | Required for multi-clip blend |
| **Enabled** | Clip on/off | Gate without removing wiring |
| **Trim start / end** | Sub-range of clip | Already on wire; expose on clip node |
| **Direction** | Playback forward/reverse | Product copy; implement via speed sign |

**Preference:** one **Animation Clip** node per clip (multi-input sockets), **not** separate catalog nodes per parameter (avoid Shift+A clutter).

### R3 — Blending and merge

- **Animation Merge** — combine N partial `glbAnimation` wires (by clip name; merge policy documented).
- **Animation Blend** — two clips (same rig / GLB), blend factor 0–1, optional crossfade duration.
- Wire **`fadeInMs` / `fadeOutMs`** through to **`studio-glb-animation-preview-mixer`** (fields exist; full runtime blend is a gap).
- **Playback policy** (`parallel-all`, `sequence`, global transport) stays on **Bundle** or a small **Animation Director** node — not duplicated on every Clip node.

### R4 — Events + continuous playback

- Keep **`event-trigger-glb-anim`** for **impulse** (restart / fire-once).
- **Animation Clip** nodes for **continuous** modulation (sensor → speed/weight/time).
- Clear precedence vs **`mergeGlbAnimationClipDrivesForPreview`** (document layer order; extend if Clip nodes add a layer).

### R5 — Blender / glTF animation coverage (full channel matrix)

glTF 2.0 animation channels target **nodes** (TRS) or **morph weights**. Three.js **`AnimationClip`** plays whatever tracks were exported — **bones are nodes** in the glTF hierarchy (skinned meshes follow bone tracks automatically). Studio does **not** need separate “bone nodes” on the graph when motion is already in named clips.

| Blender export | glTF channel | Three.js / mixer | Studio today | Phase 4+ plan |
| -------------- | ------------ | ---------------- | ------------ | ------------- |
| **Armature / bone actions** | Node TRS on bone objects | Clip tracks → skinned mesh | **Animations** tab + Bundle / mixer | **Animation Clip** + Merge |
| **Object animation** (empties, props, propeller mesh) | Node TRS | Same clip system | Same | Same |
| **Shape keys in action** (animated morphs) | `weights` morph targets | Clip morph weight tracks | Clips + **Morphs** tab | Clip node plays timeline; optional **`morph-target`** for static override |
| **Static shape keys** (no action) | Morph dictionary only | `morphTargetInfluences` | **`morph-target`**, Library **Morphs** | Graph-visible morph node + wired weight |
| **Multiple actions / NLA baked** | Multiple `AnimationClip` names | Parallel / sequence modes | Bundle **`parallel-all`**, **`sequence`** | Director + Merge |
| **Material nodes in action** | Node or material property tracks (if exporter emits) | Clip tracks when present | Material scalar drives (parallel) | Verify per exporter; document in Blender guide |
| **Camera / light in action** | Node TRS or props | Clip tracks | **Cameras** / **Lights** tabs + drives | Clip can animate; static drives remain |
| **Skinning / weights** | `skins` + inverse bind matrices | SkinnedMesh | Loaded with GLB | No graph node — data asset |
| **IK / constraints / drivers / live NLA** | — | Only if **baked** to keys | — | **Out of scope** on graph; bake in Blender |

**Implementation rule:** For anything in the **left column**, if it appears as **keys in a named glTF animation**, it is controlled through **`FlowWireAnimationV1`** (clip time, speed, weight, loop, trim, enabled). For **continuous or non-keyed** control, use **family B/C** drives.

**Validation (when implementing):** Golden GLBs per row (character armature, drone props, morph face, multi-action robot) in `tests/sensor-studio/` or manual smoke checklist.

Product message: **“We play and blend what is baked into the GLB; we drive static morphs and mechanisms on parallel paths.”**

### R6 — Mechanical / multi-part independence

- **Independent clips:** One **Animation Clip** node per *selected* glTF action when each action targets disjoint or partially overlapping rigs (merge policy documented when two clips touch the same node).
- **Independent continuous motion:** **`part-spin`** (proposed) — bind to **`extractStudioGltfComponents`** part `ref` (object path); wired **speed**, **enabled**, **axis** (local X/Y/Z), optional **direction**; evaluated on scene frame tick alongside mixer.
- **Do not** auto-spawn one node per part for entire assemblies; spawn from Library for parts the operator wires (same scale rule as clips).
- **Default templates:** Drone demo → Part Spin per propeller; robot → Clip per joint action + optional Spin for belt/roller.

### R7 — Dual runtime + VSIX

- Same graphs in **Vite dev** and **installed VSIX** (`bitstream-dual-runtime.mdc`).
- Re-test **`model-viewer`** and **3D Rotation** after new nodes and merge paths.

### R8 — UI conventions

- TRN inspector hints; socket-only cards where appropriate (`SENSOR_STUDIO_NODE_UI_RULES.md`).
- Spawn from Library row: **Clip** (continuous), **Evt** (trigger), **Spin** (part, proposed), **Bundle** (all clips) — parallel to existing **Animations → Evt** and **Parts → Evt**.

---

## Proposed catalog nodes (future)

| Node id (proposed) | Title | Role |
| ------------------ | ----- | ---- |
| `animation-clip` | Animation Clip | One GLB clip name; optional wired time/speed/weight/loop/enabled/trim; out `glbAnimation` (single-key `clips` map) |
| `animation-merge` | Animation Merge | N× `glbAnimation` in → one out |
| `animation-blend` | Animation Blend | 2× `glbAnimation` + blend factor + optional crossfade s |
| `animation-select` | Animation Select | Clip name + bundle in → patched solo / enabled clip (state-machine helper) |
| `animation-gate` | Animation Gate | Boolean → enable/disable one clip on a wire (thin wrapper) |
| `animation-director` | Animation Director (optional) | Global `playbackMode`, `clipOrder`, transport — alternative to bundle-only policy |
| `part-spin` | Part Spin | Continuous local-axis rotation on GLB part path; wired speed / enabled / direction; scene eval (not `glbAnimation`) |
| `morph-target` (existing) | Morph Target | Static morph weight; keep; improve Library spawn + merge with clip morph tracks |

**Keep:** `glb-animation-bundle`, `event-trigger-glb-anim`, `model-select` / Studio Model, **`morph-target`**, part event nodes.

**Defer:** per-bone mask nodes (use `maskPreset` on wire later), NLA strip editor, IK on graph, **procedural** clip authoring inside Studio.

---

## Architecture notes

### Wire shape

Reuse **`FlowWireAnimationV1`** / **`FlowWireAnimationClipV1`** — Clip nodes emit **partial** wires:

```json
{
  "version": 1,
  "clips": {
    "Door_Open": { "timeS": 0, "speed": 1, "loopMode": "loop", "weight": 1, "enabled": true }
  }
}
```

Merge utility **deep-merges** `clips` by name — **implemented in `animation-wire-merge.ts`**:

| Operation | Policy |
| --------- | ------ |
| **Merge** (`animation-merge`) | **2–8** ordered inputs (**1 → 2 → … → N**). Same clip name: later input overrides defined fields (`timeS`, `speed`, `weight`, `enabled`, loop, trim, fades). Distinct clip names accumulate and play in parallel. Inspector **+ / −** adjusts socket count. |
| **Mix** (`animation-mix`) | **2–8** animation inputs with per-input weights (**W1…WN** sockets or inspector). Weights normalize to sum 1 by default; scales clip weights then merges in parallel. |
| **Blend** (`animation-blend`) | Factor **0 = A**, **1 = B**. Weights scale **multiplicatively**: `wA = w × (1 − factor)`, `wB = w × factor` (not re-normalized). **`crossfadeS`** sets `fadeOutMs` on A clips and `fadeInMs` on B clips for the preview mixer. Output uses **`parallel-all`** playback mode. |

**Weight normalization:** not applied in v1 — operator should keep clip weights ≤ 1 when blending two full-weight clips, or accept summed influence in the mixer.

### Evaluator / tick

- Scene frame tick (`graphNeedsSceneFrameTick`) — same as bundle today.
- Clip nodes evaluated in dataflow tick or dedicated animation eval pass — **implementation choice**; must feed **`liveAnimationWire`** on consumers.

### Model scope

- Every clip node stores **`STUDIO_SOURCE_MODEL_NODE_ID_KEY`** (same as bundle / triggers).
- Validation: clip name exists on linked GLB (`useStudioGltfExtraction`).

### Precedence (extend documented stack)

Proposed order (latest wins unless noted):

1. Scalar GLB animation time drives (`number-constant` + extract tag)
2. **Animation Clip** node wires (per clip)
3. **GLB Animation Bundle** wire
4. **Animation Merge / Blend** output
5. **Event trigger** structured drives (`restartNonce`)

Align with **`mergeGlbAnimationClipDrivesForPreview`** when implementing.

---

## Phased implementation

### Phase A — Animation Clip node (highest value)

- [x] Catalog + `nodeId` `animation-clip`
- [x] Config: `clipName`, model scope, defaults for loop/speed/weight
- [x] Optional input ports: `time`, `speed`, `weight`, `enabled`, loop enum
- [x] Output port: `glbAnimation`
- [x] Eval: build partial `FlowWireAnimationV1`
- [x] Library **Animations** row → **Clip** (alongside **Evt** / drag to canvas)
- [x] Inspector hints; socket live previews where applicable
- [x] Unit tests: eval + merge into preview drives
- [ ] Demo template: e.g. **BMI270** or scalar → clip → viewer (live telemetry) — **Phase C**

### Phase B — Merge and Blend

- [x] **`animation-merge`** — merge partial wires (A/B/C; later wins per clip field)
- [x] **`animation-blend`** — two wires + factor; mixer crossfade from `crossfadeS` → `fadeInMs` / `fadeOutMs`
- [x] Tests: two clips same GLB, weight sum / merge rules
- [x] Document blend rules (additive vs normalized weights) — see Architecture notes

### Phase C — Guided workflow

- [x] Canvas **Run demo template**: model + 2 clips + blend (`animation-clip-blend`)
- [x] Optional wizard: Library **Model → Build animation graph** (1–8 clips → Clip + Merge/Mix/Blend + Viewer; 3+ picker for **Merge** vs **Mix**)
- [x] Shift+A **Animation** group for `animation-clip`, `animation-merge`, `animation-blend` (and bundle)

### Phase D — Director + polish

- [ ] Optional **`animation-director`** or extend bundle for graph-visible sequence control
- [ ] **Animation Select** / **Gate** if state-machine graphs demand it
- [ ] NA import mapping for node-animator `animationPlayer` / per-clip graphs (if needed)

### Phase F — Mechanical / part drives

- [x] **`part-spin`** catalog + eval (local axis, speed, enabled, model scope)
- [x] Library **Parts** → **Spin** spawn
- [x] Merge with clip mixer in **`build-glb-scalar-preview-scene-props`** / viewport rAF (Part Spin applies **after** mixer — additive local rotation)
- [x] Demo template: **`part-spin-demo`** — two spins + sine-driven speed (drone-style workflow)
- [ ] Demo template: robot arm — clip + optional spin for conveyor

### Phase G — Morph + channel verification

- [ ] Document morph **in clip** vs **static morph-target** precedence
- [ ] Golden/smoke: armature walk, morph blink in action, object-only prop spin clip
- [ ] Exporter notes for glTF Shape Keys + armature in same file

### Phase E — Documentation and Blender export guide

- [ ] Operator doc: Blender export checklist (one action per clip, bake NLA, naming, shape keys, apply modifiers)
- [ ] Use-case matrix (this doc § R5) in user-facing help
- [ ] Cross-link from **`GlbExtractionTabPanel`** empty states
- [ ] Table: “when to use Clip vs Part Spin vs Morph Target”

---

## Ideas captured (discussion)

| Idea | Decision |
| ---- | -------- |
| Model catalog dropdown → Animations → … | **Accepted** as primary UX path; dropdown on **Studio Model**, list in **GLB Library** |
| One node per clip for speed/loop/etc. | **Accepted** as **Animation Clip** (multi-socket), not one node per parameter |
| Full blending workflow | **Accepted** — Merge + Blend nodes + mixer fades |
| Cover all Blender animation types | **Accepted** — all **baked glTF channels** via clips (bones, objects, morph weights in actions); static morph / part / light / camera via **parallel** drives; **Part Spin** for continuous mechanisms; no live IK/NLA |
| Mechanical multi-part (drone, robot) | **Accepted** — Clip + **Part Spin** hybrid; Library spawn from **Parts** |
| Replace Bundle | **No** — Bundle remains best for many clips + inspector transport |
| Animation Lab on canvas | **No** — Lab stays workbench; graph consumes wires |

---

## Risks and non-goals

| Risk | Mitigation |
| ---- | ---------- |
| Canvas clutter (40 clips) | Spawn selected clips only; Bundle for full roster |
| Desync clip names vs GLB | Re-validate on model change; show extraction errors in inspector |
| Blend without same skeleton | Validate same `studioAssetId`; warn on merge |
| Duplicate model scope | Single Studio Model anchor per subgraph |

**Non-goals (v1):** Blender-style NLA editor, driver graphs, per-bone mask editor, procedural clip authoring inside Studio, **unbaked** IK/constraints on the graph.

---

## Evaluator stack (target)

Single **Model Viewer / Stage** frame tick applies layers in order (document + test):

1. **Transform** wire (whole model)
2. **`AnimationMixer`** — merged **`glbAnimation`** (all clip track types: bone, object, morph-in-action, camera/light if keyed)
3. **Part Spin** drives (continuous local rotation — may override or add to clip pose on same node; policy TBD)
4. **Morph Target** / scalar morph drives (static weights; merge with clip morph tracks — higher layer wins per morph ref)
5. **Part visibility / opacity**, material PBR, embedded camera switch

Event triggers inject **`restartNonce`** into clip drives before mixer apply.

---

## Test matrix (when implementing)

| Case | Verify |
| ---- | ------ |
| Clip node only → Model Viewer | Speed / loop / weight affect preview |
| Two Clip nodes → Merge → Viewer | Both clips active under `parallel-all` or merged weights |
| Blend idle ↔ walk | Crossfade visible; no pop |
| Event trigger + Clip continuous | Precedence matches doc |
| Library spawn Clip | `STUDIO_SOURCE_MODEL_NODE_ID_KEY` set |
| VSIX + dev | Same graph behavior |

---

## References (code)

| Area | Path |
| ---- | ---- |
| Wire types | `features/editor/nodes/animation/flow-wire-animation.ts` |
| Preview merge | `features/editor/gltf/merge-glb-animation-clip-drives.ts` |
| Mixer | `features/editor/gltf/studio-glb-animation-preview-mixer.ts` |
| GLB extract | `features/editor/gltf/studio-gltf-extract.ts` |
| Library UI | `features/editor/components/node-palette/GlbExtractionTabPanel.tsx` |
| Bundle inspector | `features/editor/components/inspector/settings/sections/GlbAnimationBundleSettingsSection.tsx` |
| Demo template (rotation) | `flow-editor.store.ts` — `rotation-glb-anim` |

---

## Tracker linkage

- **Planned / next:** _Sensor Studio — GLB animation flow (Phase 4+)_ in `extension/docs/DEVELOPMENT_TRACKER.md`
- **Inbox:** user request logged **2026-06-02** — per-clip nodes, blending, catalog → animations workflow
