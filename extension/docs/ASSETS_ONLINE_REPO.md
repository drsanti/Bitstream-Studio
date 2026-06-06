# Online assets — `ternion-3d-assets-free` (canonical reference)

**Status:** canonical for Bitstream Studio and all extension online-asset work.  
**Repo:** [github.com/drsanti/ternion-3d-assets-free](https://github.com/drsanti/ternion-3d-assets-free)

This document answers: **which GitHub path is the asset root**, how URLs are built, how sync maps GitHub → local disk, and how this repo relates to **Node Animator** (separate consumer).

**Related (local disk / webview):** [Global asset directories](./GLOBAL_ASSET_DIRECTORIES.md), [Assets location system](./ASSETS_LOCATION_SYSTEM.md), [Asset storage diagram](./ASSET_STORAGE_DIAGRAM.md), [Asset Manager architecture](../src/webview/assets-manager/docs/ASSET_MANAGER_ARCHITECTURE.md).

---

## One-line rule (memorize this)

```text
Online base = https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets
              └─ NOT repo root .../main/  (no trailing path segment = wrong for Bitstream)
```

| Question | Answer |
| -------- | ------ |
| GitHub folder to browse | [`tree/main/assets`](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets) |
| Raw URL base (`ONLINE_ASSETS_BASE_URI`) | `.../main/assets` |
| Repo root (`tree/main`) | **Not** the Bitstream asset base — legacy duplicates may exist there; ignore for new work |

---

## Canonical tree on GitHub

All **new** models, textures, manifests, and feeds live under **`assets/`** on branch **`main`**:

```text
ternion-3d-assets-free/
└── assets/                                    ← ONLINE ROOT (Bitstream + Free Loader sync)
    ├── feed.json                              ← Node Animator sync entry (not used by Bitstream)
    ├── studio-asset-manifest.v1.json          ← Sensor Studio / Asset Browser overlay
    ├── models/
    │   ├── manifest.json                      ← Node Animator model list (array of folder ids)
    │   └── <model-id>/
    │       └── <model-id>.glb
    ├── textures/
    │   └── cubemap/
    │       ├── manifest.json
    │       └── <cubemap-id>/                  ← six faces (posx.jpg, …)
    └── libraries/
        └── node-graph/                        ← Node Animator graph presets
            ├── index.json
            └── *.trn-node-asset.json
```

### Deprecated / do not use (repo root)

These may still exist on GitHub for historical reasons. **Bitstream Studio never references them:**

| Path at repo root | Status |
| ----------------- | ------ |
| `models/` | Legacy duplicate — use `assets/models/` |
| `textures/cubemap/` | Legacy duplicate — use `assets/textures/cubemap/` |
| `studio-asset-manifest.v1.json` | Legacy duplicate — use `assets/studio-asset-manifest.v1.json` |

**Cleanup goal:** delete root duplicates after Node Animator and Bitstream smoke tests pass against **`assets/`** only.

**Status:** Removed on GitHub **`2026-05-31`** ([commit `b2cc826`](https://github.com/drsanti/ternion-3d-assets-free/commit/b2cc826)); see upstream [`docs/LAYOUT.md`](https://github.com/drsanti/ternion-3d-assets-free/blob/main/docs/LAYOUT.md).

---

## How Bitstream Studio builds fetch URLs

### 1. Injected base URI

Host and webview default:

| Constant / window global | Default value |
| ------------------------ | ------------- |
| `GlobalConfig.ONLINE_ASSETS_BASE_URI` | `https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets` |
| `window.ONLINE_ASSETS_BASE_URI` | Same (injected in VS Code webview; overridable in Asset Manager) |
| Asset Manager preset **Free** | Same (`asset-presets.ts` → `ASSET_SOURCE_FREE`) |

User override: Asset Manager **Custom** base or `ternion-base-url` in globalState — still should end with **`/assets`** if mirroring the free pack layout.

### 2. Relative paths (no `assets/` prefix)

Manifest rows and catalog keys use paths **relative to the online base**:

```text
models/psoc-e84-ai/psoc-e84-ai.glb
textures/cubemap/Yokohama/posx.jpg
```

Full URL:

```text
{ONLINE_ASSETS_BASE_URI}/{relativePath}
→ .../main/assets/models/psoc-e84-ai/psoc-e84-ai.glb
```

Implementation: `resolveWebviewPackAssetOnlineUrl` in `global-directory-online-fallback.ts`, `resolveWebviewModelAssetUrl`, `joinAssetBase`.

### 3. Sensor Studio manifest

| Item | URL |
| ---- | --- |
| Default remote manifest | `{ONLINE_ASSETS_BASE_URI}/studio-asset-manifest.v1.json` |
| Override | `window.STUDIO_ASSET_MANIFEST_URL` (full URL) |
| Bundled fallback | `src/webview/assets-manager/registry/studio-asset-manifest.v1.json` |
| Manifest redesign (next phase) | [`STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md`](../src/webview/assets-manager/docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md) |
| Publish target (GitHub) | `assets/studio-asset-manifest.v1.json` on `main` |

```bash
cd extension
export GITHUB_TOKEN=ghp_...
npm run publish:studio-asset-manifest
```

### 4. Connection test file

Asset Manager uses this probe path (must exist on the remote tree):

```text
textures/cubemap/Yokohama/readme.txt
```

→ `.../main/assets/textures/cubemap/Yokohama/readme.txt`  
Constant: `ASSET_CONNECTION_TEST_REL_PATH` in `asset-presets.ts`.

---

## GitHub → local disk (Free Loader sync)

`syncTernionFreeAssets` (`src/asset-sync/syncTernionFreeAssets.ts`):

1. Lists **all Git blobs** where repo path starts with **`assets/`**.
2. Downloads each blob from `raw.githubusercontent.com/.../main/{repoPath}`.
3. Writes to local output with the **`assets/` prefix stripped**.

| GitHub repo path | Local path (under output root) |
| ---------------- | ------------------------------ |
| `assets/models/foo/foo.glb` | `models/foo/foo.glb` |
| `assets/textures/cubemap/Yokohama/posx.jpg` | `textures/cubemap/Yokohama/posx.jpg` |

Typical output roots:

| Runtime | Output root |
| ------- | ----------- |
| VS Code `globalStorage` | `.../assets/free/` |
| Monorepo bridge | `ternion-t3d/assets/free/` (when configured) |

So **local `free/models/...`** mirrors **`assets/models/...`** on GitHub — not `main/models/...`.

### Studio catalog vs upstream `models/manifest.json`

The GitHub free pack is **living** — artists add and remove assets over time. Bitstream does **not** mirror every upstream model folder automatically.

| | Upstream GitHub | Studio (Bitstream) |
| --- | --- | --- |
| **Models** | `assets/models/manifest.json` (changes with art pack) | **`free-pack-model-ids.v1.json`** — refreshed via **`npm run sync:studio-manifest-models`**; minus **`free-pack-model-exclusions.v1.json`** |
| **Textures / HDRI / cubemaps** | Upstream manifest JSON | Refreshed via **`sync:studio-manifest-textures`**; full sync lists from upstream at download time |

**Maintainer workflow when the pack changes:** [`src/webview/assets-manager/registry/FREE_PACK_CATALOG_MAINTENANCE.md`](../src/webview/assets-manager/registry/FREE_PACK_CATALOG_MAINTENANCE.md).

**Full-pack sync** filters model blobs to the studio id list (`studioFreePackCatalog.ts`). Legacy flows that referenced retired models (e.g. **`robot-4th-project`**) migrate via **`migrate-legacy-pack-model.ts`**. Cleaning upstream GitHub is optional when exclusions + studio catalog already omit the folder.

### Listing when GitHub API is rate-limited

`syncTernionFreeAssets` tries the GitHub **tree API** first, then falls back to **`freeAssetIndexFromRawManifests.ts`** (public **`raw.githubusercontent.com`** manifest JSON). End users do **not** need a maintainer **`GITHUB_TOKEN`**.

---

## Consumers at a glance

| Tool | GitHub scope | Entry mechanism |
| ---- | ------------ | ----------------- |
| **Bitstream Studio** | `main/assets/**` | `ONLINE_ASSETS_BASE_URI` + relative paths; optional manifest overlay |
| **Sensor Studio Asset Browser** | `assets/studio-asset-manifest.v1.json` + pack paths | `loadAssetManifestOverlay` |
| **Free Loader / bridge** | Studio-aligned blobs under `assets/` (nine models + textures/feeds) | `syncTernionFreeAssets` + **`studioFreePackCatalog.ts`** |
| **Dev cubemap bundle** | `assets/textures/cubemap/...` | `npm run sync:studio-cubemap-assets` |
| **Node Animator** (external) | `assets/feed.json` + child manifests | `npm run download:feeds` — see [ternion-3d-assets-free README](https://github.com/drsanti/ternion-3d-assets-free) |

Bitstream **does not** read `feed.json`. Node Animator **does not** use `ONLINE_ASSETS_BASE_URI` — both share the same **on-disk layout** under `assets/` on GitHub.

---

## Other GitHub remotes (not the free pack)

| Repo | Raw base | Used for |
| ---- | -------- | -------- |
| **`ternion-3d-assets-free`** | `.../main/assets` | Free pack (default online) |
| **`ternion-3d-assets`** | `.../main` (repo root) | Asset Manager preset **Full** — separate product tree |

Do not point the **Free** preset at repo root of `ternion-3d-assets-free`.

---

## Maintainer checklist — publish to GitHub

Use **`assets/`** only:

| Step | Action |
| ---- | ------ |
| 1 | Add or update files under **`assets/models/`**, **`assets/textures/`**, etc. |
| 2 | Update the relevant **`manifest.json`** or **`libraries/.../index.json`** |
| 3 | When **models** change: **`npm run sync:studio-manifest-models`** ([`assets/models/manifest.json`](https://github.com/drsanti/ternion-3d-assets-free/blob/main/assets/models/manifest.json)) |
| 3b | When **textures** change: **`npm run sync:studio-manifest-textures`** ([`assets/textures`](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures) — `cubemap/`, `hdri/`, `images/` manifests), then **`npm run sync:studio-cubemap-assets`** for local JPEG mirrors |
| 4 | Publish bundled catalog: **`npm run publish:studio-asset-manifest`** |
| 4 | For Node Animator: bump **`revision`** in **`assets/feed.json`** (ISO-8601 timestamp) |
| 5 | Commit and push to **`main`** |
| 6 | Verify: Free Loader sync, Asset Manager connection test, Sensor Studio Asset Browser refresh |

### Verify from Bitstream Studio

```bash
# Extension dev
cd extension
npm run sync:studio-cubemap-assets   # optional — refresh bundled cubemap JPEGs
npm run start:bridge
npm run dev:webview
```

In UI: **Asset Manager → Global Directories → Runtime** — confirm **ONLINE** base ends with `/assets`. **Actions →** sync free pack if testing offline mirror.

---

## Suggested README fix (upstream repo)

Paste or adapt this block into [ternion-3d-assets-free/README.md](https://github.com/drsanti/ternion-3d-assets-free/blob/main/README.md) when cleaning up:

```markdown
## Canonical paths

| Role | URL |
|------|-----|
| **GitHub browse** | https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets |
| **Raw base (Bitstream Studio, Free Loader)** | https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets |
| **Node Animator feed** | https://raw.githubusercontent.com/drsanti/ternion-3d-assets-free/main/assets/feed.json |

All new assets go under **`assets/`**. Files at the **repository root** (`models/`, `textures/`, root manifest) are **legacy** — do not add new content there.
```

---

## Source map (Bitstream Studio code)

| File | Role |
| ---- | ---- |
| `src/GlobalConfig.ts` | Default `ONLINE_ASSETS_BASE_URI` |
| `src/webview/assets-manager/store/asset-presets.ts` | Free / Full presets, connection test path |
| `src/webview/assets-manager/registry/asset-manifest.ts` | Manifest URL resolution + merge |
| `src/webview/assets-manager/registry/studio-asset-manifest.v1.json` | Bundled descriptor list |
| `src/webview/asset-resolution/global-directory-online-fallback.ts` | `ONLINE + relativePath` |
| `src/asset-sync/syncTernionFreeAssets.ts` | GitHub `assets/` tree → local mirror |
| `src/asset-sync/freeAssetIndexFromRawManifests.ts` | Raw manifest path list (API rate-limit fallback) |
| `src/asset-sync/diagnoseFreePackStorageReport.ts` | globalStorage diagnosis report |
| `src/commands/diagnoseFreePackStorageCommand.ts` | VS Code: Diagnose Free Pack on Disk |
| `scripts/publish-studio-asset-manifest.mjs` | Upload manifest to `assets/studio-asset-manifest.v1.json` |
| `scripts/sync-studio-cubemap-assets.mjs` | Pull cubemap JPEGs from `.../main/assets` |
| `src/panels/TernionDigitalTwin.ts` | Injects `window.ONLINE_ASSETS_BASE_URI` into webview HTML |

When adding a feature that loads remote GLBs, cubemaps, or manifests: **start from this doc**, then [Assets location system](./ASSETS_LOCATION_SYSTEM.md) for local vs online strategy.

---

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-06-04** | Document raw-manifest API fallback; studio vs upstream model list (`robot-4th-project` retired in Bitstream); maintainer CLI + VSIX diagnose command. |
| **2026-05-31** | Initial doc — clarify `main/assets` vs repo root; consumer matrix; cleanup guidance. |
