# Bitstream MCP Server (Skeleton)

This folder contains the MCP server wiring layer for Bitstream backend control.

## Multi-client dashboard sync (MCP → broker)

When MCP mutates firmware-visible config, Node sessions that use **`SerialBridgeTransportAdapter`** publish to the same WebSocket topics as the VS Code webview so other clients merge updates (MCP paths typically **verify** with **`sensor.cfg.get`** before publish — see **`mcpBrokerFanOut.ts`**). The **Bitstream webview** may publish **`sensor-cfg-updated`** **immediately** after an optimistic store merge (no verify read); both shapes share the topic so dashboards stay aligned.

- **`serialport/sensor-cfg-updated`** — after **`bitstream_run_command`** `sensor.cfg.set`, **`bitstream_sensor_start_stop_set`**, **`bitstream_sensor_start_stop_set_bulk`**, etc. (see **`mcpBrokerFanOut.ts`** in `command-api/`).
- **`serialport/bmi270-stream-mode-updated`** — after **`sensor.bmi270.mode.set`** via **`bitstream_run_command`**.

See **`src/webview/bitstream-app/docs/FIRMWARE_MULTI_CLIENT_AND_MCP_ARCHITECTURE.md`**.

## BS2 runtime (2026-05)

MCP stdio and the AI bridge attach a **`Bs2BrokerSession`** (`src/bitstream2/bridge/bs2-broker-session.ts`), not v1 **`HostSession`**:

- Serial: `serialport/open` on the WebSocket broker (921600 default).
- Control: `bitstream2/req` + `bitstream2/res` (`BS2_CMD` — PING, CAPS_GET, SENSOR_CFG_* , BMI270_*).
- Telemetry ingest for tools: `bitstream2/evt/sensor`.
- Attach: `openBitstreamBs2SessionFromCliOptions` in `bitstream-bs2-session-attach.ts` (HELLO probe, same CLI flags as before).

**Hardware / CI probes:** prefer **`npm run bitstream2:uart-probe`** (`src/bitstream2/dev/run-uart-probe.ts`). Legacy v1 probes under `src/bitstream/probe-*.ts` exit with a deprecation message.

**Diagnostics MCP tools** (`bitstream_diag_*`) return **unsupported** until BS2 `EVT_DIAG` parity exists; use firmware UART test CLIs or v1 sources only for diag channel work.

## Current status

- Runtime context abstraction: ready (BS2 session)
- Tool registration helper: ready
- MCP SDK stdio bootstrap: ready
- Included tools:
  - `bitstream_run_command`
  - `bitstream_health_check`
  - `bitstream_control_ops`
  - `bitstream_sensor_latest_samples_get`
  - `bitstream_sensor_config_get`
  - `bitstream_sensor_status_get`
  - `bitstream_sensor_start_stop_set`
  - `bitstream_sensor_start_stop_set_bulk` (enable/disable **all** of 1–4 in **one** MCP round-trip)
  - `bitstream_diag_snapshot_get`
  - `bitstream_diag_fault_events_get`
  - `bitstream_diag_task_table_get`
  - `bitstream_diag_task_priority_set`
- Included resources (descriptor-backed):
  - `bitstream://protocol/version`
  - `bitstream://sensors/catalog`
  - `bitstream://diagnostics/error-codes`
  - `bitstream://operations/safe-commands`
  - `bitstream://defaults/sensor-config`
- Included prompts (descriptor-backed):
  - `triage_fault_events`
  - `sensor_health_report`
  - `pre_command_checklist`

## Backend API coverage matrix

**Typed `BitstreamCommandRequest` kinds** (full list in `src/bitstream/command-api/bitstreamCommandTypes.ts`) are all reachable via **`bitstream_run_command`** → **`BitstreamCommandApi`** → **`executeBitstreamCommand`**:

- `handshake.run`
- `sensor.cfg.get` / `sensor.cfg.set`
- `sensor.bmi270.mode.get` / `sensor.bmi270.mode.set`
- **Diagnostics (firmware diag channel):** `diag.stream.start`, `diag.stream.stop`, `diag.snapshot.get`, `diag.task.table.get`, `diag.task.priority.set`

See **`src/webview/bitstream-app/docs/FIRMWARE_MULTI_CLIENT_AND_MCP_ARCHITECTURE.md` §4.5** for firmware opcode mapping (**`0x01`–`0x04`**, **`0x10`**), **global / task interval** fields on **`diag.stream.start`**, webview vs MCP coverage, and **`0x84`** fault events (MCP-only collector).

Additional dedicated diagnostics APIs are available for robust task workflows:

- `bitstream_diag_task_table_get`
  - Returns parsed task rows (`taskId`, `name`, `priority`, `flags`, etc.)
  - Avoids sequence-correlation issues for multi-frame task-table responses
- `bitstream_diag_task_priority_set`
  - Sends direct diagnostics priority-set payload (`0x10`) and returns ACK details
  - Accepts numeric values and numeric strings for MCP-client compatibility
- `bitstream_diag_snapshot_get`
  - Returns parsed snapshot metrics from diagnostics event `0x81`
- `bitstream_diag_fault_events_get`
  - Collects parsed diagnostics fault/audit events from diagnostics event `0x84`
- `bitstream_control_ops`
  - Explicit low-level APIs for `hello`, `ping`, `caps`, `status`, and `sensor_reinit`
- `bitstream_sensor_latest_samples_get`
  - Returns latest parsed sensor samples observed in a short collection window
  - Covers real sensor sources: `sht40`, `dps368`, `bmm350`, `bmi270` (dummy excluded)
- `bitstream_sensor_config_get`
  - Returns typed config for a specific `sourceId` and normalized `sensorState` (`started`/`stopped`)
- `bitstream_sensor_status_get`
  - Returns start/stop state and config snapshot for one or more `sourceIds` (default: `1,2,3,4`)
- `bitstream_sensor_start_stop_set`
  - Explicit sensor start/stop API by `sourceId` with config-preserving write flow (`cfg.get` -> `cfg.set` -> verify `cfg.get`)

## Implementation roadmap

Coverage and rollout plan to keep firmware/backend parity explicit:

- [x] Base command API with 9 high-level firmware interactions (`bitstream_run_command`)
- [x] Diagnostics task-table structured API (`bitstream_diag_task_table_get`)
- [x] Diagnostics task-priority direct API (`bitstream_diag_task_priority_set`)
- [x] Diagnostics snapshot structured API (`bitstream_diag_snapshot_get`)
- [x] Low-level control operations API (`bitstream_control_ops`: hello/ping/caps/status/sensor_reinit)
- [x] Diagnostics fault-event structured API (`DIAG_EVT_FAULT_EVENT`, `0x84`)
- [x] Expand smoke test to include all dedicated tools and fault-event validation
- [ ] Add backend/API contract tests for diagnostics event decoding edge cases

## Integration snippet

```ts
import { createBitstreamMcpRuntimeContext, registerBitstreamMcpTools } from "./mcp-server";

const runtime = createBitstreamMcpRuntimeContext({
  getSession: () => backendRuntime.getHostSession(),
  isRuntimeReady: () => backendRuntime.isReady(),
});

registerBitstreamMcpTools(mcpServer, runtime, { includeHealthCheck: true });
```

Resource and prompt descriptors are loaded from:

- `src/bitstream/mcp-server/resources/*.json`
- `src/bitstream/mcp-server/prompts/*.json`

Optional registries:

- `src/bitstream/mcp-server/resources/RESOURCE_REGISTRY.json`
- `src/bitstream/mcp-server/prompts/PROMPT_REGISTRY.json`

## Run stdio server

```bash
npm run bitstream:mcp:stdio
```

This starts MCP server without serial attach. `bitstream_run_command` will return no active session until a session is attached.

## Run MCP smoke test

```bash
npm run bitstream:mcp:smoke
```

## Run MCP release gate

```bash
npm run bitstream:mcp:gate
```

This gate runs, in order:

- `bitstream:mcp:validate` (descriptor contract validation)
- `test:bitstream` (bitstream unit/integration tests)
- `bitstream:mcp:smoke` (end-to-end MCP smoke)

## Validate descriptor contracts

```bash
npm run bitstream:mcp:validate
```

What it validates:

- Resource and prompt descriptors have required fields.
- Registry entries are unique and point to existing descriptors.
- Every descriptor is listed in its registry.
- Every registered resource has a sample payload in `resources/examples/*.sample.json`.

What it checks:

- `bitstream_health_check` is registered and callable.
- `bitstream_run_command` accepts wrapped command shape:
  - `{ command: { type, payload } }`
- `bitstream_run_command` accepts direct command shape:
  - `{ type, payload }`
- `handshake.run` no longer fails with `Invalid Bitstream command payload` for either shape.
- Dedicated tool registration and callability:
  - `bitstream_control_ops`
  - `bitstream_diag_snapshot_get`
  - `bitstream_diag_fault_events_get`
  - `bitstream_diag_task_table_get`
  - `bitstream_diag_task_priority_set`
  - `bitstream_sensor_latest_samples_get`
  - `bitstream_sensor_config_get`
  - `bitstream_sensor_status_get`
  - `bitstream_sensor_start_stop_set`

Smoke attach defaults (current project profile):

- `--allowManufacturer=STMicroelectronics,Silicon,Cypress`
- `--denyPattern=bluetooth,rfcomm,bth`
- `--baudRate=921600`
- `--mode=both`
- `--url=ws://127.0.0.1:9998`

Optional env overrides for smoke:

- `BITSTREAM_SMOKE_WS_URL`
- `BITSTREAM_SMOKE_ALLOW_MANUFACTURER`
- `BITSTREAM_SMOKE_DENY_PATTERN`
- `BITSTREAM_SMOKE_BAUD_RATE`
- `BITSTREAM_SMOKE_PATH`

## Run stdio server with serial attach

```bash
npm run bitstream:mcp:stdio:attach
```

or custom values:

```bash
npx tsx src/bitstream/mcp-server/run.mcp-server.ts --path=COM7 --baudRate=921600 --mode=both --url=ws://127.0.0.1:9998
```

custom filtering:

```bash
npx tsx src/bitstream/mcp-server/run.mcp-server.ts --autoDetectPort=true --allowManufacturer=STMicroelectronics,Silicon --denyPattern=bluetooth,rfcomm,bth --baudRate=921600
```

Arguments:

- `--path`: serial path, for example `COM7` (optional; if omitted, server tries auto-detect)
- `--autoDetectPort`: `true` or `false`, default `true`
- `--allowManufacturer`: comma-separated allowlist for `manufacturer` field (optional)
- `--denyPattern`: comma-separated deny patterns matched against path/manufacturer/pnpId/locationId (default `bluetooth,rfcomm,bth`)
- `--baudRate`: serial baud rate, default `921600` (see `bitstream-default-baud.ts`)
- `--mode`: `data`, `line`, or `both`, default `data`
- `--url`: websocket broker URL, default `ws://127.0.0.1:9998`

Auto-detect behavior:

- Filters out likely virtual Bluetooth ports using metadata (`manufacturer`, `pnpId`, `locationId`).
- Probes remaining candidates and executes `handshake.run`.
- Selects the first port that passes handshake; rejected ports are closed and skipped.

## Claude Desktop config (Windows, verified)

Config file:

- `C:\Users\drsanti\AppData\Roaming\Claude\claude_desktop_config.json`

Recommended server entry (verified working):

```json
{
  "mcpServers": {
    "bitstream-mcp": {
      "command": "node",
      "args": [
        "D:\\CODE\\2026\\ternion-t3d\\t3d-extension\\node_modules\\tsx\\dist\\cli.mjs",
        "D:\\CODE\\2026\\ternion-t3d\\t3d-extension\\src\\bitstream\\mcp-server\\run.mcp-server.ts",
        "--autoDetectPort=true",
        "--allowManufacturer=STMicroelectronics,Silicon,Cypress",
        "--denyPattern=bluetooth,rfcomm,bth",
        "--baudRate=921600",
        "--mode=both",
        "--url=ws://127.0.0.1:9998"
      ],
      "cwd": "D:\\CODE\\2026\\ternion-t3d\\t3d-extension"
    }
  }
}
```

Why this form:

- `node + tsx cli.mjs` avoids extra npm wrapper stdout noise in stdio mode.
- Absolute paths remove ambiguity when Claude launches outside project context.

## Troubleshooting

- **`Server disconnected` in Claude Desktop**
  - Use `command: "node"` with `tsx/dist/cli.mjs` (not `npm run ...`).
  - Ensure `cwd` points to `D:\CODE\2026\ternion-t3d\t3d-extension`.
  - Fully restart Claude Desktop after editing config.

- **`Invalid Bitstream command payload` on `handshake.run`**
  - Use either of these arguments:
    - `{ "command": { "type": "handshake.run", "payload": {} } }`
    - `{ "type": "handshake.run", "payload": {} }`
  - If your client sends `payload` as a JSON string, server-side adapter now normalizes it.
  - Flat fields are also normalized for `handshake.run` (`protocolVersion`, `pingNonce`, `requestIdPrefix`).
  - Run `npm run bitstream:mcp:smoke` to verify adapter normalization locally.

- **`sensor.bmi270.mode.set` always echoes `mode=0`**
  - MCP adapter now normalizes multiple client shapes to `payload.mode`:
    - `mode`
    - `imuMode`
    - `fusionMode` (boolean mapped to `0/1`)
  - Use `debugWire: true` to inspect `normalizedCommand` and `predictedPayloadHex`.

- **`Bitstream session not available`**
  - MCP server is alive, but no serial `HostSession` is attached.
  - Start with explicit `--path=COMx` or ensure auto-detect can pass handshake.

- **`bitstream_health_check` shows `sessionAttached` but tools fail with `Serial bridge transport is not connected`**
  - Prefer **`commandsReady`** and **`transport.state`** over **`sessionAttached`** alone: the session object may exist from startup while the WebSocket/serial tunnel is no longer `connected`.
  - Restart the MCP server after the bridge re-attaches COM so the transport opens again.
  - When using **`SerialBridgeTransportAdapter`**, **`transport.lastDisconnectReason`** may be present after drops (from WS disconnect or `serialport/status` reporting `isOpen=false`).

## Firmware reference paths

Use these local firmware workspaces when protocol behavior needs verification from source:

- Firmware project: `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Firmware`
- Shared library: `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Library`

Recommended files for diagnostics protocol checks:

- `proj_cm55/src/bitstream/modules/diag/src/bitstream_diag_service.c`
- `proj_cm55/src/bitstream/modules/diag/include/bitstream_diag_service.h`
- `proj_cm55/src/bitstream/protocol/include/bitstream_protocol.h`

## Next steps

- Connect this registration to the real MCP SDK server bootstrap.
- Add diagnostics tools backed by runtime snapshot and recent operations.
- Add integration tests for tool calls through server transport.
