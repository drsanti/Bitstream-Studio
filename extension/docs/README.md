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

Also under **`../src/bitstream2/docs/`** (SENSOR_CFG, HOST_UART_LINK, UART probes).

## Product / engineering process

| Document | Purpose |
|----------|---------|
| [`DEVELOPMENT_TRACKER.md`](./DEVELOPMENT_TRACKER.md) | Backlog and shipped work |
| [`APPLICATION_MIGRATION_PLAN.md`](./APPLICATION_MIGRATION_PLAN.md) | Port E84 / ABB / vehicle sims from `ternion-t3d` (R3F, no `@ternion/t3d`) |
| [`DEVELOPMENT_COMMANDS.md`](./DEVELOPMENT_COMMANDS.md) | `npm` scripts and dev workflows |
| [`PUBLISHING.md`](./PUBLISHING.md) | VSIX packaging |

Runbook: **[`../HOW_TO_RUN.md`](../HOW_TO_RUN.md)**. Agent handoff: **[`../../AGENT_HANDOFF.md`](../../AGENT_HANDOFF.md)**.

**Repository history:** This repo was forked from **`ternion-t3d`** (BS2 branch) as **Bitstream Studio** — extension id `bitstream-studio`, **`@ternion/t3d` removed**, external **bitstream-simulator** VSIX for virtual MCU. Details are in **`AGENT_HANDOFF.md`** §7 session log (2026-05-29 … 2026-05-30).

## Assets (extension globalStorage / Model Loader)

| Document | Purpose |
|----------|---------|
| [`ASSETS_LOCATION_SYSTEM.md`](./ASSETS_LOCATION_SYSTEM.md) | Path and URL mapping |
| [`GLOBAL_ASSET_DIRECTORIES.md`](./GLOBAL_ASSET_DIRECTORIES.md) | Directory checklist |
| [`MANAGING_DOWNLOADED_ASSETS.md`](./MANAGING_DOWNLOADED_ASSETS.md) | Backups and layout |
| [`ASSET_STORAGE_DIAGRAM.md`](./ASSET_STORAGE_DIAGRAM.md) | Storage diagrams |
| [`GLOBAL_DIRECTORIES_PANEL_DESIGN.md`](./GLOBAL_DIRECTORIES_PANEL_DESIGN.md) | Settings UI design |

## Sensor Studio (MVP1 node editor)

| Document | Purpose |
|----------|---------|
| [`MVP1_NODE_EDITOR_TASK_BOARD.md`](./MVP1_NODE_EDITOR_TASK_BOARD.md) | Milestones |
| [`MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md`](./MVP1_NODE_EDITOR_EXECUTION_CHECKLIST.md) | Execution checklist |
| [`MVP1_CONFIG_SPEC.md`](./MVP1_CONFIG_SPEC.md) | Config contract |

Feature README: [`../src/webview/sensor-studio/README.md`](../src/webview/sensor-studio/README.md).

## Outside this folder

| Topic | Where |
|-------|--------|
| MCU firmware / Wi‑Fi IPC / BMI270 fusion internals | `TESAIoT_Library` / `TESAIoT_Firmware` |
| External BS2 virtual MCU | `bitstream-simulator` repo (sibling of Ternion T3D) |
| Legacy Ternion T3D monorepo | `ternion-t3d` (migration source only) |

Do not commit credentials or CA bundles under `docs/` — use local secure storage or the webview CA install flow (`ca-cert-handle.ts`).
