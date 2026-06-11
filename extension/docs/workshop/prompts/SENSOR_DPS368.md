# Sensor annex — DPS368 (barometric pressure)

**Attach with:** [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)

---

## Deliverable

| Property | Value |
|----------|-------|
| **Output file** | `extension/docs/workshop/examples/dps368-pressure-dashboard.html` |
| **Title** | `DPS368 — barometric pressure` |
| **Sensor id** | `dps368` |
| **Accent** | `#5eb8f5` |

---

## Widgets (one HTML)

### Primary — pressure bar

| Item | Value |
|------|-------|
| Field key | `pressureHpa` |
| Unit | hPa |
| **Workshop bar range** | **900 … 1100 hPa** (sea-level band; document on scale) |
| Label | Barometric pressure |

### Optional secondary (same card, no bar required)

| Item | Value |
|------|-------|
| Field key | `temperatureC` |
| Unit | °C |
| Display | Numeric readout only (chip temperature) |

---

## Operator copy

- Card heading: **Air pressure (DPS368)**
- Meta: Typical room air ≈ **1013 hPa** at sea level
- Hint: Pressure is slow-changing in a classroom — mock should drift gently, not jump wildly

---

## Copy-paste prompt for AI agent

```text
Generate a single self-contained HTML file for the TESAIoT Bitstream Studio workshop.

Read and follow:
- extension/docs/workshop/prompts/MASTER_HTML_AGENT.md
- extension/docs/workshop/prompts/SENSOR_DPS368.md

Output: extension/docs/workshop/examples/dps368-pressure-dashboard.html

One card: DPS368 pressureHpa progress bar (900–1100 hPa sea-level band) plus optional temperatureC readout.
Standalone WebSocket ws://127.0.0.1:9997 only. Mock fallback. Read-only — no bitstream:command.
Workshop blue accent #5eb8f5. English UI only.
```
