# Bitstream Studio — documentation index

English-only committed docs for the **`bitstream-studio`** VS Code extension (`extension/`). Start with **[`BS2_PROTOCOL_INDEX.md`](./BS2_PROTOCOL_INDEX.md)** for protocol work.

## Core (Bitstream / BS2 / bridge)

| Document | Purpose |
|----------|---------|
| [`BS2_PROTOCOL_INDEX.md`](./BS2_PROTOCOL_INDEX.md) | Map of wire spec, `src/bitstream2/`, tests, firmware pointers |
| [`BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`](./BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md) | UART wire format (canonical) |
| [`TELEMETRY_MODE_LIFECYCLE.md`](./TELEMETRY_MODE_LIFECYCLE.md) | Bitstream vs Simulator on the broker |
| [`BITSTREAM_TELEMETRY_OPERATIONS.md`](./BITSTREAM_TELEMETRY_OPERATIONS.md) | Operator diagnostics |
| [`BITSTREAM_TELEMETRY_STALE_PIPELINE.md`](./BITSTREAM_TELEMETRY_STALE_PIPELINE.md) | Stale decode troubleshooting |
| [`BRIDGE.md`](./BRIDGE.md) | Serial / model WebSocket brokers |
| [`bitstream-telemetry-provider/`](./bitstream-telemetry-provider/README.md) | **Developer / AI kit** — public API `:9997`, `bitstream:sample`, EXAMPLES, **SKILL.md** |
| [`BITSTREAM_TELEMETRY_PROVIDER.md`](./BITSTREAM_TELEMETRY_PROVIDER.md) | Pointer to portable kit folder |

Also under **`../src/bitstream2/docs/`** (SENSOR_CFG, HOST_UART_LINK, UART probes).

## Product / engineering process

| Document | Purpose |
|----------|---------|
| [**`BITSTREAM_STUDIO_UNIFIED_UX.md`**](./BITSTREAM_STUDIO_UNIFIED_UX.md) | **All-in-one UX** — four-app journey, one graph / 2D+3D, work modes, desk layouts, inspector Pin |
| [`DEVELOPMENT_TRACKER.md`](./DEVELOPMENT_TRACKER.md) | Backlog and shipped work |
| [`APPLICATION_MIGRATION_PLAN.md`](./APPLICATION_MIGRATION_PLAN.md) | Port E84 / ABB / vehicle sims from `ternion-t3d` (R3F, no `@ternion/t3d`) |
| [**`DEV_MODE_QUICKSTART.md`**](./DEV_MODE_QUICKSTART.md) | **Visual** dev paths — `npm start`, F5, URLs (start here) |
| [**`WEBVIEW_DEV_PERFORMANCE.md`**](./WEBVIEW_DEV_PERFORMANCE.md) | Vite dev refresh/HMR, lazy Sensor Studio chunks, blank-page troubleshooting |
| [`DEVELOPMENT_COMMANDS.md`](./DEVELOPMENT_COMMANDS.md) | `npm` scripts and dev workflows |
| [`PUBLISHING.md`](./PUBLISHING.md) | VSIX packaging |

Runbook: **[`../HOW_TO_RUN.md`](../HOW_TO_RUN.md)**. Agent handoff: **[`../../AGENT_HANDOFF.md`](../../AGENT_HANDOFF.md)**.

**Repository history:** This repo was forked from **`ternion-t3d`** (BS2 branch) as **Bitstream Studio** — extension id `bitstream-studio`, **`@ternion/t3d` removed**, external **bitstream-simulator** VSIX for virtual MCU. Details are in **`AGENT_HANDOFF.md`** §7 session log (2026-05-29 … 2026-05-30).

## Assets (extension globalStorage / Model Loader)

| Document | Purpose |
|----------|---------|
| [`ASSETS_ONLINE_REPO.md`](./ASSETS_ONLINE_REPO.md) | **GitHub free pack** — `main/assets` vs repo root, URL rules, sync, publish |
| [`ASSETS_LOCATION_SYSTEM.md`](./ASSETS_LOCATION_SYSTEM.md) | Path and URL mapping |
| [`GLOBAL_ASSET_DIRECTORIES.md`](./GLOBAL_ASSET_DIRECTORIES.md) | Directory checklist |
| [`MANAGING_DOWNLOADED_ASSETS.md`](./MANAGING_DOWNLOADED_ASSETS.md) | Backups and layout |
| [`DUAL_HOST_RUNTIME.md`](./DUAL_HOST_RUNTIME.md) | VS Code webview vs browser; bridge bootstrap; **Open in browser** |
| [`STARTUP_CHECKLIST_DESIGN.md`](./STARTUP_CHECKLIST_DESIGN.md) | First-run setup checklist (assets + link) |
| [`ASSET_STORAGE_DIAGRAM.md`](./ASSET_STORAGE_DIAGRAM.md) | Storage diagrams |
| [`GLOBAL_DIRECTORIES_PANEL_DESIGN.md`](./GLOBAL_DIRECTORIES_PANEL_DESIGN.md) | Settings UI design |
| [`STARTUP_CHECKLIST_DESIGN.md`](./STARTUP_CHECKLIST_DESIGN.md) | First-run / link setup checklist (design + phases) |

## Sensor Studio (MVP1 node editor)

| Document | Purpose |
|----------|---------|
| [`BITSTREAM_STUDIO_UNIFIED_UX.md`](./BITSTREAM_STUDIO_UNIFIED_UX.md) | Product UX north star (work modes, desk, inspector — see also Product section above) |
| [`MVP1_NODE_EDITOR_TASK_BOARD.md`](./MVP1_NODE_EDITOR_TASK_BOARD.md) | Milestones |
| [`MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md`](./MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md) | Execution checklist |
| [`MVP1_CONFIG_SPEC.md`](./MVP1_CONFIG_SPEC.md) | Config contract |
| [`../src/webview/sensor-studio/docs/FLOW_DOMAINS.md`](../src/webview/sensor-studio/docs/FLOW_DOMAINS.md) | Telemetry vs scene tick domains |
| [`../src/webview/sensor-studio/docs/SENSOR_STUDIO_PERFORMANCE.md`](../src/webview/sensor-studio/docs/SENSOR_STUDIO_PERFORMANCE.md) | Flow/3D fps caps, canvas interaction policy, live diagnostics |
| [`../src/webview/sensor-studio/docs/NODE_ANIMATOR_PARITY.md`](../src/webview/sensor-studio/docs/NODE_ANIMATOR_PARITY.md) | Flow editor UX parity (Phases 1–3 shipped) |

Feature README: [`../src/webview/sensor-studio/README.md`](../src/webview/sensor-studio/README.md).

## Outside this folder

| Topic | Where |
|-------|--------|
| MCU firmware / Wi‑Fi IPC / BMI270 fusion internals | `TESAIoT_Library` / `TESAIoT_Firmware` |
| External BS2 virtual MCU | `bitstream-simulator` repo (sibling of Ternion T3D) |
| Legacy Ternion T3D monorepo | `ternion-t3d` (migration source only) |

Do not commit credentials or CA bundles under `docs/` — use local secure storage or the webview CA install flow (`ca-cert-handle.ts`).
