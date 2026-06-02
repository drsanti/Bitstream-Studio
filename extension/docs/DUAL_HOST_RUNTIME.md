# Dual-host runtime (VS Code webview + browser)

> **How to run dev:** [`DEV_MODE_QUICKSTART.md`](./DEV_MODE_QUICKSTART.md) · [`HOW_TO_RUN.md`](../HOW_TO_RUN.md)

Bitstream Studio ships **one web application** in two hosts:

| Host | How users open it | Asset storage | Setup checklist |
| ---- | ----------------- | ------------- | ----------------- |
| **VS Code webview** | Command palette / status bar → Bitstream Studio | Extension `globalStorage/.../assets` | Full gate until TERNION pack on disk (VSIX) |
| **Browser** | `npm start` → `http://localhost:5173`, or **Open in Browser (Dev Server)** from VS Code | Same folders via bridge + `__ternion_user_*` HTTP mirrors | Same UI; shell is **not** hard-blocked |

## Capability helpers

Webview code should use **`src/webview/webviewHostCapabilities.ts`** instead of scattering `isVsCodeExtensionWebview()` checks:

| Function | Meaning |
| -------- | ------- |
| `canUseHostedAssetBootstrap()` | Check / download TERNION pack + setup checklist (VS Code **or** browser + bridge) |
| `shouldBlockShellUntilAssetsReady()` | Hide workspace until assets ready (**VS Code only**) |
| `canOpenAppInSystemBrowser()` | **Open in browser** command (extension host only) |

Do **not** use `T3DVSCodeUtils.isVsCodeMode()` alone for packaged VSIX detection — see `isVsCodeExtensionWebview()`.

## Browser asset bootstrap

When `canUseHostedAssetBootstrap()` and the host is browser:

1. `useAssetBootstrap` connects to the **model/free-assets WebSocket bridge** (`useFreeAssetsSyncOverWs`).
2. `fetchBrowserAssetBootstrapHostCheck` lists local + remote pack files and probes online reachability.
3. Full-pack sync uses the same bridge path as **Free Assets Loader**.

**Prerequisite:** `npm run start:bridge` (or `npm start`).

## Open in browser (from VS Code)

Command: **`Bitstream Studio: Open in Browser (Dev Server)`** (`bitstream-studio.openInBrowser`).

- Starts backend services and the **local webapp HTTP server**.
- Opens the system browser with `?assetSourceStrategy=…` matching workspace settings.
- Serves downloaded assets from the same `globalStorage` tree as the panel (see [Managing downloaded assets](./MANAGING_DOWNLOADED_ASSETS.md)).

Quick palette (Ctrl+/): **Open in browser** — extension webview only.

## Operator flows

| Goal | VS Code | Browser (`localhost:5173`) |
| ---- | ------- | --------------------------- |
| Fast UI iteration | F5 after `compile`, or panel | `npm start` + HMR |
| TERNION pack sync | Setup checklist / Download TERNION pack | Same commands when bridge is up |
| First VSIX install | Blocking setup overlay | N/A — use VSIX panel |
| UART / Simulator telemetry | Full | Bridge + WS (no webview COM in tab) |

## Related docs

- [HOW_TO_RUN.md](../HOW_TO_RUN.md) — terminals and URLs
- [STARTUP_CHECKLIST_DESIGN.md](./STARTUP_CHECKLIST_DESIGN.md) — checklist steps and dismiss rules
- [MANAGING_DOWNLOADED_ASSETS.md](./MANAGING_DOWNLOADED_ASSETS.md) — folder layout and `__ternion_user_free/`
- [TELEMETRY_MODE_LIFECYCLE.md](./TELEMETRY_MODE_LIFECYCLE.md) — Bitstream vs Simulator
