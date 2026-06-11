# Instructor matrix — workshop sessions × sensor theory

**Purpose:** One-page map for instructors — which **workshop session** (Ch1–6) uses which **sensor**, which **theory chapter** to assign or skim, and where **embedded** depth lives.

**Total session time:** ~7.5 hours (405 min).  
**Theory quartet:** [CH1 SHT40](./sensor-theory/CH1_SHT40.md) · [CH2 DPS368](./sensor-theory/CH2_DPS368.md) · [CH3 BMI270](./sensor-theory/CH3_BMI270.md) · [CH4 BMM350](./sensor-theory/CH4_BMM350.md)  
**Hub:** [SENSOR_THEORY.md](./SENSOR_THEORY.md) (shared concepts, cheat sheet, FAQ)

---

## At a glance

| Workshop | Time | Lead sensor(s) on DevKit | Sensor theory (read / assign) | Trainee must leave knowing |
|----------|------|--------------------------|-------------------------------|----------------------------|
| **Ch1** Introduction & Architecture | 45 min | All (demo: **SHT40** warm-up) | [SENSOR_THEORY.md](./SENSOR_THEORY.md) § Core ideas | Four apps, live ↔ settings, board first |
| **Ch2** Sensor Telemetry | 75 min | **SHT40** (primary); **DPS368** optional bar | [CH1](./sensor-theory/CH1_SHT40.md) · [CH2](./sensor-theory/CH2_DPS368.md) §8–9 | Value + unit + bar %; live / stale |
| **Ch3** Sensor Configuration | 60 min | **BMI270** (demo centerpiece) | [CH3](./sensor-theory/CH3_BMI270.md) §4–7 | Apply, output profile, publish mode |
| **Ch4** Sensor Studio basics | 75 min | **SHT40**, **DPS368** | [CH1](./sensor-theory/CH1_SHT40.md) §10 · [CH2](./sensor-theory/CH2_DPS368.md) §10 | Sensor → (math) → gauge; save flow |
| **Ch5** Pipelines & multi-sensor | 75 min | **BMI270**, **BMM350**, **SHT40**+**DPS368** strip | [CH3](./sensor-theory/CH3_BMI270.md) §9–10 · [CH4](./sensor-theory/CH4_BMM350.md) §9–10 · CH1+CH2 weather | Vector length, threshold, multi-sensor |
| **Ch6** Course Studio dashboard | 75 min | **All four** | All four theory chapters §10 + hub § colors | Polished page, four regions, stale styling |

---

## Per workshop chapter — instructor detail

### Ch1 — Introduction & Architecture (45 min)

| Item | Guidance |
|------|----------|
| **Theory prep** | Hub only — no need to assign full sensor chapters yet |
| **Demo sensor** | Cup hands on board → **SHT40** temp (foreshadow [CH1](./sensor-theory/CH1_SHT40.md)) |
| **Embedded (optional aside)** | Mention “name + number + unit” and UART path; defer BS2 IDs to theory chapters |
| **Simulator** | Show same four sensors if one seat has no board |

---

### Ch2 — Sensor Telemetry (75 min)

| Item | Guidance |
|------|----------|
| **Primary theory** | [CH1](./sensor-theory/CH1_SHT40.md) — §2 physics (light), §7–8 readouts & bars, §9 Labs 1–3 |
| **Stretch / fast group** | [CH2](./sensor-theory/CH2_DPS368.md) — §8 sea-level band (900–1100 hPa), optional pressure bar |
| **Demo order** | SHT40 temp + humidity → humidity bar → unplug USB → **stale** |
| **Embedded track** | CH1 §5–6 if audience is firmware/HW; CH2 §6 wire scale hPa×10 if doing pressure |
| **Common pitfall** | Humidity bar capped at 50% by mistake — use 0–100 %RH |

**Suggested timing inside 75 min:** 15 theory · 35 hands-on · 15 review · 10 buffer

---

### Ch3 — Sensor Configuration (60 min)

| Item | Guidance |
|------|----------|
| **Primary theory** | [CH3](./sensor-theory/CH3_BMI270.md) — §4 output profiles, §7 configuration, §9 Labs 5–6 |
| **Cross-ref** | Hub § Settings; CH1/CH2 slow-sensor rates if someone asks about SHT40/DPS368 |
| **Demo script** | Lower rate → on-change + rotate → **Raw** vs **Fusion** → toggle one telemetry channel |
| **Embedded track** | CH3 §5–6 fusion feed **10 ms** vs telemetry **20 ms**; REQ `0x14`–`0x17` |
| **Common pitfall** | Sliders changed but **Apply** not pressed |

**Suggested timing:** 10 recap · 40 BMI270 demo · 10 trainee try · 10 buffer

---

### Ch4 — Sensor Studio basics (75 min)

| Item | Guidance |
|------|----------|
| **Primary theory** | [CH1](./sensor-theory/CH1_SHT40.md) §10 · [CH2](./sensor-theory/CH2_DPS368.md) §10 |
| **Demo script** | SHT40 → gauge → Math °C→°F → DPS368 pressure display → save/reload |
| **Embedded track** | Field keys `temperatureC`, `humidityPct`, `pressureHpa`; port types scalar vs vector |
| **Defer** | BMI270/BMM350 vector wiring → Ch5 |

**Suggested timing:** 15 node editor theory · 45 build · 15 save/test

---

### Ch5 — Pipelines (75 min)

| Item | Guidance |
|------|----------|
| **Theory by mini-flow** | Shake → [CH3](./sensor-theory/CH3_BMI270.md) §2 magnitude, §10 Vector Length · Compass → [CH4](./sensor-theory/CH4_BMM350.md) §2 vector, §8 ±100 µT · Weather → [CH1](./sensor-theory/CH1_SHT40.md) + [CH2](./sensor-theory/CH2_DPS368.md) |
| **Demo order** | (1) BMI270 shake threshold (2) BMM350 rotate (3) SHT40 + DPS368 strip |
| **Embedded track** | CH3 EVT order; CH4 I3C vs I²C bus separation on AI kit |
| **Safety** | BMM350 magnet demo — instructor only, brief |

**Suggested timing:** 15 blocks theory · 50 three flows · 10 show-and-tell

---

### Ch6 — Course Studio (75 min)

| Item | Guidance |
|------|----------|
| **Theory** | Hub § multi-sensor roles & **color cues**; each sensor chapter §10 Course Studio |
| **Layout** | BMI270 motion · SHT40 climate · DPS368 pressure · BMM350 mag — captions on page |
| **HTML templates** | [examples/](./examples/) — per-sensor + [workshop-four-sensor-dashboard.html](./examples/workshop-four-sensor-dashboard.html) |
| **Demo finale** | Move board → animate IMU + mag; unplug once → stale on widgets |
| **Capstone checklist** | Four labels, units, connection honest, one saved flow + one course page |

**Suggested timing:** 10 layout theory · 50 build/preview · 15 capstone checklist

---

## Sensor-first reading order (homework / flipped classroom)

If trainees read **before** the live session, use this order (matches increasing complexity):

1. [CH1 SHT40](./sensor-theory/CH1_SHT40.md) — scalars, easiest physics  
2. [CH2 DPS368](./sensor-theory/CH2_DPS368.md) — second scalar, weather narrative  
3. [CH3 BMI270](./sensor-theory/CH3_BMI270.md) — vectors, fusion, configuration  
4. [CH4 BMM350](./sensor-theory/CH4_BMM350.md) — vectors, interference, compass story  

Pair with live workshop Ch2→Ch6 in the table above — theory chapters are **not** the same numbers as workshop Ch1–6.

---

## Embedded developer parallel track

Same room, extra depth — point engineers to these sections without slowing the whole class:

| Sensor | Hardware § | Firmware § | BS2 wire § | Debug § |
|--------|------------|--------------|------------|---------|
| SHT40 | CH1 §3 | CH1 §5 | CH1 §6 | CH1 §12 |
| DPS368 | CH2 §3 | CH2 §5 | CH2 §6 | CH2 §12 |
| BMI270 | CH3 §3 | CH3 §5 | CH3 §6 | CH3 §12 |
| BMM350 | CH4 §3 | CH4 §5 | CH4 §6 | CH4 §12 |

---

## Quick reference — workshop HTML accents

| Sensor | Catalog id | Example HTML | Accent |
|--------|------------|--------------|--------|
| SHT40 | `sht40` | [sht40-climate-dashboard.html](./examples/sht40-climate-dashboard.html) | `#5ee89a` |
| DPS368 | `dps368` | [dps368-pressure-dashboard.html](./examples/dps368-pressure-dashboard.html) | `#5eb8f5` |
| BMI270 | `bmi270` | [bmi270-motion-dashboard.html](./examples/bmi270-motion-dashboard.html) | `#42e8ff` |
| BMM350 | `bmm350` | [bmm350-magnetometer-dashboard.html](./examples/bmm350-magnetometer-dashboard.html) | `#b88cff` |
| All four | — | [workshop-four-sensor-dashboard.html](./examples/workshop-four-sensor-dashboard.html) | per region |

---

## Related documents

| Document | Role |
|----------|------|
| [WORKSHOP_OUTLINE.md](./WORKSHOP_OUTLINE.md) | Full session prose (Intro / Theory / Demo / Summary) |
| [SENSOR_THEORY.md](./SENSOR_THEORY.md) | Shared concepts + chapter index |
| [README.md](./README.md) | Workshop doc index |
