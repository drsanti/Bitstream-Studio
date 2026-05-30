# Bitstream App (webview)

React shell and Zustand-backed hooks/state for Bitstream protocol workflows under `src/webview/bitstream-app`, composed into the extension webview via `BitstreamAppMain` (see `src/webview/main.tsx`).

## Transport status (2026-05-27)

The main shell is **simulator-only** for webview ↔ broker exchange. See **[docs/BITSTREAM_WEBVIEW_TRANSPORT_SIMULATOR_ONLY.md](docs/BITSTREAM_WEBVIEW_TRANSPORT_SIMULATOR_ONLY.md)**.

- **Simulator:** `useBitstreamSession` + `useBitstream2TelemetryBridge` on `bitstream2/*`
- **UART in toolbar:** not connected in this build; use CLI UART harnesses until transport is redesigned

## Screens

- **`bitstream-shell/BitstreamShellRoot.tsx`** (exported as `BitstreamAppWrapper`) — Multi-sensor shell: header, hamburger menu, simulator connect/disconnect, handshake via BS2 HELLO, and a `children` slot. Helper context: `useBitstreamAppControl`; internal `BitstreamTransportActionsProvider` for `runAction` / BMI270 stream-mode sync.
- **`BitstreamAppMain.tsx`** — Entry: shell + `Bmi270StreamModeSyncEffect` + workspace view, or **`?app=sensor-studio`** for Sensor Studio.

## Sensor control components

Sensor-specific folders under **`components/`** (`bmi270/`, `dps368/`, `sht40/`, `bmm350/`). Configuration uses **local store draft** via **`useSensorConfigController`** (firmware I/O stubbed pending BS2 cfg restore).

## Documentation (Bitstream webview)

| Doc | Topic |
|-----|--------|
| **[docs/BITSTREAM_WEBVIEW_TRANSPORT_SIMULATOR_ONLY.md](docs/BITSTREAM_WEBVIEW_TRANSPORT_SIMULATOR_ONLY.md)** | **Current** webview transport scope (simulator only) |
| **[docs/BITSTREAM_SENSOR_DATA_FLOW_AND_STATE.md](docs/BITSTREAM_SENSOR_DATA_FLOW_AND_STATE.md)** | Live store, BS2 ingest, state tables |
| **[docs/BITSTREAM_SERIAL_AND_BROKER_DATA_FLOW.md](docs/BITSTREAM_SERIAL_AND_BROKER_DATA_FLOW.md)** | Bridge/broker architecture (CLI + future UI) |
| **[docs/CONTROL_PANEL_MULTI_INSTANCE_SYNC.md](docs/CONTROL_PANEL_MULTI_INSTANCE_SYNC.md)** | Multi-client sync (broker fan-out **disabled** in webview until redesign) |
| **[docs/DIAGNOSTICS_SNAPSHOT_UI.md](docs/DIAGNOSTICS_SNAPSHOT_UI.md)** | Diagnostics cards (transport-dependent features stubbed) |

## Port Admin (hamburger)

**Serial Port Admin** opens **`SystemSerialportInfo`** for bridge port table inspection (WS URL from `useWsClientStore`). This is **admin/diagnostic**, not the removed Bitstream serial session UI.

## Persistence

- **Browser / webview `localStorage`**: key **`bitstream-dashboard-config-v2`** (`state/bitstreamConfig.store.ts`)
- **VS Code host mirror**: `installBitstreamHostConfigSync.ts` → `globalStorageUri/bitstream-dashboard-config.json`

## State and hooks

- **State (`state/`)**: `bitstreamConnection.store.ts`, `bitstreamLive.store.ts`, `bitstreamConfig.store.ts`, `bitstreamTelemetrySource.store.ts`
- **Hooks (`hooks/`)**: `useBitstreamSession`, `useBitstream2TelemetryBridge`, `useBitstreamHandshake`, `useBitstreamConnection`, `useBitstreamConfig`

Core Bitstream library APIs live in `src/bitstream/` and `src/bitstream2/`; this folder imports them via relative paths.

## Manual QA (simulator)

1. `cd extension && npm run start:bridge` (terminal 1) and `npm run dev:webview` (terminal 2)
2. Open `http://localhost:5173/?app=bitstream`
3. Set **SOURCE** to **Simulator** (or **Auto** with external sim running)
4. **Connect** — expect WS connected, BS2 HELLO, live samples on decks / Sensor Studio nodes
5. **UART** source — connect logs that serial transport is removed; no COM session in webview
