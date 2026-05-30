# Assets location system

This document explains **how the extension decides where assets live on disk** and **how those locations map to URLs** in the webview, the browser dev app, and the Model Downloader bridge. It is the conceptual map; for day-to-day paths and backups, see [Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md). For a **tabular directory checklist** (models, free pack, legacy roots), see **[Global asset directories](./GLOBAL_ASSET_DIRECTORIES.md)**. For WebSocket bridge wiring, see [BRIDGE.md](./BRIDGE.md).

## Why it feels complicated

The same logical content (for example a GLB under “Tesaiot downloads” or the free GitHub pack) can appear in several places:

1. **Bundled / repo tree** — `t3d-extension/src/assets/**` (development, some packaged mirrors in the VSIX build).
2. **Per-user writable storage** — VS Code `globalStorage` under `.../assets/` (production downloads and sync).
3. **Logical web keys** — Stable strings such as `tesaiot/models/...` and `free/models/...` used in catalog merge, deduplication, and bridge messages; these are **not** always the same as a single filesystem path.

The code keeps one **canonical layout** in `src/assetLayout.ts` and resolves it per runtime in `src/extensionAssetPaths.ts` (VS Code) and `src/model-downloader/bridgeDefaultPaths.ts` (bridge activation).

## Canonical layout (conceptual)

Everything user-facing under globalStorage hangs off a single bucket:

| Role | Typical filesystem path (conceptual) |
| ---- | ------------------------------------ |
| **User assets root** | `<ExtensionContext.globalStorageUri>/assets/` |

Under that root, distinct **segments** separate pipelines:

| Segment | Purpose |
| ------- | ------- |
| `tesaiot/models/` | Default root for **Model Loader** (API / PDM) downloads — product folders underneath. |
| `tesaiot/textures/` | Optional **Tesaiot pack** textures (parallel to `free/textures/`). |
| `free/` | **Free GitHub pack** mirror (`free/models/`, `free/textures/`, …). |
| `models/downloads/` | **Removed** — migrate folders to `tesaiot/models/`. |
| `free-github/` | **Removed** — migrate to `free/`. |

Constants for these directory chains live in `GLOBAL_STORAGE_ASSET_DIRS` in `src/assetLayout.ts`. Helpers that build `vscode.Uri` values are in `src/extensionAssetPaths.ts` (`getUserAssetsRootUri`, `getModelDownloadsRootUri`, `getFreeGithubMirrorRootUri`, `getTesaiotTexturesRootUri`, etc.).

## Development tree (`src/assets`)

In the repo, the parallel tree is rooted at **`src/assets`** (`DEV_SRC_ASSETS_ROOT` in `assetLayout.ts`). Conventions include:

| Area | Relative path (examples) |
| ---- | ------------------------ |
| Free pack (dev) | `src/assets/free/models/`, `src/assets/free/textures/` |
| Tesaiot pack (dev) | `src/assets/tesaiot/models/`, `src/assets/tesaiot/textures/` (same segments as `globalStorage`) |
| Mirrored “packaged” models | `src/assets/models/**` (may overlap logically with free tree; catalog merge dedupes) |

**Bundled WASM / physics / tooling** under `src/assets` ship with the extension; large models are often excluded from the VSIX via `.vscodeignore` — see [Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md).

## Logical “web path” prefixes

These strings identify a file **relative to the user-assets story**, not necessarily a literal URL pathname everywhere:

| Prefix | Meaning |
| ------ | ------- |
| `tesaiot/models/` | File under the Tesaiot Model Loader root (`.../assets/tesaiot/models/`). |
| `tesaiot/textures/` | File under the Tesaiot pack textures tree (`.../assets/tesaiot/textures/`). |
| `free/models/` | File under the free-pack mirror (`.../assets/free/models/...`). |

The catalog uses these prefixes in **`canonicalCatalogDedupeKey`** (`src/webview/model-catalog/modelCatalogMerge.ts`) so listings from globs, bridge scans, and globalStorage line up.

## VS Code webview vs browser (T3D) dev

### Webview (extension)

- **`localResourceRoots`** include `<globalStorageUri>/assets` so `asWebviewUri` can load GLBs and textures from downloaded/synced content.
- Scanned files are mapped to web paths and URIs in `src/model-downloader-handle.ts` (`webPathForScannedModelFile`, `webviewFileUriForScannedLocalFile`), respecting tesaiot, free-pack, and extension dev roots.

### Browser + local HTTP server

When the UI runs in the browser against a local static server (`src/local-webapp-server.ts`), user content is exposed under **stable HTTP prefixes** (read-only):

| HTTP prefix | Maps to on disk (when set) |
| ----------- | -------------------------- |
| `/__ternion_user_models/` | Same folder as Model Loader default: `.../assets/tesaiot/models` |
| `/__ternion_user_free/` | Free pack mirror: `.../assets/free` |
| `/__ternion_user_tesaiot_textures/` | Tesaiot pack textures: `.../assets/tesaiot/textures` |

For preview assets that come from the free pack (`models/psoc-e84-ai/...`, `textures/cubemap/...`), browser mode resolves from `__ternion_user_free` first in local-first strategy.

Constants: `BROWSER_USER_MODELS_HTTP_PATH_PREFIX`, `BROWSER_USER_FREE_HTTP_PATH_PREFIX`, `BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX` in `assetLayout.ts`.  
On extension activate, `extension.ts` sets both the bridge roots and these server roots via `setLocalWebappUserModelsRoot`, `setLocalWebappFreePackRoot`, and `setLocalWebappTesaiotTexturesRoot`.

**Catalog URL bridging:** `bridgeWebPathToCatalogModelUrl` in `modelCatalogMerge.ts` turns logical paths like `tesaiot/models/...` and `free/models/...` into fetchable URLs (using those HTTP prefixes in the browser build, and dev-specific Vite aliases in `DEV`).

## Asset source strategy

The extension exposes `ternion.assets.sourceStrategy`:

- `local-only`
- `local-first` (default)
- `online-only`

At runtime this is injected as `window.ASSET_SOURCE_STRATEGY` and can also be passed on browser-mode URL query (`assetSourceStrategy=...`).

Current intent:

- `local-first` prefers free/user mirrors under globalStorage; falls back to online when local roots are unavailable.
- `online-only` prefers `ONLINE_ASSETS_BASE_URI` first.
- `local-only` avoids online-first resolution and keeps loads on local roots.

### Vite dev server (logical path → URL)

Vite’s document root is `src/webview`, so a naive `/assets/...` URL would hit `src/webview/assets`, not `t3d-extension/src/assets`. The dev server therefore exposes two families of routes (see **`serveExtensionLocalAssetsPlugin`** in `vite.config.ts`):

| Logical keys | Dev URL prefix | On-disk resolution (typical) |
| ------------ | -------------- | ---------------------------- |
| `src/assets/...` (repo bundle, including `models/**` under the dev prefix) | `/__extension_src_assets/...` | Repo **`t3d-extension/src/assets`** |
| `tesaiot/models/...`, `tesaiot/textures/...`, `free/...` (pack paths) | `/__ternion_user_models/`, `/__ternion_user_tesaiot_textures/`, `/__ternion_user_free/` | Same trees as production browser: **`TERNION_VITE_*` env**, then VS Code **`globalStorage/.../assets/...`**, then repo **`src/assets/...`** as fallback |

`projectRelativePathToDevUrl` (`src/webview/logical-asset-url.ts`) implements this split in **`import.meta.env.DEV`**. **`bridgeWebPathToCatalogModelUrl`** and **`devViteModelUrlFromCanonicalDedupeKey`** (`modelCatalogMerge.ts`) use the user-mirror prefixes for pack paths so catalog previews match **`local-webapp-server.ts`** behavior. **`resolveTesaiotTexturesToFetchableUrl`** keeps `tesaiot/textures/...` aligned with injected **`TESAIOT_TEXTURES_BASE_URI`** (and the same user-mirror prefix when bases are unset in dev).

## Model Downloader bridge

When the bridge runs **inside the activated extension**, `extension.ts` calls:

- `setBridgeModelDownloadsRoot` → absolute path of `getModelDownloadsRootUri` (globalStorage `tesaiot/models`).
- `setBridgeUserAssetsRoot` → absolute path of `getUserAssetsRootUri` (`assets` parent of both tesaiot and free trees).

Standalone bridge (npm scripts) leaves downloads root unset so the bridge falls back to repo-relative defaults (see `bridgeDefaultPaths.ts` and [BRIDGE.md](./BRIDGE.md)).

Scan roots and catalog listing in the bridge use these roots so **one** logical layout is shared between Node and the UI.

## Static catalog globs (build-time)

`MODEL_CATALOG_BUILD_GLOBS` in `assetLayout.ts` must stay in sync with the **string literals** in `modelCatalog-asset-scan.ts` (Vite requires literal glob patterns). Those globs point at packaged trees under `../../assets/...` relative to the catalog module.

## Rotation preview: Sensor Studio and Bitstream (same GLB URL rules)

Large preview GLBs (for example **`models/psoc-e84-ai/psoc-e84-ai.glb`**) are often **omitted from the VSIX** via `.vscodeignore` (`out/webview/assets/models/**`, `*.glb` under packaged assets). Code must **not** build load URLs with `new URL('…/assets/models/…', import.meta.url)` for those files: that resolves to an extension-folder URI where the file was never installed, causing **404** and `Webview.loadLocalResource` errors in a packaged extension.

**Shared resolver (required):** use the same pipeline as the Bitstream rotation preview:

- **`resolveDefaultPreviewMeshGlbUrl()`** → **`resolveWebviewModelAssetUrl(PSOC_E84_GLB_RELATIVE_PATH)`**  
  (`src/webview/bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.ts`)

That function respects **`window.FREE_ASSETS_BASE_URI`**, **`LOCAL_ASSETS_BASE_URI`**, **`TESAIOT_TEXTURES_BASE_URI`** (logical keys under `tesaiot/textures/…`, shared with **`resolveTesaiotTexturesToFetchableUrl`** in `src/webview/logical-asset-url.ts` and the Model Catalog), **`USER_MODELS_BASE_URI`**, **`ONLINE_ASSETS_BASE_URI`**, and **`getAssetSourceStrategy()`** (`src/webview/asset-source-strategy.ts`), matching how the webview host injects globals at load time and `asset-config-response` refresh.

**Sensor Studio** defaults and fallbacks in **`scene3d-config.ts`** and **`RotationPreviewPanelV4.tsx`** follow this resolver so Behavior matches Bitstream and packaged installs after a **free-pack sync** (or online assets when configured). See also [Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md) — first-run empty state.

## Quick reference: main source files

| File | Responsibility |
| ---- | ---------------- |
| `src/assetLayout.ts` | Shared constants: dev roots, globalStorage segments, HTTP prefixes, catalog globs. |
| `src/extensionAssetPaths.ts` | VS Code `Uri` helpers under `globalStorage/.../assets`. |
| `src/model-downloader/bridgeDefaultPaths.ts` | Injected absolute roots for the bridge process. |
| `src/local-webapp-server.ts` | Browser static server mapping for `__ternion_user_*` routes. |
| `src/extension.ts` | Wires bridge + local server roots on activate / clears on deactivate. |
| `src/model-downloader-handle.ts` | Web path and webview URI mapping for scanned files. |
| `src/webview/model-catalog/modelCatalogMerge.ts` | Dedupe keys, dev URL projection, bridge → catalog URL. |
| `src/webview/bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.ts` | **`resolveWebviewModelAssetUrl`** / **`resolveDefaultPreviewMeshGlbUrl`** for preview GLBs (VSIX-safe). |

## Related documents

- [Global asset directories](./GLOBAL_ASSET_DIRECTORIES.md) — **canonical table**: where models, free pack, and legacy trees live (`src/assets` vs `globalStorage/assets`).
- [Global Directories panel design](./GLOBAL_DIRECTORIES_PANEL_DESIGN.md) — **UI design** (read-only panel, hooks, phases) aligned with the directory reference.
- [Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md) — where files are written, backups, UI “Open folder”.
- [BRIDGE.md](./BRIDGE.md) — WebSocket bridge architecture and dev commands.
- [Asset Manager architecture](../src/webview/assets-manager/docs/ASSET_MANAGER_ARCHITECTURE.md) — planned **self-contained** webview module + **hooks** for Bitstream / Sensor Studio; does **not** replace resolver rules in this document.
