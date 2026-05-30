# Webview Changelog

Version matches `t3d-extension/package.json`.

## 0.0.7

- Extract `TestWebSocketAndSerialBridge` from `main.tsx` into `TestWebSocketAndSerialBridge.tsx`. Keeps app entry logic in `main.tsx` and tester UI in a dedicated component.
- Add Model Downloader tab to Tester: `ModelDownloaderTester` component for TESAIoT Product Model Store. Config (base URL, API key, CA cert), list models with pagination, get model info, download (thumbnail, 3D model, ZIP). Uses WebSocket bridge for list/info/download (works in webview and browser when bridge runs). Extension postMessage for config persistence and folder picker (webview only).
- Fix TDZ in `ModelDownloaderTester`: declare `wsUrl` state before passing to `useModelDownloaderOverWs` to avoid "Cannot access before initialization" error when opening Model Loader tab.
- Fix Choose Folder button in Model Downloader: acquire VS Code API in HTML script before ES modules load (so `acquireVsCodeApi` is available) and use `window.__VSCODE_API__` in `useModelDownloaderExtension`.
- Add browser mode folder picker: use File System Access API (`showDirectoryPicker`) in Chrome/Edge when not in extension. Bridge supports `download-browser` topic to return file contents; browser writes to selected folder.
- Add download progress: bridge publishes progress (phase, percent, file index). UI shows progress bar and current file. Browser download fixed by sending one file per message (`download-browser-file`, `download-browser-complete`) to avoid message size limits.
- IMU 3D preview: fix Y rotation 180° offset by applying Y correction in Euler space (`addYRotationOffset`: add π to Euler Y after flips) instead of a fixed 180° Y quaternion.
- IMU 3D preview: set initial rotation to 180° X then 180° Y (applyFlipUpright applies both); removed addYRotationOffset from pipeline.
- IMU 3D preview: restore MCU format selector (Y-up/Z-up); Y-up uses modelQuatFromRaw, Z-up uses modelQuatFromRawZUp (negate X).
- IMU 3D preview: Z-up overlay uses REST_EULER_DEG_Z so 0° when board flat.
