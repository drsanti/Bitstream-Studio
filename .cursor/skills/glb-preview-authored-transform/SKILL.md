---
name: glb-preview-authored-transform
description: >-
  GLB/GLTF preview placement in Bitstream Studio webviews. Use when loading models
  with useGLTF, RotationPreviewBodyGlb, GlbPreviewModelRoot, Animation Lab,
  RotationPreviewPanelV4, model catalog preview, thumbnail generator, Blender
  origin, bbox centering, model below grid, or ROTATION_PREVIEW_BODY_GLB_SCALE.
---

# GLB preview — authored transform

## Policy (non-negotiable for preview UIs)

Keep the **exported glTF root transform** (Blender object position, rotation, scale). The ground grid is a fixed reference plane (`GROUND_GRID_Y`); the model is **not** re-centered to world origin by default.

## Implementation checklist

When adding or editing a GLB preview:

1. **Load** with `useGLTF(url)` or `GLTFLoader` → use **`gltf.scene`** directly (cached scene).
2. **Render** with `<GlbPreviewModelRoot scene={scene} />` or `<primitive object={scene} />`.
3. **Do not** wrap with `scale={0.5}`, `position={-bboxCenter}`, drei `<Center>`, or `centerObjectToOrigin` after load.
4. **Animations:** one `AnimationMixer` on the same scene root; no `scene.clone(true)` for skinned assets.
5. **Camera:** adjust camera/controls to bounding volume; do not mutate model transform for framing.
6. **Thumbnails:** `thumbnail-generator.ts` — frame camera to `Box3` / sphere center without `root.position.sub(center)`.

## Key symbols

| Symbol | Path |
|--------|------|
| `GLB_PREVIEW_BODY_PLACEMENT_MODE` | `bitstream-app/components/3d-rotation/shared/rotationPreviewConstants.ts` |
| `GlbPreviewModelRoot` | `bitstream-app/components/3d-rotation/shared/GlbPreviewModelRoot.tsx` |
| `computeGlbPreviewBodyGroupPosition` | `.../compute-glb-preview-body-placement.ts` (`authored` \| `bbox-floor` \| `bbox-center`) |
| Catalog override | `animationLab.transform` in `*_metadata.json` — `ANIMATION_LAB_CATALOG_METADATA.md` |

## Overrides (rare)

```ts
// Global — only when product explicitly needs auto-framing
GLB_PREVIEW_BODY_PLACEMENT_MODE = "bbox-floor"; // feet on grid, XZ centered
```

```json
{
  "animationLab": {
    "transform": { "position": [0, 0, 0], "rotationDeg": [0, 0, 0], "scale": [1, 1, 1] }
  }
}
```

## Regression symptoms

| Symptom | Likely cause |
|---------|----------------|
| Model half below grid, fine in Blender | Bbox centering or `<Center>` reintroduced |
| Model tiny/huge vs Blender | Uniform `0.5` (or other) scale wrapper |
| Clips play but mesh frozen | `scene.clone()` broke skinned bindings |

## Rule

**`.cursor/rules/glb-preview-authored-transform.mdc`**

## Related

- **`bitstream-studio-dev`** — `npm run dev:webview`, HMR
- **`extension/src/webview/bitstream-app/docs/ROTATION_3D_PREVIEW.md`**
- **`extension/src/webview/bitstream-app/components/animation-lab/GLB_ANIMATION_LAB.md`**
