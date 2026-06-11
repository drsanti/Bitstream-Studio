# DPS368 — Hands-on labs & Bitstream Studio

Workshop labs on the DevKit plus embedded UART probes. Use toolbar **Bitstream** + **Link** (or **Simulator** as fallback).

---

## Workshop labs (DevKit)

### Lab 1 — Sea-level baseline

1. Link DevKit (**Bitstream** + **Link**).
2. Open **DPS368** in Sensor Telemetry.
3. **Expect:** pressure near **1000–1020 hPa** indoors; say *"about one thousand hectopascals."*

### Lab 2 — Slow drift story

1. Note pressure at session start.
2. Compare after lunch or HVAC cycle (if any).
3. **Expect:** small drift (often < 1 hPa) — discuss weather / air mass, not sensor noise.

### Lab 3 — Weather strip with SHT40

1. Enable **SHT40** and **DPS368** on the telemetry deck.
2. Place boards side by side in the same air.
3. **Expect:** climate (temp/RH) moves faster than pressure; narrate *"room weather panel."*

### Lab 4 — Sea-level bar

1. Map **900–1100 hPa** on a gauge or bar widget.
2. Show numeric hPa beside percent.
3. **Expect:** ~1013 hPa → bar slightly above mid-scale.

### Lab 5 — Lift test (expect no drama)

1. Rest on desk → note pressure.
2. Lift board ~50 cm for 30 s → return to desk.
3. **Expect:** no obvious change — debunk *"pressure as altitude meter at desk scale."*

---

## Embedded labs

### Lab 6 — UART probe

From `extension/`:

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter `sensorId: 3`; verify PRESS wire ÷10 matches bench readout.

### Lab 7 — Mask pressure-only

1. Disable **Temp** channel in telemetry mask, **Apply**.
2. Confirm EVT payload shrinks to one int16 (PRESS only).

### Lab 8 — Recovery observe (instructor)

With logging enabled, watch port retry and optional re-init after 5 consecutive read failures.

---

## Build it in Bitstream Studio

### Sensor Telemetry (workshop Ch2)

1. Locate **DPS368** pressure (and optional chip temp).
2. Study pressure bar; show **900–1100 hPa** band in meta copy.

### Sensor Studio (workshop Ch4)

1. Add **DPS368** sensor node.
2. Wire **pressure** → **Radial Gauge** or numeric readout.
3. Optional: **Map Range** 900–1100 → 0–100 for gauge fill.

### Weather strip (workshop Ch5)

Side-by-side **SHT40** (temp + humidity) and **DPS368** (pressure) on one stage.

### Course Studio (workshop Ch6)

Manometer column or pressure ring infographic; workshop accent **`#5eb8f5`** (cool blue).

---

## External dashboards (embedded)

| Item | Value |
|------|-------|
| Provider WebSocket | `ws://127.0.0.1:9997` |
| Sensor id | `dps368` |
| Primary field | `pressureHpa` |
| Secondary field | `temperatureC` (chip) |
| Example HTML | `extension/docs/workshop/examples/dps368-pressure-dashboard.html` |
