# Core ideas — all four sensors

**Audience:** Workshop trainees, instructors, and embedded developers.

This chapter introduces shared concepts before the per-sensor deep dives. Read it first, then continue with **SHT40** (Chapter 1) — it is the gentlest scalar intro before pressure, motion vectors, and magnetics.

---

## TESAIoT DevKit — four sensors on one board

The **TESAIoT DevKit** carries four digital sensors. Bitstream Studio reads them in real time when the board is linked (toolbar **Bitstream** + **Link**).

| Sensor | Physical quantity | One-line role |
|--------|-------------------|---------------|
| **SHT40** | Air temperature and humidity | How warm and how moist is the air near the board? |
| **DPS368** | Barometric pressure (+ chip temperature) | What is the air pressure around the board? |
| **BMI270** | Acceleration, rotation, fused orientation | How is the board moving and which way is it tilted? |
| **BMM350** | Magnetic field (3 axes) + chip temperature | What does the local magnetic field look like in X, Y, Z? |

```text
        ┌─────────────────────────────────────┐
        │         TESAIoT DevKit              │
        │  SHT40   DPS368   BMI270   BMM350   │
        └──────────────┬──────────────────────┘
                       │ USB  ↔  Bitstream Studio
              live readings up · settings down
```

**Simulator** shows the same four sensors with synthetic data when no board is available. The ideas below apply to both; hands-on demos should use the **DevKit first**.

---

## Per-sensor chapters in this book

| Chapter | Sensor | Quantities |
|---------|--------|------------|
| **1** | **SHT40** | Temperature, relative humidity |
| **2** | **DPS368** | Barometric pressure, chip temperature |
| **3** | **BMI270** | Acceleration, gyro, fused orientation |
| **4** | **BMM350** | Magnetic field X/Y/Z, chip temperature |

Each chapter has four topics: **overview**, **engineering**, **labs**, and **reference**.

---

## One reading = a name, a number, and a unit

Bitstream Studio never shows a bare number without context.

- **Temperature** → `24.5` **°C**
- **Humidity** → `62` **%RH**
- **Pressure** → `1013.2` **hPa**

Trainees should always say all three parts aloud: *"Humidity is sixty-two percent."*

---

## Single values vs three-axis vectors

| Type | Meaning | Examples |
|------|---------|----------|
| **Scalar** | One number | Temperature, humidity, pressure |
| **Vector** | X, Y, Z together | Acceleration, gyro, magnetic field |

For vectors, think of three perpendicular arrows fixed to the board. When you **tilt** the board, accel X/Y/Z change. When you **spin** it, gyro X/Y/Z change.

**Combined strength** (one number from a vector):

```text
strength = √(x² + y² + z²)
```

Example: board sitting flat — acceleration strength is about **9.8 m/s²** (gravity).

---

## From raw value to bar or gauge (0–100%)

```text
percent = (value − minimum) ÷ (maximum − minimum) × 100
(capped at 0% and 100%)
```

| Reading | Workshop range | Example | Bar |
|---------|------------------|---------|-----|
| Humidity | 0–100 %RH | 62 % | 62% |
| Indoor temperature | 0–50 °C | 25 °C | 50% |
| Sea-level pressure band | 900–1100 hPa | 1013 hPa | ~56% |

---

## Live, offline, and stale

| State | Meaning |
|-------|---------|
| **Live** | DevKit or Simulator linked; numbers change when the world changes |
| **Offline** | Not connected — no trustworthy stream |
| **Stale** | Link lost; last number may still display but is **old** |

If the board is moving and the number is frozen, treat the display with suspicion.

---

## Settings you send back to the board

From **Sensor Telemetry**, you can change how each sensor behaves:

| Setting | Plain meaning |
|---------|----------------|
| **Enabled** | Stream on or off |
| **Sampling rate** | How often the chip measures |
| **When to publish** | Periodic, on change, or hybrid |
| **Which channels** | Which measurements are included (e.g. BMI270 Raw vs Fusion) |

Flow: adjust → **Apply** → board confirms → live data matches the new choice.

**Embedded note:** Settings are **SENSOR_CFG** on the BS2 UART link. Under heavy EVT load, GET/SET may need retry or slower sample rates on other sensors first.

---

## Working with multiple sensors

| Role | Sensor | Widget idea |
|------|--------|-------------|
| **Climate** | SHT40 | Temp + humidity cards |
| **Weather / air mass** | DPS368 | Pressure ring |
| **Motion / tilt** | BMI270 | Bars, pitch/roll gauges |
| **Direction / field** | BMM350 | Compass or 3-axis bars |

**Pipeline thinking (Sensor Studio):**

```text
Sensor node  →  optional Math / Map Range / Vector Length  →  Gauge or dashboard
```

Build **one wire at a time**. Name nodes. Test with a deliberate board motion before adding the next sensor.

---

## Quick reference — measurements cheat sheet

| Sensor | Main fields | Primary unit | BS2 sensorId |
|--------|-------------|--------------|--------------|
| SHT40 | Temperature, Humidity | °C, %RH | 2 |
| DPS368 | Pressure, Temperature | hPa, °C | 3 |
| BMI270 | Accel X/Y/Z, Gyro X/Y/Z, Pitch, Roll, Heading | m/s², rad/s, rad | 0 |
| BMM350 | Mag X/Y/Z, Temperature | µT, °C | 1 |

---

## Common questions

| Question | Short answer |
|----------|--------------|
| Why does gravity show on the accelerometer? | Accelerometers measure proper acceleration; gravity is real when the board is still. |
| Why are gyro values noisy when I'm not moving? | Noise and drift are normal at high sampling; use on-change publish or fusion for display-only lessons. |
| Why don't humidity and temperature change instantly? | Thermal mass of the PCB and air flow; SHT40 is fast but not instantaneous. |
| Pressure didn't change when I lifted the board. | Altitude effect is small over desk height; use the weather band story. |
| Compass doesn't point north. | Uncalibrated magnetometer + indoor distortion; teach relative field change. |
| Simulator vs DevKit? | Same four sensors and UI; DevKit proves real physics. |

---

## Next — Workshop Ch6 capstone

After the four sensor chapters, open **Workshop capstone → Four-sensor dashboard (Ch6)** for the full 2×2 infographic layout with workshop color cues (climate, pressure, motion, mag).
