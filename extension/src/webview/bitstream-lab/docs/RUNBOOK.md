# Bitstream Lab — agent runbook (continue from here)

**Purpose:** Single continuation guide for an AI coding agent on a **new machine**. Read after monorepo **`AGENT_HANDOFF.md`** and this folder’s **`README.md`**.

**Last updated:** 2026-05-28  
**Git branch:** `BS2` on `https://github.com/drsanti/ternion-t3d`  
**Landmark commit:** `eaa347f` — `feat(bitstream-lab): add transport workbench and fix serial bridge close flood`

> **Note:** The standalone Bitstream Lab app (`/?standalone=bitstream-lab`) and `dev:bitstream-lab` script were removed on **2026-05-28**.
> This runbook remains as historical reference until these panels are reintroduced under the **Sensor Lab** workspace.

---

## 1. What exists today (do not re-build)

| Phase | Status | Key paths |
|-------|--------|-----------|
| **0** Shell + workbench | **Done** | `BitstreamLab.tsx`, `workbench/*`, `LabLinkBar`, `LabHealthStrip` |
| **1** Topic Tap | **Done** | `TopicTapPanel.tsx`, `hooks/useLabTopicTap.ts`, `store/labTopicTap.store.ts`, `lib/labTopics.ts` |
| **2** Serial + Activity | **Done** | `SerialPanel.tsx`, `hooks/useLabSerialPort.ts`, `ActivityLogPanel.tsx`, `store/labActivity.store.ts` |
| **3** BS2 smoke | **Done** | `Bs2SmokePanel.tsx`, `hooks/useLabBs2Smoke.ts` |
| **4–8** Loopback, Publish, Broker, Protocol, Bridge observability | **Not done** | Stubs: `BrokerObservabilityPanel`, `LabPanelStub`; specs in `docs/*.md` |

**Isolation rule:** Lab must **not** import `bitstream-app` or `bitstream-shell`. Shared: `../ws-client-store`, `../serialport/*`, `../ui/workbench`, `bitstream2/bridge/protocol`.

---

## 2. Clone and run (legacy; standalone app removed)

```bash
git clone https://github.com/drsanti/ternion-t3d.git
cd ternion-t3d
git checkout BS2
git pull origin BS2

cd t3d-extension && npm install
cd ../T3D && npm install && npm run build:lib
cd ../T3D && npm run link:lib:extension
```

Use **`t3d-extension/HOW_TO_RUN.md`** for current commands:

- Loopback sim (browser dev): `npm run dev:bitstream2-loopback` → `http://localhost:5173/?app=bitstream`
- Real MCU (UART): use CLI probes (`bitstream2:uart-probe`, matrix, etc.)

---

## 3. Serial bridge behavior (critical for agents)

Firmware EVT rate with **default SENSOR_CFG** is ~**1 Hz per sensor** (~4 EVT/s total). Topic Tap flooding at **5–20 rows/s** is almost always **host-side**, not firmware.

### 3.1 Architecture (event vs timer)

| Topic / path | Driven by |
|--------------|-----------|
| `serialport/data` | **Event** — OS `data` callback per USB chunk (only if bridge publishes raw UART; see §3.2) |
| `bitstream2/evt_sensor` | **Event** — valid BS2 frame decoded |
| `bitstream2/metrics` | **Timer** — 1 Hz on bridge |
| `serialport/status` | **Event** — open/close/path/baud (not every `bytesRead` tick after `eaa347f`) |
| `t3d/broker/monitor` | **Event** — broker telemetry; echoes publishes when `brokerMonitorIncludePublishes` is on |

BS2 wire: frames end with **`\\r\\n`** only on a **complete** `BS ` + CRC frame — not line-delimited stream filtering.

### 3.2 Bridge fixes in `eaa347f` (must restart bridge after pull)

| Mechanism | File | Behavior |
|-----------|------|----------|
| **`hostUartSessionActive`** | `SerialPortWebSocketBridge.ts` | `false` on **Close** before OS `port.close()`; blocks `publishData`, metrics, status spam |
| **Immediate `CLOSE_RESULT`** | same | Webview does not hang 5s while USB driver closes |
| **No raw UART by default** | same | `serialport/data` not published unless `T3D_BRIDGE_PUBLISH_RAW_UART=1` or dev loopback |
| **No reconnect re-open** | same | WS reconnect does **not** call `setHostUartSessionActive(true)` when COM still open |
| **Stale COM cleanup** | same | If COM open without active session → `finishHostPortCloseAfterAck()` |
| **All-zero RX streak** | same | 16 zero chunks → gate off + `forceClose()` (unplugged USB) |
| **DATA subscribe only while open** | `serial-port-store.ts` | Unsubscribe `serialport/data` on Close |
| **Topic Tap** | `useLabTopicTap.ts` | Throttle status/monitor/data display; pause on Close in `useLabSerialPort` |

**After `git pull`:** always **Ctrl+C** and re-run `npm run start:bridge`. Vite: hard refresh (Ctrl+Shift+R).

### 3.3 User symptom → cause → action

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Flood continues after **Close** | Old bridge binary still running | Restart `npm run start:bridge` |
| Flood after **unplug** without Close | USB garbage RX, session still active | Click **Close**; wait ~2s; or restart bridge |
| `Close port timeout` in Activity | Pre-`eaa347f` bridge blocked on `port.close()` | Pull `BS2`, restart bridge |
| `resync skips` ≈ `uartBytesIn` | Garbage bytes, not valid BS2 | Expected on floating RX; gate should stop publish |
| Topic Tap shows `serialport/data` with High volume **off** | Rows are `t3d/broker/monitor` echoing publishes | Filter monitor or disable high-volume topics in tap logic (already partially filtered) |
| **Loopback** grey + COM open | Real hardware path | Correct — not simulator |

---

## 4. Firmware SENSOR_CFG defaults (reference)

Source: `TESAIoT_Library/CM55/modules/bitstream/protocol/src/bitstream_bs_cfg.c` → `bitstream_bs_cfg_init_defaults()`.

| BS2 `sensorId` | Sensor | Publish mode | Sample / UART period | Mask (boot) |
|----------------|--------|--------------|----------------------|-------------|
| 0 | BMI270 | PERIODIC (0) | 1000 ms | ACC+GYR `0x03` |
| 1 | BMM350 | PERIODIC | 1000 ms | `0x03` |
| 2 | SHT40 | PERIODIC | 1000 ms | `0x03` |
| 3 | DPS368 | PERIODIC | 1000 ms | `0x03` |

Also: `minPublishIntervalMs = 50`, `publishIntervalMs = 0` (use sampling interval). BS process tick **10 ms**; publish gated by intervals, not every tick.

**BMI270 stream mode (compile):** `BITSTREAM_BMI270_STREAM_MODE=0` (RAW) in `proj_cm55/bitstream.mk` — not fusion unless changed.

Live config may differ after host **SENSOR_CFG_SET** — verify with `npm run bitstream2:uart-probe` or Lab BS2 panel when wired.

---

## 5. Next implementation work (phases 4–8)

Implement in order unless user reprioritizes. Update **`README.md`** phase table and this file when each phase ships.

| Phase | Panel / hook | Spec |
|-------|----------------|------|
| **4** | `LoopbackPanel`, `PublishPanel` | `README.md` §registry; loopback topics in `lib/labTopics.ts` |
| **5** | `BrokerObservabilityPanel` | `docs/BROKER_OBSERVABILITY.md` |
| **6** | `ProtocolAnalyticsPanel` | `docs/PROTOCOL_ANALYTICS.md` |
| **7** | `BridgeObservabilityPanel` | `docs/BRIDGE_OBSERVABILITY.md` |
| **8** | RUNBOOK maintenance, optional `serialport/bridge/telemetry` topic | Bridge + Lab parity |

**Broker observability:** Copy aggregation into `bitstream-lab/lib/` — do **not** import from `bitstream-app` (isolation). Types only from `broker-monitor-events.ts`.

---

## 6. Files touched in `eaa347f` (quick index)

```
t3d-extension/src/webview/bitstream-lab/          # new module
t3d-extension/scripts/dev-bitstream-lab.mjs
t3d-extension/src/serialport-bridge/SerialPortWebSocketBridge.ts
t3d-extension/src/serialport-bridge/protocol.ts
t3d-extension/src/serialport/T3DSerialPort.ts
t3d-extension/src/webview/serialport/serial-port-store.ts
t3d-extension/src/webview/main.tsx
t3d-extension/src/webview/WebviewRoot.tsx
t3d-extension/package.json
t3d-extension/HOW_TO_RUN.md
AGENT_HANDOFF.md
```

---

## 7. Tests and compile

```bash
cd t3d-extension
npm run compile
node --import tsx --test tests/bitstream2/sensor-synth.test.ts
npm run bitstream2:uart-probe -- --path COM3 --baud 921600   # hardware
```

---

## 8. Related firmware workspace

| Doc | Path |
|-----|------|
| Firmware handoff | `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Firmware\AGENT_HANDOFF.md` |
| BS2 wire in library | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| UART CLI matrix | `t3d-extension/src/bitstream2/dev/UART_TEST_COMMANDS.md` |

---

## 9. Session log (append when you ship Lab/bridge work)

| Date | Summary |
|------|---------|
| 2026-05-27 | Lab phases 0–3 + serial bridge close flood fixes; commit `eaa347f` |
| | *(add next row)* |
