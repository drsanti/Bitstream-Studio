---
name: bitstream-telemetry-provider
description: >-
  Build external apps that consume decoded Bitstream live sensor data.
  Use for Course Studio HTML blocks, React localhost dashboards, telemetry
  gauges, bitstream:sample events, sensor catalog, or ws://127.0.0.1:9997.
---

# Bitstream Telemetry Provider — AI agent skill

**This file lives in the portable developer kit.** Upload the parent folder `bitstream-telemetry-provider/` to external AI tools, or attach it as project context.

**Human overview:** [README.md](./README.md)

---

## AI agent workflow (read first)

### 1. Try live data first

| App context | Connect how |
|-------------|-------------|
| **Course Studio HTML iframe** | `window.parent.postMessage({ type: "bitstream:ready", v: 1, payload: { clientId } }, "*")` then listen for `bitstream:*` on `message` — **do not** open a WebSocket inside the iframe |
| **Standalone HTML / React on localhost** | `WebSocket("ws://127.0.0.1:9997")` or [client/BitstreamTelemetryClient.ts](./client/BitstreamTelemetryClient.ts) |
| **Course iframe opened in browser tab** | Same as standalone — use `ws://127.0.0.1:9997` |

Wait for `bitstream:catalog`, `bitstream:config`, and `bitstream:sample`. Use [EXAMPLES/](./EXAMPLES/) as templates — each implements this pattern.

### 2. Mock fallback when live is unavailable

If the WebSocket **cannot connect**, **closes**, or **no samples arrive** after a short wait, **start mock/demo data** so the UI still renders and can be reviewed. All three [EXAMPLES/](./EXAMPLES/) use this pattern for standalone mode (sine or catalog-scaled fake samples).

- Label mock state in UI (e.g. status line: “Mock data — connect Bitstream Studio for live stream”).
- When live connects, **stop mock** and switch to `bitstream:sample`.
- In **Course Studio iframes**, the parent usually pushes live data after `bitstream:ready`; mock is mainly for **offline preview** or **standalone** tabs.

### 3. Plain language for operators (required)

**Do not** put UART, baud rate, COM port names, or wire-protocol details in user-facing copy, comments, or setup steps you generate for dashboard authors.

| Avoid | Use instead |
|-------|-------------|
| UART, COM3, `/dev/cu.usbmodem…`, 921600 | **Bitstream** (live hardware path) or **Simulator** |
| BS2 frames, `EVT_SENSOR`, broker 9998 | **telemetry provider**, `bitstream:sample`, port **9997** (or postMessage in iframe) |
| SENSOR_CFG, mask hex in UI text | **sensor config**, **active fields** from `bitstream:config` |

R2 raw broker details belong only in [ADVANCED.md](./ADVANCED.md) — not in generated HTML dashboards.

---

## When to use

- User builds **HTML dashboard** for Course Studio
- User builds **React / localhost** telemetry app
- User asks how to **subscribe to live sensor data** without low-level protocol knowledge
- User mentions **bitstream:sample**, **telemetry provider**, or **sensor catalog**

## Do not

- Parse wire frames or internal bridge protocols in the app
- Use `ws://127.0.0.1:9998` in **iframe HTML** (use postMessage)
- Invent gauge min/max — use **sensor-catalog.v1.json** `fields[].min` / `max`
- Treat gyro/accel as 0–100 physical units — **% on a bar is mapped**, not the sensor unit
- Use `gx` in code — catalog key is **`gyroX`** (see [SENSOR_CATALOG.md § Field aliases](./SENSOR_CATALOG.md#field-aliases-user-names--catalog-keys))
- Poll in a loop — config is **push on change**; `bitstream:request` only for recovery
- Block the UI when live data is down — **use mock fallback** (see workflow above)

## Building gauges and progress bars

1. **Resolve field** — map user words (`gx`, “gyro x”) → catalog key (`gyroX`) via [SENSOR_CATALOG.md](./SENSOR_CATALOG.md)
2. **Resolve range** — default: `fields[].min` / `max` from catalog or runtime `bitstream:catalog` (not 0…100 unless field is `%RH`)
3. **Map to 0–100%** — `percent = clamp((value - min) / (max - min) * 100, 0, 100)` — see [RECIPES.md](./RECIPES.md)
4. **Subscribe** — `bitstream:sample` → `payload.fields` for the target sensor
5. **Check mask** — `bitstream:config` → `maskLabels` before assuming a field is present every frame
6. **Pick a starter example** — copy the closest [EXAMPLES/](./EXAMPLES/) file:

| Example | Sensor / field |
|---------|----------------|
| [sht40-humidity-progress-bar.html](./EXAMPLES/sht40-humidity-progress-bar.html) | `humidityPct` |
| [dps368-pressure-progress-bar.html](./EXAMPLES/dps368-pressure-progress-bar.html) | `pressureHpa` |
| [gyro-x-progress-bar.html](./EXAMPLES/gyro-x-progress-bar.html) | `gyroX` (auto-enables gyro on **Bitstream** when missing from config) |

**BMI270 gyroX defaults:** min **-5**, max **+5** rad/s → `gyroX = 0` → **50%** bar (not 0%).

## Pick the consumer path

| App | Transport | Read |
|-----|-----------|------|
| Course HTML / iframe | `postMessage` `bitstream:*` | [IFRAME.md](./IFRAME.md) |
| React on localhost | SDK → `ws://127.0.0.1:9997` | [SDK.md](./SDK.md) |
| Node / MCP / expert | Raw broker 9998 (R2) | [ADVANCED.md](./ADVANCED.md) |

## Public events (v1)

Envelope: `{ type, v: 1, payload }` — full spec: [EVENTS.md](./EVENTS.md)

| type | Use |
|------|-----|
| `bitstream:catalog` | Field keys, units, min/max, `staleAfterMs` |
| `bitstream:config` | Current sensor config per device (push on change) |
| `bitstream:sample` | Live data — read `payload.fields` |
| `bitstream:connection` | Link / route state (`bitstream` \| `simulator`) |
| `bitstream:ready` | iframe → parent handshake |
| `bitstream:request` | Optional refresh (`catalog`, `config`) |
| `bitstream:stale` | No sample within `staleAfterMs` (per sensor, from catalog) |
| `bitstream:command` / `bitstream:response` | R1 advanced control |

JSON Schema: [SCHEMA.v1.json](./SCHEMA.v1.json)

## Sample handling

```javascript
// payload.fields are human-scale (°C, hPa, rad/s, …)
if (payload.sensor === "bmi270" && typeof payload.fields.gyroX === "number") {
  const pct = ((payload.fields.gyroX - displayMin) / (displayMax - displayMin)) * 100;
}
```

Check `bitstream:config` for `maskLabels` — `sample.fields` may be a partial mask per frame.

## Static catalog

- JSON in this folder: [sensor-catalog.v1.json](./sensor-catalog.v1.json)
- Reference: [SENSOR_CATALOG.md](./SENSOR_CATALOG.md)
- Recipes: [RECIPES.md](./RECIPES.md) · Examples: [EXAMPLES/](./EXAMPLES/)
- Sensors: `bmi270`, `bmm350`, `sht40`, `dps368`

## Prerequisites (live data)

```bash
cd extension   # Bitstream Studio repo
npm start   # starts telemetry provider on ws://127.0.0.1:9997
```

In the toolbar, link **Bitstream** (hardware) or **Simulator**. Provider also starts with the packaged extension bridge (VSIX).

Standalone client copy: [client/BitstreamTelemetryClient.ts](./client/BitstreamTelemetryClient.ts)

## Adding a sensor (Bitstream Studio contributors)

1. `src/bitstream2/domains/sensors/`
2. `telemetry-provider/catalog/sensor-catalog-source.ts`
3. `npm run bitstream2:telemetry-catalog:gen` — syncs this kit, standalone client, **Course `telemetry-examples/`**, and `telemetryExampleHtml.generated.ts`
4. `npm run test:bitstream2`
5. Bump `SENSOR_CATALOG_VERSION` and commit kit changes
