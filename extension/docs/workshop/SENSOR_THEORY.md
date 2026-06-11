# Sensor Theory — TESAIoT Bitstream Studio Workshop

**Audience:** Workshop trainees, instructors, and embedded developers (hardware + firmware).

**Companion:** [WORKSHOP_OUTLINE.md](./WORKSHOP_OUTLINE.md) (session plan) · [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) (which theory chapter per workshop session).

This document is the **hub** for shared sensor concepts. Each on-board sensor has a **dedicated chapter** with workshop labs and embedded depth (I²C, firmware, BS2 wire).

---

## Per-sensor chapters

| Chapter | Sensor | Quantities | Document |
|---------|--------|------------|----------|
| **1** | **SHT40** | Temperature, relative humidity | **[CH1_SHT40.md](./sensor-theory/CH1_SHT40.md)** |
| **2** | **DPS368** | Barometric pressure, chip temperature | **[CH2_DPS368.md](./sensor-theory/CH2_DPS368.md)** |
| **3** | **BMI270** | Acceleration, gyro, fused orientation | **[CH3_BMI270.md](./sensor-theory/CH3_BMI270.md)** |
| **4** | **BMM350** | Magnetic field X/Y/Z, chip temperature | **[CH4_BMM350.md](./sensor-theory/CH4_BMM350.md)** |

Read **Chapter 1 (SHT40)** first — it introduces scalar readings, slow-sensor rate planning, and the firmware-to-UI pipeline. Chapters 2–4 add pressure, motion (vectors + fusion), and magnetometer (vectors + interference).

---

## TESAIoT DevKit — four sensors on one board

The **TESAIoT DevKit** carries four digital sensors. Bitstream Studio reads them in real time when the board is linked (toolbar **Bitstream** + **Link**).

| Sensor | Physical quantity | One-line role on the board |
|--------|-------------------|----------------------------|
| **SHT40** | Air temperature and humidity | “How warm and how moist is the air near the board?” |
| **DPS368** | Barometric pressure (+ chip temperature) | “What is the air pressure around the board?” (weather / altitude clue) |
| **BMI270** | Acceleration, rotation, and fused orientation | “How is the board moving and which way is it tilted?” |
| **BMM350** | Magnetic field (3 axes) + chip temperature | “What does the local magnetic field look like in X, Y, Z?” (compass-style labs) |

```text
        ┌─────────────────────────────────────┐
        │         TESAIoT DevKit              │
        │  SHT40   DPS368   BMI270   BMM350   │
        └──────────────┬──────────────────────┘
                       │ USB  ↔  Bitstream Studio
              live readings up · settings down
```

**Simulator** shows the same four sensors with synthetic motion when no board is available. The ideas below apply to both; hands-on demos should use the **DevKit first**.

---

## Core ideas (all sensors)

### One reading = a name, a number, and a unit

Bitstream Studio never shows a bare number without context. Example:

- **Temperature** → `24.5` **°C**
- **Humidity** → `62` **%RH** (percent relative humidity)
- **Pressure** → `1013.2` **hPa** (hectopascals; same scale as weather reports)

Trainees should always say all three parts aloud: *“Humidity is sixty-two percent.”*

### Single values vs three-axis vectors

| Type | Meaning | Workshop examples |
|------|---------|-------------------|
| **Single value (scalar)** | One number | Temperature, humidity, pressure |
| **Three-axis vector** | X, Y, Z together | Acceleration, gyro, magnetic field |

For vectors, think of three perpendicular arrows fixed to the board. When you **tilt** the board, accel X/Y/Z change. When you **spin** it, gyro X/Y/Z change.

**Combined strength** (one number from a vector) — useful for shake detection:

```text
strength = √(x² + y² + z²)
```

Example: board sitting flat — acceleration strength is about **9.8 m/s²** (gravity).

### From raw value to bar or gauge (0–100%)

Dashboards often show a **fill level** between a chosen minimum and maximum:

```text
percent = (value − minimum) ÷ (maximum − minimum) × 100
(capped at 0% and 100%)
```

| Reading | Workshop range | Value | Bar |
|---------|------------------|-------|-----|
| Humidity | 0–100 %RH | 62 % | 62% |
| Indoor temperature | 0–50 °C | 25 °C | 50% |
| Sea-level pressure band | 900–1100 hPa | 1013 hPa | ~56% |

Use a range that matches the lesson. Humidity is already 0–100; the bar can match the number directly. Gyroscope bars often use a **narrower** motion band (e.g. ±1 rad/s) so small hand movements are visible.

### Live, offline, and stale

| State | What the trainee should understand |
|-------|--------------------------------------|
| **Live** | DevKit or Simulator linked; numbers change when the world changes |
| **Offline** | Not connected — no trustworthy stream |
| **Stale** | Link lost (e.g. USB unplugged); last number may still be on screen but is **old** |

Rule: if the value has not changed and the board is moving, treat the display with suspicion.

### Settings you send back to the board

From **Sensor Telemetry**, trainees can change how each sensor behaves:

| Setting | Plain meaning |
|---------|----------------|
| **Enabled** | Stream on or off |
| **Sampling rate** | How often the chip measures |
| **When to publish** | **Periodic** (steady clock), **On change** (only when value moves enough), **Hybrid** (mix) |
| **Which channels** | Which measurements are included (e.g. BMI270 **Raw** vs **Fusion**) |

Flow: adjust → **Apply** → board confirms → live data matches the new choice.

**Embedded note:** Settings are **SENSOR_CFG** on the BS2 UART link. Schema: `extension/src/bitstream2/docs/SENSOR_CFG_V2.md`. Under heavy EVT load, GET/SET may need retry or slower sample rates on other sensors first.

---

## Working with multiple sensors

### Roles in a dashboard

| Role | Sensor | Widget idea |
|------|--------|-------------|
| **Climate** | SHT40 | Temp + humidity cards |
| **Weather / air mass** | DPS368 | Pressure ring |
| **Motion / tilt** | BMI270 | Bars, pitch/roll gauges |
| **Direction / field** | BMM350 | Compass or 3-axis bars |

### Suggested color cues (Course Studio, Ch6)

Keep one accent color per sensor across the page so trainees can scan quickly. Example:

- BMI270 — motion (teal family in product examples)
- SHT40 — climate (warm neutral / `#5ee89a` in workshop HTML)
- DPS368 — pressure (cool blue)
- BMM350 — magnetics (violet)

Exact colors are flexible; **consistency** matters more than the hex code.

### Pipeline thinking (Sensor Studio)

```text
Sensor node  →  optional Math / Map Range / Vector Length  →  Gauge or dashboard
```

Build **one wire at a time**. Name nodes (“SHT40 temp °F”, “Shake magnitude”). Test with a deliberate board motion before adding the next sensor.

---

## Instructor notes — common questions

| Question | Short answer |
|----------|----------------|
| “Why does gravity show on the accelerometer?” | Accelerometers measure **proper acceleration**; gravity is real when the board is still. |
| “Why are gyro values noisy when I’m not moving?” | Noise and drift are normal at high sampling; use **on change** publish or fusion for display-only lessons. |
| “Why don’t humidity and temperature change instantly?” | Thermal mass of the PCB and air flow; SHT40 is fast but not instantaneous. See [CH1_SHT40.md](./sensor-theory/CH1_SHT40.md). |
| “Pressure didn’t change when I lifted the board.” | Altitude effect is small over desk height; use the **weather band** story, not elevator physics. |
| “Compass doesn’t point north.” | Uncalibrated magnetometer + indoor distortion; teach **relative** field change, not navigation grade heading. |
| “Simulator vs DevKit?” | Same four sensors and UI; DevKit proves real physics, Simulator fills backup seats. |

---

## Quick reference — measurements cheat sheet

| Sensor | Main fields trainees see | Primary unit | BS2 sensorId |
|--------|--------------------------|--------------|--------------|
| SHT40 | Temperature, Humidity | °C, %RH | 2 |
| DPS368 | Pressure, Temperature | hPa, °C | 3 |
| BMI270 | Accel X/Y/Z, Gyro X/Y/Z, Pitch, Roll, Heading | m/s², rad/s, rad | 0 |
| BMM350 | Mag X/Y/Z, Temperature | µT, °C | 1 |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [WORKSHOP_OUTLINE.md](./WORKSHOP_OUTLINE.md) | Session plan, demos, timing |
| [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) | Workshop Ch1–6 × sensor theory × labs |
| [sensor-theory/CH1_SHT40.md](./sensor-theory/CH1_SHT40.md) | SHT40 full chapter (workshop + embedded) |
| [README.md](./README.md) | Workshop doc index |

*Developer catalog and API details live in `extension/docs/bitstream-telemetry-provider/` — not required for the workshop track.*
