# Sensor annex — BMM350 (magnetic field)

**Attach with:** [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)

---

## Deliverable

| Property | Value |
|----------|-------|
| **Output file** | `extension/docs/workshop/examples/bmm350-magnetometer-dashboard.html` |
| **Title** | `BMM350 — magnetic field` |
| **Sensor id** | `bmm350` |
| **Accent** | `#b88cff` |

---

## Widgets (one HTML)

### Three axis bars

| Field | Label | Bar range |
|-------|-------|-----------|
| `magX` | Magnetic X | −100 … +100 µT |
| `magY` | Magnetic Y | −100 … +100 µT |
| `magZ` | Magnetic Z | −100 … +100 µT |

Use **gaugeHints** earth-field band ±100 µT (not full ±1000 catalog range) so classroom motion is visible.

### Optional footer readout

Field strength: `√(magX² + magY² + magZ²)` in µT, label **Field strength**.

---

## Operator copy

- Card heading: **Magnetic field (BMM350)**
- Meta: Earth field is weak (~25–65 µT) — bars show **relative** change when you rotate the board
- Caution line (10px): Keep strong magnets away from the DevKit

---

## Copy-paste prompt for AI agent

```text
Generate a single self-contained HTML file for the TESAIoT Bitstream Studio workshop.

Read and follow:
- extension/docs/workshop/prompts/MASTER_HTML_AGENT.md
- extension/docs/workshop/prompts/SENSOR_BMM350.md

Output: extension/docs/workshop/examples/bmm350-magnetometer-dashboard.html

One card: BMM350 magX, magY, magZ progress bars (±100 µT workshop band) plus optional field strength readout.
Standalone WebSocket ws://127.0.0.1:9997 only. Mock fallback. Read-only — no bitstream:command.
Workshop violet accent #b88cff. English UI only.
```
