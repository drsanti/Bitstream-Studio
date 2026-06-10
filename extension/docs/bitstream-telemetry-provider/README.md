# Bitstream Telemetry Provider — developer kit (v1)

**Upload this entire folder** to external developers or AI coding agents. Everything needed to build live sensor apps is self-contained here.

**Status:** **Shipped** — catalog, gateway (`ws://127.0.0.1:9997`), Course Studio postMessage bridge, R1 commands, SDK client, three EXAMPLES, Course live-topic demos.

**AI agents:** start with **[SKILL.md](./SKILL.md)** — connect live first (`ws://127.0.0.1:9997` or iframe `postMessage`), then **mock fallback** if unavailable; use plain **Bitstream** / **Simulator** language (not UART/baud in user-facing copy).

---

## Folder contents

| File | Purpose |
|------|---------|
| **[SKILL.md](./SKILL.md)** | **Start here for AI agents** — workflow, do/don't, consumer paths |
| [RECIPES.md](./RECIPES.md) | **Progress bars, gauges, field mapping** |
| [EXAMPLES/gyro-x-progress-bar.html](./EXAMPLES/gyro-x-progress-bar.html) | BMI270 `gyroX` → 0–100% bar |
| [EXAMPLES/sht40-humidity-progress-bar.html](./EXAMPLES/sht40-humidity-progress-bar.html) | SHT40 `humidityPct` → 0–100% bar |
| [EXAMPLES/dps368-pressure-progress-bar.html](./EXAMPLES/dps368-pressure-progress-bar.html) | DPS368 `pressureHpa` → sea-level band bar |
| [client/BitstreamTelemetryClient.ts](./client/BitstreamTelemetryClient.ts) | Standalone WS client (copy into external apps) |
| [EVENTS.md](./EVENTS.md) | All `bitstream:*` event payloads |
| [IFRAME.md](./IFRAME.md) | Course Studio HTML blocks (`postMessage`) |
| [SDK.md](./SDK.md) | React / vanilla apps on `localhost` |
| [ADVANCED.md](./ADVANCED.md) | Raw broker (9998), MCP, R2 experts |
| [SENSOR_CATALOG.md](./SENSOR_CATALOG.md) | Catalog reference, **field aliases**, range types |
| [sensor-catalog.v1.json](./sensor-catalog.v1.json) | Machine-readable sensor specs |
| [SCHEMA.v1.json](./SCHEMA.v1.json) | JSON Schema for event envelopes |

---

## What it is

Decoded, human-scale **real-time sensor data** from Bitstream Studio — your app never parses low-level device wire format.

| Layer | Role |
|-------|------|
| Device / simulator | Sensor samples |
| Bridge (internal) | Decodes → internal broker on port **9998** |
| **Telemetry Provider** | Public `bitstream:*` events on port **9997** |
| Your app | Subscribe to **`bitstream:sample`** → `payload.fields` |

**Do not** parse wire frames or use internal bridge decoders in app code.

---

## Consumers

| Consumer | Transport | Doc |
|----------|-----------|-----|
| Course Studio HTML iframe | `postMessage` | [IFRAME.md](./IFRAME.md) |
| React on localhost | SDK → `ws://127.0.0.1:9997` | [SDK.md](./SDK.md) |
| Node / MCP / expert | Raw broker 9998 | [ADVANCED.md](./ADVANCED.md) |
| Offline UI design | [sensor-catalog.v1.json](./sensor-catalog.v1.json) | [SENSOR_CATALOG.md](./SENSOR_CATALOG.md) |

### API tiers

| Tier | Events |
|------|--------|
| **R0** (default) | `catalog`, `config`, `sample`, `hello`, `connection`, `stale` |
| **R1** | `command`, `response`, `request` |
| **R2** | Raw `bitstream2/*` on 9998 — [ADVANCED.md](./ADVANCED.md) |

---

## Prerequisites (live data)

```bash
cd extension   # Bitstream Studio repo
npm start
```

Toolbar: **Bitstream** (hardware) or **Simulator**. Public API: **`ws://127.0.0.1:9997`** (also started from the VSIX bridge).

**Offline / no studio running:** build the UI with **mock data** first (see [EXAMPLES/](./EXAMPLES/)); switch to live when the provider connects.

---

## Quick example

```javascript
// bitstream:sample — values already scaled
if (payload.sensor === "sht40") {
  console.log(payload.fields.temperatureC, "°C");
  console.log(payload.fields.humidityPct, "%RH");
}
```

Use [sensor-catalog.v1.json](./sensor-catalog.v1.json) for gauge min/max and per-sensor `staleAfterMs`. Use `bitstream:config` for active fields.

---

## Bitstream Studio repo (contributors)

TypeScript catalog source: `extension/src/bitstream2/telemetry-provider/catalog/sensor-catalog-source.ts`

Regenerate this kit and sync Course bundled examples:

```bash
cd extension
npm run bitstream2:telemetry-catalog:gen
npm run test:bitstream2
```

Also copies EXAMPLES → `course-studio/content/telemetry-examples/` and generates `telemetryExampleHtml.generated.ts`. Live course pages: **SHT40 / DPS368 / BMI270 → Live visualization**.

Smoke (contributors, hardware): `npm run bitstream2:provider-uart-smoke -- --path=…`

---

## Shipped phases

| Phase | Deliverable |
|-------|-------------|
| **P0** | Catalog + contract + this kit |
| **P0.5** | RECIPES, aliases, progress-bar examples |
| **P1** | Course Studio postMessage bridge |
| **P2** | R1 commands + live `bitstream:config` |
| **P3** | `BitstreamTelemetryClient` SDK |
| **P4** | Gateway `ws://127.0.0.1:9997` (in `start:bridge` / VSIX) |

**Deferred:** npm package publish for the client (kit copy is sufficient for now).
