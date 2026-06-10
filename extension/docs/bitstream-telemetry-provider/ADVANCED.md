# Bitstream Telemetry Provider — advanced / R2

For **Node probes**, **MCP agents**, and experts who need full BS2 broker access.

**Default external apps** (HTML dashboards, React on localhost, Course Studio iframes) should use:

| Tier | Port | Doc |
|------|------|-----|
| **R0** | **9997** | [SDK.md](./SDK.md), [IFRAME.md](./IFRAME.md) |
| **R1** | 9997 commands | [EVENTS.md](./EVENTS.md) § R1 |

**Do not** point browser HTML at port **9998** — use the public provider or `postMessage`.

---

## R2 — When you need the raw broker

Use **9998** only when you:

- Write **Node/CLI** tools inside Bitstream Studio (`uart-probe`, MCP, CI)
- Need **topics** not exposed on 9997 (`bitstream2/metrics`, `bitstream2/dev/sim/state`, `serialport/*`)
- Must publish **`bitstream2/req`** with arbitrary `cmdId` / `bodyB64` before R1 allowlist exists
- Debug **framing/CRC** or bridge routing

You must then:

1. Subscribe to `bitstream2/evt/sensor` and map wire integers → human fields yourself, **or**
2. Duplicate logic from `mapBs2ToProviderSample` / [sensor-catalog.v1.json](./sensor-catalog.v1.json)

---

## Broker transport (port 9998)

Bitstream Studio runs a **TERNION WebSocket broker** (`T3DWebSocketServer`) on **`ws://127.0.0.1:9998`** by default.

### Connection

1. Open WebSocket to `ws://127.0.0.1:9998`
2. Optional: send client hello (identity for logs)
3. **Subscribe** to topics (JSON control messages)
4. Receive **`message`** frames with `topic` + `payload`

Canonical wire protocol: `extension/src/websocket/ARCHITECTURE.md` _(Bitstream Studio repo)_.

### Subscribe (client → broker)

```json
{
  "type": "subscribe",
  "topic": "bitstream2/evt/sensor",
  "qos": 0,
  "channel": "json"
}
```

### Incoming sample (broker → client)

```json
{
  "type": "message",
  "topic": "bitstream2/evt/sensor",
  "payload": {
    "sensorId": 2,
    "mask": 3,
    "counter": 1842,
    "tMs": 120450,
    "values": [2456, 4820],
    "atMs": 1718034123456,
    "origin": "uart"
  },
  "qos": 0
}
```

| Field | Meaning |
|-------|---------|
| `sensorId` | 0 BMI270 · 1 BMM350 · 2 SHT40 · 3 DPS368 |
| `mask` | Active channel bits (sensor-specific) |
| `values` | Wire integers in mask order — divide by catalog `wireScale` |
| `origin` | `uart` (hardware) or `sim` (simulator inject) |

### Map to public `fields` (example SHT40)

Catalog: `temperatureC` wire÷100, `humidityPct` wire÷100.

```javascript
const tempC = values[0] / 100;
const humidityPct = values[1] / 100;
```

Full field order per sensor: [SENSOR_CATALOG.md](./SENSOR_CATALOG.md) and firmware `BS_WIRE.md` _(TESAIoT_Library)_.

---

## BS2 topics (primary)

| Topic | Direction | Content |
|-------|-----------|---------|
| `bitstream2/hello` | bridge → clients | Firmware handshake (`version`, `caps`, `fwTag`) |
| `bitstream2/evt/sensor` | bridge → clients | Decoded samples (table above) |
| `bitstream2/metrics` | bridge → clients | UART CRC / resync counters |
| `bitstream2/req` | clients → bridge | BS2 command request |
| `bitstream2/res` | bridge → clients | Command response |
| `bitstream2/telemetry/route` | webview → bridge | `{ mode: "uart" \| "simulator" }` |
| `bitstream2/dev/sim/state` | sim → clients | Simulator SENSOR_CFG snapshot |
| `bitstream2/dev/inject-rx` | clients → bridge | Inject UART bytes (sim path) |
| `bitstream2/sim/status` | external sim → clients | Simulator heartbeat |

Topic constants: `extension/src/bitstream2/bridge/protocol.ts` → `BITSTREAM2_TOPICS`.

---

## Serial port topics (open COM from Node)

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `serialport/open` | client → bridge | Open COM (`path`, `baudRate`, `leaseOwner`) |
| `serialport/open-result` | bridge → clients | Success / error |
| `serialport/close` | client → bridge | Release COM |
| `serialport/status` | bridge → clients | Open path, baud |

**macOS path example:** `/dev/cu.usbmodem1103` @ **921600**.

Only **one** lease owner should hold the port (UI **or** probe **or** MCP — not mixed without coordination).

---

## Commands (`bitstream2/req` / `res`)

### Typed request

```json
{
  "type": "publish",
  "topic": "bitstream2/req",
  "payload": {
    "requestId": "probe-ping-1",
    "reqId": 1,
    "cmdId": 1,
    "bodyB64": "",
    "timeoutMs": 4000
  },
  "qos": 0
}
```

### Response on `bitstream2/res`

```json
{
  "requestId": "probe-ping-1",
  "ok": true,
  "cmdId": 1,
  "status": 0,
  "bodyB64": "",
  "atMs": 1718034123999
}
```

| `cmdId` | Name | Notes |
|---------|------|-------|
| `0x01` | PING | Link check |
| `0x02` | CAPS_GET | Capability bytes |
| `0x10` | SENSOR_CFG_GET | Body: sensorId byte |
| `0x11` | SENSOR_CFG_SET | 12-byte v2.1 body |
| `0x14` | BMI270_MODE_SET | 1 byte mode |
| `0x15` | BMI270_MODE_GET | Returns mode byte |

Full wire spec: [BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md](../BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md) _(Bitstream Studio repo)_.

**Prefer R1** on port 9997 for apps: `bitstream:command` with names like `sensor.cfg.get` — see [EVENTS.md](./EVENTS.md).

---

## Reference clients (repo)

| Client | Path | Use |
|--------|------|-----|
| `Bs2BrokerSession` | `src/bitstream2/bridge/bs2-broker-session.ts` | MCP, probes — subscribe, `sendReq`, open COM |
| `T3DWebSocketClient` | `src/websocket/T3DWebSocketClient.ts` | Low-level broker peer |
| `run-uart-probe.ts` | `src/bitstream2/dev/run-uart-probe.ts` | Hardware checklist |
| `run-provider-uart-smoke.ts` | `src/bitstream2/dev/run-provider-uart-smoke.ts` | UART + public provider 9997 |

### Bring-up commands

```bash
cd extension
npm run start:bridge
npm run bitstream2:uart-probe -- --path=/dev/cu.usbmodem1103 --baud=921600
npx tsx src/bitstream2/dev/run-provider-uart-smoke.ts --path=/dev/cu.usbmodem1103
```

---

## MCP agents (Cursor)

MCP tools operate on the **same broker** as the Bitstream webview:

| Tool | Role |
|------|------|
| `bitstream_health_check` | Link readiness |
| `bitstream_sensor_latest_samples_get` | Recent decoded samples |
| `bitstream_sensor_config_get` | `SENSOR_CFG` |
| `bitstream_run_command` | Typed BS2 commands |

Skills: `bs2-uart-bringup`, `bs2-protocol-change`  
Architecture: `extension/src/webview/bitstream-app/docs/FIRMWARE_MULTI_CLIENT_AND_MCP_ARCHITECTURE.md`

**AI agents building user dashboards** should follow [SKILL.md](./SKILL.md) (public `bitstream:*` on **9997**), not raw `cmdId` in generated HTML.

---

## Telemetry route gating

Only one backend active: **Bitstream (UART)** or **Simulator**.

- Webview publishes `bitstream2/telemetry/route` with `{ mode: "uart" | "simulator" }`
- Bridge gates real COM vs `inject-rx`
- Samples include `origin: "uart" | "sim"`
- Public provider on 9997 reflects `connection.route`

Details: [TELEMETRY_MODE_LIFECYCLE.md](../TELEMETRY_MODE_LIFECYCLE.md) _(Bitstream Studio repo)_.

---

## Decode location

BS2 UART decoding runs in **`SerialPortWebSocketBridge`** (`BsUartDecoder`). Clients on 9998 receive **already decoded** `bitstream2/evt/sensor` JSON — not raw `BS ` frames.

Do **not** re-implement framing in dashboard HTML. Do **not** subscribe to legacy `serialport/data` for BS2 telemetry.

---

## Security and deployment

| Rule | Reason |
|------|--------|
| Bind **9998** / **9997** to **127.0.0.1** only | Local dev tool — no auth on broker |
| Never expose 9998 to the public internet | Full firmware control surface |
| Browser apps → **9997** or **postMessage** | Stable contract, allowlisted commands |
| VSIX / extension starts bridge on user machine | Same localhost trust model |

---

## Tier summary

| Tier | API | Audience |
|------|-----|----------|
| **R0** | `bitstream:*` on **9997**, iframe `postMessage` | HTML, React, Course Studio |
| **R1** | `bitstream:command` / `response` on 9997 | Config labs, tooling |
| **R2** | `bitstream2/*` on **9998** | Node, MCP, firmware engineers |

---

## See also

- [README.md](./README.md) — kit overview
- [EVENTS.md](./EVENTS.md) — public event payloads
- [SDK.md](./SDK.md) — `BitstreamTelemetryClient`
- [BS2_PROTOCOL_INDEX.md](../BS2_PROTOCOL_INDEX.md) — canonical spec index _(repo)_
