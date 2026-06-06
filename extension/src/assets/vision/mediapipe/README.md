# MediaPipe vision assets (local / free pack / VSIX)

Vision nodes load WASM + models from here when **Prefer bundled models** is ON.

## Tiers

| Tier | Contents | Where |
|------|-----------|--------|
| **VSIX / dev lite** | WASM + `pose_landmarker_lite.task` | `npm run vision:copy-mediapipe` → this folder → `out/webview/assets/vision/` |
| **Full pack** | all `.task` / `.tflite` | **`ternion-3d-assets-free`** `assets/vision/mediapipe/` → Free Loader → `globalStorage/.../free/vision/mediapipe/` |

Canonical plan: **`extension/docs/VISION_MEDIAPIPE_FREE_PACK.md`**

## Maintainer commands

From `extension/`:

```bash
npm run vision:copy-mediapipe          # lite + WASM (VSIX default)
npm run vision:copy-mediapipe:all    # all models (local / staging)
npm run vision:gen-mediapipe-manifest
npm run vision:stage-free-pack         # copy into ../ternion-3d-assets-free
```

Then commit + push in **`ternion-3d-assets-free`** (use git CLI for files &gt; 25 MB).

## URL resolution (webview)

1. `LOCAL_ASSETS_BASE_URI` — bundled VSIX/dev (`out/webview/assets` or `__extension_src_assets`)
2. `FREE_ASSETS_BASE_URI` — after Free Loader sync
3. `ONLINE_ASSETS_BASE_URI` — raw GitHub `.../main/assets`

Optional models prefer **free** before **local**. See `vision-mediapipe-url-resolver.ts`.

## Verify in browser (dev)

```
http://localhost:5173/__extension_src_assets/vision/mediapipe/wasm/vision_wasm_internal.wasm
```

## Disable CDN / use Free pack

Vision Pose inspector → **Model CDN (advanced)** → keep **Prefer bundled models** ON → run **Free Loader → Download vision models**.
