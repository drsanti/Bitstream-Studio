# Bitstream Developer Runbook

This runbook is the practical “how to run it / how to test it” reference for Bitstream development and production triage.

It complements:

- `FRAME_PROTOCOL_SPECIFICATION.md` (wire format and IDs)
- `../../webview/bitstream-app/docs/BACKEND_AUTHORITATIVE_RUNTIME_STATE.md` (multi-client authority model; webview no-ACK lane)
- `SerialPortWebSocketBridge.ts` (the bridge implementation details)

---

## 1. Prerequisites and terminology

**Key processes**

- **Broker**: WebSocket broker (default `ws://127.0.0.1:9998`)
- **Bridge**: `SerialPortWebSocketBridge` (the only component that opens the OS serial handle)
- **Client(s)**: webview UI, CLI probes, or MCP server processes that connect to the broker and request `serialport/open`, `serialport/write`, etc.

**Key concepts**

- **CONTROL channel**: `0x03` (handshake and sensor control)
- **corrId**: `u16 LE` echoed in CONTROL ACKs (bridge may rewrite on TX for multi-client safety)
- **ACK budget**: `ACK_TIMEOUT_MS` and `ACK_RETRY_COUNT` (host-side timeout/retry policy)

---

## 2. Common commands (what to run)

All commands below are from the `t3d-extension` folder.

### 2.1 Start broker + bridge (+ dev webview)

Runs the combined dev stack (broker + serial bridge + extension/webview watchers):

```bash
npm start
```

If you only need broker + bridge (no webview build/watch):

```bash
npm run start:bridge
```

### 2.2 Run the protocol probes (CLI)

Handshake-only probe:

```bash
npx tsx src/bitstream/probe-handshake-cli.ts
```

Full protocol torture probe (handshake + streaming + CONTROL + diagnostics):

```bash
npm run -s bitstream:probe:protocol
```

Diagnostics task-table end-to-end probe (requires task stream configuration):

```bash
npx tsx src/bitstream/probe-diag-task-table-e2e-cli.ts
```

---

## 3. Environment variables (CLI probes and transport)

### 3.1 Broker / serial configuration

- **`T3D_WS_CLIENT_URL`**: broker URL (default `ws://127.0.0.1:9998`)
- **`BITSTREAM_SERIAL_PATH`**: serial device path (Windows `COM3`, macOS `/dev/tty.*`)
- **`BITSTREAM_BAUD_RATE`**: baud rate (default `921600`)

Example:

```bash
set T3D_WS_CLIENT_URL=ws://127.0.0.1:9998
set BITSTREAM_SERIAL_PATH=COM3
set BITSTREAM_BAUD_RATE=921600
```

### 3.2 Recommended ACK budgets (production-like)

There is no single “perfect” number for every firmware build and streaming load. The values below are the current recommended baseline for stable development gates.

**Stable baseline (recommended)**

- `ACK_TIMEOUT_MS=12000`
- `ACK_RETRY_COUNT=2`

**Heavy stress baseline (recommended for publish-mode stress / combined streams)**

- `ACK_TIMEOUT_MS=16000`
- `ACK_RETRY_COUNT=2`

Example:

```bash
set ACK_TIMEOUT_MS=12000
set ACK_RETRY_COUNT=2
npm run -s bitstream:probe:protocol
```

### 3.3 Protocol torture probe knobs

Core loop parameters:

- **`TORTURE_LOOPS`**: number of loop iterations (default `120`)
- **`TORTURE_CONTROL_HZ`**: loop cadence (default `12`)
- **`LOAD_SAMPLING_MS`**: high-bandwidth sampling interval used to create load (default `10`)

Sensor source ids (firmware truth; see `src/webview/bitstream-app/constants/sensorSourceIds.ts`):

- **`SENSOR_SOURCE_ID`**: default load source (often `1` = SHT40)
- **`MAG_SOURCE_ID`**: magnetometer (default `3` = BMM350)
- **`BARO_SOURCE_ID`**: barometer (default `2` = DPS368)

Diagnostics task stream knobs:

- **`DIAG_MAJOR`** (default `2`)
- **`DIAG_MINOR`** (default `0`)
- **`DIAG_TASK_STREAM_PERIOD_MS`** (default `20`)
- **`DIAG_TASK_STREAM_MAX_ROWS`** (default `6`)
- **`DIAG_TASK_STREAM_RESYNC_MS`** (default `2000`)

BMI270 knobs (when enabled in the probe):

- **`ENABLE_BMI270_MODE_TOGGLE`**: `0/1`
- **`BMI270_FUSION_FEED_A_MS`**, **`BMI270_FUSION_FEED_B_MS`**

Publish-mode stress knobs:

- **`ENABLE_PUBLISH_MODE_STRESS`**: `0/1`
- **`MIN_PUBLISH_A_MS`**, **`MIN_PUBLISH_B_MS`**
- **`DELTA_A_X100`**, **`DELTA_B_X100`**

Example (heavy stress):

```bash
set TORTURE_LOOPS=160
set TORTURE_CONTROL_HZ=12
set LOAD_SAMPLING_MS=10
set ENABLE_PUBLISH_MODE_STRESS=1
set ACK_TIMEOUT_MS=16000
set ACK_RETRY_COUNT=2
npm run -s bitstream:probe:protocol
```

---

## 4. Multi-client test checklist (must-pass)

The system is designed for multiple concurrent clients connected to the same broker, while only the **bridge** owns the serial handle.

### 4.1 Two-client concurrency (CLI + UI)

1. Start the dev stack:
   - `npm start`
2. Open the webview UI and connect to the device.
3. In a second terminal, run the protocol probe:
   - `ACK_TIMEOUT_MS=12000 ACK_RETRY_COUNT=2 npm run -s bitstream:probe:protocol`
4. Confirm:
   - No handshake regressions
   - No “wrong ACK resolved” symptoms
   - No persistent stuck **transport** wait states in **CLI** clients (the Bitstream webview does not surface per-control “ACK pending” for `sensor.cfg.set`)

### 4.2 Two-client concurrency (two CLIs)

Run the protocol probe twice concurrently (separate terminals).

Expected behavior:

- Both probes should remain stable under load (bridge rewrites CONTROL `corrId` to avoid collisions).
- If one client disconnects/reconnects, the other should not deadlock; transient failures should be recoverable by re-open + handshake.

---

## 5. When a test fails (triage pointers)

### 5.1 CONTROL ACK timeouts under load (CLI / MCP / tests)

Signals:

- `ACK timeout (seq=..., ch=0x3)` in CLI probe
- **MCP** or scripted hosts that still **`writeAwaitAck`** show command failures or hung tool calls

First checks:

- Confirm you are using the **recommended ACK budget** for the current test severity.
- Confirm the bridge process is up to date (restart `npm start` and hard reload the webview when iterating).
- Confirm firmware build includes the CONTROL streaming pause behavior (`BITSTREAM_CTRL_STREAM_PAUSE_TICKS`) and that control requests carry `corrId`.

**Note:** The **Bitstream extension webview** uses **`HostSession.disableWriteAwaitAck`** for interactive dashboard traffic, so it will **not** exhibit the same “ACK pending” UI pattern as ACK-gated probes; treat webview vs CLI symptoms separately during triage.

### 5.2 Diagnostics task-table timeouts

`diag.task.table.get` requires the diagnostics task stream to be configured and resynced at least once (the probe does this automatically).

If timeouts persist:

- verify `DIAG_MAJOR/DIAG_MINOR` match the firmware build
- verify diag service is enabled in firmware

