# TESAIoT Bitstream Studio — One-Day Training Outline

**Date:** ******\_\_\_******  
**Venue:** ******\_\_\_******  
**Audience:** Mixed (beginners + engineers)  
**Hardware:** TESAIoT DevKit per station · USB cable · PC with VS Code + Bitstream Studio + **TESAIoT Firmware Flasher** installed  
**Total duration:** ~6 hrs 30 min (09:00–12:00 · 13:00–16:00, excluding lunch)

---

## Morning Session — 09:00–12:00 (3 hrs)

> **Goal:** Understand the hardware, firmware stack, and tool ecosystem — then get a live connection running with the TESAIoT DevKit.

---

### 1 · Introduction to TESAIoT DevKit and TESAIoT Firmware Stack

**09:00–09:30 · 30 min**

| Block              | Content                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Overview**       | What is the TESAIoT DevKit? Board tour: sensors, USB connector, indicator LEDs                                        |
| **Firmware stack** | CM55 (application + bitstream protocol) and CM33 (Wi-Fi / RTOS) dual-core architecture; how they communicate over IPC |
| **Data path**      | On-board sensors → firmware pipeline → BS2 framed protocol → USB UART → host PC                                       |
| **Two-way link**   | Live readings flow **up**; sensor settings (rate, mode, channel mask) flow **down** on the same link                  |
| **Simulator**      | Practice mode for seats without hardware — same four sensors, synthetic motion                                        |
| **Key takeaway**   | "The DevKit is always the source of truth. Simulator is the backup, not the default."                                 |

---

### 2 · Introduction to PSoC Edge AI and Sensors

**09:30–10:00 · 30 min**

| Block                     | Content                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **PSoC Edge AI**          | Infineon PSoC™ Edge: CM55 (ML/inference) + CM33 (connectivity/RTOS) on one die; why dual-core matters for IoT AI applications |
| **Four on-board sensors** |                                                                                                                               |
|                           | **SHT40** — air temperature (°C) + relative humidity (%RH); I²C slow scalar sensor                                            |
|                           | **DPS368** — barometric pressure (hPa) + chip temperature; weather / altitude applications                                    |
|                           | **BMI270** — 6-axis IMU: acceleration (m/s²), gyroscope (°/s), fused orientation (pitch/roll/yaw)                             |
|                           | **BMM350** — 3-axis magnetometer (µT) + chip temperature; compass-style applications                                          |
| **Scalar vs vector**      | Single-value (SHT40, DPS368) vs three-axis (BMI270, BMM350); vector magnitude `√(x²+y²+z²)`                                   |
| **Units and ranges**      | Name + number + unit — trainees should always read all three aloud                                                            |
| **Key takeaway**          | Know which sensor produces which quantity before touching any software.                                                       |

---

### 3 · Introduction to Bitstream Studio

**10:00–10:30 · 30 min**

| Block                | Content                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **What it is**       | VS Code extension — one workspace, four apps                                                |
| **Four apps**        |                                                                                             |
|                      | **Sensor Telemetry** — connect the DevKit, view live readings, configure sensors            |
|                      | **Sensor Studio** — visual node-based editor: wire sensors → math → dashboard/3D            |
|                      | **Course Studio** — build lesson pages with embedded live widgets                           |
|                      | **Applications / Examples** — ready-made flows and dashboards to copy and learn from        |
| **The journey**      | Connect → Wire → Show → Teach (trainees may enter at any step)                              |
| **One live world**   | All four apps share the same serial bridge connection — change source once, all apps update |
| **Toolbar controls** | **Bitstream** (DevKit) vs **Simulator** — mutually exclusive; **Link** = live stream on/off |
| **Demo**             | Open Bitstream Studio, identify each app tab, show the toolbar source selector              |
| **Key takeaway**     | "One connection, four views — not four separate programs."                                  |

---

### ☕ Break — 10:30–10:45 (15 min)

---

### 4 · Getting Started with the TESAIoT DevKit

**10:45–11:30 · 45 min**

| Block                              | Content                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Hardware setup**                 | USB connection, COM port detection, driver check                                                                                 |
| **Connecting in Bitstream Studio** | Toolbar → **Bitstream** → select COM port → **Link**                                                                             |
| **Sensor Telemetry first look**    | Live deck: four sensor cards updating in real time                                                                               |
| **Hands-on lab A**                 | Cup hands over board — watch SHT40 temperature and humidity rise                                                                 |
| **Hands-on lab B**                 | Tilt the board — watch BMI270 acceleration X/Y/Z shift                                                                           |
| **Connection states**              | **Live** (streaming) vs **Stale** (link lost, last value frozen) vs **Offline** (not connected); unplug USB to demonstrate stale |
| **Simulator fallback**             | Switch to Simulator for any station without hardware — same UI, synthetic data                                                   |
| **Key takeaway**                   | Every trainee has a live reading by the end of this section.                                                                     |

---

### 5 · TESAIoT Firmware Flasher

**11:30–12:00 · 30 min**

| Block                   | Content                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Why update firmware** | Bug fixes, new sensor modes, protocol version alignment with Bitstream Studio                                                                                                   |
| **Flasher overview**    | Standalone desktop app (**TESAIoT Firmware Flasher**): KitProg3 bridge detection, pick or drag-and-drop `app_combined.hex`, flash all cores (CM33-S, CM33-NS, CM55) in one pass |
| **Flash walkthrough**   | Connect DevKit via USB → confirm agent + KitProg3 bridge → select workshop firmware image → **Flash Firmware** → watch per-core progress → review log on success                |
| **Version check**       | How to confirm the installed firmware version matches the expected BS2 protocol handshake (HELLO in Bitstream Studio after flash)                                               |
| **Common pitfalls**     | KitProg3 bridge not detected; wrong or stale HEX file; flash aborted mid-program; USB cable or driver issue; version mismatch causing stale handshake                           |
| **Demo**                | Instructor demonstrates one full flash cycle; trainees confirm their board version in Sensor Telemetry                                                                          |
| **Key takeaway**        | Firmware and extension version must be aligned — always flash the workshop image and verify before lunch.                                                                       |

---

## 🍽 Lunch Break — 12:00–13:00 (1 hr)

---

## Afternoon Session — 13:00–16:00 (3 hrs)

> **Goal:** Build, wire, and display data — from raw sensor readings to a complete no-code IoT dashboard.

---

### 6 · Sensor Telemetry — Sensor Configurator

**13:00–13:45 · 45 min**

| Block                      | Content                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What you can configure** | Enabled (on/off), sampling rate, publish mode (Periodic / On change / Hybrid), channel mask, sensitivity threshold                                   |
| **Apply flow**             | Change slider → press **Apply** → board acknowledges → live stream reflects new settings                                                             |
| **BMI270 output profiles** | **Raw** (accel + gyro axes) · **Fusion** (pitch/roll/yaw) · **All** (both); hands-on: switch and observe telemetry deck                              |
| **Rate trade-offs**        | High rate = more responsive but more USB bandwidth; low rate + on-change = battery-friendly                                                          |
| **Hands-on lab**           | Lower BMI270 sampling rate → switch to On-change → rotate board → observe burst behaviour; toggle one channel off and verify it disappears from deck |
| **Cross-sensor example**   | Disable DPS368 during a temperature-only exercise to reduce noise                                                                                    |
| **Key takeaway**           | "Change settings on the card, always press Apply, then confirm the stream responded."                                                                |

---

### 7 · Sensor Studio — Node-Based Editor

**13:45–14:30 · 45 min**

| Block                       | Content                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **The node editor concept** | Three block types: **Sensor** (source) → **Utility/Math** (transform) → **Output** (display); data flows left to right                   |
| **Work modes**              | **Wire** (build the graph) · **2D** (tune Dashboard HMI) · **3D** (tune Stage / digital twin) · **Twin** (both surfaces at once)         |
| **One graph, two faces**    | Dashboard Output (2D operator screen) and Stage Output (3D scene) both read from the same flow graph                                     |
| **Key nodes**               | Sensor input, Math, Map Range, Vector Length, Threshold, Radial Gauge, Dashboard Gauge, Numeric Readout                                  |
| **Inspector & Pin**         | Click any node to inspect; use **Pin** to lock inspector on a widget while clicking elsewhere                                            |
| **Desk layouts**            | Named layout presets (Graph Focus, Dashboard Focus, Stage Focus, Twin Focus); save your own arrangement                                  |
| **Hands-on lab**            | Add SHT40 node → wire **temperature** to a Radial Gauge → Link the DevKit → confirm live °C update → insert Math node to convert °C → °F |
| **Key takeaway**            | "One sensor, one wire, one gauge — get that working before adding anything else."                                                        |

---

### ☕ Break — 14:30–14:45 (15 min)

---

### 8 · Working with Individual Sensors (Hands-on Labs)

**14:45–15:30 · 45 min**

Four short paired labs — beginners follow the recipe; engineers are encouraged to add extra math or logic nodes.

#### Lab 1 — Environment Sensor: SHT40 (10 min)

- SHT40 node → **temperature** + **humidity** → two Radial Gauges side by side
- Add comfort zone annotation: Map Range 18–28 °C → 0–100% fill
- Breathe on the board; watch both values update

#### Lab 2 — Pressure Sensor: DPS368 (10 min)

- DPS368 node → **pressureHpa** → Numeric Readout + vertical Bar Meter
- Map Range 900–1100 hPa → 0–100% gauge fill (sea-level weather band)
- Discuss altitude clue: pressure drops ~1.2 hPa per 10 m of elevation

#### Lab 3 — Magnetometer: BMM350 (10 min)

- BMM350 node → **magX / magY / magZ** → three Bar Meters (one per axis)
- Add **Vector Length** node → magnetic field strength readout
- Slowly rotate the board; observe axis values shifting while strength stays roughly constant

#### Lab 4 — IMU: BMI270 (15 min)

- BMI270 node (Fusion profile) → **pitch** + **roll** → two Radial Gauges
- Add **Vector Length** on accel X/Y/Z → magnitude display
- Insert **Threshold** node (magnitude > 15 m/s²) → LED/Status Pill for shake detection
- Shake the board to trip the threshold

---

### 9 · IoT Dashboard Design with No Code

**15:30–15:50 · 20 min**

| Block                      | Content                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Course Studio overview** | Pages, widget boards, block types (numeric readout, vertical bar, status pill, LED indicator, hero gauge, infographic skins)                                                   |
| **Five theme presets**     | EV Compact, Course Amber, Industrial, Telemetry Cyan, Sci-Fi — apply in one click                                                                                              |
| **Layout principles**      | One color per sensor (SHT40 green `#5ee89a`, DPS368 blue `#5eb8f5`, BMI270 cyan `#42e8ff`, BMM350 purple `#b88cff`); always show value + unit + connection state               |
| **Live widgets**           | Widget board blocks auto-connect to the same DevKit link — same live stream, polished look                                                                                     |
| **Hands-on**               | Create a **Four-Sensor Dashboard** page in Course Studio: one region per sensor, captions, units visible; preview with DevKit linked; unplug once to demonstrate stale styling |
| **Key takeaway**           | "A Course Studio page is the Sensor Studio graph with a lesson-ready face."                                                                                                    |

---

### 10 · IoT Application Development

**15:50–16:00 · 10 min**

| Block                            | Content                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bitstream Telemetry Provider** | External HTML apps can subscribe to live sensor data via WebSocket (ws://127.0.0.1:9997) or postMessage (iframe) — no firmware knowledge required |
| **Applications / Examples**      | Copy starter flows: `sht40-climate-dashboard.html`, `bmi270-motion-dashboard.html`, `workshop-four-sensor-dashboard.html`                         |
| **MQTT broker**                  | Optional local Aedes broker for multi-device or cloud forwarding scenarios                                                                        |
| **Next steps for engineers**     | Bitstream framed protocol (BS2), CM55/CM33 IPC reference, Wi-Fi IPC commands, custom firmware nodes                                               |
| **Wrap-up**                      | Capstone checklist: four sensors labeled, units visible, connection state shown, one saved Sensor Studio flow + one saved Course page per trainee |

---

## Day Summary

| Time        | Session                                          | Duration         |
| ----------- | ------------------------------------------------ | ---------------- |
| 09:00–09:30 | TESAIoT DevKit & Firmware Stack                  | 30 min           |
| 09:30–10:00 | PSoC Edge AI & Sensors                           | 30 min           |
| 10:00–10:30 | Bitstream Studio Introduction                    | 30 min           |
| 10:30–10:45 | ☕ Break                                         | 15 min           |
| 10:45–11:30 | Getting Started with the DevKit                  | 45 min           |
| 11:30–12:00 | TESAIoT Firmware Flasher                         | 30 min           |
| 12:00–13:00 | 🍽 Lunch                                         | 60 min           |
| 13:00–13:45 | Sensor Configurator                              | 45 min           |
| 13:45–14:30 | Sensor Studio Node Editor                        | 45 min           |
| 14:30–14:45 | ☕ Break                                         | 15 min           |
| 14:45–15:30 | Hands-on Labs (SHT40 · DPS368 · BMM350 · BMI270) | 45 min           |
| 15:30–15:50 | No-Code Dashboard Design                         | 20 min           |
| 15:50–16:00 | IoT Application Development & Wrap-up            | 10 min           |
| **Total**   |                                                  | **6 hrs 30 min** |

---
