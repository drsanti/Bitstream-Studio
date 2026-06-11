# BMI270 — Reference & knowledge check

Use cases, pitfalls, instructor notes, and quick reference tables.

---

## Real-world use cases

| Domain | BMI270 role |
|--------|-------------|
| **Vibration / machine health** | Accel magnitude trends |
| **Robotics attitude** | Fusion pitch/roll |
| **Fall / impact detection** | Sudden accel spike |
| **Interactive exhibits** | Tilt-to-steer without GPS |

**Embedded product notes:**

- **Fusion** needs consistent fusion feed; starving BSX produces stale Euler.
- **Navigation heading** needs magnetometer fusion (BMM350) — workshop keeps IMU and mag **separate** for learning.
- **Power:** 10 Hz raw often enough for logging; 50 Hz for active UI only.
- **Mounting:** Hard-mount IMU to structure under test; foam isolation changes accel semantics.

---

## Limitations, pitfalls, and debug

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
| Mask vs wire mismatch | Hybrid gating / stream mode | `BMI270_MODE_GET`, UART probe |
| UART saturation | 50 Hz + mask `0x1f` + other sensors | Trim mask or rates |

---

## Knowledge check

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

## Instructor notes

- Budget extra time for **output profile** + **publish mode** in Sensor Telemetry.
- Prepare a “**0.5 rad ≈ 29°**” rule of thumb on a slide.
- Pre-test shake threshold on your desk surface — foam pads change spikes.
- Verify **Raw** profile in both **Bitstream** and **Simulator** before class.

---

## Quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | Motion + tilt — “how is the board moving?” |
| Vectors | Accel X/Y/Z (m/s²), Gyro X/Y/Z (rad/s) |
| Fusion | Heading, pitch, roll (rad or °) |
| At rest | Accel strength ≈ 9.8 m/s² (≈ 1 g) |
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
