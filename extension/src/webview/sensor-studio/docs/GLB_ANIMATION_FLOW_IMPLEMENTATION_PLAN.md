# GLB / glTF animation flow — implementation plan (future)

**Status:** **Backlog** — requirements and design captured **2026-06-02**; implementation **not started**.  
**Domain:** Sensor Studio flow canvas — **Domain B** (scene + animation).  
**Related:** [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md) (Phase 4 shipped baseline), [`flow-wire-animation.ts`](../features/editor/nodes/animation/flow-wire-animation.ts), [`GLB_ANIMATION_LAB.md`](../../../bitstream-app/components/animation-lab/GLB_ANIMATION_LAB.md), [`studio-gltf-extract.ts`](../features/editor/gltf/studio-gltf-extract.ts), [`DEVELOPMENT_TRACKER.md`](../../../../docs/DEVELOPMENT_TRACKER.md).

---

## Goal

Give **animators and integrators** a clear, graph-visible workflow to:

1. Pick a **model** from the catalog.
2. Work with **animations extracted from the GLB**.
3. Control **each clip independently** (time, speed, direction, loop, weight, trim, enable).
4. **Blend** and **merge** multiple clip states into one viewport.
5. Cover **real Blender / glTF export use cases** without pretending to replicate Blender NLA or IK in the graph.

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

Phase 4 slices (1–4) in **`FLOW_DOMAINS.md`** are **done**; this plan is **Phase 4+** (per-clip nodes + blend + guided workflow).

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

### R5 — Blender / glTF coverage (honest scope)

| Export content | glTF / Three.js | Studio extraction today | Plan |
| -------------- | --------------- | ------------------------ | ---- |
| **Actions** (armature / object F-curves) | Named `AnimationClip` | **Animations** tab | **Animation Clip** nodes + Bundle |
| **Shape keys in action** | Channels on morph weights | Clips + **Morphs** tab | Clip node + optional morph scalars in parallel |
| **Multiple actions / NLA baked** | Multiple clip names | Bundle sequence / parallel | Director + Merge |
| **Object-only animation** | TRS channels | Same clip system | Same nodes |
| **Skin / bones** | Skinned mesh + clips | Same clip system | No per-bone flow nodes in v1 |
| **Embedded cameras / lights** | Clip or static | **Cameras** / **Lights** drives | Sibling drive family, not “animation clip” |
| **Morph targets** (static) | Mesh morph dictionary | **Morphs** tab + scalar drives | Document vs clip timeline |
| **IK / constraints / NLA logic** | Only if **baked** into keys | — | **Out of scope** on graph; Blender + Lab |

Product message: **“We play and blend what is baked into the GLB.”**

### R6 — Dual runtime + VSIX

- Same graphs in **Vite dev** and **installed VSIX** (`bitstream-dual-runtime.mdc`).
- Re-test **`model-viewer`** and **3D Rotation** after new nodes and merge paths.

### R7 — UI conventions

- TRN inspector hints; socket-only cards where appropriate (`SENSOR_STUDIO_NODE_UI_RULES.md`).
- Spawn from Library row: **Clip** (continuous), **Evt** (trigger), **Bundle** (all clips) — parallel to existing **Animations → Evt**.

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

**Keep:** `glb-animation-bundle`, `event-trigger-glb-anim`, `model-select` / Studio Model.

**Defer:** per-bone mask nodes (use `maskPreset` on wire later), NLA strip editor, IK on graph.

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

Merge utility **deep-merges** `clips` by name (policy: later layer wins per field or per clip — TBD in implementation).

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

- [ ] Catalog + `nodeId` `animation-clip`
- [ ] Config: `clipName`, model scope, defaults for loop/speed/weight
- [ ] Optional input ports: `time`, `speed`, `weight`, `enabled`, loop enum
- [ ] Output port: `glbAnimation`
- [ ] Eval: build partial `FlowWireAnimationV1`
- [ ] Library **Animations** row → **Spawn Clip** (alongside **Evt** / drag to canvas)
- [ ] Inspector hints; socket live previews where applicable
- [ ] Unit tests: eval + merge into preview drives
- [ ] Demo template: e.g. **BMI270** or scalar → clip → viewer (live telemetry)

### Phase B — Merge and Blend

- [ ] **`animation-merge`** — merge partial wires
- [ ] **`animation-blend`** — two wires + factor; mixer crossfade from `fadeInMs` / `fadeOutMs`
- [ ] Tests: two clips same GLB, weight sum / normalization rules
- [ ] Document blend rules (additive vs normalized weights)

### Phase C — Guided workflow

- [ ] Canvas **Run demo template**: model + 2 clips + blend or sequence
- [ ] Optional wizard: catalog → pick clips → spawn graph
- [ ] Shift+A subgroup **Animation** under Utilities

### Phase D — Director + polish

- [ ] Optional **`animation-director`** or extend bundle for graph-visible sequence control
- [ ] **Animation Select** / **Gate** if state-machine graphs demand it
- [ ] NA import mapping for node-animator `animationPlayer` / per-clip graphs (if needed)

### Phase E — Documentation and Blender export guide

- [ ] Operator doc: Blender export checklist (one action per clip, bake NLA, naming)
- [ ] Use-case matrix (this doc § R5) in user-facing help
- [ ] Cross-link from **`GlbExtractionTabPanel`** empty states

---

## Ideas captured (discussion)

| Idea | Decision |
| ---- | -------- |
| Model catalog dropdown → Animations → … | **Accepted** as primary UX path; dropdown on **Studio Model**, list in **GLB Library** |
| One node per clip for speed/loop/etc. | **Accepted** as **Animation Clip** (multi-socket), not one node per parameter |
| Full blending workflow | **Accepted** — Merge + Blend nodes + mixer fades |
| Cover all Blender animation types | **Partial** — all **baked clip** types; morph/part/light/camera as **parallel** drives; no live IK/NLA |
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

**Non-goals (v1):** Blender-style NLA editor, driver graphs, per-bone mask editor, procedural clip authoring inside Studio.

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
