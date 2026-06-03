# Global asset directories (canonical reference)

This document is the **single checklist** for **where models and other assets are stored** in the t3d-extension project. Path segments match **`src/assetLayout.ts`** and **`src/extensionAssetPaths.ts`**; if code and this doc disagree, **fix the doc** after changing the constants.

**Visual overview (Mermaid):** [Asset storage diagram](./ASSET_STORAGE_DIAGRAM.md) — physical trees, Free Loader vs Model Loader, and webview URL bases.

**Online GitHub (`ternion-3d-assets-free`):** [Online assets repo](./ASSETS_ONLINE_REPO.md) — canonical base is **`.../main/assets`** (not repo root).

## Pack layout (same shape for both trees)

Under **`…/assets/`** (VS Code `globalStorage` or monorepo **`ternion-t3d/assets`**), there are two **packs** with parallel folders:

| Pack | Typical subtrees | Primary role |
| ---- | ------------------ | -------------- |
| **Free** | `free/models/`, `free/textures/`, … | GitHub **[ternion-3d-assets-free](https://github.com/drsanti/ternion-3d-assets-free)** mirror — online tree is **`assets/`** on `main` ([details](./ASSETS_ONLINE_REPO.md)) |
| **Tesaiot** | `tesaiot/models/`, `tesaiot/textures/`, … | Model Loader / API downloads + optional Tesaiot-side textures |

Logical web keys mirror disk segments (for example `free/models/…`, `tesaiot/models/…`, `tesaiot/textures/…`). VS Code helpers: **`getFreeGithubMirrorRootUri`** (`free/`), **`getModelDownloadsRootUri`** (`tesaiot/models/`), **`getTesaiotTexturesRootUri`** (`tesaiot/textures/`).

---

## Two physical trees (do not confuse them)

| Tree | Root on disk | Who writes | Typical use |
| ---- | -------------- | ---------- | ----------- |
| **Repo / dev bundle** | **`t3d-extension/src/assets/`** (`DEV_SRC_ASSETS_ROOT`) | Developers, build scripts, `npm run sync:*` | Shipped or mirrored content in the repo. **Vite dev:** repo keys under `src/assets/...` → **`/__extension_src_assets/...`**; pack keys (`tesaiot/…`, `free/…`) → **`/__ternion_user_*`** (same as browser; see [Assets location system](./ASSETS_LOCATION_SYSTEM.md) *Vite dev server*). |
| **Per-user storage** | **`<ExtensionContext.globalStorageUri>/assets/`** | Extension (Model Loader, free-pack sync), user via OS folder | Production downloads and GitHub **free** mirror; webview gets **`asWebviewUri`** bases from the host. |

Everything below is **under one of these two roots** (or the monorepo shared **`ternion-t3d/assets/**`** tree when present).

---

## Per-user storage (VS Code `globalStorage`)

**User assets bucket:**  
`<globalStorageUri>/assets/`  
Helper: **`getUserAssetsRootUri(context)`** in `src/extensionAssetPaths.ts`.

| Role | Directory (under `.../assets/`) | Helper (extension host) | Logical web prefix (catalog / messages) |
| ---- | --------------------------------- | ------------------------- | ---------------------------------------- |
| **Free GitHub pack mirror** | `free/` (contains `models/`, `textures/`, …) | `getFreeGithubMirrorRootUri` | e.g. `free/models/` (`FREE_MODELS_WEB_PREFIX`) |
| **Model Loader / API downloads** | `tesaiot/models/` | `getModelDownloadsRootUri` | `tesaiot/models/` (`TESAIOT_MODELS_WEB_PREFIX`) |
| **Tesaiot-side textures** | `tesaiot/textures/` | `getTesaiotTexturesRootUri` | `tesaiot/textures/` (`TESAIOT_TEXTURES_WEB_PREFIX`) |

**Breaking change:** `models/downloads/`, `free-github/`, `t3d-extension/downloads/models/`, and dev `src/assets/aiot/**` are no longer scanned — move content into **`tesaiot/models/`** and **`free/`**. The **model-downloader / free-sync bridge** (standalone browser) does not fall back to **`t3d-extension/src/assets`**; use monorepo **`ternion-t3d/assets/**`** or **`TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR`** / **`TERNION_BRIDGE_MODEL_DOWNLOADS_OUTPUT_DIR`** (see **`src/standaloneBridgeAssetLayout.ts`**).

**Constants:** `GLOBAL_STORAGE_ASSET_DIRS` in `src/assetLayout.ts`.

---

## Repo dev tree (`src/assets/`)

**Root:** `t3d-extension/src/assets/` (same as `DEV_SRC_ASSETS_PREFIX` = `src/assets/`).

| Area | Path (under `src/assets/`) | Constants | Notes |
| ---- | --------------------------- | --------- | ----- |
| **Free pack** | `free/models/`, `free/textures/`, … | `DEV_SRC_ASSET_DIRS.freeModels`, `freeTextures` | Mirrors public repo layout. |
| **Tesaiot pack** | `tesaiot/models/`, `tesaiot/textures/`, … | `DEV_SRC_ASSET_DIRS.tesaiotModels`, `tesaiotTextures` | Same segment names as **`globalStorage`** / monorepo. |
| **Bundled / mirrored models** | `models/**` | `MODEL_CATALOG_BUILD_GLOBS.mirroredModelsGlb` | e.g. `models/psoc-e84-ai/`; packaging may omit large GLBs (`.vscodeignore`). |
| **Cubemaps & textures (default tree)** | `textures/cubemap/<set>/` | — | JPEG faces; sync via `npm run sync:studio-cubemap-assets`. |

---

## Monorepo shared assets (`ternion-t3d/assets`)

When `t3d-extension` sits next to `ternion-t3d/assets/`, bridges and sync scripts read/write the **same pack paths** as production: **`assets/free/**`** and **`assets/tesaiot/**`** (see `src/assetMonorepoRoots.ts`).

---

## Browser static server (extension-hosted local app)

When the local web app maps user folders to HTTP (see `src/local-webapp-server.ts`):

| HTTP prefix | Maps to |
| ----------- | ------- |
| `/__ternion_user_models/` | globalStorage `.../assets/tesaiot/models` |
| `/__ternion_user_free/` | globalStorage `.../assets/free` |
| `/__ternion_user_tesaiot_textures/` | globalStorage `.../assets/tesaiot/textures` |

Constants: `BROWSER_USER_MODELS_HTTP_PATH_PREFIX`, `BROWSER_USER_FREE_HTTP_PATH_PREFIX`, `BROWSER_USER_TESAIOT_TEXTURES_HTTP_PATH_PREFIX` in `src/assetLayout.ts`.

---

## Webview URL bases (not directories — but tied to the above)

The host injects **`window.LOCAL_ASSETS_BASE_URI`**, **`window.FREE_ASSETS_BASE_URI`**, **`window.TESAIOT_TEXTURES_BASE_URI`**, **`window.ONLINE_ASSETS_BASE_URI`**. Logical paths such as `textures/cubemap/Yokohama/posx.jpg` or `tesaiot/textures/...` are turned into fetchable URLs by **`resolveWebviewModelAssetUrl`** and **`resolveTesaiotTexturesToFetchableUrl`** (`src/webview/logical-asset-url.ts`), **not** by concatenating disk paths in UI code.

**Online free pack:** `ONLINE_ASSETS_BASE_URI` defaults to `.../ternion-3d-assets-free/main/assets` — see **[Online assets repo](./ASSETS_ONLINE_REPO.md)**.

Details: [Assets location system](./ASSETS_LOCATION_SYSTEM.md).

---

## Related source files

| File | Purpose |
| ---- | ------- |
| `src/assetLayout.ts` | Segment constants, dev roots, web prefixes, catalog glob patterns. |
| `src/extensionAssetPaths.ts` | `vscode.Uri` helpers under `globalStorage/.../assets/`. |
| `src/model-downloader/bridgeDefaultPaths.ts` | Bridge process absolute roots (activation). |
| `src/local-webapp-server.ts` | Browser HTTP mapping for `__ternion_user_*`. |
| `src/webview/bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.ts` | **`resolveWebviewModelAssetUrl`** — runtime URL resolution. |

---

## Asset Manager module (product UI)

Orchestration and operator UX live under **`src/webview/assets-manager/`**; it **must not** redefine the directory table above — it links here and calls host / resolver contracts. Design notes: [Asset Manager architecture](../src/webview/assets-manager/docs/ASSET_MANAGER_ARCHITECTURE.md).

**Planned UI:** [Global Directories panel design](./GLOBAL_DIRECTORIES_PANEL_DESIGN.md) — read-first panel aligned with this document (bands, components, host reveal contract).
