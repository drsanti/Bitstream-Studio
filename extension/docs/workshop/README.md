# TESAIoT Bitstream Studio — Workshop documentation

Trainee-facing material for the hands-on workshop (**TESAIoT DevKit** first, **Simulator** as fallback).

## Documents

| Document | Use for |
|----------|---------|
| **[WORKSHOP_OUTLINE.md](./WORKSHOP_OUTLINE.md)** | Session plan — six chapters, timing, demos, summaries |
| **[INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md)** | Instructor one-pager — workshop Ch1–6 × sensor theory × labs × timing |
| **[SENSOR_THEORY.md](./SENSOR_THEORY.md)** | Sensor theory hub — shared concepts, cheat sheet, chapter index |
| **[sensor-theory/CH1_SHT40.md](./sensor-theory/CH1_SHT40.md)** | Chapter 1 — SHT40 (workshop labs + embedded HW/FW/BS2 depth) |
| **[sensor-theory/CH2_DPS368.md](./sensor-theory/CH2_DPS368.md)** | Chapter 2 — DPS368 (barometric pressure + chip temp; weather strip with SHT40) |
| **[sensor-theory/CH3_BMI270.md](./sensor-theory/CH3_BMI270.md)** | Chapter 3 — BMI270 (IMU, fusion profiles, vector magnitude / shake labs) |
| **[sensor-theory/CH4_BMM350.md](./sensor-theory/CH4_BMM350.md)** | Chapter 4 — BMM350 (magnetometer, Earth field, I3C, compass-style labs) |
| **[prompts/README.md](./prompts/README.md)** | AI agent prompts to generate per-sensor HTML + four-sensor dashboard |
| **[examples/](./examples/)** | Generated workshop HTML (run `scripts/generate-workshop-html.mjs`) |
| **[../BITSTREAM_STUDIO_UNIFIED_UX.md](../BITSTREAM_STUDIO_UNIFIED_UX.md)** | Instructor / product — all-in-one journey (Connect → Wire → Show → Teach), Sensor Studio work modes |

**Course Studio:** TESAIoT Embedded → chapter **Tesring** → **Workshop HTML** → subtopic **Live sensor dashboards** (`workshop-live-html` page, HTML Editor blocks).

## Suggested prep

1. Read **WORKSHOP_OUTLINE.md** for flow and **INSTRUCTOR_SENSOR_MATRIX.md** for session × sensor mapping (~7.5 hrs).
2. Read **SENSOR_THEORY.md** (core ideas) and all four chapters under **`sensor-theory/`** (SHT40 → DPS368 → BMI270 → BMM350).
3. Verify each station: USB, toolbar **Bitstream**, **Link**, one **TESAIoT DevKit** per pair.

## Hardware

Primary: **TESAIoT DevKit** (on-board SHT40, DPS368, BMI270, BMM350).

Fallback: external **Simulator** extension when a board is unavailable.
