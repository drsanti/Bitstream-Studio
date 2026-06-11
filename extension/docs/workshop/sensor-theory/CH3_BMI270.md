# Chapter 3 — BMI270 (Motion, Rotation & Orientation)

**Audience:** Workshop trainees, instructors, and embedded developers (hardware + firmware).

**Hardware:** TESAIoT DevKit — on-board **BMI270** 6-axis IMU (accelerometer + gyroscope) with firmware **fusion** (heading, pitch, roll, quaternion).

**Companion:** [WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) (Ch3–6 demos) · [SENSOR_THEORY.md](../SENSOR_THEORY.md) (shared core ideas) · [CH1_SHT40.md](./CH1_SHT40.md) · [CH2_DPS368.md](./CH2_DPS368.md)

Each major section has two tracks:

| Track | Who | Focus |
|-------|-----|-------|
| **Workshop** | Trainees | Vectors, tilt/shake demos, output profiles, Sensor Studio pipelines |
| **Embedded** | HW / FW engineers | I²C, driver ranges, BSX fusion feed, BS2 wire, stream modes |

---

## 1. Introduction

### Workshop

The **BMI270** answers: *“How is the board moving, and which way is it tilted?”*

It is an **IMU** (inertial measurement unit) — a motion sensor that reports:

| Group | What it tells you | Units in Bitstream Studio |
|-------|-------------------|---------------------------|
| **Accelerometer** (X, Y, Z) | Linear acceleration **including gravity** | m/s² |
| **Gyroscope** (X, Y, Z) | How fast the board **rotates** around each axis | rad/s |
| **Fusion orientation** | Heading, pitch, roll (+ quaternion) — firmware fuses motion into “which way is up” | rad |

Think of **three perpendicular arrows** fixed to the board. **Tilt** moves accel X/Y/Z. **Twist** spikes gyro X/Y/Z. **Fusion** gives smoother tilt angles without raw gyro noise.

**Radians tip:** Bitstream Studio shows angles in radians. For teaching: **0.5 rad ≈ 29°**; small angles are small numbers.

**Learning outcomes**

After this chapter you should be able to:

1. Distinguish accelerometer, gyroscope, and fusion orientation readouts.
2. Explain why gravity appears on the accelerometer when the board is still.
3. Select **Raw**, **Fusion**, or **All** output profile and **Apply** in Sensor Telemetry.
4. Compute **vector magnitude** for shake detection and wire a threshold in Sensor Studio.
5. *(Embedded)* Describe fusion feed vs UART telemetry rate, EVT mask order, and stream mode REQ commands.

**Where this chapter fits**

| Workshop chapter | BMI270 role |
|------------------|-------------|
| **Ch3** — Sensor Configuration | Sampling rate, publish mode, **output profile**, telemetry channels |
| **Ch4** — Sensor Studio | BMI270 tap nodes (Acceleration, Gyroscope, Euler) |
| **Ch5** — Pipelines | **Vector Length** → **Threshold** shake alert |
| **Ch6** — Course Studio | Motion bars, pitch/roll gauges |

### Embedded

| Item | Value |
|------|--------|
| **Part** | BMI270 (Bosch) — 6-axis IMU |
| **Kit** | **KIT_PSE84_AI** (U18) and **KIT_PSE84_EVAL** (U5) |
| **BS2 sensorId** | `0` (`BS2_SENSOR_ID.BMI270`) |
| **Catalog id** | `bmi270` |

**Software stack**

```text
BMI270 chip (I²C 0x68)
  → mtb_bmi270 driver (accel + gyro + die temp)
  → sensor_bmi270 (physical units, elapsed_ms)
  → bitstream_bmi270_runtime (stream mode, fusion feed, EVT pack)
  → CM33 BSXLite via IPC (fusion orientation)
  → UART EVT_SENSOR → decodeBmi270Values() → Bitstream Studio UI
```

**Authoritative references**

| Doc | Path |
|-----|------|
| EVT layout + fusion feed | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| Output presets (host) | `extension/src/webview/bitstream-app/lib/bmi270OutputProfiles.ts` |
| Host decode | `extension/src/bitstream2/domains/sensors/bmi270.ts` |
| 3D preview axes | `extension/src/webview/bitstream-app/docs/ROTATION_3D_PREVIEW.md` |

---

## 2. Physical principles

### Workshop — accelerometer

An **accelerometer** measures **proper acceleration** — what you feel when pushed, tilted, or shaken. When the board sits **still on a table**, gravity is real and the sensor reports it:

- Flat on table → **accel Z ≈ 9.8 m/s²**, X and Y near **0**
- Tilt one edge → X or Y grows; Z shares gravity across axes

**Vector magnitude** (one number from three axes):

```text
strength = √(accelX² + accelY² + accelZ²)
```

At rest, strength ≈ **9.8 m/s²** (mostly gravity). A sharp shake spikes strength above ~15 m/s² — useful for alert demos.

### Workshop — gyroscope

A **gyroscope** measures **angular rate** — how fast the board spins around each axis (rad/s).

- Board still → gyro near **0** (small noise is normal at high sample rates)
- Quick twist around Z → **gyro Z** spikes
- Use **on change** publish or **Fusion** profile if display-only lessons feel too noisy

### Workshop — fusion orientation

**Fusion** combines accelerometer and gyroscope (and firmware algorithms on CM33) into stable **heading**, **pitch**, and **roll** angles — plus an optional **quaternion** for 3D previews.

| Angle | Plain meaning |
|-------|----------------|
| **Pitch** | Nose up / down (tilt front-back) |
| **Roll** | Bank left / right |
| **Heading** | Compass-style yaw in the sensor frame (not navigation-grade without magnetometer) |

Use **Fusion** when you want tilt gauges without interpreting raw gyro noise.

### Embedded — transducer and ranges

| Axis | TESAIoT driver config | Conversion |
|------|----------------------|------------|
| Accel | **±2 g** (`ACC_RANGE_2G`) | LSB → m/s² via `GRAVITY_EARTH` (9.80665) |
| Gyro | **±2000 °/s** (`GYR_RANGE_DPS`) | LSB → rad/s via `DEG_TO_RAD` |
| Temp | Bosch BMI2 formula | `((int16_t)raw) / 512.0 + 23.0` °C |

Catalog display spans are wider (accel ±20 m/s², gyro ±5 rad/s) for UI headroom; workshop bands are narrower for visible hand motion:

| Band | Range | Use |
|------|-------|-----|
| Accel motion | ±2 m/s² | Small tilt / hand motion |
| Gyro rotation | ±1 rad/s | Twist demos |
| Shake strength | 0–20 m/s² | Magnitude bar |

---

## 3. Hardware design (DevKit integration)

> **Embedded depth**

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x68** default (`MTB_BMI270_ADDRESS_DEFAULT`); alt **0x69** |
| **Kit placement** | AI kit **U18**; Eval kit **U5** |
| **Voltage / pins** | Bus 1 — SCB0, P8[0] SCL, P8[1] SDA, **1.8 V** |

### Shared bus

BMI270 shares Bus 1 with **SHT40**, **DPS368**, and (on AI kit) **BMM350**. All reads use `cm55_i2c_manager` lock discipline. IMU at **50–100 Hz** dominates I²C time — plan slow-sensor intervals accordingly.

### Mechanical frame

Accelerometer and gyro readings are in the **sensor package frame** (PCB axes). Fusion Euler/quaternion follow firmware/BSX convention; 3D preview may apply a catalog **`pcb-glb`** mapping — see rotation preview docs.

---

## 4. Output profiles and stream modes

> **Embedded depth** — host presets map to firmware stream mode + SENSOR_CFG mask.

Bitstream Studio exposes three **output profiles** (Sensor Telemetry → BMI270):

| Profile | Label | Stream mode | Mask (hex) | Channels in telemetry |
|---------|-------|-------------|------------|------------------------|
| **Raw** | Raw | `raw` | `0x07` | Accel X/Y/Z, Gyro X/Y/Z, chip temp |
| **Fusion** | Fusion | `fusion` | `0x18` | Heading, pitch, roll, quaternion |
| **All** | All | `hybrid` | `0x1f` | Alternating **raw group** and **fusion group** |

Mask bit definitions (host/firmware canonical):

| Bit | Name | Value | Payload |
|-----|------|-------|---------|
| ACC | Accelerometer | `0x01` | 3 × int16 (X, Y, Z) |
| GYR | Gyroscope | `0x02` | 3 × int16 |
| TMP | Temperature | `0x04` | 1 × int16 |
| EULER | Fusion Euler | `0x08` | 3 × int16 (heading, pitch, roll) |
| QUAT | Fusion quaternion | `0x10` | 4 × int16 (special W encoding) |

**Firmware stream modes** (`bitstream_bmi270_runtime.h`):

```c
#define BITSTREAM_BMI270_STREAM_MODE_RAW    (0U)
#define BITSTREAM_BMI270_STREAM_MODE_FUSION (1U)
#define BITSTREAM_BMI270_STREAM_MODE_HYBRID (2U)
```

Host applies profile via **SENSOR_CFG** mask + **`BMI270_MODE_SET`** (REQ `0x14` / GET `0x15`). Always **Apply** both mask and mode before judging the telemetry deck.

**Hybrid / All caveat:** UART frames **alternate** raw-heavy and fusion-heavy payloads — do not expect all 14 scalars in every single EVT.

---

## 5. Firmware architecture (TESAIoT)

> **Embedded depth**

### Layer map

| Layer | File | Role |
|-------|------|------|
| Driver | `sensor_bmi270.c` | `mtb_bmi270_init_i2c`, read, LSB→SI |
| Runtime | `bitstream_bmi270_runtime.c` | Mode, fusion feed tick, EVT pack |
| BS2 sensor | `bitstream_bs_sensor.c` | Publish scheduling |
| Fusion IPC | CM33 BSXLite bridge | Orientation from acc/gyr feed |

### Initialization

1. Wait for shared I²C ready.
2. `mtb_bmi270_init_i2c(&bmi270, hal, 0x68)` + `mtb_bmi270_config_default()` — up to 3 retries.
3. `SENSOR_STATE_READY` on success.

### Read path (raw)

1. `sensor_bmi270_read()` — lock → `mtb_bmi270_read()` + optional die temp.
2. Populates `bmi270_sample_t` (float m/s², rad/s, °C, `elapsed_ms`).
3. `elapsed_ms` feeds BSX fusion as IPC timing hint.

### Fusion feed vs telemetry (critical)

Do **not** confuse these two rates:

| Path | Default cadence | On UART? |
|------|-----------------|----------|
| **Fusion feed** | **10 ms** (`FUSION_FEED_SET` `0x16`/`0x17`) | No — feeds CM33 BSX only |
| **Telemetry** | `samplingIntervalMs` (default **20 ms** = 50 Hz) | Yes — `EVT_SENSOR` |

`fusion_tick` performs a **fresh IMU read** before pushing acc/gyr to CM33 (BS2 fix 2026-05-29). Euler/quaternion in EVT reflect the **latest fusion result** at **publish** time, not every 10 ms feed tick.

Fusion feed interval bounds: **10–100 ms** (`BITSTREAM_BMI270_FUSION_FEED_INTERVAL_MIN_MS` / `MAX_MS`).

### EVT pack order

`decodeBmi270Values()` canonical order (only set mask bits):

```text
ACC(3) → GYR(3) → TMP(1) → EULER(3) → QUAT(4)
```

Full mask `0x1f` with fusion available → **14** int16 values per frame (largest workshop payload).

---

## 6. BS2 wire format and host decode

> **Embedded depth**

### Identity

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `0` |
| **Default mask** | `0x1f` (catalog / board profile) |
| **Default samplingIntervalMs** | `20` (50 Hz) |
| **staleAfterMs** | `500` |

### Wire scales

| Field group | Keys | wireScale | Notes |
|-------------|------|-----------|-------|
| Accel | `accelX`, `accelY`, `accelZ` | 100 | m/s² × 100 |
| Gyro | `gyroX`, `gyroY`, `gyroZ` | 100 | rad/s × 100 |
| Temp | `temperatureC` | 100 | °C × 100 |
| Euler | `headingRad`, `pitchRad`, `rollRad` | 100 | rad × 100 |
| Quaternion | `quatW`, `quatX`, `quatY`, `quatZ` | 10000 | **W:** unsigned bucket `(qw×10000+10000)`; X/Y/Z signed ×10000 |

### Worked example — flat board, Raw profile (mask `0x07`)

Approximate physics: accel (0, 0, 9.8) m/s², gyro (0, 0, 0), temp 25 °C.

| Channel | Physical | ×100 | int16 |
|---------|----------|------|-------|
| accX | 0 | 0 | 0 |
| accY | 0 | 0 | 0 |
| accZ | 9.8 | 980 | 980 |
| gyrX/Y/Z | 0 | 0 | 0 |
| temp | 25 °C | 2500 | 2500 |

### REQ commands (BMI270-specific)

| REQ | Purpose |
|-----|---------|
| `0x14` / `0x15` | BMI270_MODE_SET / GET |
| `0x16` / `0x17` | FUSION_FEED_SET / GET |

Plus shared **SENSOR_CFG** GET/SET for enable, mask, rates, publish mode.

---

## 7. Configuration and rate planning

### Workshop — settings that matter

Open **BMI270** in Sensor Telemetry (WORKSHOP Ch3 demo):

| Setting | Suggestion |
|---------|------------|
| **Output profile** | **Raw** for shake labs; **Fusion** for tilt gauges; **All** for advanced |
| **Sampling rate** | **50–100 Hz** for motion; **10–20 Hz** for calm display |
| **Publish mode** | **Periodic** for steady bars; **On change** to reduce USB traffic |
| **Fusion feed** | Visible when Fusion or All selected — default **10 ms** is fine |
| **Telemetry channels** | Toggle individual axes off to simplify the deck |

**Apply** after changes. If gyro/accel missing in HTML dashboard, set **Raw** profile and reload.

### Embedded — rate and bandwidth

BMI270 uses **fast sensor** presets (`FAST_SENSOR_SAMPLING_HZ_PRESETS`: 10–100 Hz).

| Rate | intervalMs | UART load |
|------|------------|-----------|
| 20 Hz | 50 ms | Moderate |
| 50 Hz | 20 ms | **Catalog default** |
| 100 Hz | 10 ms | High — stress test |

At 50 Hz with mask `0x1f`, UART carries large EVT bodies — disable unused channels or use **Raw** `0x07` for busier multi-sensor setups.

**SENSOR_CFG under load:** Same policy as other sensors — quiet the link before cfg-only work (`BS_WIRE.md`).

---

## 8. From chip to screen

### Workshop — vectors and bars

**Single axis bar** — map e.g. gyro X with range **−1 … +1 rad/s**:

```text
percent = (value − min) ÷ (max − min) × 100
```

**Shake strength** — in Sensor Studio use **Vector Length** on acceleration; in HTML workshops compute in JS:

```text
strength = √(accelX² + accelY² + accelZ²)
```

Map strength **0–20 m/s²** for a fill bar; show **~9.8** at rest.

### Embedded — pipeline

```text
I²C read → float SI in bmi270_sample_t
  → fusion_tick (10 ms) → BSX on CM33
  → pack_bs_evt per mask → int16 wire
  → host ÷ wireScale → Sensor Telemetry / Studio / Course
```

---

## 9. Hands-on labs (DevKit)

### Workshop labs

**Lab 1 — Flat on table (gravity)**

1. Board flat, **Raw** profile, **Apply**.
2. **Expect:** accel Z ≈ **9.8 m/s²**; X, Y ≈ 0; gyro near 0.

**Lab 2 — Tilt one edge**

1. Raise one edge ~30°.
2. **Expect:** accel X or Y grows; switch to **Fusion** → **pitch** or **roll** moves.

**Lab 3 — Twist quickly**

1. Spin board around vertical axis.
2. **Expect:** gyro Z (or axis aligned with spin) spikes briefly.

**Lab 4 — Shake alert prep**

1. **Raw** profile, 50 Hz sampling.
2. Watch vector magnitude in Sensor Studio (**Vector Length**).
3. Shake firmly → strength >> 9.8.

**Lab 5 — Output profile swap**

1. **Fusion** → **Apply** → confirm Euler channels, no accel in deck.
2. **Raw** → **Apply** → accel/gyro return.
3. **All** → alternating groups in telemetry.

**Lab 6 — Publish mode**

1. **On change** + rotate board → bursts when values shift.
2. Lower sampling to 2 Hz → slower updates (Ch3 lesson).

### Embedded labs

**Lab 7 — UART probe**

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Confirm `sensorId: 0`, mask matches profile (Raw often `0x07` on wire even when cfg stores `0x1f` — see `UART_TEST_COMMANDS.md`).

**Lab 8 — Fusion feed vs sample rate**

1. Set fusion feed **10 ms**, sampling **100 ms**.
2. Observe smooth fusion in 3D preview while EVT cadence stays 10 Hz.

**Lab 9 — Mask trim**

Disable **Quaternion** in telemetry channels; verify shorter EVT payload.

---

## 10. Build it in Bitstream Studio

### Workshop walkthroughs

**Sensor Telemetry (Ch3)**

1. BMI270 configuration cards — sampling, publish, **output profile**, channels.
2. Demo lower rate vs twist responsiveness.

**Sensor Studio (Ch4)**

1. **BMI270** → **Acceleration** node → gauge.
2. **Gyroscope** node → bar (±1 rad/s band).
3. **Euler** node → pitch/roll readouts (**Fusion** profile).

**Pipelines (Ch5)**

```text
BMI270 Acceleration → Vector Length → Threshold → status LED
```

Toggle board to trip threshold (~15 m/s² class trip point for demo).

**Course Studio (Ch6)**

Motion bars + pitch/roll gauges; accent **`#42e8ff`** (teal).

### Embedded — external dashboards

| Item | Value |
|------|-------|
| Sensor id | `bmi270` |
| Raw fields | `accelX/Y/Z`, `gyroX/Y/Z`, `temperatureC` |
| Fusion fields | `headingRad`, `pitchRad`, `rollRad`, `quatW/X/Y/Z` |
| Example HTML | `extension/docs/workshop/examples/bmi270-motion-dashboard.html` |
| Prompt | `extension/docs/workshop/prompts/SENSOR_BMI270.md` |

---

## 11. Real-world use cases

### Workshop stories

| Domain | BMI270 role |
|--------|-------------|
| **Vibration / machine health** | Accel magnitude trends |
| **Robotics attitude** | Fusion pitch/roll |
| **Fall / impact detection** | Sudden accel spike |
| **Interactive exhibits** | Tilt-to-steer without GPS |

### Embedded product notes

- **Fusion** needs consistent fusion feed; starving BSX produces stale Euler.
- **Navigation heading** needs magnetometer fusion (BMM350) — workshop keeps IMU and mag **separate** for learning.
- **Power:** 10 Hz raw often enough for logging; 50 Hz for active UI only.
- **Mounting:** Hard-mount IMU to structure under test; foam isolation changes accel semantics.

---

## 12. Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Why does gravity show on accel? | Accelerometers measure proper acceleration; gravity is real when still. |
| Gyro noisy when still? | Normal at high rate — use **on change** or **Fusion** for displays. |
| All profile looks “incomplete”? | Hybrid **alternates** frame groups — not all channels every tick. |
| No euler after Apply? | Need **Fusion** or **All**; fusion feed must be active. |

### Embedded debug table

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| Init failed | I²C, wrong address | `0x68`, manager ready |
| Flat Z not ~980 (×100) | Range mismatch, board not flat | ±2 g config, placement |
| Euler frozen | Fusion feed stopped, BSX not running | `fusion_tick`, CM33 IPC |
| Mask vs wire mismatch | Hybrid gating / stream mode | `BMI270_MODE_GET`, UART_TEST_COMMANDS |
| UART saturation | 50 Hz + mask `0x1f` + 3 other sensors | Trim mask or rates |
| Custom profile | Mask+mode not matching preset | `resolveBmi270OutputPresetId()` returns null |

---

## 13. Knowledge check

1. Name the three motion groups the BMI270 provides in workshop language.
2. Board flat on table — what is accel Z approximately in m/s²?
3. What are the three output profile labels in Sensor Telemetry?
4. What is the mask for **Raw** profile?
5. What is EVT channel order for ACC + GYR + TMP?
6. What is `wireScale` for accelerometer axes?
7. Why is fusion feed (10 ms) separate from sampling interval?
8. Compute magnitude for accel (0.1, 0.2, 9.8) m/s².
9. What BS2 sensorId is BMI270?
10. Why doesn’t IMU heading replace a compass?

### Answers

1. **Accelerometer**, **gyroscope**, **fusion orientation** (Euler/quaternion).
2. About **9.8 m/s²** (gravity on Z).
3. **Raw**, **Fusion**, **All**.
4. **`0x07`** (ACC + GYR + TMP).
5. **ACC X,Y,Z** → **GYR X,Y,Z** → **TMP**.
6. **100** (m/s² × 100 on wire).
7. BSX needs high-rate acc/gyr feed; UART publishes at slower telemetry rate.
8. √(0.01 + 0.04 + 96.04) ≈ **9.81 m/s²**.
9. **0**.
10. Heading from IMU alone **drifts** without magnetometer reference; BMM350 is a separate chapter.

---

## 14. Instructor and maintainer notes

- **Ch3 centerpiece:** BMI270 is the configuration chapter demo sensor — budget extra time for profile + publish mode.
- **Radians:** Prepare a “0.5 rad ≈ 29°” rule of thumb on a slide.
- **Shake threshold:** Pre-test trip value on your desk surface — foam pads change spikes.
- **Simulator:** Synthetic sine on accel/gyro; Z biased to 1 g — same field keys as UART.
- **Dual-runtime:** Verify **Raw** profile in both **Bitstream** and **Simulator** before class.

---

## 15. Summary and quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | Motion + tilt — “how is the board moving?” |
| Vectors | Accel X/Y/Z (m/s²), Gyro X/Y/Z (rad/s) |
| Fusion | Heading, pitch, roll (rad) |
| At rest | Accel strength ≈ 9.8 m/s² |
| Profiles | Raw `0x07`, Fusion `0x18`, All `0x1f` |
| Gyro bar band | ±1 rad/s |
| Shake band | 0–20 m/s² magnitude |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `0` |
| I²C address | `0x68` |
| Accel / gyro config | ±2 g, ±2000 °/s |
| EVT order | ACC→GYR→TMP→EULER→QUAT |
| Default sample | 20 ms (50 Hz) |
| Fusion feed default | 10 ms |
| Stream modes | raw=0, fusion=1, hybrid=2 |
| REQ | `0x14`–`0x17` |
| Driver | `sensor_bmi270.c`, `bitstream_bmi270_runtime.c` |
| Host decode | `extension/src/bitstream2/domains/sensors/bmi270.ts` |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [SENSOR_THEORY.md](../SENSOR_THEORY.md) | Hub + shared vector/magnitude ideas |
| [CH4_BMM350.md](./CH4_BMM350.md) | Magnetometer chapter |
| [prompts/SENSOR_BMI270.md](../prompts/SENSOR_BMI270.md) | HTML dashboard generator |

*Developer catalog API: `extension/docs/bitstream-telemetry-provider/` — optional for workshop track.*
