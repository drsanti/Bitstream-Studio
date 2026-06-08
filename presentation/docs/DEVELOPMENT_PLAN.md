# Presentation — development plan

**Status:** In progress (2026-06-08) — integrated into Bitstream Studio webview  
**Canonical code:** `extension/src/webview/presentation/`  
**Legacy archive:** `presentation/` at repo root (v0 standalone app — do not import from extension)  
**Integration doc:** `extension/src/webview/presentation/docs/INTEGRATION.md`  
**Audience:** Public talks, instructor-led training, self-paced reference  
**Related:** `extension/docs/BS2_PROTOCOL_INDEX.md`, `extension/docs/TELEMETRY_MODE_LIFECYCLE.md`, `extension/HOW_TO_RUN.md`

---

## 1. Goals

| Goal | Detail |
|------|--------|
| **Professional training** | Theory visible on screen — not only in speaker notes |
| **Live proof** | Demos read `useBitstreamLiveStore` (same broker path as Sensor Telemetry) |
| **Offline-safe** | Theory slides work without hardware; simulation fills demos when disconnected |
| **Full sensor coverage** | All four TESAIoT BS2 sensors: BMI270, BMM350, SHT40, DPS368 |
| **Platform context** | First chapter introduces Bitstream Studio before sensor deep-dives |
| **Extensible chapters** | No fixed chapter numbers in this phase — new chapters can be inserted later |

### Non-goals (this phase)

- Replacing Bitstream Studio UI or Sensor Studio flows
- Localized (non-English) slide copy
- PDF export pipeline (future)
- Duplicate WebSocket decoder in presentation layer

### Integration model (shipped direction)

- **Third workspace tab:** Sensor Telemetry · Sensor Studio · **Presentation**
- **VS Code side panel:** `bitstream-studio.openPresentation` — same webview bundle, `workspace=presentation`
- **Browser dev:** `http://localhost:5173/?workspace=presentation` with `npm run dev:webview`
- **Themes:** presentation-scoped **light** and **dark** (`usePresentationThemeStore`, independent of VS Code theme)

---

## 2. Pedagogical model

Every sensor chapter follows the same **Teach → Show → Do** rhythm.

### Slide modes

| Mode | On-screen role | Live data |
|------|----------------|-----------|
| **Theory** | Definitions, diagrams, equations, spec tables | None (static) |
| **Demo** | Validates theory with live or simulated stream | Required (sim OK) |
| **Lab** | Guided exercise + expected outcome | Required |

### Section pattern (within each sensor chapter)

```text
Opening → Foundations → Product → Physics → Demos → Integration recap
```

- **Opening** — objectives and agenda for that chapter
- **Foundations** — physics/concepts before touching the chip
- **Product** — datasheet-level BMI270 / BMM350 / … facts
- **Physics** — MEMS or sensing principle (theory, then optional animated demo)
- **Demos** — live widgets; each demo slide has a one-line theory recap strip
- **Integration recap** — how this sensor appears on the wire and in Bitstream Studio (short; full protocol story lives in the platform chapter)

### Delivery profiles

| Profile | Typical duration | Include |
|---------|------------------|---------|
| **Keynote** | 30–45 min | Platform chapter (abbreviated) + one sensor chapter (demos only) |
| **Sensor training** | 90–120 min | One full sensor chapter |
| **Full course** | 6–8 hours | Platform + all four sensor chapters + labs |

Tag slides with `tags: ['keynote' | 'training' | 'lab']` in the registry for optional sidebar filtering.

---

## 3. Chapter architecture

Chapters are **named modules**, not numbered sequences. Order below is the **recommended teaching order**; the registry must allow reordering and insertion without renumbering files.

```text
extension/src/webview/presentation/chapters/
  bitstream-studio/     ← teach first (platform)
  bmi270/
  euler-quaternion/     ← after BMI270 (fusion / attitude)
  bmm350/
  dps368/
  sht40/
  _shared/              ← layouts, integration snippets reused across chapters
```

### Chapter list

| Chapter ID | Title | BS2 `sensorId` | Priority |
|------------|-------|----------------|----------|
| `bitstream-studio` | Bitstream Studio Platform | — (all) | **P0 — first** |
| `bmi270` | BMI270 — 6-DoF IMU | `0` | **P1 — core shipped** |
| `euler-quaternion` | Euler Angles & Quaternion | — (BMI270 fusion) | **P1 — shipped** |
| `bmm350` | BMM350 — Magnetometer | `1` | P2 |
| `dps368` | DPS368 — Barometric Pressure | `3` | P3 |
| `sht40` | SHT40 — Temperature & Humidity | `2` | P4 |

> **Note:** `sensorId` values match `extension/src/bitstream2/domains/sensors/sensor-ids.ts`.

### Future chapters (placeholders — no implementation yet)

| Chapter ID | Title | When |
|------------|-------|------|
| `tesaiot-board` | TESAIoT Edge board — sensor placement & power | After all sensor chapters |
| `multi-sensor` | Sensor fusion across IMU + mag + baro + RH/T | After individual sensors |
| `sensor-studio-lab` | Building a flow: nodes → Stage → Dashboard | After platform + BMI270 |
| `bs2-protocol-deep` | BS2 wire format & SENSOR_CFG advanced | Optional appendix |

### Repository file structure

**Canonical implementation:** `extension/src/webview/presentation/` (third Bitstream Studio workspace).

The **v0 standalone app** under `presentation/src/` remains as **read-only reference** until moved to `presentation/legacy/v0-demo-deck/`. Do not import from it in the extension.

```text
extension/src/webview/presentation/
├── PresentationWorkspace.tsx
├── presentation.css
├── docs/
│   └── INTEGRATION.md
├── app/                    ← chapter nav, sensor hooks, keyboard shortcuts
├── layout/                 ← shell, sidebar, top bar, speaker notes
├── design/                 ← light + dark theme tokens + PresentationThemeProvider
├── store/                  ← usePresentationThemeStore (localStorage)
├── display/                ← live store → slide units
└── chapters/
    ├── registry.ts
    ├── types.ts
    ├── _shared/
    │   └── layouts/
    │       ├── TheorySlideLayout.tsx   ← shipped
    │       ├── DemoSlideLayout.tsx     ← shipped
    │       └── LabSlideLayout.tsx      ← shipped
    ├── bitstream-studio/
    │   ├── chapter.ts
    │   └── slides/
    │       ├── bss-title/
    │       ├── bss-objectives/
    │       └── bss-workspaces/
    └── bmi270/
        └── slides/
            └── bmi-live-status/

presentation/                         ← planning + legacy archive (repo root)
├── README.md
├── docs/
│   └── DEVELOPMENT_PLAN.md           ← this file
└── src/                              ← v0 standalone (archive; not canonical)
    └── slides/                       ← 8-slide BMI270 demo deck
```

**Planned additions** (same tree under `extension/src/webview/presentation/chapters/`):

```text
    ├── bitstream-studio/slides/
    │       ├── bss-telemetry-modes/
    │       ├── bss-data-path/
    │       └── bss-demo-bridge/
    ├── bmm350/
    ├── dps368/
    ├── sht40/
    └── _shared/diagrams/
        └── DataPathDiagram.tsx
```

Legacy target layout (optional filesystem move):

```text
presentation/legacy/v0-demo-deck/
    └── slides/                       ← copy of presentation/src/slides/*
```

Old plan excerpt (standalone `src/chapters/` — superseded):

```text
    ├── bitstream-studio/
    │   └── slides/
    │       ├── bss-title/
    │       │   ├── BssTitleSlide.tsx
    │       │   └── notes.md
    │   │       ├── bss-objectives/
    │   │       ├── bss-architecture/
    │   │       └── …                  ← one folder per slide id
    │   │
    │   ├── bmi270/
    │   │   ├── chapter.ts
    │   │   └── slides/
    │   │       ├── bmi-title/
    │   │       ├── bmi-objectives/
    │   │       ├── bmi-coordinates/
    │   │       ├── bmi-demo-orientation/   ← demo slides reuse widgets from legacy where useful
    │   │       └── …
    │   │
    │   ├── bmm350/
    │   │   ├── chapter.ts
    │   │   └── slides/
    │   │       └── …
    │   │
    │   ├── dps368/
    │   │   ├── chapter.ts
    │   │   └── slides/
    │   │       └── …
    │   │
    │   └── sht40/
    │       ├── chapter.ts
    │       └── slides/
    │           └── …
    │
    └── sensor/                      ← broker + decode (shared by all chapters)
        ├── types.ts
        ├── decoder.ts               ← dispatches by sensorId
        ├── bmi270/
        │   ├── decode.ts
        │   ├── simulate.ts
        │   └── configWriter.ts
        ├── bmm350/
        │   ├── decode.ts
        │   └── simulate.ts
        ├── dps368/
        │   ├── decode.ts
        │   └── simulate.ts
        ├── sht40/
        │   ├── decode.ts
        │   └── simulate.ts
        ├── useBitstreamBroker.ts    ← single WS (replaces useBitstreamSensor singleton)
        ├── useSensorFrame.ts
        └── useSensorRef.ts
```

#### Per-slide folder convention

Each slide is a folder named by **slide id** (kebab-case, chapter-prefixed):

```text
bmi270/slides/bmi-demo-accel/
  AccelDemoSlide.tsx    ← default export; lazy-loaded
  notes.md              ← speaker notes (?raw import)
  sections.ts           ← optional: theory recap line, lab prompt (if not inline)
```

#### What moves to `legacy/` (Phase 0 migration)

| Current path | Destination |
|--------------|-------------|
| `src/slides/**` | `legacy/v0-demo-deck/slides/**` |
| `src/slides/registry.ts` | `legacy/v0-demo-deck/registry.ts` |

#### What stays in `src/` and evolves

| Path | Fate |
|------|------|
| `src/layout/*` | Keep; refactor for chapter sidebar |
| `src/design/*` | Keep; add shared layouts under `chapters/_shared/layouts/` |
| `src/sensor/*` | Split per sensor; broker hook rename in Phase 0 |
| `src/store/useSlideStore.ts` | Extend or replace with `useChapterStore` |

#### Import rules

- **App code must not import** from `legacy/` (reference only).
- When porting a demo, **copy** the component into the new slide folder (or extract a shared widget under `design/components/`).
- `@/` alias continues to point at `src/`.

---

## 4. Chapter — Bitstream Studio Platform

**Purpose:** Orient attendees before any sensor physics. Answers *where does live data come from* and *what tools exist after the course*.

### Learning objectives

- Name the two main workspaces: **Sensor Telemetry** and **Sensor Studio**
- Explain UART Bitstream vs external **Simulator** telemetry modes (mutually exclusive)
- Describe the data path: sensor → MCU firmware → UART → bridge → WebSocket broker → host clients
- Open the dev stack (`start:bridge`, `dev:webview`) or installed VSIX

### Sections and slides (~14 theory + 2 demo)

#### Opening

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-title` | Theory | Bitstream Studio | Product tagline, version, who it is for (engineers, educators, IoT builders) |
| `bss-objectives` | Theory | What you will learn | Bullet objectives; map to later sensor chapters |

#### Platform overview

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-problem` | Theory | The problem | MCU sensor data is binary, fast, and opaque — need decode, config, visualization |
| `bss-architecture` | Theory | System architecture | Diagram: PSoC Edge → UART 921600 → Serial bridge → `ws://127.0.0.1:9998` → webviews / presentation / scripts |
| `bss-extension` | Theory | VS Code extension | Single extension id `bitstream-studio`; dev URL vs installed VSIX; toolbar workspaces |

#### Sensor Telemetry workspace

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-telemetry-intro` | Theory | Sensor Telemetry | Live plots, sensor settings deck, connection toolbar |
| `bss-telemetry-connect` | Theory | Connecting hardware | COM port, baud, HELLO handshake; readiness gates |
| `bss-telemetry-modes` | Theory | Bitstream vs Simulator | Exclusive modes; route topic; `origin: uart \| sim`; link to `TELEMETRY_MODE_LIFECYCLE.md` |
| `bss-telemetry-config` | Theory | Sensor configuration | SENSOR_CFG v2 draft in UI; per-sensor publish mask / rate (high level) |

#### Sensor Studio workspace

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-studio-intro` | Theory | Sensor Studio | Flow graph mental model: sources → math → outputs |
| `bss-studio-nodes` | Theory | Sensor nodes | BMI270, BMM350, DPS368, SHT40 input nodes + tap nodes |
| `bss-studio-stage` | Theory | Stage viewport | 3D scene, GLB drives, scene editor Edit / Simulate |
| `bss-studio-dashboard` | Theory | Dashboard | Widgets, layout, live evaluation |

#### Ecosystem

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-assets` | Theory | Asset Manager | Models, flow presets, vision packs (one slide, not a tutorial) |
| `bss-simulator-ext` | Theory | Bitstream Simulator | External VSIX; virtual MCU; same broker contract |
| `bss-presentation-app` | Theory | Presentation workspace | In-webview training deck; tab + side panel; shared live store (legacy `presentation/` archive) |

#### Demos

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-demo-bridge` | Demo | Live broker status | Connection bar: live / sim / disconnected; subscribe `bitstream2/evt/sensor` |
| `bss-demo-telemetry` | Demo | Multi-sensor stream | Table of last sample per `sensorId` (0–3); mask decode at a glance |

#### Close

| Slide ID | Mode | Title | On-screen content |
|----------|------|-------|-------------------|
| `bss-summary` | Theory | Summary & next steps | `HOW_TO_RUN.md`, clone repo, F5 extension host; pointer to BMI270 chapter |

---

## 5. Chapter — BMI270 (6-DoF IMU)

**Purpose:** Full IMU training — theory first, then live demos. Replaces the current 8-slide demo-heavy deck.

### Learning objectives

- Distinguish accelerometer (specific force) from gyroscope (angular rate)
- Interpret tri-axis data and right-hand coordinate conventions
- Explain why sensor fusion (Euler / quaternion) exists
- Configure accelerometer/gyroscope range and ODR and observe trade-offs
- Decode BMI270 payloads from `bitstream2/evt/sensor`

### Sections and slides (~23)

#### Opening

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmi-title` | Theory | BMI270 — course title |
| `bmi-objectives` | Theory | Learning objectives |

#### Foundations (theory only)

| Slide ID | Mode | Title | Key on-screen content |
|----------|------|-------|----------------------|
| `bmi-what-is-imu` | Theory | What is an IMU? | 6-DoF; accel + gyro roles; example applications |
| `bmi-coordinates` | Theory | Coordinate systems | Right-hand rule; sensor vs body frame; flat table → aZ ≈ +1 g |
| `bmi-accel-theory` | Theory | Accelerometer fundamentals | Specific force; gravity as reaction; static vs dynamic; filtering intuition |
| `bmi-gyro-theory` | Theory | Gyroscope fundamentals | ω in °/s; integration drift; rate vs angle |
| `bmi-fusion-intro` | Theory | Sensor fusion overview | Complementary filter idea; Euler vs quaternion (one diagram) |

#### Product

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmi-product-overview` | Theory | BMI270 overview — package, interfaces, power |
| `bmi-product-accel-spec` | Theory | Accelerometer specs — range, ODR, resolution table |
| `bmi-product-gyro-spec` | Theory | Gyroscope specs — range, ODR, noise |
| `bmi-product-onchip` | Theory | On-chip features — step counter, activity, FIFO, interrupts |

#### MEMS physics

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmi-mems-accel-theory` | Theory | MEMS accelerometer — proof mass, capacitive sensing |
| `bmi-mems-accel-demo` | Demo | MEMS accelerometer — animated proof mass + live aX |
| `bmi-mems-gyro-theory` | Theory | MEMS gyroscope — drive/sense axes, Coriolis |
| `bmi-mems-gyro-demo` | Demo | MEMS gyroscope — live ω + gimbal visualization |

#### Live demonstrations

| Slide ID | Mode | Title | Lab prompt (optional) |
|----------|------|-------|------------------------|
| `bmi-demo-connection` | Demo | Live connection | Verify temperature updates |
| `bmi-demo-orientation` | Demo | Orientation & 3D model | Rotate 90° — predict axis |
| `bmi-demo-accel` | Demo | Accelerometer waveforms | Tilt before looking at plot |
| `bmi-demo-gyro` | Demo | Gyroscope rates | Slow spin vs fast spin |
| `bmi-demo-activity` | Demo | Activity recognition | Flat → Tilt → Shake sequence |
| `bmi-demo-config` | Lab | Sensor configuration | Change range; discuss resolution |

#### Integration recap

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmi-wire-mask` | Theory | BMI270 on the wire — mask bits, scale factors |
| `bmi-studio-node` | Theory | BMI270 in Sensor Studio — node ports, tap nodes |
| `bmi-summary` | Theory | Chapter summary |

### Migration from current slides

| Current slide | Fate |
|---------------|------|
| `01-intro` | Split → `bmi-product-overview` + `bmi-objectives` |
| `02-orientation` | Split → `bmi-coordinates` (theory) + `bmi-demo-orientation` |
| `03-accelerometer` | Split → `bmi-accel-theory` + `bmi-demo-accel` |
| `04-mems` | Split → `bmi-mems-accel-theory` + `bmi-mems-accel-demo` |
| `05-gyroscope` | Split → `bmi-mems-gyro-theory` + `bmi-mems-gyro-demo` + `bmi-demo-gyro` |
| `06-activity` | → `bmi-demo-activity` (+ theory in notes / `bmi-product-onchip`) |
| `07-config` | → `bmi-demo-config` |
| `08-code` | Move protocol depth to platform chapter; keep `bmi-wire-mask` short recap |

---

## 6. Chapter — BMM350 (Magnetometer)

**Purpose:** Magnetic field sensing, heading, and interference — with live vector and compass demos.

### Learning objectives

- Describe Earth's magnetic field vector (declination, inclination, magnitude)
- Read µT tri-axis data and compute heading (level assumption)
- Explain hard-iron and soft-iron distortion at a high level
- Decode BMM350 `sensorId=1` payloads

### Sections and slides (~18)

#### Opening

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmm-title` | Theory | BMM350 — Magnetometer |
| `bmm-objectives` | Theory | Learning objectives |

#### Foundations

| Slide ID | Mode | Title | Key content |
|----------|------|-------|-------------|
| `bmm-earth-field` | Theory | Earth's magnetic field | Field vector; µT scale; declination/inclination diagram |
| `bmm-heading` | Theory | Heading vs orientation | `atan2(By, Bx)`; level-only vs tilt-compensated (needs accel) |
| `bmm-interference` | Theory | Hard iron & soft iron | Motors, batteries, ferrous mounts; why calibration matters |
| `bmm-vs-imu` | Theory | Magnetometer + IMU | Why fusion uses gyro + accel + mag for stable heading |

#### Product

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmm-product-overview` | Theory | BMM350 overview — package, interfaces |
| `bmm-product-spec` | Theory | Range, ODR, noise, power |

#### Physics

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmm-physics-theory` | Theory | Magnetoresistive / TMR sensing (conceptual) |
| `bmm-physics-demo` | Demo | Field vector diagram driven by live Bx, By, Bz |

#### Demos

| Slide ID | Mode | Title | Lab prompt |
|----------|------|-------|------------|
| `bmm-demo-connection` | Demo | Live BMM350 stream | Confirm `sensorId=1` |
| `bmm-demo-vector` | Demo | Tri-axis µT readout + \|B\| | Compare to ~25–65 µT typical Earth field |
| `bmm-demo-compass` | Demo | Compass rose / heading | Rotate board flat — watch heading |
| `bmm-demo-temp` | Demo | Die temperature | Secondary channel |

#### Integration recap

| Slide ID | Mode | Title |
|----------|------|-------|
| `bmm-wire-mask` | Theory | BMM350 mask: MAG `0x01`, TMP `0x02`; int16 ÷100 |
| `bmm-studio-node` | Theory | BMM350 node + Magnetic tap |
| `bmm-summary` | Theory | Chapter summary |

### Presentation code notes

- `decodeBmm350Payload` exists in `presentation/src/sensor/decoder.ts` — wire hook + simulation stub needed
- Simulation default: Bangkok-ish field vector already in `DEFAULT_BMM350_FRAME`

---

## 7. Chapter — DPS368 (Barometric Pressure)

**Purpose:** Pressure, altitude, and weather context.

### Learning objectives

- Relate barometric pressure (hPa) to altitude (barometric formula, sea-level reference)
- Interpret pressure trends (weather / HVAC / door open)
- Understand MEMS capacitive pressure sensing at a high level
- Decode DPS368 `sensorId=3` payloads

### Sections and slides (~16)

#### Opening

| Slide ID | Mode | Title |
|----------|------|-------|
| `dps-title` | Theory | DPS368 — Barometric Pressure |
| `dps-objectives` | Theory | Learning objectives |

#### Foundations

| Slide ID | Mode | Title | Key content |
|----------|------|-------|-------------|
| `dps-pressure-basics` | Theory | Pressure fundamentals | Absolute vs gauge; hPa; sea level ~1013 hPa |
| `dps-altitude` | Theory | Pressure ↔ altitude | Barometric formula (simplified); reference pressure concept |
| `dps-applications` | Theory | Applications | Weather, drones, floor detection, leak detection |

#### Product

| Slide ID | Mode | Title |
|----------|------|-------|
| `dps-product-overview` | Theory | DPS368 overview |
| `dps-product-spec` | Theory | Pressure range, accuracy, ODR, FIFO |

#### Physics

| Slide ID | Mode | Title |
|----------|------|-------|
| `dps-mems-theory` | Theory | MEMS capacitive pressure cell (membrane + cavity) |
| `dps-mems-demo` | Demo | Schematic animation optional; live pressure trend |

#### Demos

| Slide ID | Mode | Title | Lab prompt |
|----------|------|-------|------------|
| `dps-demo-connection` | Demo | Live DPS368 stream | Confirm `sensorId=3` |
| `dps-demo-pressure` | Demo | Pressure (hPa) live + history chart | Note slow breath / altitude stair |
| `dps-demo-altitude` | Demo | Derived altitude estimate | Set reference hPa; climb stairs |
| `dps-demo-temp` | Demo | Temperature channel | Cross-check with SHT40 later |

#### Integration recap

| Slide ID | Mode | Title |
|----------|------|-------|
| `dps-wire-mask` | Theory | DPS368 mask: PRESS `0x01`, TMP `0x02`; pressure hPa×10 |
| `dps-studio-node` | Theory | DPS368 node + Pressure tap |
| `dps-summary` | Theory | Chapter summary |

### Presentation code notes

- Add `Dps368SensorFrame`, decoder, simulation (slow pressure drift + noise)
- DPS368 often publishes at lower rate — UI should tolerate sparse updates

---

## 8. Chapter — SHT40 (Temperature & Humidity)

**Purpose:** RH/T sensing for comfort, condensation, and environmental monitoring.

### Learning objectives

- Define relative humidity (%RH) vs absolute humidity
- Read comfort zones (ASHRAE-style simplified chart)
- Explain capacitive polymer humidity sensing
- Decode SHT40 `sensorId=2` payloads

### Sections and slides (~16)

#### Opening

| Slide ID | Mode | Title |
|----------|------|-------|
| `sht-title` | Theory | SHT40 — Temperature & Humidity |
| `sht-objectives` | Theory | Learning objectives |

#### Foundations

| Slide ID | Mode | Title | Key content |
|----------|------|-------|-------------|
| `sht-rh-basics` | Theory | Relative humidity | %RH definition; saturation; dew point mention |
| `sht-comfort` | Theory | Human comfort | Temperature + RH combined chart |
| `sht-applications` | Theory | Applications | HVAC, agriculture, storage, condensation risk |

#### Product

| Slide ID | Mode | Title |
|----------|------|-------|
| `sht-product-overview` | Theory | SHT40 overview — Sensirion, I²C |
| `sht-product-spec` | Theory | Accuracy, repeatability, heater mode (mention only) |

#### Physics

| Slide ID | Mode | Title |
|----------|------|-------|
| `sht-physics-theory` | Theory | Capacitive polymer humidity sensor |
| `sht-physics-demo` | Demo | RH + T live on comfort zone plot |

#### Demos

| Slide ID | Mode | Title | Lab prompt |
|----------|------|-------|------------|
| `sht-demo-connection` | Demo | Live SHT40 stream | Confirm `sensorId=2` |
| `sht-demo-rh` | Demo | Humidity %RH trend | Breathe on sensor / sealed bag |
| `sht-demo-temp` | Demo | Temperature | Compare with BMI270 / DPS368 die temp |
| `sht-demo-comfort` | Lab | Comfort zone classifier | Classify hot-humid vs cool-dry |

#### Integration recap

| Slide ID | Mode | Title |
|----------|------|-------|
| `sht-wire-mask` | Theory | SHT40 mask: TEMP `0x01`, HUM `0x02`; int16 ÷100 |
| `sht-studio-node` | Theory | SHT40 node + Humidity tap |
| `sht-summary` | Theory | Chapter summary |

### Presentation code notes

- Add `Sht40SensorFrame`, decoder, simulation (RH 40–60 % band + slow drift)

---

## 9. Shared content (`_shared/`)

Reuse across chapters — do **not** duplicate full protocol lectures in every sensor chapter.

| Asset | Purpose |
|-------|---------|
| `TheorySlideLayout` | Title, diagram slot, bullet list, optional equation callout |
| `DemoSlideLayout` | Recap strip + live panel + footnote |
| `LabSlideLayout` | Prompt card + success criteria + live readout |
| `SpecTable` | Datasheet-style range / ODR / resolution rows |
| `WireFormatCard` | Mask + scale factor table per sensor |
| `DataPathDiagram` | Sensor → MCU → UART → broker → host (from platform chapter) |
| `ConnectionStatusBar` | Live / sim / disconnected (existing TopBar pattern) |

### Shared integration slides (optional inserts)

These can be linked from sensor chapters as “see also” without duplicating slides:

| Slide ID | Title |
|----------|-------|
| `shared-evt-sensor` | `bitstream2/evt/sensor` message shape |
| `shared-subscribe-snippet` | Minimal WebSocket subscribe (TypeScript) |
| `shared-sensor-ids` | Table: id 0–3 → name |

---

## 10. Technical architecture

### Multi-chapter registry

Replace flat `slides/registry.ts` with a two-level structure:

```typescript
interface ChapterDefinition {
  id: string           // e.g. 'bmi270'
  title: string
  subtitle?: string
  icon: string
  order: number        // sort key only — not displayed as "Chapter N"
  slides: SlideDefinition[]
}

interface SlideDefinition {
  id: string
  title: string
  subtitle: string
  icon: string
  mode: 'theory' | 'demo' | 'lab'
  section: string      // e.g. 'foundations', 'demos'
  tags?: string[]
  requiresLive?: boolean
  durationMin?: number
  notes: () => Promise<{ default: string }>
  Component: FC
}
```

### Navigation UX

- **Sidebar:** chapter picker (collapsible groups) → slide list within chapter
- **Keyboard:** `←` `→` within chapter; `Shift+←` `Shift+→` jump chapter boundaries (optional)
- **URL hash:** `#bmi270/bmi-demo-accel` for deep links (optional phase 2)
- **Mode badge** on each thumbnail: Theory / Demo / Lab
- **`requiresLive` warning** when disconnected and slide is Demo/Lab

### Sensor data layer

| Module | Responsibility |
|--------|----------------|
| `useBitstreamBroker` | Single WS connection; subscribe `bitstream2/evt/sensor` |
| `decodePayload(sensorId, …)` | Dispatch to per-sensor decoders (align with `extension/src/bitstream2/domains/sensors/`) |
| `useSensorFrame(sensorId, fps)` | Throttled React snapshot per sensor |
| `useSensorRef(sensorId)` | High-frequency ref for canvas / Three.js |
| `simulateFrame(sensorId)` | Per-sensor plausible defaults when offline |

**Rule:** Decoder scale factors must stay in sync with host `bitstream2` — treat extension decode modules as canonical.

### Build output

- Keep `outDir: '../out/presentation'` in `vite.config.ts`
- Add `presentation/README.md` with run instructions (phase 0)

---

## 11. Implementation phases

### Phase 0 — Scaffold & integration (in progress)

- [x] **Integrated workspace** — `presentation` tab + `BitstreamShellMain` routing
- [x] **VS Code side panel** — `bitstream-studio.openPresentation` → shared webview bundle
- [x] **Chapter registry** — `chapters/registry.ts` + sidebar navigation
- [x] **Light + dark themes** — `usePresentationThemeStore`, `PresentationThemeProvider`, top-bar toggle
- [x] **Shared layouts** — `TheorySlideLayout`, `DemoSlideLayout`, `LabSlideLayout`
- [x] **Live store hook** — `usePresentationBmi270` / `display/selectors.ts` (no duplicate decoder)
- [x] **Integration doc** — `extension/src/webview/presentation/docs/INTEGRATION.md`
- [ ] **Legacy archive move** — `presentation/src/slides/` → `presentation/legacy/v0-demo-deck/`
- [ ] **Standalone v0 build** — optional; not required for extension workspace

**Exit criteria:** Navigate chapters in dev (`?workspace=presentation`) and VS Code panel; theme toggle works in both light and dark.

### Phase 1 — Bitstream Studio platform chapter (in progress)

- [x] Core theory path: `bss-problem`, `bss-architecture`, `bss-workspaces`, `bss-telemetry-intro`, `bss-telemetry-modes`, `bss-summary`
- [x] `bss-demo-bridge` — live connection / handshake / counters from live store
- [x] `bss-demo-telemetry` — multi-sensor last-sample table (ids 0–3)
- [x] Shared `DataPathDiagram` + `sensor-summary` selectors
- [x] `bss-extension`, `bss-telemetry-connect`, `bss-telemetry-config` — shipped 2026-06-08
- [x] Sensor Studio block (`bss-studio-nodes`, `bss-studio-stage`, `bss-studio-dashboard`) — shipped 2026-06-08
- [x] Ecosystem block (`bss-assets`, `bss-simulator-ext`, `bss-presentation-app` in-webview rewrite) — shipped 2026-06-08
- [ ] Phase 1 exit: speaker notes timing pass (~45 min keynote / ~90 min training paths)
- [ ] Speaker notes timing pass (~45 min keynote / ~90 min training paths)

**Exit criteria:** New attendee can understand workspaces and broker without opening the extension.

### Phase 2 — BMI270 chapter redesign (in progress)

- [x] Theory path: objectives, IMU basics, coordinates, accel/gyro theory, product, MEMS theory, wire mask, summary
- [x] Live demos ported: connection snapshot, 3D orientation, accel waveforms, MEMS proof-mass, gyro dials + gimbal
- [x] Shared widgets: `LiveBar`, `WaveCanvas`, `DialArc`, R3F scenes, `Bmi270FrameRefSync`
- [x] Activity demo (`bmi-demo-activity`) — shipped 2026-06-08
- [x] Config lab (`bmi-demo-config`) — shipped 2026-06-08 (draft + Telemetry deck handoff; no wire write in presentation)
- [ ] Studio node recap slide
- [ ] Expand `notes.md` with lab answer keys

**Exit criteria:** Theory slides usable as handouts; full training runnable with sim fallback.

### Phase 2b — Euler & Quaternion chapter (shipped core)

- [x] New chapter `euler-quaternion` after BMI270 in registry (order 2)
- [x] Theory: fusion motivation, Euler, gimbal lock, quaternion basics, comparison table
- [x] Demos: live Euler (mask 0x08), live quaternion + 3D (mask 0x10)
- [x] Integration slide: SENSOR_CFG / fusion publish on wire

**Exit criteria:** Attendees understand why fusion exists and can read Euler/quaternion from live store.

### Phase 3 — BMM350 chapter

- [ ] Decoder + simulation + hooks
- [ ] Compass rose component
- [ ] ~18 slides per §6

### Phase 4 — DPS368 chapter

- [ ] Decoder + simulation + pressure history chart
- [ ] Altitude derived view
- [ ] ~16 slides per §7

### Phase 5 — SHT40 chapter

- [ ] Decoder + simulation + comfort zone chart
- [ ] ~16 slides per §8

### Phase 6 — Polish

- [ ] Cross-chapter summary slide deck (all sensors on one wire)
- [ ] Keynote filter in sidebar
- [ ] `extension/docs/DEVELOPMENT_TRACKER.md` entry when first chapter ships
- [ ] Optional: link from extension Help or landing to `presentation/` dev URL

---

## 12. Content authoring guidelines

### On-screen text

- **Headline:** ≤ 8 words
- **Bullets:** ≤ 5 per slide; ≤ 12 words each
- **Equations:** One primary formula per theory slide
- **Units:** Always show (g, °/s, µT, hPa, %RH, °C)

### Speaker notes (`notes.md`)

Each slide notes file should include:

1. **Duration** — e.g. `~5 min`
2. **Talking points** — prose depth not on screen
3. **Demo script** — step-by-step for Demo/Lab slides
4. **Q&A prompts** — 1–2 questions
5. **Lab answer key** — for Lab slides

### Visual consistency

- Axis colors match Sensor Studio data-type colors where possible
- Theory slides: light diagram + dark text (readable projected)
- Demo slides: live panel ≥ 60% viewport width

---

## 13. Canonical references (keep in sync)

| Topic | Canonical source |
|-------|------------------|
| BS2 sensor IDs | `extension/src/bitstream2/domains/sensors/sensor-ids.ts` |
| EVT_SENSOR decode | `extension/src/bitstream2/domains/sensors/*.ts` |
| Sensor Studio nodes | `extension/src/webview/sensor-studio/config/node-catalog.config.ts` |
| Telemetry modes | `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` |
| Dev runbook | `extension/HOW_TO_RUN.md` |
| Protocol index | `extension/docs/BS2_PROTOCOL_INDEX.md` |

---

## 14. Open decisions

| # | Question | Default recommendation |
|---|----------|------------------------|
| 1 | Embed presentation in VS Code webview? | **Decided:** third workspace + optional side panel (same bundle) |
| 2 | Single long deck vs chapter picker default? | Chapter picker; remember last chapter in `localStorage` |
| 3 | Print/PDF export? | Phase 6+; theory slides first |
| 4 | Localized slides? | English only per repo Markdown policy |
| 5 | Reuse extension decode path? | **Decided:** read `useBitstreamLiveStore` only — no copied decoders |

---

## 15. Document history

| Date | Change |
|------|--------|
| 2026-06-08 | Phase 2 BMI270 (16 slides) + Euler & Quaternion chapter (11 slides); ported live demos and R3F widgets |
| 2026-06-08 | Phase 0 scaffold shipped in `extension/src/webview/presentation/` — workspace tab, VS Code panel, light/dark themes, shared layouts, 4 slides (platform + BMI270 demo) |
| 2026-06-08 | Initial plan — chapter architecture, four sensors + platform chapter, BMI270 redesign, implementation phases |
