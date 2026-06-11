# Sensor annex — SHT40 (climate)

**Attach with:** [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)

---

## Deliverable

| Property | Value |
|----------|-------|
| **Output file** | `extension/docs/workshop/examples/sht40-climate-dashboard.html` |
| **Title** | `SHT40 — temperature & humidity` |
| **Sensor id** | `sht40` |
| **Accent** | `#5ee89a` |

---

## Widgets (one HTML, two rows)

### 1. Temperature

| Item | Value |
|------|-------|
| Field key | `temperatureC` |
| Unit | °C |
| Catalog range | −40 … 125 |
| **Workshop bar range** | **0 … 50 °C** (indoor lab band; show in meta) |
| Label | Temperature |

### 2. Humidity

| Item | Value |
|------|-------|
| Field key | `humidityPct` |
| Unit | %RH |
| Bar range | 0 … 100 (physical = bar %) |
| Label | Humidity |

---

## Operator copy

- Card heading: **Room climate (SHT40)**
- Meta line: On-board environmental sensor on the **TESAIoT DevKit**
- Try-it hint (meta or footer): Warm the board with your hands to see temperature and humidity rise

---

## Copy-paste prompt for AI agent

```text
Generate a single self-contained HTML file for the TESAIoT Bitstream Studio workshop.

Read and follow:
- extension/docs/workshop/prompts/MASTER_HTML_AGENT.md
- extension/docs/workshop/prompts/SENSOR_SHT40.md

Output: extension/docs/workshop/examples/sht40-climate-dashboard.html

One card, two progress bars: SHT40 temperatureC (bar maps 0–50 °C) and humidityPct (0–100 %RH).
Standalone WebSocket ws://127.0.0.1:9997 only. Mock fallback. Read-only — no bitstream:command.
Workshop green accent #5ee89a. English UI only.
```
