# Sensor annex — BMI270 (motion)

**Attach with:** [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)

---

## Deliverable

| Property | Value |
|----------|-------|
| **Output file** | `extension/docs/workshop/examples/bmi270-motion-dashboard.html` |
| **Title** | `BMI270 — gyro & acceleration` |
| **Sensor id** | `bmi270` |
| **Accent** | `#42e8ff` |

---

## Widgets (one HTML, two sections)

### 1. Gyro bar — “rotation”

| Item | Value |
|------|-------|
| Field key | `gyroX` (primary); show axis name in label |
| Unit | rad/s |
| **Workshop bar range** | **−1 … +1 rad/s** (hand-rotation band; meta notes catalog ±5) |
| Label | Gyro X |

### 2. Accel shake — “motion strength”

Compute **shake strength** from accelerometer (read-only, no Vector Length node — do in JS):

```text
strength = √(accelX² + accelY² + accelZ²)
```

| Item | Value |
|------|-------|
| Input fields | `accelX`, `accelY`, `accelZ` |
| Unit | m/s² |
| **Bar range** | **0 … 20 m/s²** (catalog max; still ~9.8 at rest) |
| Label | Acceleration strength |
| Hint | At rest, strength ≈ **9.8 m/s²** (gravity). Shake the **TESAIoT DevKit** to spike the bar. |

Show numeric strength with one decimal. Optional small readout of raw X/Y/Z (10px muted) under the bar.

---

## Profile hint (status line only)

If samples lack `gyroX` or accel fields, status text:

> BMI270 Raw motion not active — open Sensor Telemetry, set output profile **Raw**, Apply, then reload.

**Do not** send commands from HTML.

---

## Operator copy

- Card heading: **Motion (BMI270)**
- Meta: IMU on the **TESAIoT DevKit** — rotate for gyro, shake for accel strength

---

## Copy-paste prompt for AI agent

```text
Generate a single self-contained HTML file for the TESAIoT Bitstream Studio workshop.

Read and follow:
- extension/docs/workshop/prompts/MASTER_HTML_AGENT.md
- extension/docs/workshop/prompts/SENSOR_BMI270.md

Output: extension/docs/workshop/examples/bmi270-motion-dashboard.html

One card, two widgets:
1) gyroX progress bar (−1…+1 rad/s workshop band)
2) accel shake strength bar from accelX/Y/Z magnitude (0…20 m/s²)

Standalone WebSocket ws://127.0.0.1:9997 only. Mock fallback. Read-only — no bitstream:command.
If gyro/accel missing, show Sensor Telemetry Raw profile hint only.
Workshop teal accent #42e8ff. English UI only.
```
