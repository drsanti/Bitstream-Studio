# Dashboard annex — four sensors (Chapter 6)

**Attach with:** [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)

**Also attach** field details from:

- [SENSOR_SHT40.md](./SENSOR_SHT40.md)
- [SENSOR_DPS368.md](./SENSOR_DPS368.md)
- [SENSOR_BMI270.md](./SENSOR_BMI270.md)
- [SENSOR_BMM350.md](./SENSOR_BMM350.md)

---

## Deliverable

| Property | Value |
|----------|-------|
| **Output file** | `extension/docs/workshop/examples/workshop-four-sensor-dashboard.html` |
| **Title** | `TESAIoT DevKit — four sensor dashboard` |
| **Layout** | Single page, **2×2 grid** of sensor panels (responsive → stack on narrow width) |

---

## Grid layout

```text
┌─────────────────────┬─────────────────────┐
│  BMI270 — Motion    │  SHT40 — Climate      │
│  (teal #42e8ff)     │  (green #5ee89a)      │
├─────────────────────┼─────────────────────┤
│  DPS368 — Pressure  │  BMM350 — Magnetic    │
│  (blue #5eb8f5)     │  (violet #b88cff)     │
└─────────────────────┴─────────────────────┘
```

Page header: **TESAIoT DevKit live dashboard** + global status line (connection route, Live/Mock/Stale).

---

## Per-panel minimum widgets

| Panel | Widgets |
|-------|---------|
| **BMI270** | `gyroX` bar (−1…+1 rad/s); accel strength bar (0…20 m/s²) |
| **SHT40** | `temperatureC` bar (0…50 °C); `humidityPct` bar (0…100) |
| **DPS368** | `pressureHpa` bar (900…1100 hPa) |
| **BMM350** | `magX`, `magY`, `magZ` bars (±100 µT) — compact row or stacked |

Each panel: own accent border tint, section title, panel-level stale if that sensor’s samples stop.

---

## Sample routing

One WS connection; filter each `bitstream:sample` by `payload.sensor`:

- `bmi270` → motion panel
- `sht40` → climate panel
- `dps368` → pressure panel
- `bmm350` → magnetic panel

Apply catalog once; share `valueToPercent` helper.

---

## Mock mode

When mock is active, animate **all four** panels with coordinated slow phases (not identical sine — offset phases per sensor).

---

## Read-only / HTML Editor

Same rules as master: no commands. BMI270 missing-field hint per [SENSOR_BMI270.md](./SENSOR_BMI270.md).

---

## Copy-paste prompt for AI agent

```text
Generate a single self-contained HTML file for the TESAIoT Bitstream Studio workshop (Chapter 6 capstone).

Read and follow:
- extension/docs/workshop/prompts/MASTER_HTML_AGENT.md
- extension/docs/workshop/prompts/DASHBOARD_FOUR_SENSORS.md
- extension/docs/workshop/prompts/SENSOR_SHT40.md
- extension/docs/workshop/prompts/SENSOR_DPS368.md
- extension/docs/workshop/prompts/SENSOR_BMI270.md
- extension/docs/workshop/prompts/SENSOR_BMM350.md

Output: extension/docs/workshop/examples/workshop-four-sensor-dashboard.html

2×2 grid dashboard: BMI270 motion, SHT40 climate, DPS368 pressure, BMM350 magnetic field.
Standalone WebSocket ws://127.0.0.1:9997 only. Mock fallback for all panels. Read-only — no bitstream:command.
Per-sensor workshop accent colors. Global + per-panel status. English UI only.
```
