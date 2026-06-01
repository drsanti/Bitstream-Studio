# GLB Animation Lab

Investigation surface for **multi-clip glTF/GLB** playback in Bitstream Studio. Lives beside the frozen **Quaternion · 3D Orientation** card so operators keep a simple fusion preview while integrators and animators compare playback policies.

## Related components

| Component | Path | Role |
|-----------|------|------|
| **Quaternion · 3D Orientation** | `components/3d-rotation/QuaternionRotation3DPreviewCard.tsx` | Live IMU → mesh; **parallel-all** transport only; bugfix-only |
| **GLB Animation Lab** | `components/animation-lab/` | Full clip control, solo/parallel modes, timeline scrub, **machine twin** (Phase A) |
| **Model Viewer** | `sensor-studio/.../RotationPreviewPanelV4.tsx` | Vanilla Three reference |
| **Studio mixer** | `sensor-studio/.../studio-glb-animation-preview-mixer.ts` | Trim, weight, fade, sequence (Phase B) |

## Model transform (viewport)

Shared with all Bitstream / Sensor Studio GLB previews: **`GLB_PREVIEW_BODY_PLACEMENT_MODE = "authored"`** in `rotationPreviewConstants.ts` — export **position, rotation, and scale** from Blender, no `0.5` scale, no bbox recenter. Optional `bbox-floor` / `bbox-center` via that constant; catalog `animationLab.transform` for per-asset overrides.

## Design goals

1. **Blender-first defaults** — solo one action, scrub timeline, named clips.
2. **One `AnimationMixer` per model** on the cached `useGLTF` scene (no clone for skinned rigs).
3. **One `mixer.update(delta)` per frame** after applying transport/drives.
4. **Progressive disclosure** — L0 operator controls vs L1+ lab inspector.
5. **Parity matrix** — document which engine path is active for A/B tests.

## Playback modes

| Mode | ID | Behavior |
|------|-----|----------|
| **Per clip (solo)** | `per-clip` | One active clip via Studio drives; cross-fade on clip change (default) |
| **Parallel all** | `parallel-all` | All clips driven; matches Quaternion orientation preview |
| **Sequence** | `sequence` | One clip at a time, `once` loop, advances via Studio sequence helper |

Legacy engine (`mixerEngine: legacy`) keeps Phase A transport without trim/fade.

## Operational digital twin (Phase A + B)

Sidebar **Machine twin** panel: subsystem health, simulated motor/sensor parameters, clip-linked selection. Viewport **CSS3D tags** on anchors (toolbar **Tags** / **Alerts only**). Catalog **`digitalTwin`** metadata or clip-name heuristics for multi-actuator GLBs. Spec: **`extension/docs/GLB_ANIMATION_LAB_DIGITAL_TWIN.md`**.

## File layout

```
components/animation-lab/
  GLB_ANIMATION_LAB.md          ← this document
  index.ts
  glb-animation-lab.types.ts
  animation-lab-constants.ts
  animation-lab-persistence.ts
  resolve-animation-lab-mesh-fetch-url.ts
  glb-animation-lab-playback.ts
  build-animation-lab-drives.ts
  glb-animation-lab-context.tsx
  GlbAnimationLabBody.tsx
  GlbAnimationLabScene.tsx
  GlbAnimationLabViewport.tsx
  GlbAnimationLabInspector.tsx       ← re-exports showcase inspector
  GlbAnimationLabInspectorShowcase.tsx
  GlbAnimationLabPreviewCard.tsx
  glb-animation-lab-catalog-display.ts
  GLB_ANIMATION_LAB_SMOKE.md
```

## Development plan

### Phase A — Shell + solo/parallel (current)

- [x] Spec document and module scaffold under `components/animation-lab/`
- [x] `GlbAnimationLabPreviewCard` + viewport (R3F, catalog model picker, grid/env toolbar)
- [x] `GlbAnimationLabBody` — cached scene, mixer, solo vs parallel-all
- [x] Inspector: clip list, mode select, transport, scrub slider (solo)
- [x] **Telemetry** workbench main pane = Animation Lab only (`TelemetryMainPanel`; quaternion card removed from this surface)
- [ ] Manual smoke: Tesa Drone solo gimbal clip vs parallel-all — checklist **`GLB_ANIMATION_LAB_SMOKE.md`**

### Phase B — Studio mixer parity

- [x] Playback mode: `sequence` (+ reorder in inspector)
- [x] Wire `applyStudioGlbAnimationMixerDrives` + per-clip weight, loop, trim, fade
- [x] Cross-fade on per-clip change (`soloCrossFadeS`, `activeClipRestartNonce`)
- [x] Mixer engine toggle: **Studio** (default) vs **Legacy** (Phase A)
- [x] Dev compare aids: catalog / Asset Browse open lab (integrator tools removed from showcase inspector)

### Phase C — Animator tooling

- [x] Read-only track overlap summary per clip
- [x] Catalog metadata: `defaultPreviewClip`, `recommendedPlaybackMode`, `clipOrder` (sidecar JSON — see `ANIMATION_LAB_CATALOG_METADATA.md`)
- [x] Frame / time readout synced to active action

### Phase D — Product integration (optional)

- [x] Entry from Model Catalog / Asset Browse (`open-animation-lab-from-catalog.ts`; card + preview menu + Asset Browse button)
- [x] Promote lab playback policy to new **GLB Animation Bundle** nodes (`studio-glb-preview-defaults-from-lab.ts`; flow store merge on spawn)

## Parity checklist (manual)

| Check | Orientation | Animation lab | Model Viewer |
|-------|-------------|---------------|--------------|
| Tesa Drone loads | ✓ | ✓ (smoke doc) | ✓ |
| Authored transform / grid | ✓ | ✓ | ✓ |
| Solo one clip smooth | parallel only | ✓ Studio | partial |
| Parallel 7 clips | ✓ | ✓ | varies |
| Sequence + trim/fade | — | ✓ | ✓ (flow) |
| Play/Pause/Stop | ✓ | ✓ | ✓ |
| Scrub + live readout | — | ✓ | partial |

## UX tiers

| Tier | Surface | Controls |
|------|---------|----------|
| L0 | Quaternion card | Model, play/pause/stop, parallel-all |
| L1 | Animation lab | L0 + solo clip, mode, scrub |
| L2 | Phase B | Weight, loop, trim, fade, sequence |
| L3 | Phase C | Overlap graph, engine compare |

## Non-goals (v1)

- NLA editor, keyframe editing, retargeting, onion skin
- Cloning skinned scenes for display
- Replacing Sensor Studio flow Model Viewer node
