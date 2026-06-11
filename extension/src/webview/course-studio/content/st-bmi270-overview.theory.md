# BMI270 — Overview & physical principles

**Hardware:** TESAIoT DevKit — on-board **BMI270** 6-axis IMU (accelerometer + gyroscope) with firmware **fusion** (heading, pitch, roll, quaternion).

The **BMI270** answers: *"How is the board moving, and which way is it tilted?"*

| Group | What it tells you | Units in Bitstream Studio |
|-------|-------------------|---------------------------|
| **Accelerometer** (X, Y, Z) | Linear acceleration **including gravity** | m/s² (often shown as **g** on dashboards) |
| **Gyroscope** (X, Y, Z) | How fast the board **rotates** around each axis | rad/s or °/s |
| **Fusion orientation** | Heading, pitch, roll (+ quaternion) | rad or ° |

Think of **three perpendicular arrows** fixed to the board. **Tilt** moves accel X/Y/Z. **Twist** spikes gyro X/Y/Z. **Fusion** gives smoother tilt angles without raw gyro noise.

**Radians tip:** Bitstream Studio can show angles in degrees. For teaching: **0.5 rad ≈ 29°**.

---

## Learning outcomes

After this topic you should be able to:

1. Distinguish accelerometer, gyroscope, and fusion orientation readouts.
2. Explain why gravity appears on the accelerometer when the board is still.
3. Read live BMI270 values in **Sensor Telemetry** and interpret flat-table vs tilt vs twist.
4. Describe vector magnitude as a shake-strength narrative.

---

## Where BMI270 fits in the workshop

| Workshop chapter | BMI270 role |
|------------------|-------------|
| **Ch3** — Sensor Configuration | Sampling rate, publish mode, **output profile**, channels |
| **Ch4** — Sensor Studio | BMI270 tap nodes (Acceleration, Gyroscope, Euler) |
| **Ch5** — Pipelines | **Vector Length** → **Threshold** shake alert |
| **Ch6** — Course Studio | Motion bars, pitch/roll gauges (this book) |

---

## Embedded identity

| Item | Value |
|------|--------|
| **Part** | BMI270 (Bosch) — 6-axis IMU |
| **BS2 sensorId** | `0` |
| **Catalog id** | `bmi270` |

**Software stack:**

```text
BMI270 chip (I²C 0x68)
  → mtb_bmi270 driver (accel + gyro + die temp)
  → sensor_bmi270 (physical units)
  → bitstream_bmi270_runtime (stream mode, fusion feed, EVT pack)
  → CM33 BSXLite via IPC (fusion orientation)
  → UART EVT_SENSOR → host decode → Bitstream Studio UI
```

---

## Accelerometer

An **accelerometer** measures **proper acceleration** — what you feel when pushed, tilted, or shaken. When the board sits **still on a table**, gravity is real and the sensor reports it:

- Flat on table → **accel Z ≈ 9.8 m/s²** (≈ **1 g**), X and Y near **0**
- Tilt one edge → X or Y grows; Z shares gravity across axes

**Vector magnitude** (one number from three axes):

```text
strength = √(accelX² + accelY² + accelZ²)
```

At rest, strength ≈ **9.8 m/s²** (mostly gravity). A sharp shake spikes strength above ~15 m/s² — useful for alert demos.

---

## Gyroscope

A **gyroscope** measures **angular rate** — how fast the board spins around each axis (rad/s).

- Board still → gyro near **0** (small noise is normal at high sample rates)
- Quick twist around Z → **gyro Z** spikes
- Use **on change** publish or **Fusion** profile if display-only lessons feel too noisy

---

## Fusion orientation

**Fusion** combines accelerometer and gyroscope (and firmware algorithms on CM33) into stable **heading**, **pitch**, and **roll** — plus an optional **quaternion** for 3D previews.

| Angle | Plain meaning |
|-------|----------------|
| **Pitch** | Nose up / down (tilt front-back) |
| **Roll** | Bank left / right |
| **Heading** | Compass-style yaw in the sensor frame (not navigation-grade without magnetometer) |

Use **Fusion** when you want tilt gauges without interpreting raw gyro noise. Select **Raw**, **Fusion**, or **All** in Sensor Telemetry and **Apply** before judging the deck.

---

## At-rest checklist (live widgets)

| Check | Expect |
|-------|--------|
| Board flat on desk | **\|a\| ≈ 1 g**; accel Z dominant |
| Gyro quiet | Near zero with small noise |
| **Fusion** profile + Apply | Pitch/roll respond to slow tilt |
| **Raw** profile | Accel + gyro channels in telemetry deck |

---

## Related

- **Engineering** topic — I²C, masks, fusion feed vs telemetry, BS2 wire
- **Labs** topic — tilt, twist, shake, profile swap walkthroughs
- Workshop source: `extension/docs/workshop/sensor-theory/CH3_BMI270.md`
