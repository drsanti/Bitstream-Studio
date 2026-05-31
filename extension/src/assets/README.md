# Extension assets (repo tree)

Large **models and textures are not listed from this folder** in the webview catalog when `REPO_ASSET_STATIC_SCAN_ENABLED` is `false` in `src/assetLayout.ts` (default). The Asset Manager and Model Catalog read from **VS Code `globalStorage/…/assets/`** (free pack, Model Loader downloads, synced textures).

## What belongs here

| Path | Role |
|------|------|
| `sounds/`, WASM, small bundled payloads | Shipped or referenced by the extension build |
| `models/`, `free/`, `tesaiot/` (legacy dev mirrors) | **Optional local copies only** — safe to remove after free-pack sync into globalStorage |

## Operator workflow

1. Open **Asset Manager → Storage → Actions → Free loader** and sync the free pack into `globalStorage …/assets/free`.
2. Model Loader writes to `globalStorage …/assets/tesaiot/models`.
3. VSIX builds omit heavy GLBs via `.vscodeignore` (`out/webview/assets/models/**`).

See `extension/docs/ASSETS_LOCATION_SYSTEM.md` and `extension/docs/MANAGING_DOWNLOADED_ASSETS.md`.
