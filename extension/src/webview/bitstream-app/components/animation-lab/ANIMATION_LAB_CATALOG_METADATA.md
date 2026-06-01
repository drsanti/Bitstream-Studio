# Animation Lab catalog metadata

Optional sidecar JSON beside a catalog GLB (same folder as the model, typically `<productId>_metadata.json`). The Animation Lab reads an `animationLab` block at load time and applies hints once per model URL (does not auto-start transport).

## Schema

```json
{
  "animationLab": {
    "defaultPreviewClip": "gimbal_sweep",
    "recommendedPlaybackMode": "per-clip",
    "clipOrder": ["idle", "gimbal_sweep", "takeoff"],
    "clipLabels": {
      "gimbal_sweep": "Gimbal sweep"
    },
    "quickDemos": [
      {
        "id": "welcome",
        "label": "Single clip (loop)",
        "clip": "gimbal_sweep",
        "loopMode": "loop",
        "playbackMode": "per-clip"
      },
      {
        "id": "tour",
        "label": "Full tour",
        "useSequenceOrder": true,
        "playbackMode": "sequence"
      }
    ]
  }
}
```

**Tesa Drone example** (copy beside the GLB as `tesa-drone_metadata.json`):  
`extension/docs/examples/tesa-drone_animation-lab-metadata.example.json`

| Field | Type | Description |
|-------|------|-------------|
| `defaultPreviewClip` | string | Clip name to select after load (must exist on the GLB). |
| `recommendedPlaybackMode` | `"per-clip"` \| `"parallel-all"` \| `"sequence"` | Initial playback mode. |
| `clipOrder` | string[] | Sequence list order; unknown names are appended after known clips. |
| `clipLabels` | object | Map GLB clip name → friendly label for the showcase inspector. |
| `quickDemos` | array | One-tap booth presets (`id`, `label`, optional `playbackMode`, `clip`, `loopMode`, `useSequenceOrder`, `preservePlaybackMode`). |

Snake_case aliases (`default_preview_clip`, `recommended_playback_mode`, `clip_order`, `clip_labels`, `quick_demos`, `loop_mode`, `use_sequence_order`, `preserve_playback_mode`) are accepted for downloader-exported metadata.

**Single clip (loop)** sets `playbackMode` to `per-clip` (one repeating clip). **Full tour** sets `sequence`. Use `preservePlaybackMode: true` on a custom demo only when you must not change the mode chips.

When `quickDemos` is omitted, the showcase inspector synthesizes **Single clip (loop)** (default clip) and **Full tour** (when `clipOrder` has 2+ entries).

## Discovery

`animation-lab-catalog-hints.ts` indexes `extension/src/webview/assets/**/models/**/*.json` at build time and matches by model directory derived from the catalog `dedupeKey`.

## Transform (optional override)

By default the lab uses the **exported glTF root transform** (Blender object transform at export). Only add when the file pivot is wrong and you need a host-side fix without re-exporting:

```json
{
  "animationLab": {
    "transform": {
      "position": [0, 0, 0],
      "rotationDeg": [0, 0, 0],
      "scale": [1, 1, 1]
    }
  }
}
```

Snake_case: `rotation_deg`. Omitted fields are not applied.

## Related

- Spec: `GLB_ANIMATION_LAB.md` (Phase C)
- Apply path: `apply-animation-lab-catalog-hints.ts`
- Overlap analysis: `analyze-glb-clip-overlap.ts` (read-only, not from JSON)
