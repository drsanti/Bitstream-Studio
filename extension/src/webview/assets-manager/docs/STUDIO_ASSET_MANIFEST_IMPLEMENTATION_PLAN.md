# Studio pack resource catalog — implementation plan

**Status:** v1 **interim** (split JSON + sync scripts + remote overlay); **next phase = redesign** unified **resource management** for models, environments, and textures.  
**Related:** [Asset Manager architecture](./ASSET_MANAGER_ARCHITECTURE.md), [Assets online repo](../../../../docs/ASSETS_ONLINE_REPO.md), [Global asset directories](../../../../docs/GLOBAL_ASSET_DIRECTORIES.md), [Asset Browser tracker](../../../../docs/DEVELOPMENT_TRACKER.md) (_Planned / next → Pack resource catalog redesign_)

---

## Objective

Replace the current **three-file + three-script** pack catalog with a **single, validated resource contract**: stable **`id`** refs in flows, manifest-owned **defaults**, discoverability (tags / thumbnails / groups), and one **sync → bundle → publish** pipeline aligned with [ternion-3d-assets-free](https://github.com/drsanti/ternion-3d-assets-free) (`assets/models`, `assets/textures/{cubemap,hdri,images}`).

---

## Future plan — resource management redesign (target architecture)

The files below are **good enough for v0.1** but are **not** the long-term model. Treat them as generated or derived artifacts until the redesign lands.

### Interim files (today — do not extend by hand)

| File | Role today | Problem |
| ---- | ---------- | ------- |
| [`studio-asset-manifest.v1.json`](../registry/studio-asset-manifest.v1.json) | Bundled **merged** catalog (`assets[]` + `defaults`); remote overlay by `id` | Becomes a **build output** — easy to drift if models/textures synced separately |
| [`free-pack-model-ids.v1.json`](../registry/free-pack-model-ids.v1.json) | Cache of upstream `assets/models/manifest.json` | Duplicate truth; must match manifest model rows manually |
| [`free-pack-cubemap-ids.v1.json`](../registry/free-pack-cubemap-ids.v1.json) | Cache of upstream `assets/textures/cubemap/manifest.json` | HDRI / **images** have no sibling id file — only full manifest rows |
| [`default-studio-pack-model.ts`](../registry/default-studio-pack-model.ts) | TS duplicate of `defaults.packModelId` | Third source of default model truth |

### Interim sync scripts (today)

| Script | Writes |
| ------ | ------ |
| `npm run sync:studio-manifest-models` | model rows + `free-pack-model-ids.v1.json` |
| `npm run sync:studio-manifest-textures` | env + texture rows + `free-pack-cubemap-ids.v1.json` |
| `npm run sync:studio-cubemap-assets` | JPEG bytes under `src/assets/textures/cubemap/` (not manifest) |
| `npm run publish:studio-asset-manifest` | Upload bundled JSON to free repo |

**Risk:** running only one sync leaves catalog **half-updated**; reviewers must diff a large monolithic JSON.

### Target approach (better — planned M1–M2)

```text
ternion-3d-assets-free (authoritative per category)
  assets/models/manifest.json
  assets/textures/cubemap/manifest.json
  assets/textures/hdri/manifest.json
  assets/textures/images/manifest.json
        │
        ▼  npm run sync:studio-pack-catalog  (single entry)
  extension/src/webview/assets-manager/registry/
    pack-index/                    ← optional: mirrored upstream JSON (generated, gitignored or committed)
    studio-catalog.overrides.json  ← human: labels, tags, defaults, deprecated, replacedById
        │
        ▼  npm run build:studio-catalog
  studio-asset-manifest.v2.json    ← bundled runtime catalog (generated)
        │
        ▼  publish + webview merge
  StudioAssetDescriptorsProvider + resolveAsset (unchanged resolver rules)
```

**Design goals for the redesign:**

1. **One command** refreshes all pack categories (models + cubemap + HDRI + images) from upstream manifests.
2. **Separate concerns** — upstream **index** vs studio **overrides** vs **built** consumer manifest (no hand-editing merged `assets[]`).
3. **Deprecate** committed `free-pack-model-ids.v1.json` / `free-pack-cubemap-ids.v1.json` as sources of truth (replace with generated `pack-index/` or inline fetch at build time).
4. **Schema v2** — typed sections or unified `assets[]` with JSON Schema + CI (`validate:studio-catalog`).
5. **Defaults block** is authoritative — remove `default-studio-pack-model.ts` and demo hardcodes (M3).
6. **Asset Manager** owns operator story: sync status, last upstream SHA, missing bytes on disk vs online fallback (ties to [Global Directories](../../../../docs/GLOBAL_ASSET_DIRECTORIES.md)).
7. **Model Catalog scan** remains a **separate merge lane** (downloaded / workspace GLBs), not mixed into pack-index generation.

**Non-goals:** changing `resolveWebviewModelAssetUrl` path rules; moving bytes out of `globalStorage` / free-pack mirror layout.

### Migration from v1 trio → v2 pipeline

| Step | Action |
| ---- | ------ |
| 1 | M0 audit: list every import of the three JSON files and both sync scripts |
| 2 | M1: schema + `studio-catalog.overrides.json` seed from current manifest labels/defaults |
| 3 | M2: `sync:studio-pack-catalog` replaces `sync:studio-manifest-models` + `sync:studio-manifest-textures` (keep old scripts as thin aliases one release) |
| 4 | M3: runtime reads v2; v1 parser retained for one cycle |
| 5 | M5: delete `free-pack-*-ids.v1.json` from repo (or move to `pack-index/` generated only) |

---

## Objective (manifest contract)

Evolve the **built catalog** from a hand-merged flat list into a **maintainable contract**: stable **`id`** refs in flows, clear **defaults**, discoverability (search/tags/thumbnails), and one **publish + merge** story with the free asset pack and Model Catalog scan.

---

## Current state (v1 — interim)

| Piece | Behavior |
| ----- | -------- |
| **Pack models (2026-06-03)** | Nine folders from [free repo `assets/models`](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/models) (`manifest.json`; **`robot-4th-project` removed**); **`npm run sync:studio-manifest-models`**. |
| **Pack textures (2026-06-03)** | [Cubemap](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures/cubemap) (10 sets), [HDRI](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures/hdri) (10), [images](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures/images) (6 library entries); **`npm run sync:studio-manifest-textures`**. |
| **Bundled JSON** | Flat `assets[]` rows: `id`, `category`, `source`, `label`, `summary`, plus `relativePath` / `cubemapSetId` / `externalUrl` / `onlineFallbackUrl` |
| **`defaults.packModelId`** | `model.psoc-e84.default` (informational until M3 runtime reads it) |
| **Remote overlay** | Fetch `{ONLINE_ASSETS_BASE_URI}/studio-asset-manifest.v1.json` (or `window.STUDIO_ASSET_MANIFEST_URL`); merge by **`id`** (remote wins) |
| **Publish** | `npm run publish:studio-asset-manifest` → `ternion-3d-assets-free` `assets/studio-asset-manifest.v1.json` |
| **Consumers** | Asset Browser, Node Inspector model picker, rotation preview descriptors, Sensor Studio demo templates |
| **Pack default model** | [`default-studio-pack-model.ts`](../registry/default-studio-pack-model.ts) — must stay aligned with manifest row **`model.psoc-e84.default`** until manifest owns **`defaults`** |

### Known limitations (why redesign next phase)

- **Hand-maintained** list drifts from disk (`models/**`, cubemap folders) and from Model Catalog scan.
- **No manifest-level defaults** — demo templates and `default-studio-pack-model.ts` duplicate the “canonical pack GLB” outside JSON.
- **Inconsistent row shapes** — models use `relativePath`; environments use `cubemapSetId`; textures use face paths; optional mirrors (`model.psoc-e84.online-mirror`) are ad hoc.
- **Weak metadata** — no tags, preview thumbnail, semver per asset, license, or “recommended for” (Stage / rotation / Animation Lab).
- **No validation** — invalid JSON or orphan `id`s are caught only at runtime (404 previews).
- **Asset Browser roadmap** (search, MRU, unified Models/Environments/Textures) needs a **richer index**, not only curated rows.

---

## Design principles (next phase)

1. **Persist `id`, resolve URL at runtime** — unchanged; flows and `scene3d.model.studioAssetId` must not store environment-specific URLs.
2. **No second resolver** — manifest describes **logical** assets; **`resolveWebviewModelAssetUrl`** / **`resolveAsset`** stay authoritative for bytes.
3. **Defaults live in catalog** — e.g. `defaults.packModelId`, `defaults.environmentId`; codegen or CI checks that [`default-studio-pack-model.ts`](../registry/default-studio-pack-model.ts) matches (or delete the TS file in favor of manifest-only).
4. **Bundled + remote + optional generated slice** — curated overrides on top of scan/index where needed (same merge-by-`id` idea as today).

---

## Phased implementation plan

### Phase M0 — Audit and contract (read-only)

- [ ] Inventory all **`studio-asset-manifest`** / **`AssetDescriptor`** consumers (Sensor Studio, Bitstream rotation, Animation Lab, Free pack, publish script).
- [ ] Document merge order: bundled → remote → (future) downloaded index.
- [ ] List every **hardcoded** `relativePath` / asset `id` outside manifest (demo templates, rotation constants, tests).

**Exit:** checklist in this doc’s appendix; no schema change.

### Phase M1 — Schema v2 design

- [ ] Draft **`studio-asset-manifest.v2.json`** shape (or version field inside v1 file with migration):
  - **`version`**, **`defaults`** (role → `id`: `packModel`, `packEnvironment`, …)
  - **`assets[]`** extensions: `tags[]`, `thumbnailRelativePath`, `deprecated`, `replacedById`, `capabilities` (e.g. `hasAnimations`, `recommendedFor: ["stage", "rotation"]`)
  - Optional **`groups`** / **`collections`** for Asset Browser side nav
- [ ] JSON Schema + `npm run validate:studio-asset-manifest` (CI gate).
- [ ] Publish script supports v2 path on free repo (keep v1 URL until cutover).

**Exit:** approved schema doc + sample v2 file (can ship empty `assets` beside v1 during transition).

### Phase M2 — Generation and pack sync (unified resource pipeline)

- [ ] **`sync:studio-pack-catalog`** — fetch all upstream category manifests ([models](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/models), [textures](https://github.com/drsanti/ternion-3d-assets-free/tree/main/assets/textures)); emit normalized rows.
- [ ] **`studio-catalog.overrides.json`** — human edits only (labels, tags, `defaults`, deprecations); **stop** hand-editing merged [`studio-asset-manifest.v1.json`](../registry/studio-asset-manifest.v1.json).
- [ ] **`build:studio-catalog`** → **`studio-asset-manifest.v2.json`** (generated bundled artifact).
- [ ] Retire committed [`free-pack-model-ids.v1.json`](../registry/free-pack-model-ids.v1.json) / [`free-pack-cubemap-ids.v1.json`](../registry/free-pack-cubemap-ids.v1.json) as manual sources (generated cache or dropped).
- [ ] Keep **`sync:studio-cubemap-assets`** for **bytes** only; driven by built catalog paths.
- [ ] CI: built manifest matches upstream indexes + overrides; optional local scan of `src/assets/**` for missing mirrors.

**Exit:** one command refreshes the full pack catalog; PR shows diff on overrides + generated v2 only.

### Phase M3 — Runtime merge and migration

- [ ] Parser accepts v1 and v2; normalize to internal **`AssetDescriptor`** (+ new fields on type).
- [ ] **`loadAssetManifestOverlay`**: v2 remote preferred when `version >= 2`.
- [ ] Migrate persisted flows: optional CLI/webview “rewrite `selectedModelUrl` → `selectedStudioAssetId` only”.
- [ ] Replace **`default-studio-pack-model.ts`** with manifest **`defaults.packModelId`** (+ resolver helper `getDefaultPackModelDescriptor()`).

**Exit:** Sensor Studio boot demos read defaults from manifest; no duplicate path constants.

### Phase M4 — Asset Browser and operator UX

- [ ] Unified library uses manifest v2 metadata (tags, thumbnails, defaults section in UI).
- [ ] “Missing asset” diagnostics reference manifest `id` + resolver strategy (Asset Manager **Browse** tab).
- [ ] Deprecate empty **`STUDIO_ASSET_CATALOG`** remnants; single provider path.

**Exit:** operators pick assets from Browser without knowing `models/...` paths.

### Phase M5 — Cutover and cleanup

- [ ] Publish v2 to `ternion-3d-assets-free`; bump bundled file; document in **`ASSETS_ONLINE_REPO.md`**.
- [ ] Remove v1 publish path after one release cycle (or dual-publish with warning).
- [ ] Tracker + **`ASSET_MANAGER_ARCHITECTURE.md`** phased table updated.

---

## Dependencies and ordering

| Depends on | Notes |
| ---------- | ----- |
| **Asset Manager P0–P1** | Hooks + shell; Browse tab consumes manifest v2 |
| **Asset Browser (tracker)** | Unified Models/Environments/Textures picker |
| **Global Directories panel** | Explains *where* bytes live; manifest explains *what* is cataloged |

**Can proceed in parallel:** M0 + M1 while Asset Manager P0 ships; M2–M3 before Asset Browser “full library” milestone.

---

## Success criteria (next phase complete)

- **Single sync/build pipeline** replaces the v1 trio (`studio-asset-manifest.v1.json` + `free-pack-model-ids.v1.json` + `free-pack-cubemap-ids.v1.json`) and split npm scripts.
- One **defaults** block in the built catalog; demo templates and Stage bootstrap read **`defaults.*`** only (no `default-studio-pack-model.ts`).
- CI validates catalog against schema and upstream pack manifests.
- Remote + bundled merge unchanged for operators (refresh / publish documented).
- Asset Browser lists models/environments/textures from the same descriptor list with search/tags.

---

## Appendix — maintain until M3

| Constant / file | Must match manifest row |
| --------------- | ------------------------ |
| [`default-studio-pack-model.ts`](../registry/default-studio-pack-model.ts) | `model.psoc-e84.default` → `models/psoc-e84-ai/psoc-e84-ai.glb` |
| `rotationPreviewConstants.ts` `PSOC_E84_GLB_RELATIVE_PATH` | Same path (Bitstream rotation; converge in M3) |
| `runDemoTemplate` in `flow-editor.store.ts` | Uses `DEFAULT_STUDIO_PACK_MODEL_*` until M3 |

When editing **`studio-asset-manifest.v1.json`** until M2 ships: run **`sync:studio-manifest-models`** and **`sync:studio-manifest-textures`** together (do not edit model/env rows by hand). Update **`default-studio-pack-model.ts`** when `defaults.packModelId` changes.

**Until redesign:** the three JSON files are **interim** — see _Future plan — resource management redesign_ above.
