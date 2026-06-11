# BMI270 — Hands-on labs & Bitstream Studio

Workshop labs on the DevKit plus embedded UART probes. Use toolbar **Bitstream** + **Link** (or **Simulator** as fallback).

---

## Workshop labs (DevKit)

### Lab 1 — Flat on table (gravity)

1. Board flat, **Raw** profile, **Apply**.
2. **Expect:** accel Z ≈ **9.8 m/s²** (|a| ≈ **1 g**); X, Y ≈ 0; gyro near 0.

### Lab 2 — Tilt one edge

1. Raise one edge ~30°.
2. **Expect:** accel X or Y grows; switch to **Fusion** → **pitch** or **roll** moves on the live widgets.

### Lab 3 — Twist quickly

1. Spin board around vertical axis.
2. **Expect:** gyro Z (or axis aligned with spin) spikes briefly.

### Lab 4 — Shake alert prep

1. **Raw** profile, 50 Hz sampling.
2. Watch **|a|** on the scalar widget or vector magnitude in Sensor Studio.
3. Shake firmly → strength well above 1 g.

### Lab 5 — Output profile swap

1. **Fusion** → **Apply** → confirm Euler channels; accel may leave deck.
2. **Raw** → **Apply** → accel/gyro return.
3. **All** → observe alternating groups in telemetry.

### Lab 6 — Publish mode

1. **On change** + rotate board → bursts when values shift.
2. Lower sampling to 2 Hz → slower updates (configuration lesson).

---

## Embedded labs

### Lab 7 — UART probe

From `extension/`:

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Confirm `sensorId: 0`, mask matches profile (Raw often `0x07` on wire).

### Lab 8 — Fusion feed vs sample rate

1. Set fusion feed **10 ms**, sampling **100 ms**.
2. Observe smooth fusion in 3D preview while EVT cadence stays 10 Hz.

### Lab 9 — Mask trim

Disable **Quaternion** in telemetry channels; verify shorter EVT payload.

---

## Build it in Bitstream Studio

### Sensor Telemetry

1. BMI270 configuration cards — sampling, publish, **output profile**, channels.
2. Demo lower rate vs twist responsiveness.

### Sensor Studio

1. **BMI270** → **Acceleration** node → gauge.
2. **Gyroscope** node → bar (±1 rad/s band).
3. **Euler** node → pitch/roll readouts (**Fusion** profile).

### Pipelines

```text
BMI270 Acceleration → Vector Length → Threshold → status LED
```

Toggle board to trip threshold (~15 m/s² class trip point for demo).

### Course Studio (this book)

Motion scalar widgets + Euler telemetry cards on overview and labs pages — same binding paths as Sensor Studio dashboards.

---

## Settings that matter

| Setting | Suggestion |
|---------|------------|
| **Output profile** | **Raw** for shake labs; **Fusion** for tilt gauges; **All** for advanced |
| **Sampling rate** | **50–100 Hz** for motion; **10–20 Hz** for calm display |
| **Publish mode** | **Periodic** for steady bars; **On change** to reduce traffic |
| **Fusion feed** | Default **10 ms** when Fusion or All selected |

**Apply** after changes. If gyro/accel missing in HTML dashboard, set **Raw** profile and reload.
