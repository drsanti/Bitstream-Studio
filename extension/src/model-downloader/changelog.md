# Model Downloader Changelog

Version matches `t3d-extension/package.json`.

## 0.0.7

- Add `run.model-downloader.bridge.ts`: standalone bridge entry point (run Model Downloader without SerialPort). Retries connection when server is not yet ready (fixes race with `start:model-downloader-bridge`). Use `npm run start:model-downloader-bridge` or `npx tsx src/model-downloader/run.model-downloader.bridge.ts`.
- Add `run.model-downloader.client.ts`: client demos (ex1 list, ex2 info, ex3 download) exercising the WebSocket protocol. Use `npm run run:model-downloader-client ex1` or `npx tsx src/model-downloader/run.model-downloader.client.ts ex1`.
- Add `ModelDownloaderService.ts`: TypeScript service extracted from `samples/download_model_nodejs.js`. Exposes `listModels`, `getModelInfo`, `downloadModel` with configurable baseUrl, apiKey, caCertPath.
- Add `model-downloader-handle.ts`: Extension host handler for webview messages. Persists API key in secrets, baseUrl/caCertPath in globalState. Handles config, folder picker (list/info/download moved to WebSocket bridge).
- Add `protocol.ts`: Platform-agnostic types and topics for Model Downloader WebSocket bridge.
- Add `ModelDownloaderWebSocketBridge.ts`: WebSocket bridge for list/info/download. Connects to T3D broker, subscribes to model-downloader/\* topics. Integrated into `combined-bridge-entry.ts` with SerialPort bridge.
- Fix folder picker in webview: use pre-injected `window.__VSCODE_API__` from extension HTML (ES modules cannot access global `acquireVsCodeApi`).
- Add browser folder picker: `DOWNLOAD_BROWSER` topic returns base64 file contents; web client uses `showDirectoryPicker` and File System Access API to save files (Chrome, Edge). `downloadModelToMemory` in service.
- Browser download: send one file per message (`DOWNLOAD_BROWSER_FILE`, `DOWNLOAD_BROWSER_COMPLETE`) to avoid broker message size limits. Add download progress (`DOWNLOAD_PROGRESS`) and progress callbacks in service for both disk and browser downloads.
- Dev: `npm run start:bridge` runs `src/run.bridge.ts`, which starts both Serial Port and Model Downloader bridges in one process (List Models supported). For Serial Port only, use `serialport-bridge/run.bridge.ts`.
