# Bitstream Telemetry Provider — React / localhost SDK

For **standalone React**, **Vite**, or **vanilla HTML** served on `localhost` (not inside a Course Studio iframe).

**Public endpoint:** `ws://127.0.0.1:9997`

---

## Prerequisites

```bash
cd extension
npm start
```

That starts the **telemetry provider** (`:9997`) with the dev stack. Link telemetry in the toolbar (**Bitstream** or **Simulator**).

**Try WebSocket first** — if `ws://127.0.0.1:9997` is unreachable, keep the UI alive with mock samples until the studio is running (see [EXAMPLES/](./EXAMPLES/) and [SKILL.md](./SKILL.md)).

For a minimal stack without the supervisor:

```bash
npm run start:bridge   # broker :9998 + telemetry provider :9997
npm run dev:webview
```

`start:telemetry-provider` is only needed when the broker is already running **without** the combined bridge (rare).

---

## SDK (shipped in repo)

Source: `extension/src/bitstream2/telemetry-provider/client/`

Copy `BitstreamTelemetryClient.ts` into external apps, or import from the Bitstream Studio workspace when developing side-by-side.

### Vanilla / React

```typescript
import { BitstreamTelemetryClient } from "../../../bitstream2/telemetry-provider/client/BitstreamTelemetryClient";

const client = new BitstreamTelemetryClient({
  url: "ws://127.0.0.1:9997",
});

await client.connect();

client.on("catalog", (catalog) => {
  console.log("sensors", catalog.sensors.map((s) => s.id));
});

client.on("config", (config) => {
  console.log("active mask", config.sensors.sht40?.maskLabels);
});

client.on("sample", (sample) => {
  if (sample.sensor === "dps368") {
    updateGauge("pressure", sample.fields.pressureHpa);
  }
});

client.on("connection", (state) => {
  setLinked(state.state === "connected" && state.providerReady);
});
```

Same `payload` shapes as [EVENTS.md](./EVENTS.md).

---

## React hook

```typescript
import { useBitstreamTelemetry } from "../../../bitstream2/telemetry-provider/client/useBitstreamTelemetry";

function PressureCard() {
  const { sample, catalog, config, connection, connected } = useBitstreamTelemetry({
    sensor: "dps368",
  });

  const limits = catalog?.sensors.find((s) => s.id === "dps368")
    ?.fields.find((f) => f.key === "pressureHpa");

  const pressure = sample?.fields.pressureHpa;

  return (
    <Gauge
      value={pressure}
      min={limits?.min ?? 900}
      max={limits?.max ?? 1100}
      unit="hPa"
      linked={connected}
    />
  );
}
```

---

## Commands (R1)

```typescript
const res = await client.command("sensor.cfg.get", { sensor: "sht40" });
if (res.ok) {
  console.log(res.data);
}
```

Allowlist: `ping`, `caps.get`, `sensor.cfg.get`, `sensor.cfg.set`, `bmi270.mode.get`, `bmi270.mode.set` — see [EVENTS.md](./EVENTS.md).

---

## Static catalog without live hardware

```typescript
import catalog from "./sensor-catalog.v1.json";
```

Regenerate after catalog changes:

```bash
npm run bitstream2:telemetry-catalog:gen
```

---

## CORS and ports

| Port | Service | External localhost apps |
|------|---------|-------------------------|
| **9997** | Telemetry Provider (public) | **Use this** |
| **9998** | Internal T3D broker | R2 advanced only |
| **5173** | Vite dev webview | Bitstream Studio UI |

---

## See also

- [README.md](./README.md)
- [IFRAME.md](./IFRAME.md) — Course Studio HTML blocks (postMessage, no WS)
- [ADVANCED.md](./ADVANCED.md)
