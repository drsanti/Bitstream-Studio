# TESAIoT Bitstream Studio Workshop Outline

**Audience:** Trainees — hands-on with **Sensor Telemetry**, **Sensor Studio** (node editor), and **Course Studio**. Plain language; no developer API jargon.

**Workshop hardware (priority):** Each station uses the **TESAIoT DevKit** — USB to the PC, toolbar **Bitstream** + **Link**. Use the **Simulator** only when a board is unavailable (remote prep, broken cable, extra laptops without hardware).

**Sensor theory (read alongside Ch2–6):** [SENSOR_THEORY.md](./SENSOR_THEORY.md) (hub) · [sensor-theory/](./sensor-theory/) quartet (SHT40 → DPS368 → BMI270 → BMM350).

**Instructors:** [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) — which theory chapter and labs align with each workshop session (~7.5 hrs).

**HTML generation (instructors / AI):** [prompts/README.md](./prompts/README.md) — standalone WS dashboards for HTML Editor. Index: [README.md](./README.md).

**Total:** ~7.5 hrs · **6 chapters** · **30 sections**

Each chapter follows: **Intro → Theory → Demo → Use Cases → Summary**.

---

## Chapter 1 — Introduction & Architecture (45 min)

**Sensor theory:** [SENSOR_THEORY.md](./SENSOR_THEORY.md) (core ideas) · **Demo touch:** SHT40 warm-up → [CH1_SHT40.md](./sensor-theory/CH1_SHT40.md) §9 Lab 1

### Intro

What is Bitstream Studio? Workshop goals, tools we'll use, expected outcomes.

**Bitstream Studio is one workspace made of four apps:**

| App                         | What you use it for                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Sensor Telemetry**        | Connect the **TESAIoT DevKit** (or Simulator fallback); view live readings, adjust sensor settings, and explore the telemetry deck |
| **Sensor Studio**           | Visual node editor — wire sensors through math and logic into gauges and displays                                                  |
| **Course Studio**           | Build lesson pages and dashboards that embed live sensor widgets                                                                   |
| **Applications / Examples** | Ready-made sample apps and reference flows to learn from and copy                                                                  |

**Instructor / product UX:** Connect → Wire → Show → Teach journey and Sensor Studio work modes — [BITSTREAM_STUDIO_UNIFIED_UX.md](../BITSTREAM_STUDIO_UNIFIED_UX.md).

### Theory

**Two-way real-time data path** — on-board sensors → **TESAIoT DevKit** firmware **↔** **Bridge** **↔** **Bitstream Studio**. With the board connected (toolbar **Bitstream**), live readings flow **up** to the studio while settings you change—sampling rate, which measurements to show, sensor modes—flow **down** to the board on the same link. The Bridge keeps that connection alive; all four apps above share one live stream. **Simulator** follows the same path when no board is plugged in.

### Demo

Open Bitstream Studio, connect the **TESAIoT DevKit** (USB, toolbar **Bitstream**, **Link**), open **Sensor Studio**, place a sensor node, and watch values update live—tilt the board or warm the SHT40 with your hand. Change one setting in the inspector, **Apply**, and confirm the stream responds (readings in, settings out). If a station has no board, use **Simulator** + **Link** instead and note the difference aloud.

### Use Cases

Industry 4.0: condition monitoring, predictive maintenance, remote dashboards. **TESAIoT DevKit** for hands-on labs; **Simulator** for backup seats and homework without hardware.

### Summary

Architecture diagram recap. Four apps: Sensor Telemetry, Sensor Studio, Course Studio, Applications/Examples. Key ideas: live readings, two-way settings, **board first / Simulator fallback**. Setup checklist: USB, COM link, one board per pair.

---

## Chapter 2 — Sensor Telemetry — Reading & Visualizing Live Data (75 min)

**Sensor theory:** [CH1_SHT40.md](./sensor-theory/CH1_SHT40.md) (primary) · [CH2_DPS368.md](./sensor-theory/CH2_DPS368.md) (optional pressure bar) · Matrix row: [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) § Ch2

### Intro

What does “live telemetry” mean? A reading leaves the on-board sensor and shows up on your screen almost instantly—no manual refresh. Example: SHT40 temperature ticking up when you cup the **TESAIoT DevKit** in your hands.

### Theory

**What each sensor can report** — Bitstream Studio knows the measurements available per sensor: name, unit, and a sensible display range. Example (SHT40): **temperature** in °C (often shown roughly 0–50 °C for indoor use) and **humidity** in % (0–100%).

**What a live reading looks like** — Each update is a set of named values. Example: temperature **24.5 °C**, humidity **62%**. Gauges and progress bars use the **number**, the **unit**, and the **range** together.

**Turning a number into a bar or gauge** — Map the current value between a minimum and maximum, then express it as 0–100% for the widget:

```text
percent = (value − minimum) ÷ (maximum − minimum) × 100
(capped at 0% and 100%)
```

Worked example: humidity **62%** with range **0–100%** → bar at **62%**. Temperature **25 °C** with range **0–50 °C** → bar at **50%**.

**Connection status** — Label whether data is **live** (board or Simulator linked), **offline** (not connected), or **stale** (USB unplugged or link lost; last value is old). Never treat a frozen number as if it were still updating.

### Demo

In **Sensor Telemetry**, open the telemetry deck with the **TESAIoT DevKit** linked (**Bitstream** + **Link**). Find **SHT40** temperature and humidity readouts updating live—breathe on the board to nudge humidity. Add or configure a dual progress bar (or open **Applications / Examples** and study the humidity bar example). Show value, unit, and bar percent side by side. Unplug USB briefly and point out **stale** readouts. One backup station may repeat with **Simulator** only.

### Use Cases

HVAC monitoring, cold-chain logistics, cleanroom humidity control. Good habits: say where the data comes from (live vs practice), notice when updates stop, use each sensor’s real range instead of guessing (e.g. don’t cap humidity at 50% unless that is intentional for your lesson).

### Summary

Sensor listing → live named values → map to 0–100% for visuals. Always show value + unit + connection state. Review trainee progress bars before moving to configuration.

---

## Chapter 3 — Sensor Configuration (60 min)

**Sensor theory:** [CH3_BMI270.md](./sensor-theory/CH3_BMI270.md) §4–7 (output profiles, SENSOR_CFG) · Matrix row: [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) § Ch3

### Intro

Why change sensor settings? Faster updates use more power and bandwidth; slower updates save battery but feel less responsive. You choose the trade-off for your scenario.

### Theory

**Settings you can change** (in **Sensor Telemetry**, per sensor):

| Setting                          | What it means                           | Example                                                                                        |
| -------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Enabled**                      | Turn the sensor stream on or off        | Disable DPS368 during a temperature-only lab                                                   |
| **Sampling rate**                | How often the device measures           | BMI270 every 100 ms for motion; every 2 s for a slow demo                                      |
| **When to publish**              | How updates reach the screen            | **Periodic** (on a timer), **On change** (only when the value moves enough), **Hybrid** (both) |
| **Which channels to show**       | Pick axes or measurement groups         | BMI270 **Raw** (accel + gyro), **Fusion** (orientation), or **All**                            |
| **Sensitivity to small changes** | Minimum change before “on change” fires | Humidity must move ~1% before a new reading is sent                                            |

**How changes travel** — You adjust controls in the panel → press **Apply** → the device acknowledges → the panel shows the new active settings → live readings reflect the change. If Apply fails, the old settings stay in effect—always check the status hint on the card.

**Allowed ranges** — Sliders and inputs respect min/max shown in the UI (e.g. sampling between 10 ms and 60 s). Stay inside those limits.

### Demo

In **Sensor Telemetry**, open the **BMI270** configuration cards with the **TESAIoT DevKit** linked.

1. Lower **sampling rate** and watch how often gyro values tick.
2. Switch **publish mode** to **On change** and rotate the **board**—notice bursts only when values shift.
3. Change **output profile** from **Fusion** to **Raw** and **Apply**—confirm accel/gyro channels appear in the telemetry deck.
4. Open **Telemetry channels** and toggle one axis off, **Apply**, and verify that channel disappears from live data.

### Use Cases

Battery-powered devices: slower rate + on-change for temperature drift. Vibration or robotics: higher rate on BMI270 accel. Bandwidth-limited links: fewer channels in the mask, longer publish interval.

### Summary

Settings panel → Apply → device confirms → live stream updates. Pick publish mode for your lesson goal. Common mistakes: changing sliders but forgetting **Apply**, expecting a channel that is turned off in **Telemetry channels**.

---

## Chapter 4 — Sensor Studio — Node Editor Basics (75 min)

**Sensor theory:** [CH1_SHT40.md](./sensor-theory/CH1_SHT40.md) §10 · [CH2_DPS368.md](./sensor-theory/CH2_DPS368.md) §10 · Matrix row: [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) § Ch4

### Intro

Why a node editor? You connect blocks like a flowchart—no code required—so you can see **where data comes from**, **what transforms it**, and **where it is displayed**.

### Theory

**Three kinds of blocks**

| Kind               | Role                                 | Examples                                               |
| ------------------ | ------------------------------------ | ------------------------------------------------------ |
| **Sensor**         | Source — live readings from a device | SHT40, DPS368, BMI270, BMM350                          |
| **Utility / Math** | Transform — scale, convert, combine  | **Math**, **Map Range**, **Vector Length**             |
| **Output**         | Sink — something the user sees       | **Radial Gauge**, **Dashboard Gauge**, numeric readout |

**How wires work** — Drag from an **output** port to an **input** port. Data flows one direction: sensors → processing → display. Match port types (a single number vs a 3-axis vector). When the **TESAIoT DevKit** is linked (or **Simulator** on a no-hardware seat), every new reading pushes through the graph automatically.

**Good first habits** — Name your nodes, connect one sensor to one gauge before adding math, and fix red/disconnected wires before running the stage.

### Demo

In **Sensor Studio** with the **TESAIoT DevKit** linked:

1. Add **SHT40** → wire **temperature** to a **Radial Gauge**. Run the stage; confirm °C updates live.
2. Insert **Math** between SHT40 and the gauge; convert °C → °F (multiply/add in the node settings).
3. Add **DPS368** → wire **pressure** to a numeric display or bar meter.
4. Save the flow; reload and verify it still runs.

### Use Cases

Quick classroom demos, technician checklists, prototyping before building a **Course Studio** page. Ideal when you want to **see the wiring**, not only the final dashboard.

### Summary

Sensor → transform (optional) → output. Port types must match. Save early, test one wire at a time. Typical fixes: unplugged wire, wrong port (vector vs number).

---

## Chapter 5 — Building Pipelines — Math, Logic & Multi-Sensor Flows (75 min)

**Sensor theory:** [CH3_BMI270.md](./sensor-theory/CH3_BMI270.md) (shake) · [CH4_BMM350.md](./sensor-theory/CH4_BMM350.md) (compass) · CH1+CH2 (weather strip) · Matrix row: [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) § Ch5

### Intro

One sensor and one gauge is a start. Real setups combine math, thresholds, and several sensors—e.g. “alert when vibration is too high” or “weather panel from temp + pressure.”

### Theory

**Processing blocks you will use**

| Block                       | Use it when…                          | Example                             |
| --------------------------- | ------------------------------------- | ----------------------------------- |
| **Math**                    | Add, subtract, scale a single value   | °C → °F                             |
| **Map Range**               | Rescale into 0–100 for a bar          | Pressure 950–1050 hPa → gauge fill  |
| **Vector Length**           | Combine X/Y/Z into one strength value | Accel magnitude for shake detection |
| **Threshold** / **Compare** | True/false when a rule is met         | Magnitude > 15 m/s² → alert         |
| **Logic**                   | Combine conditions                    | Motion **and** door open            |

**Multi-sensor panels** — Each sensor node runs on its own schedule; your graph can show several readouts on one stage. Use consistent labels and colors per sensor (see Chapter 6).

**Vector magnitude** (for IMU or magnetometer axes):

```text
strength = √(x² + y² + z²)
```

Example: accel (0.1, 0.2, 9.8) → strength ≈ **9.8 m/s²** (mostly gravity when still).

### Demo

Build three mini-flows in **Sensor Studio**:

1. **Shake alert** — BMI270 **Acceleration** → **Vector Length** → **Threshold** → status LED or pill (toggle board to trip the threshold).
2. **Compass-style view** — BMM350 magnetic vector → **Radial Gauge** or stage readout; discuss how X/Y/Z relate to field direction.
3. **Weather strip** — SHT40 temperature + DPS368 pressure on the same stage layout (two gauges side by side).

### Use Cases

Machine vibration warning, tilt/orientation teaching aids, environmental station for agriculture, simple fall-detection story (sudden accel spike).

### Summary

One job per node; label everything; test on the **board** first (shake/tilt to exercise flows). **Simulator** only where hardware is missing. Avoid chaining duplicate math on very fast streams—one **Vector Length** is enough for the demo.

---

## Chapter 6 — Course Studio — Four-Sensor Dashboard (75 min)

**Sensor theory:** All four chapters §10 + [SENSOR_THEORY.md](./SENSOR_THEORY.md) § multi-sensor colors · [examples/workshop-four-sensor-dashboard.html](./examples/workshop-four-sensor-dashboard.html) · Matrix row: [INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md) § Ch6

### Intro

When is **Course Studio** the right finish line? When you need a **polished lesson page** or kiosk dashboard—not just the node graph. You embed live widgets that stay in sync with the same **TESAIoT DevKit** link (or **Simulator** on backup stations).

### Theory

**From Sensor Studio to Course Studio** — Prototype wiring in **Sensor Studio**; publish the look in **Course Studio** using **widget board** blocks (gauges, bars, hero readouts, infographic skins). Learners open one page and see all sensors together.

**Our four workshop sensors** (names trainees should recognize):

| Sensor     | Main readings                         | Typical display                         |
| ---------- | ------------------------------------- | --------------------------------------- |
| **BMI270** | Accel, gyro, orientation (pitch/roll) | Motion bars, radial gauges              |
| **SHT40**  | Temperature, humidity                 | Thermometer / droplet skins, dual cards |
| **DPS368** | Pressure (and temperature)            | Manometer column, pressure ring         |
| **BMM350** | Magnetic field X, Y, Z                | 3-axis bars or compass-style graphic    |

**Layout tips** — Give each sensor a consistent color on the page. Show **live / stale** on widgets when connection drops. Add a short caption per block (“Room climate”, “Barometric pressure”) so the page reads without an instructor.

**Board vs Simulator** — Build and preview the page with the **TESAIoT DevKit** connected (**Bitstream** + **Link**). The layout is identical if a trainee later opens it with **Simulator**—only the data source changes.

### Demo

In **Course Studio**, create a **Four sensors** workshop page:

- **BMI270** — accel/gyro bars + pitch/roll gauges
- **SHT40** — temperature + humidity cards
- **DPS368** — pressure readout (sea-level band in the lesson narrative)
- **BMM350** — three magnetic axes or compass infographic

With the **TESAIoT DevKit** linked, open preview and walk the class through each region—move the board to animate BMI270 and BMM350 blocks. Unplug USB once to demonstrate **stale** styling. Optionally copy a block from **Applications / Examples** as a starting template. Backup: same page on **Simulator**.

### Use Cases

Training handouts, museum kiosks, factory overview screens, capstone “my dashboard” trainee projects.

### Summary

Full workshop arc: connect → read (Ch2) → configure (Ch3) → wire nodes (Ch4–5) → publish a Course page (Ch6). Checklist: four sensors labeled, units visible, connection state honest, one saved flow + one saved course page per trainee.

---

## Duration summary

| Chapter   | Title                                                 | Duration     | Lead sensors (theory) |
| --------- | ----------------------------------------------------- | ------------ | --------------------- |
| 1         | Introduction & Architecture                           | 45 min       | All · [hub](./SENSOR_THEORY.md) |
| 2         | Sensor Telemetry — Reading & Visualizing Live Data    | 75 min       | [SHT40](./sensor-theory/CH1_SHT40.md), [DPS368](./sensor-theory/CH2_DPS368.md) opt. |
| 3         | Sensor Configuration                                  | 60 min       | [BMI270](./sensor-theory/CH3_BMI270.md) |
| 4         | Sensor Studio — Node Editor Basics                    | 75 min       | [SHT40](./sensor-theory/CH1_SHT40.md), [DPS368](./sensor-theory/CH2_DPS368.md) |
| 5         | Building Pipelines — Math, Logic & Multi-Sensor Flows | 75 min       | [BMI270](./sensor-theory/CH3_BMI270.md), [BMM350](./sensor-theory/CH4_BMM350.md), weather |
| 6         | Course Studio — Four-Sensor Dashboard                 | 75 min       | All four · [matrix](./INSTRUCTOR_SENSOR_MATRIX.md) |
| **Total** |                                                       | **~7.5 hrs** | |

Full instructor timing and lab mapping: **[INSTRUCTOR_SENSOR_MATRIX.md](./INSTRUCTOR_SENSOR_MATRIX.md)**.
