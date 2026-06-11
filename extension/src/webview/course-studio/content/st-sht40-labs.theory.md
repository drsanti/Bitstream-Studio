# SHT40 — Hands-on labs & Bitstream Studio

Workshop labs on the DevKit plus embedded UART probes. Use toolbar **Bitstream** + **Link** (or **Simulator** as fallback).

---

## Workshop labs (DevKit)

### Lab 1 — Warm-up (temperature)

1. Link DevKit (**Bitstream** + **Link**).
2. Note baseline temperature in **Sensor Telemetry**.
3. Cup the board in both hands for **30 seconds**.
4. **Expect:** temperature rises **1–3 °C**; humidity may rise slightly from breath.

### Lab 2 — Dry air (humidity)

1. Hold the board near a desk fan or AC vent (not too close to condensation).
2. **Expect:** humidity drifts **down slowly** over 30–60 s; temperature may dip slightly.

### Lab 3 — Steady room (periodic trace)

1. Leave the board flat on the table.
2. Set **publish mode** to **Periodic**, sampling **1–2 s**.
3. **Expect:** gentle trace; small noise ±0.1 °C is normal.

### Lab 4 — Channel mask

1. Open SHT40 **Telemetry channels**; disable **Humidity**, **Apply**.
2. **Expect:** only temperature updates in the deck.
3. Re-enable humidity and confirm both return.

---

## Embedded labs

### Lab 5 — UART probe

From `extension/`:

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter for `sensorId: 2` / SHT40; confirm TEMP and HUM int16 values match hand warmth experiment (÷100).

### Lab 6 — Rate change

1. Set `samplingIntervalMs` from **200** → **2000**, **Apply**, wait **≥600 ms**.
2. Count EVT rate (should drop to ~0.5 Hz).

### Lab 7 — Error path (instructor / advanced)

When `sensor_sht40_read()` fails: port returns **-2**, state → `ERROR`, last good sample may remain until **stale** timeout. Recovery: power cycle or soft reset (`sht4x_soft_reset`).

---

## Build it in Bitstream Studio

### Sensor Telemetry (workshop Ch2)

1. Open telemetry deck with DevKit linked.
2. Locate **SHT40** temperature and humidity.
3. Study dual progress bar patterns (humidity bar).
4. Show value, unit, and bar percent side by side.

### Sensor Studio (workshop Ch4)

1. Add **SHT40** sensor node.
2. Wire **temperature** → **Radial Gauge** (°C live).
3. Insert **Math** node: °C → °F (`°F = °C × 9/5 + 32`).
4. Save flow; reload and verify.

### Weather strip (workshop Ch5)

Place **SHT40** temperature beside **DPS368** pressure on one stage — preview for the four-sensor dashboard narrative.

### Course Studio (workshop Ch6)

Embed thermometer / droplet infographic widgets bound to `temperatureC` and `humidityPct`. Use a consistent warm accent (workshop examples use `#5ee89a`).

---

## External dashboards (embedded)

| Item | Value |
|------|-------|
| Provider WebSocket | `ws://127.0.0.1:9997` |
| Sensor id | `sht40` |
| Field keys | `temperatureC`, `humidityPct` |
| Example HTML | `extension/docs/workshop/examples/sht40-climate-dashboard.html` |

Regenerate example HTML:

```bash
node extension/docs/workshop/scripts/generate-workshop-html.mjs
```
