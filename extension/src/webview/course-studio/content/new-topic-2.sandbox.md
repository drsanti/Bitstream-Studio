## What this page is for

Use this **sandbox** to preview **HTML page blocks** inside Course Studio — the same iframe + telemetry provider bridge used on live chapter pages.

### Live telemetry widgets (top row)

Three kit examples listen for `bitstream:ready` and update from **Simulator** or **Bitstream** toolbar routes:

- **Gyro X** — BMI270 `gyroX` progress bar (auto-enables gyro mask on UART)
- **Humidity** — SHT40 `humidityPct`
- **Pressure** — DPS368 `pressureHpa`

Turn on **Maintainer → Preview** (or Content pane) and pick **Simulator** + streaming sim for instant mock/live data.

### Decorative hero (bottom)

The EV speed ring is **visual-only** — no telemetry binding. Use it as layout inspiration; keep iframe height ~200–320px for course pages.
