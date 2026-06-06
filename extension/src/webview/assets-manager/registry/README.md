# Asset registry (interim layout)

**Status:** v1 interim — **redesign planned** for unified pack resource management.

| File | Purpose |
| ---- | ------- |
| `studio-asset-manifest.v1.json` | Bundled catalog consumed by the webview (merged models + environments + textures). |
| `free-pack-model-ids.v1.json` | **Studio-supported** model folder ids (refreshed from upstream; drives sync + Asset Browser). |
| `free-pack-model-exclusions.v1.json` | Upstream model folder ids to **omit** when refreshing the studio list (retired art still on GitHub). |
| `free-pack-cubemap-ids.v1.json` | Cached upstream `assets/textures/cubemap/manifest.json` (sync script output). |

**When artists change the GitHub free pack:** see **[`FREE_PACK_CATALOG_MAINTENANCE.md`](./FREE_PACK_CATALOG_MAINTENANCE.md)** — living upstream vs studio catalog, add/remove workflow.

Do **not** treat these three files as the long-term architecture. Future work consolidates them under one **`sync:studio-pack-catalog`** + generated manifest v2.

**Implementation plan:** [`../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md`](../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md) — section *Future plan — resource management redesign*.

**Maintainer (until redesign):**

```bash
npm run sync:studio-manifest-models
npm run sync:studio-manifest-textures
# optional: npm run sync:studio-cubemap-assets
# optional: npm run publish:studio-asset-manifest
# globalStorage free pack (dev repo): npm run check:free-pack-storage | sync:free-pack-storage
```

After upstream model changes: run **`sync:studio-manifest-models`**, review diff, commit registry JSON. Adjust **`free-pack-model-exclusions.v1.json`** when retiring models that remain on GitHub temporarily.
