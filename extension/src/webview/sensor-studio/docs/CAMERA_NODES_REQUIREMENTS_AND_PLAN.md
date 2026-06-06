# Sensor Studio — camera nodes (video, texture, and vision)

**Status:** v0.8 Phase H — MediaPipe free-pack distribution (Free Loader + slim VSIX); Phase G shipped (3D landmarks, workers, full local pack for maintainers).

**Goal:** Add a camera mini-domain to Sensor Studio with two practical tracks:

1. **Video as scene media** — live camera feed as texture/material and CSS3D content.
2. **Video as ML source** — camera feed for browser-side inference (MediaPipe / TF.js class).

This plan follows the existing Sensor Studio pattern used by Audio and Flow Domains: keep heavy runtime objects out of persisted flow JSON, expose graph-friendly typed outputs, and evaluate on the frame-domain scheduler.

**Related:** [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md), [`SENSOR_STUDIO_3D_AND_PHYSICS_GRAPH.md`](./SENSOR_STUDIO_3D_AND_PHYSICS_GRAPH.md), [`AUDIO_NODES_REQUIREMENTS_AND_PLAN.md`](./AUDIO_NODES_REQUIREMENTS_AND_PLAN.md).

---

## Non-goals (v0.1)

- Full compositor graph with arbitrary pixel-shader chain.
- Full tensor graph or generic tensor data on sockets.
- Cloud inference and server-side streaming.
- Recording/export pipeline (mp4/webm) in first slice.

---

## Constraints (webview reality)

1. **Permission UX is mandatory**: `getUserMedia({ video: ... })` can deny or be blocked.
2. **Performance budget**: camera + Three.js + inference can saturate CPU/GPU quickly.
3. **Persistence contract**: no `MediaStream`, `HTMLVideoElement`, `ImageBitmap`, or tensors in store snapshots.
4. **VSIX parity**: must run in Vite dev and VS Code webview without host-specific assumptions.
5. **Frame-domain timing**: camera and inference should run on Domain B frame scheduling, not telemetry ticks.

---

## Port type proposal

Add two opaque-handle wire types to `StudioPortType`:

- `videoBus` — runtime camera stream handle (similar role to `audioBus`).
- `videoTexture` — runtime texture handle for scene/material consumers.

Do **not** expose full landmark/tensor structs as new wire types in v0.1. Use existing scalar/vector/event outputs for graph operations, plus optional debug JSON strings where needed.

---

## Runtime architecture proposal

Create shared runtime:

- `extension/src/webview/sensor-studio/core/camera/studio-camera-runtime.ts`

Responsibilities:

- camera device lifecycle (`getUserMedia`, stop tracks, errors, denied state)
- source/video element registry by `nodeId`
- texture lifecycle (`THREE.VideoTexture`) by producer/consumer node ids
- per-node inference runners (throttled FPS, optional worker path later)

Store only config and scalar outputs in flow graph state; runtime holds live objects.

---

## Proposed node catalog entries (v0.1/v0.2 path)

All entries go into:
`extension/src/webview/sensor-studio/config/node-catalog.config.ts`.

### 1) `camera-input` (category: `scene`)

**Purpose:** Acquire camera stream and expose runtime handle + health metrics.

**Inputs:**

- `enabled` (`boolean`, optional)

**Outputs:**

- `video` (`videoBus`)
- `active` (`boolean`)
- `fps` (`number`)
- `width` (`number`)
- `height` (`number`)

**Default config (draft):**

- `enabled`: `false`
- `deviceId`: `"default"`
- `width`: `1280`
- `height`: `720`
- `targetFps`: `30`
- `facingMode`: `"user"` (`"user" | "environment"`)
- `mirrorPreview`: `true`

### 2) `video-texture` (category: `scene`)

**Purpose:** Convert `videoBus` to a texture-handle wire for 3D/material consumers.

**Inputs:**

- `in` (`videoBus`)

**Outputs:**

- `out` (`videoTexture`)
- `ready` (`boolean`)

**Default config (draft):**

- `colorSpace`: `"srgb"`
- `flipY`: `false`
- `minFilter`: `"linear"`
- `magFilter`: `"linear"`

### 3) `material-video` (category: `scene`)

**Purpose:** Apply live camera texture to a target model material map.

**Inputs:**

- `model` (`string`)
- `tex` (`videoTexture`)
- `gain` (`number`, optional)

**Outputs (optional v0.1):**

- `active` (`boolean`)

**Default config (draft):**

- `materialName`: `""`
- `mapSlot`: `"map"` (`map`, `emissiveMap`, optional `alphaMap`)
- `blend`: `1`
- `toneMapped`: `false`

### 4) `css3d-camera-feed` (category: `scene`)

**Purpose:** Place camera feed as a CSS3D panel synced with scene camera.

**Inputs:**

- `in` (`videoBus`)
- `visible` (`boolean`, optional)
- `opacity` (`number`, optional)

**Outputs (optional):**

- `visible` (`boolean`)

**Default config (draft):**

- `anchorMode`: `"screen"` (`screen | world`)
- `anchor`: `{ x: 0, y: 0, z: 0 }`
- `sizePx`: `{ w: 320, h: 180 }`
- `borderRadiusPx`: `8`

### 5) `vision-pose` (category: `logic` or `scene`, v0.2)

**Purpose:** Run pose inference from `videoBus` with graph-friendly outputs.

**Inputs:**

- `in` (`videoBus`)
- `enabled` (`boolean`, optional)

**Outputs (initial):**

- `detected` (`boolean`)
- `score` (`number`)
- `nose` (`vector3`)  // normalized x,y + confidence in z or packed depth hint
- `leftWrist` (`vector3`)
- `rightWrist` (`vector3`)
- `trigger` (`event`) // pulses on enter/exit detection or threshold crossings

**Default config (draft):**

- `modelVariant`: `"lite"`
- `runningMode`: `"video"`
- `targetFps`: `15`
- `minDetectionConfidence`: `0.5`
- `minTrackingConfidence`: `0.5`

### 6) `vision-landmarks-debug` (optional helper)

**Purpose:** Expose compact debug channel for inspection/logging.

**Inputs:**

- `in` (`videoBus`)

**Outputs:**

- `count` (`number`)
- `json` (`string`)

---

## Evaluation hooks (exact integration points)

## 1) Types and colors

- `features/editor/flow-graph-types.ts` — add `videoBus`, `videoTexture`.
- `config/data-type-colors.config.ts` — add accent colors.
- `features/editor/edges/flow-edge-port-label.ts` — add labels.

## 2) Catalog and node panels

- `config/node-catalog.config.ts` — add node entries above.
- `features/editor/nodes/...` — add card panels + inspector sections.
- `features/editor/components/inspector/settings/node-inspector-settings-search.ts` — searchable terms.

## 3) Runtime and scheduling

- `core/camera/studio-camera-runtime.ts` — singleton runtime instance.
- `core/flow/scene-flow-frame-subscribers.ts` — mark camera/vision nodes as frame-subscribed.
- `app/useSensorStudioFlowTickScheduler` usage path — reuse Domain B rAF coalescing.

## 4) Graph evaluation and outputs

- `features/editor/store/flow-editor.store.ts`:
  - create/own camera runtime ref
  - invoke camera/vision evaluators during `tickSimulation`
  - write scalar/vector/event outputs to node pin maps

## 5) Scene/material consumption

- `features/editor/gltf/studio-glb-preview-runtime.ts`:
  - resolve `videoTexture` handles
  - apply to material map slots safely
  - restore previous maps when wire disconnects
- `core/stage/evaluate-stage-scene-snapshot.ts` (if Stage support in v0.1)
  - include camera texture drives in stage snapshot path (optional first slice)

---

## Phased implementation plan

### Phase A — Camera foundation (recommended first)

- `camera-input` + runtime lifecycle + permission UX.
- `video-texture` output and simple readiness state.
- smoke tests: start/stop, device swap, denied permission.

### Phase B — Scene media integration

- `material-video` on Model Viewer / rotation preview.
- optional `css3d-camera-feed` panel.
- ensure disconnect restores original material state.

### Phase C — Vision baseline

- `vision-pose` (MediaPipe-first) with throttled inference.
- expose only graph-friendly outputs (`boolean`, `number`, `vector3`, `event`).
- add quality/perf presets (low/med/high).

### Phase D — Vision expansion

- [x] additional nodes: **vision-hands**, **vision-face**, **vision-object**, **vision-landmarks-debug**
- [x] Stage integration: CSS3D feeds + material-video on **Stage** viewport; vision status HUD overlay
- [x] self-hosted model bundles: `localStorage` MediaPipe endpoint overrides (`vision-mediapipe-endpoints.ts`)
- [x] worker/offscreen pose inference (`studio-vision-pose-inference.worker.ts` + per-node **Inference backend**)
- [x] 2D skeleton overlay (`StudioVisionPoseSketchOverlay`) on Stage / Model Viewer / rotation preview
- [x] bundled asset path: copy `src/assets/vision/**` to `/assets/vision/` (operator drops `.task` + WASM per README)

### Phase G — shipped (2026-06-06)

- [x] 3D landmark debug draw in scene graph (`studio-vision-landmarks-3d-overlay.ts`, `drawLandmarks3d` on pose / landmarks-debug)
- [x] full offline MediaPipe model pack for local dev (`npm run vision:copy-mediapipe:all`)
- [x] worker offload for **vision-hands**, **vision-face**, **vision-object** (+ landmarks-debug via pose worker)

### Phase H — free pack (in progress)

- [x] Plan + shared pack module (`visionMediapipeFreePack.ts`, `VISION_MEDIAPIPE_FREE_PACK.md`)
- [x] Free Loader **Download vision models** + raw-manifest indexer
- [x] Per-file URL resolver (local → free → online)
- [x] VSIX slim: lite + WASM only on `prebuild:webview`
- [x] Publish `assets/vision/mediapipe/` to **`ternion-3d-assets-free`** on GitHub — [`4061528`](https://github.com/drsanti/ternion-3d-assets-free/commit/4061528)
- [ ] Vision inspector chip when optional models missing (backlog)

See **`extension/docs/VISION_MEDIAPIPE_FREE_PACK.md`**.

---

## Testing matrix (minimum)

| Area | Verify in dev | Verify in VSIX |
| --- | --- | --- |
| Camera permission | allow/deny/revoke flows | same |
| Device switching | camera changes live, no stale stream | same |
| Material feed | live video mapped to target material | same |
| CSS3D feed | overlay visible + camera sync stable | same |
| Pose node | stable FPS cap, outputs update, no UI hitching | same |

Performance guardrails:

- default inference FPS <= 15 for v0.2 vision nodes.
- auto-disable heavy inference when node is disabled or feed not active.

---

## Risks and mitigations

- **Risk:** FPS collapse with camera + 3D + inference.
  - **Mitigation:** independent target FPS per vision node, frame skipping, conservative defaults.
- **Risk:** device/permission instability across hosts.
  - **Mitigation:** explicit runtime states (`idle/requesting/denied/error/active`) and recovery actions.
- **Risk:** texture leaks on reconnect.
  - **Mitigation:** centralized runtime disposal and lifecycle tests.

---

## Decision summary

- Use **opaque runtime handles** (`videoBus`, `videoTexture`) instead of raw frame payloads in flow state.
- Keep v0.1 focused on **camera -> texture/material/CSS3D**.
- Add ML in v0.2 with **graph-friendly outputs**, not tensor-first wiring.
