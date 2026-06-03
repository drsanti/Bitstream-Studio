# TERNION free pack loader (Free Loader)

Modern **TRNWindow** UI for syncing the **TERNION free asset pack** from the online catalog into per-user extension storage, and browsing files already on disk.

## Entry points

- **Asset Manager** → **Free Loader** (opens `FreeAssetsLoaderDashboard`)
- Dev: `http://localhost:5173/?app=bitstream` with bridge running for browser mode

## Shell (`TRNWindow`)

| Setting | Value |
|--------|--------|
| Storage key | `ternion:free-assets-loader:window` (`FREE_ASSETS_LOADER_WINDOW_STORAGE_KEY`) |
| Resize | `resizeEdges="all"` (edges + corners) |
| Glass | `medium` preset |
| Maximize | Header control (replaces legacy full-screen overlay fill) |

Initial geometry: ~88% viewport, centered (`computeInitialFreeAssetsLoaderRect`).

## Layout (top → bottom)

| Region | Component | Role |
|--------|-----------|------|
| Title bar | `TRNWindow` + `FreeAssetsLoaderHeaderActions` | Pack name, catalog / on-disk / selected counts, bridge chip |
| Subtitle | In-window copy | Short operator description |
| Main | Tabs, search, tables, download actions | Primary work area |
| Footer | `FreeAssetsLoaderSaveFolderFooter` | Collapsed **Save folder & sync location** (path, hints, folder actions) |
| Footer (browser dev) | `FreeAssetsLoaderBridgeDevFooter` | Collapsed **Development — bridge connection** when bridge offline (not shown in VS Code) |

## Behavior

- **Auto-refresh** when the window opens (and when the browser bridge connects): loads online catalog + on-disk list without pressing Refresh.
- `useFreeAssetsLoaderRuntime` — WS broker, list/download progress, local scan, folder override
- **VS Code extension:** built-in broker chip
- **Browser + bridge:** connection chip when offline; setup commands in bottom collapsible **Development — bridge connection** (not a top banner)

## Related docs

- `extension/docs/GLOBAL_ASSET_DIRECTORIES.md`
- `extension/docs/ASSET_STORAGE_DIAGRAM.md`
- `extension/src/webview/ui/TRN/docs/TRNWindow.md`
