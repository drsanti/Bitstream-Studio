# Vision MediaPipe pack — free assets + Free Loader

**Status:** Shipped (Phase H complete)  
**Related:** [`ASSETS_ONLINE_REPO.md`](./ASSETS_ONLINE_REPO.md), [`CAMERA_NODES_REQUIREMENTS_AND_PLAN.md`](../src/webview/sensor-studio/docs/CAMERA_NODES_REQUIREMENTS_AND_PLAN.md), upstream [`ternion-3d-assets-free`](https://github.com/drsanti/ternion-3d-assets-free)

## Goal

Ship **optional** MediaPipe vision models (hand, face, object, full/heavy pose) via the **existing Free Loader** and **`ternion-3d-assets-free`**, while keeping a **lite VSIX** (WASM + lite pose bundled under `out/webview/assets/vision/mediapipe/`).

No separate downloader — reuse `syncTernionFreeAssets` and `FREE_ASSETS_BASE_URI`.

## GitHub layout (`ternion-3d-assets-free`)

```text
assets/vision/mediapipe/
├── README.md
├── NOTICE.md
├── manifest.v1.json          # file list + revision + pack tiers
├── wasm/                     # @mediapipe/tasks-vision WASM (pinned with npm)
├── pose_landmarker_lite.task
├── pose_landmarker_full.task
├── pose_landmarker_heavy.task
├── hand_landmarker.task
├── face_landmarker.task
└── efficientdet_lite0.tflite
```

After Free Loader sync → `globalStorage/.../assets/free/vision/mediapipe/...`

**Bitstream relative paths** (no `assets/` prefix): `vision/mediapipe/...`

All files are **under GitHub’s 100 MB/file limit** (~81 MB total pack; largest file ~29 MB heavy pose).

## URL resolution (webview)

When **Prefer bundled models** is ON, each asset resolves in order:

| Tier | Files | Base order |
|------|--------|------------|
| **Core** | `wasm/*`, `pose_landmarker_lite.task` | `LOCAL_ASSETS_BASE_URI` → `FREE_ASSETS_BASE_URI` → `ONLINE_ASSETS_BASE_URI` |
| **Optional** | full/heavy pose, hand, face, object | `FREE_ASSETS_BASE_URI` → `ONLINE_ASSETS_BASE_URI` → `LOCAL_ASSETS_BASE_URI` |

Implementation: `vision-mediapipe-url-resolver.ts`, `visionMediapipeFreePack.ts`.

CDN defaults apply only when **Prefer bundled models** is OFF.

## Free Loader integration

| Mechanism | Vision pack |
|-----------|-------------|
| Full **Download all** | Includes `assets/vision/**` from GitHub tree (non-model paths pass through) |
| **Download vision models** button | `onlyRepoPaths` from `manifest.v1.json` (subset sync) |
| Raw-manifest fallback (API rate limit) | `freeAssetIndexFromRawManifests.ts` reads `vision/mediapipe/manifest.v1.json` |

## Maintainer scripts (`extension/`)

| Script | Purpose |
|--------|---------|
| `npm run vision:copy-mediapipe` | Lite + WASM → `src/assets/vision/mediapipe/` (VSIX / dev) |
| `npm run vision:copy-mediapipe:all` | All models (local dev / staging) |
| `npm run vision:gen-mediapipe-manifest` | Write `manifest.v1.json` from disk |
| `npm run vision:stage-free-pack` | Copy pack + manifest into local clone of `ternion-3d-assets-free` |

Publish to GitHub: commit + push in **`ternion-3d-assets-free`** (use `git push`, not web UI for files &gt; 25 MB).

## VSIX build

- **`prebuild:webview`** — `vision:copy-mediapipe` (lite only)  
- Optional models — Free Loader or online raw URLs after sync

## Phases

- [x] **H0** — Plan doc + shared pack module + URL resolver  
- [x] **H1** — Raw-manifest indexer + manifest generator + stage script  
- [x] **H2** — Free Loader “Download vision models” + slim prebuild  
- [x] **H3** — Publish pack to `ternion-3d-assets-free` on GitHub ([`4061528`](https://github.com/drsanti/ternion-3d-assets-free/commit/4061528))  
- [x] **H4** — Vision inspector **Model missing** chip + Asset Browser **Libraries** tab (MediaPipe pack row)

## Tests

`tests/sensor-studio/vision-mediapipe-free-pack.test.ts` — pack paths, resolver base order, manifest parsing.
