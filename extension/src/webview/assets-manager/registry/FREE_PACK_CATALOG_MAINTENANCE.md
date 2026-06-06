# When the GitHub free pack changes

The public repo **[ternion-3d-assets-free](https://github.com/drsanti/ternion-3d-assets-free)** is a **living** art pack. Artists and maintainers will **add, remove, and replace** models, cubemaps, HDRI, images, and other assets over time.

Bitstream Studio separates two concerns:

| Layer | Role | Changes when |
| ----- | ---- | ------------ |
| **Upstream (GitHub)** | Authoritative bytes and folder layout under `assets/` | Artists publish to the free repo |
| **Studio catalog (this extension)** | Which pack entries Bitstream **ships, lists, and syncs by default** | Maintainers run sync scripts and commit JSON |

Do **not** hardcode model folder names in TypeScript for sync policy. Runtime filtering reads **`free-pack-model-ids.v1.json`**. Retirements that still exist on GitHub use **`free-pack-model-exclusions.v1.json`** (applied by the sync script, not at download time alone).

---

## Models

**New model on GitHub**

1. Artist adds folder + GLB under `assets/models/<id>/` and updates upstream `assets/models/manifest.json`.
2. Maintainer: `npm run sync:studio-manifest-models` — pulls upstream ids, applies exclusions, updates `free-pack-model-ids.v1.json` and `studio-asset-manifest.v1.json` model rows.
3. Edit labels/summary in the sync script’s `modelRow` map if needed (until **`studio-catalog.overrides.json`** lands — see implementation plan).
4. Commit registry JSON; users re-sync via **Sync Free Pack to Disk** or Free Loader.

**Retired model (still on GitHub or removed upstream)**

1. Add folder id to **`free-pack-model-exclusions.v1.json`** (if upstream still lists it).
2. Run `npm run sync:studio-manifest-models` and commit.
3. Add or update save migration if old graphs referenced the asset (e.g. **`migrate-legacy-pack-model.ts`**).
4. Optional: remove from upstream `models/manifest.json` on GitHub when the art pack is cleaned.

**Full-pack sync behavior:** `syncTernionFreeAssets` downloads **only** model folders in `free-pack-model-ids.v1.json`. Selective sync (`onlyRepoPaths`) is unchanged.

---

## Textures, cubemaps, HDRI, images, feeds

These follow **upstream manifest JSON** at listing time (GitHub tree API or raw-manifest fallback). When artists add cubemap sets or HDRI entries:

1. Maintainer: `npm run sync:studio-manifest-textures` (and optional `sync:studio-cubemap-assets` for dev bundle).
2. Commit updated **`studio-asset-manifest.v1.json`** / id-list caches.
3. Full pack sync pulls new texture paths automatically on the next user sync (no model-style allowlist).

---

## End users

- **VSIX:** **Sync Free Pack to Disk** or Free Loader — no terminal.
- **Maintainers (dev repo):** `npm run sync:free-pack-storage`, `check:free-pack-storage`, diagnose command.

See **`extension/docs/ASSETS_ONLINE_REPO.md`** and **`extension/docs/MANAGING_DOWNLOADED_ASSETS.md`**.

---

## Future (catalog v2)

Unified **`sync:studio-pack-catalog`** + **`studio-catalog.overrides.json`** will replace hand-maintained label maps in the sync script. Until then, use the workflow above.

**Plan:** [`../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md`](../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md)
