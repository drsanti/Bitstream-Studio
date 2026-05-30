# TERNION Digital Twin Extension Changelog

Version matches `t3d-extension/package.json`.

## 0.0.7

- Bitstream app demos: migrated UI controls to strict `@ternion/t3d/ui` primitives via shared wrappers (`t3dUiControls.tsx`) with no local fallback controls.
- Bitstream app demos: added shared T3D UI load primitives + status hook (`t3dUiPrimitives.ts`) and centralized loading/error gate renderer (`t3dUiLoadGate.tsx`).
- Bitstream Sensor Control Dashboard: config input fields moved to Zustand store (`bitstreamDashboardConfig.store.ts`) and hook (`useBitstreamDashboardConfig.ts`) so transport and diagnostics config state is hook/store synchronized.
- Bitstream Sensor Control Dashboard: handshake summary state moved into live store (`bitstreamDashboardLive.store.ts`) and managed through `useBitstreamDashboardHandshake.ts`.
- Edge AI > IMU: 3D orientation preview applies YZ axis swap in UI so orientation is correct when MCU does not use IMU_SWAP_YZ.
- Edge AI > IMU: 3D orientation preview X-axis rotation direction fixed (Euler-based reverse X only) so model matches physical board; Rev X/Y/Z checkboxes removed.
- Edge AI > WiFi Manager and MCU CLI Output: lines prefixed with `[CM33.IMU.*]` are no longer stored or printed (IMU stream stays visible only in Edge AI > Sensors > IMU).
- Edge AI > WiFi Manager: WiFi Scanner list shows only lines prefixed with `[CM55.WiFi.Scan]`.
- Edge AI > IMU: IMU data chart (ImuCharts) wrapped in a CollapsibleCard titled "IMU data" (default open).
- Edge AI > IMU: stream controls (sample rate, output mode, Start/Stop stream) wrapped in a CollapsibleCard titled "Stream controls" (default open).
- Edge AI > IMU: 3D orientation preview canvas height increased (240px → 360px).
- Edge AI > IMU: 3D orientation preview restored to default (IMU quaternion applied directly, no frame conversion).
- Edge AI > IMU: 3D orientation preview below "Last received" using React Three Fiber. Renders a box that rotates with the latest quaternion from the stream (Quaternion or Data mode). Imu3DPreview.tsx; last quat derived from chartData in ImuView.
- CollapsibleCard: optional `status` and `statusIconVariant` props. Status shows a Lucide icon in the header (green/red/gray). `statusIconVariant`: `websocket` (Globe), `serial` (Cable), or `default` (CircleCheck/CircleX/Circle). ConnectionBlock uses websocket and serial variants for WebSocket and Port cards.
- IMU commands aligned with docs and plan: fusion mode **quat | euler | data** in cli-commands.ts; ImuView Output mode adds **Data** (sends `imu fusion mode data`); imuParser parses `[CM33.IMU.Data]` stream lines and extracts quat for charting.
- Edge AI > IMU: filter serial lines by [CM33.IMU.Euler] and [CM33.IMU.Quaternion], parse values, visualize with Recharts (Euler and Quaternion line charts). ImuView with connection block, Start/Stop stream, rolling buffer (300 points), Clear. Parser in imuParser.ts; ImuCharts with fixed-height ResponsiveContainer.
- MCU CLI: add IMU and Touch commands from cli-command-list. New categories IMU (status, data, stream, fusion mode/on/off, calib status/reset) and Touch (status, stream on/off, ipc status). buildCommandLine supports multi-word subcommand names (e.g. "fusion mode", "calib status").
- Edge AI tab: new top-level tab "Edge AI" with sub-tabs "WiFi Manager" and "Sensors". WiFi Manager includes connection block (useSerialPortOverWs, ConnectionBlock) and WiFi Scanner card; sends `wifi scan` over MCU serial CLI and shows raw scan lines in a list. Sensors sub-tab is a placeholder. Persistence for Edge AI (ternion-edge-ai-config). Lazy-loaded EdgeAiPanel.
- MCU CLI UI: add Serial tab Raw/CLI toggle; MCU CLI panel with ConnectionBlock, CommandList, ParameterForm, OutputPanel, ConfirmDialog; CLI command metadata (cli-commands.ts) and buildCommandLine; persistence (ternion-mcu-cli-config); toast on send error; shared Button/Input components.
- Plan docs for MCU CLI UX/UI: complete OVERVIEW.md, GOAL.md, ARCHITECTURE.md, JOURNAL.md (connection + 24 CM33 CLI commands, categories, file structure, data flow, phases).
- Split panel code into separate files: `webview-util.ts` (getNonce), `panels/TernionDigitalTwin.ts` (3D World panel), `panels/TernionToolsPanel.ts` (Tools panel). `extension.ts` now only wires activation, commands, and status bar.
- Add second webview panel **TERNION Tools**: command "Open TERNION Tools" (`ternion-digital-twin.openToolsPanel`). Uses its own viewType so it can be open at the same time as the 3D World panel. Placeholder content in `TernionToolsPanel._getHtmlForWebview`; replace or load custom assets for your tasks.
- Refactor bridge run scripts: move "run both bridges" into neutral entry `src/run.bridge.ts`; `serialport-bridge/run.bridge.ts` now runs only the Serial Port bridge. `npm run start:bridge` uses `src/run.bridge.ts` so dev still runs broker + both bridges in two processes.
- Add `run:model-downloader-bridge` script: run model-downloader bridge only (connect to existing WebSocket server). Use when port 9998 is already in use.
- Improve ws-server EADDRINUSE error: suggest `npm run run:model-downloader-bridge` when port is in use.
- Add `run.model-downloader.bridge.ts` and `run.model-downloader.client.ts`: standalone Model Downloader bridge and client demos (list, info, download). Scripts: `npm run start:model-downloader-bridge`, `npm run run:model-downloader-bridge`, `npm run run:model-downloader-client ex1|ex2|ex3`.
- SerialPort tab: keep SerialPortTester (and Model Downloader) mounted when switching tabs so WebSocket connection, serial port connection, and UI state persist across tab switches.
- SerialPort: persist wsUrl, baudRate, mode, selectedPath to localStorage for cross-refresh consistency.
- Rename WebSocket tab title to "WebSocket (MQTT-style)" for accuracy (custom protocol, not MQTT).
- Align WebSocket and SerialPort tab layouts with Model Downloader: wrap content in `w-full p-6 space-y-4 border-2`, add h1 heading to WebSocket tab, remove max-w-4xl/centering from SerialPort.
- Add `chunkSizeWarningLimit: 2000` to Vite build config to silence chunk size warnings (3D stack produces large bundles).
- Add `baseline-browser-mapping` as direct devDependency (^2.8.32) to fix outdated data warning from Tailwind/browserslist.
- Use concurrently built-in `--prefix "name"` instead of template `"[{name}]"` for consistent prefix display across platforms.
