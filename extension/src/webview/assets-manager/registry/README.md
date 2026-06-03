# Asset registry (interim layout)

**Status:** v1 interim — **redesign planned** for unified pack resource management.

| File | Purpose |
| ---- | ------- |
| `studio-asset-manifest.v1.json` | Bundled catalog consumed by the webview (merged models + environments + textures). |
| `free-pack-model-ids.v1.json` | Cached upstream `assets/models/manifest.json` (sync script output). |
| `free-pack-cubemap-ids.v1.json` | Cached upstream `assets/textures/cubemap/manifest.json` (sync script output). |

Do **not** treat these three files as the long-term architecture. Future work consolidates them under one **`sync:studio-pack-catalog`** + generated manifest v2.

**Implementation plan:** [`../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md`](../docs/STUDIO_ASSET_MANIFEST_IMPLEMENTATION_PLAN.md) — section *Future plan — resource management redesign*.

**Maintainer (until redesign):**

```bash
npm run sync:studio-manifest-models
npm run sync:studio-manifest-textures
# optional: npm run sync:studio-cubemap-assets
# optional: npm run publish:studio-asset-manifest
```
