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
- [ ] **`theory.md`** on all theory slides (same pattern as BMI270 / Euler)

### Phase 4 — DPS368 chapter

- [ ] Decoder + simulation + pressure history chart
- [ ] Altitude derived view
- [ ] ~16 slides per §7
- [ ] **`theory.md`** on all theory slides (`dps-altitude` pilot shipped)

### Phase 5 — SHT40 chapter

- [ ] Decoder + simulation + comfort zone chart
- [ ] ~16 slides per §8
- [ ] **`theory.md`** on all theory slides

### Phase 6 — Polish

- [ ] Cross-chapter summary slide deck (all sensors on one wire)
- [ ] Keynote filter in sidebar
- [ ] `extension/docs/DEVELOPMENT_TRACKER.md` entry when first chapter ships
- [ ] Optional: link from extension Help or landing to `presentation/` dev URL

### Phase 7 — Course Studio v2 (new tree; v1 frozen)

**Product name (decided 2026-06):** **Course Studio** — workspace id `course-studio`. Alive documents, grid pages, maintainer authoring, live sensor-driven infographics.

**Folder strategy:** Keep shipped deck as backup; implement v2 greenfield beside it.

| Path | Role |
|------|------|
| `extension/src/webview/presentation/` | **v1 frozen** — legacy “Presentation” tab; slides, theory reader; critical fixes only |
| `extension/src/webview/course-studio/` | **v2 greenfield** — Course Studio: grid pages, diagram editor, UI catalog, maintainer tools |
| `presentation/docs/DEVELOPMENT_PLAN.md` | Canonical plan for **both** (this file) |
| `course-studio/docs/` | v2 architecture, schemas, implementation checklist |

**Toolbar line:** Sensor Telemetry · Sensor Studio · **Course Studio** (v2; dev until parity) · Presentation (v1 legacy during transition).

**Dev entry:** `?workspace=course-studio` or dev toolbar; optional Ctrl+Shift+4. v1 stays `presentation` / Ctrl+Shift+3.

**Share from v1 (import, do not fork):** `useBitstreamLiveStore`, `display/selectors.ts`, sensor hooks, theme CSS variables, GSAP patterns from `ui/TRN`.

**Do not copy:** per-slide TSX layouts, hand-coded `*Svg.tsx` — re-author as `page.v1.json` + `diagram.v1.json` in v2 `content/`.

See **§17** for Phase 0 scaffold checklist before feature work.

### Phase 7 — Maintainer content authoring (diagram + markdown)

**Goal:** In **dev / maintainer mode** only, authors can edit presentation content in-product and persist changes back to the repo (or staged overrides). Shipped VSIX remains read-only.

Two tools (see **§16** for full design):

| Tool | Purpose |
|------|---------|
| **Diagram / infographic editor** | Shapes, arrows, text, images; **live bindings** to sensor / broker fields; embed in slides and reader docs |
| **Markdown editor** | Edit `theory.md`, `notes.md`, and future inline reader copy with KaTeX preview |

**Phase 7a — Markdown maintainer editor (lower risk, ship first)**

- [ ] Maintainer mode gate (`import.meta.env.DEV` + toggle; mirror Sensor Studio `flow-preset-maintainer-mode`)
- [ ] Edit `theory.md` / `notes.md` in Theory Reader / Speaker Notes with split preview (`PresentationTheoryMarkdown`)
- [ ] Save → Vite dev API writes file under `chapters/**/slides/<id>/`
- [ ] Dirty-state + discard; no edit UI in packaged VSIX

**Phase 7b — Diagram schema + static renderer**

- [ ] `PresentationDiagram.v1.json` scene graph (see §16.3)
- [ ] `PresentationDiagramRenderer` — replace hand-coded `*Svg.tsx` incrementally
- [ ] Theme tokens (`var(--accent-cyan)`, axis colors) — no hardcoded hex in saved files

**Phase 7c — Diagram editor (maintainer)**

- [ ] Canvas editor: select, move, resize, z-order, snap, arrow connectors
- [ ] Property panel: fill, stroke, typography, TRN-aligned palette
- [ ] Export / save diagram JSON beside slide (`diagram.json` or `slides/<id>/assets/diagram.v1.json`)

**Phase 7d — Live bindings on diagrams**

- [ ] Binding picker: `live.bmi270.ax`, `live.bmm350.heading`, connection status, etc. (catalog from `useBitstreamLiveStore` + selectors)
- [ ] Formatters: unit, decimals, threshold color, `{value}` text templates
- [ ] Runtime: same store as demos — no second decode path

**Phase 7e — Embed + slide integration**

- [ ] `TheorySlideLayout` `visual` slot accepts diagram renderer
- [ ] Optional full-slide infographic layout
- [ ] Import existing SVG diagrams into v1 schema (one-time migration scripts)

**Phase 7f — 3D infographic layer**

- [ ] `PresentationDiagram3DLayer` — R3F stage inside diagram frame (reuse `PresentationStage`, GLB catalog)
- [ ] 3D nodes in scene JSON: `modelRef`, transform bindings, material color bindings
- [ ] Same `evaluateDiagramProps` resolver → Three.js attrs (position, rotation quaternion, scale)

**Phase 7g — Animation + link health**

- [ ] Edge `flow` animation (dash-offset from sample counter or time)
- [ ] `LinkHealthPolicy` per document/diagram: freeze+gray (default), hide, fallback constant
- [ ] Telemetry preference: `auto` (UART then sim), `uart`, `simulator` — document metadata

**Exit criteria:** Maintainer can update BMI270 accel `theory.md` and fusion pipeline diagram in dev, reload, present with live bound values; VSIX users see read-only result after commit. One slide demonstrates **2D + 3D** bound infographic with UART/sim fallback and frozen-gray stale state.

---

## 12. Content authoring guidelines

### On-screen text

- **Headline:** ≤ 8 words
- **Bullets:** ≤ 5 per slide; ≤ 12 words each
- **Equations:** One primary formula per theory slide
- **Units:** Always show (g, °/s, µT, hPa, %RH, °C)

### Reader articles (`theory.md`)

- Shipped for **BMI270** and **Euler & Quaternion** theory slides (2026-06-08); remaining sensor chapters in Phases 3–5.
- Deep-dive for students/engineers; LaTeX via KaTeX in reader panel (**R**).
- Maintainer editing: Phase 7a (in-product) — until then, edit files in repo directly.

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
| 6 | Diagram editor library? | **Decided:** hybrid — pro **2D editor** (curves, snap) + optional **tldraw** eval for maintainer; **3D layer** via existing R3F stack (§16.11) |
| 7 | Markdown save path in VSIX? | **Default:** dev-only write via Vite middleware; VSIX read-only unless explicit “content pack” import |
| 8 | Diagram vs Sensor Studio React Flow? | **Decided:** separate **Alive Document** scene model — not RF nodes |
| 9 | Bind `width` / `height`? | **v1 or v2** — position, rotation, color in v1; size binding when needed |
| 10 | Text templates? | **Decided:** single-field `"{value:.3f} g"` sufficient for v1 |
| 11 | Edge animation? | **Decided:** yes — dash-offset / flow animation on connectors (§16.10) |
| 12 | Stale / disconnected? | **Decided:** default **freeze last value + inactive (gray) styling**; per-diagram / per-binding override (§16.10) |
| 13 | UART vs Simulator? | **Decided:** support **both**; document-level preference + auto-fallback UART→sim (§16.10); align `TELEMETRY_MODE_LIFECYCLE.md` |
| 14 | 3D infographics? | **Decided:** yes — shared binding engine drives **2D SVG + 3D R3F** layers (§16.11) |
| 15 | v2 product / folder name? | **Decided:** **Course Studio** — `extension/src/webview/course-studio/`, workspace `course-studio` |

---

## 16. Maintainer authoring — diagram + markdown (design reference)

### 16.1 Modes

| Mode | Who | Capabilities |
|------|-----|----------------|
| **Present** | Instructor, student | Navigate, reader (**R**), notes (**S**), live demos |
| **Maintainer** | TESA authors, devs | Edit markdown + diagrams; save to repo (dev) or override pack |

Gate maintainer UI the same way as Sensor Studio flow presets:

- `import.meta.env.DEV` **or** explicit `?maintainer=1` on localhost only
- Toggle: `usePresentationMaintainerStore` (amber chrome, persisted in `localStorage`)
- **Never** expose write APIs in packaged VSIX without authentication

### 16.2 Tool 1 — Markdown editor

**Surfaces to edit**

| File | Panel | Audience |
|------|-------|----------|
| `theory.md` | Theory reader (**R**) | Students / engineers |
| `notes.md` | Speaker notes (**S**) | Instructors |

**UX pattern**

```text
[ Maintainer ON ]  →  toolbar: Edit | Preview | Save | Revert
Split view:  textarea (monospace)  |  PresentationTheoryMarkdown preview
Optional: KaTeX cheat sheet; link to BS2 docs snippets
```

**Reuse**

- Renderer: `PresentationTheoryMarkdown` (already has KaTeX)
- Do **not** fork a second markdown stack
- Inspector-style toggles can mirror Sensor Studio `NoteLayoutNode` (headings, tables, code blocks)

**Persistence (dev)**

```text
PUT /__presentation-maintainer/slide-content
  { chapterId, slideId, kind: "theory" | "notes", markdown: string }
→ writes extension/src/webview/presentation/chapters/.../theory.md
```

Mirror existing flow-preset dev API pattern (`flow-preset-bundled-endpoints.ts`). HMR reloads reader content without full compile.

**Validation before save**

- English prose (repo markdown policy)
- Warn on broken `$...$` / `$$...$$` pairs
- Optional max size guard (e.g. 64 KB per file)

### 16.3 Tool 2 — Diagram / infographic editor

**Problem today:** Diagrams are hand-coded React SVG (`FusionPipelineSvg.tsx`, etc.) — hard to update without a TS developer.

**Target:** Saved **scene graph JSON** + one **renderer** used in slides, reader embeds, and export.

**Suggested file layout**

```text
chapters/bmi270/slides/bmi-accel-theory/
  BmiAccelTheorySlide.tsx    ← thin wrapper: TheorySlideLayout + <PresentationDiagram src={...} />
  theory.md
  notes.md
  diagram.v1.json            ← optional infographic (static or live)
```

**Scene graph sketch (`PresentationDiagram.v1`)**

```json
{
  "version": 1,
  "viewBox": [0, 0, 420, 200],
  "nodes": [
    { "id": "box-gyro", "type": "rect", "x": 24, "y": 64, "w": 88, "h": 72, "style": "card", "label": "Gyro ω" },
    { "id": "arrow-1", "type": "arrow", "from": "box-gyro", "to": "box-fusion", "marker": "end" },
    { "id": "val-ax", "type": "text", "x": 200, "y": 40, "binding": { "path": "bmi270.ax", "format": "0.000", "unit": "g" } }
  ]
}
```

**Primitive types (v1 minimum)**

| Type | Use |
|------|-----|
| `rect`, `ellipse` | Boxes, chips |
| `line`, `arrow`, `polyline` | Connectors, pipelines |
| `text` | Labels; optional `binding` |
| `group` | Logical grouping |
| `image` | Icons, PCB photos (asset URI) |

**Styling:** Reference **theme tokens** by name (`accent-cyan`, `axis-x`), not raw colors — renderer resolves against `.presentation-root` CSS variables.

### 16.4 Live data — data-driven properties (core design)

Diagram objects are **not** static SVG with one text binding. **Most visual properties** support either a literal value or a **data-driven binding** evaluated each frame from the same live store as demo slides.

**Rule:** Read **`useBitstreamLiveStore`** + `display/selectors.ts` — no second decode path.

**Property value union (every bindable field)**

```typescript
type PropValue<T> = T | DataBinding<T>;

type DataBinding<T> = {
  path: string;              // catalog id, e.g. "bmi270.ax"
  map?: MapOp[];           // optional pipeline (see §16.9)
  fallback?: T;            // disconnected / NaN / stale
};
```

**Bindable property groups (v1 target)**

| Group | Properties | Example use |
|-------|------------|-------------|
| **Transform** | `x`, `y`, `width`, `height`, `rotation`, `scaleX`, `scaleY`, `opacity` | Proof mass offset from `bmi270.ax`; compass needle from heading |
| **Stroke / fill** | `stroke`, `fill`, `strokeWidth`, `dash` | Threshold colors when $|a| > 1.2$ g |
| **Text** | `content`, `fontSize` | Live value + unit template |
| **Edge** | `path` endpoints via port offsets, `stroke`, `marker` | Animated flow highlight when streaming |
| **Visibility** | `visible` | Show block when `bridge.connected` |

**Authoring UX**

- Inspector: each property row → **static** input **or** link icon → binding picker + map chain preview
- “Test with Simulator” when `origin: sim`
- Disconnected: fallbacks + muted diagram chrome (like demo `requiresLive`)

**Do not** embed arbitrary JavaScript in JSON. Use a **typed path catalog** + **fixed `MapOp` pipeline** (§16.9); extend catalog in TypeScript when BS2 fields ship.

See **§16.9** for map operators, evaluation, performance, and examples.

### 16.5 Editor technology choices

| Approach | Pros | Cons |
|----------|------|------|
| **Custom SVG editor** (recommended v1) | Small bundle, full theme control, matches existing diagrams | More build effort for handles, undo, multi-select |
| **tldraw** embed | Fast polish, good interaction | License/bundle size; map styles to TRN tokens |
| **Excalidraw** | Sketch aesthetic | Less “technical infographic”; export cleanup |
| **React Flow** | Already in Sensor Studio | Wrong mental model for slide art; heavy for static figures |

**Recommendation:** Start **custom** on SVG + scene JSON (you already author in SVG). Re-evaluate **tldraw** if you need freehand, collaborative editing, or rich grouping in Phase 7c+.

### 16.6 Slide integration patterns

| Pattern | When |
|---------|------|
| `TheorySlideLayout` + `visual={<PresentationDiagram file={...} />}` | Split theory + diagram (current layout) |
| Full-slide diagram | Architecture / data-path slides |
| Inline in markdown | ` ```presentation-diagram\n{...}\n``` ` fence (Phase 7e+) |
| Live infographic overlay | Demo slides — diagram + bound values beside `WaveCanvas` |

### 16.7 Migration path from today

1. Keep existing `*Svg.tsx` components working
2. Rebuild **one** diagram (`FusionPipelineSvg`) as `diagram.v1.json` + renderer to prove format
3. Markdown editor for `theory.md` before diagram editor (authors get value immediately)
4. Gradually replace hand-coded SVGs when touched
5. BMM350 / DPS368 / SHT40 theory slides: author in markdown tool once Phase 7a ships

### 16.8 Professional editor features (curves, snap)

Target **draw.io-class** interaction in maintainer editor (Phase 7c):

| Feature | Notes |
|---------|-------|
| Curved connectors | Bezier + smooth-step (orthogonal rounded); reuse `@xyflow/system` path math |
| Snap | Grid + object edges/centers + smart alignment guides |
| Ports | Arrows glue to N/E/S/W; re-route when shapes move |
| Undo | `zundo` on editor store |

**Hybrid delivery:** rich editor lazy-loaded in maintainer mode; **present mode** runs lightweight `PresentationDiagramRenderer` only.

### 16.9 Data-driven property pipeline

#### 16.9.1 Design principle

> **Layout is authored; presentation is driven.**

Authors set **design-time defaults** (position, size, colors). Bindings **override** properties at runtime using normalized sensor values. Same object works in static export (fallbacks) and live class (streaming).

#### 16.9.2 Map operators (`MapOp`) — safe transform pipeline

Bindings chain declarative ops (no user code):

| Op | Purpose | Example |
|----|---------|---------|
| `scale` | engineering units → pixels | `ax` (g) → $\Delta x$ px: `inMin:-1, inMax:1, outMin:-40, outMax:40` |
| `clamp` | limit range | rotation clamped $\pm 45°$ |
| `threshold` | step / band | fill red if value $> 1.5$ |
| `lerpColor` | blend theme tokens | `axis-x` → `accent-red` by magnitude |
| `format` | text template | `"{value:.3f} g"` |
| `boolean` | visibility | `path: bridge.connected` |
| `remapDiscrete` | enum → number | activity class → y offset |

```json
{
  "y": {
    "path": "bmi270.ax",
    "map": [
      { "op": "scale", "inMin": -1, "inMax": 1, "outMin": 120, "outMax": 40 },
      { "op": "clamp", "min": 40, "max": 120 }
    ],
    "fallback": 80
  }
}
```

Base transform: `y = baseY + mappedOffset` (additive) or `y = mapped` (absolute) — per-property `mode: "add" | "absolute"` in schema.

#### 16.9.3 Path catalog

Central registry (`presentation/display/diagram-binding-catalog.ts`):

```typescript
{ id: "bmi270.ax", type: "number", unit: "g", sensorId: 0, ... }
{ id: "bridge.connected", type: "boolean", ... }
```

Picker UI groups by sensor + platform. Version catalog with BS2 sensor domains.

#### 16.9.4 Evaluation loop

```text
live store tick
  → resolve paths (single snapshot per frame)
  → for each node: evaluate PropValue pipeline
  → emit ResolvedScene (plain numbers/colors/strings)
  → SVG render (or ref-based DOM attrs for high-rate)
```

**Performance:** Throttle React re-renders (30–60 Hz); optional `usePresentationDiagramRef` for text nodes updated imperatively like `WaveCanvas`.

#### 16.9.5 Multi-binding & derived visuals

| Pattern | Bindings |
|---------|----------|
| Proof mass | `y` ← `bmi270.ax` scaled |
| Compass needle | `rotation` ← `bmm350.heading` |
| Activity highlight | `fill` ← `threshold` on accel magnitude |
| Pipeline edge pulse | `strokeOpacity` ← `samples.rate` or counter modulo |
| Group transform | parent `rotation` drives children |

**Groups:** Evaluate parent transform first; children inherit (standard scene graph).

#### 16.9.6 Maintainer vs present mode

| Mode | Editor shows | Canvas shows |
|------|--------------|--------------|
| **Edit** | Static defaults; ghost preview optional (“Preview live”) | Handles, no live override unless preview on |
| **Present** | — | Fully data-driven |

#### 16.9.7 Example: MEMS proof mass (replaces hand-coded demo coupling)

```json
{
  "id": "proof-mass",
  "type": "rect",
  "x": { "value": 100, "mode": "absolute" },
  "y": {
    "base": 80,
    "mode": "add",
    "path": "bmi270.ax",
    "map": [{ "op": "scale", "inMin": -1, "inMax": 1, "outMin": 30, "outMax": -30 }]
  },
  "fill": "var(--accent-amber)"
}
```

#### 16.9.8 Relationship to Sensor Studio

| Sensor Studio | Presentation diagrams |
|---------------|----------------------|
| Flow wires connect nodes | Declarative `path` per property |
| Evaluator runs graph | `MapOp` pipeline per property |
| Dashboard widgets | SVG infographic primitives |

Same **live store**; different authoring metaphor. Future: export binding path as documentation string for Studio users.

#### 16.9.9 Phase 7d deliverables (bindings)

- [ ] `diagram-binding-catalog.ts` synced with `display/selectors.ts`
- [ ] `evaluateDiagramProps(scene, liveSnapshot)` + unit tests (golden resolved frames)
- [ ] Inspector: link/unlink per property, map chain editor
- [ ] Pilot: MEMS accel diagram + fusion pipeline edge highlight

### 16.10 Locked product decisions (alive documents)

**Product goal:** One maintainer toolchain to author **professional alive documents** — markdown reader copy, 2D infographics, 3D models, live sensor-driven motion — for students and engineers. Not a toy diagram widget.

| Topic | Decision |
|-------|----------|
| **Size binding** | `width` / `height` bindable in **v1 or v2**; prioritize position, rotation, color, opacity in v1 |
| **Text** | Single-field templates: `"{value:.3f} g"` — sufficient for v1 |
| **Edge animation** | **Yes** — animated flow on connectors (dash-offset driven by sample counter or time); static highlight also supported |
| **Stale / disconnected** | **Default:** freeze last good value + **inactive gray** palette on affected objects; **author-selectable** per diagram or binding: `freeze-gray` \| `hide` \| `fallback` \| `last-no-style` |
| **Telemetry backend** | **UART and Simulator** both first-class; per-document setting: `auto` (prefer UART, **fall back to Simulator** when COM unavailable), `uart`, `simulator`; respect `origin` tagging; never mix streams in one evaluation tick |
| **3D** | **Yes** — infographics may include GLB models with same data-driven properties as 2D |

#### Stale-state styling (`LinkHealthPolicy`)

```typescript
type LinkHealthPolicy =
  | "freeze-gray"   // default — hold last values, apply inactive token set
  | "hide"          // bound objects hidden when unhealthy
  | "fallback"      // use binding.fallback only
  | "last-no-style" // freeze values, keep full color
```

**Unhealthy** when: WS down, wrong telemetry route, no samples within `staleMs`, or `origin` mismatch with document preference.

Inactive theme tokens (presentation CSS): `--diagram-inactive-fill`, `--diagram-inactive-stroke`, `--diagram-inactive-text` (grayed, still readable).

#### Document telemetry preference

Stored in diagram or chapter metadata (`alive-document.v1.json` or slide folder `document.meta.json`):

```json
{
  "telemetryPreference": "auto",
  "staleMs": 2000,
  "defaultLinkHealth": "freeze-gray"
}
```

`auto` behavior: if UART route active and samples flowing → use `origin: uart`; else if Simulator streaming → use `origin: sim`; else → stale policy. **Does not** auto-switch toolbar without user consent in v1 — presentation **reads** current route and applies preference + fallback messaging (“Showing simulated data — connect Bitstream for hardware”).

### 16.11 3D infographic layer

**Principle:** One **binding resolver**, two render backends.

```text
diagram.v1.json
  ├── layers[]
  │     ├── { kind: "2d", nodes: [...] }     → SVG renderer
  │     └── { kind: "3d", nodes: [...] }     → R3F PresentationStage
  └── meta: telemetryPreference, linkHealth
```

**3D node types (v1)**

| Type | Properties (bindable) |
|------|------------------------|
| `model` | `modelId` / GLB URI, `position`, `rotation` (euler or quat path), `scale`, `opacity` |
| `group` | transform group for multi-mesh rigs |
| `label3d` | billboard text with `content` binding (optional v2) |

**Reuse**

- `PresentationStage`, `GlbPreviewModelRoot`, catalog assets — same authored-transform policy as Sensor Studio / rotation preview
- BMI270 PCB orientation scenes migrate to data-driven `model` nodes over time

**Editor:** 3D viewport tab in maintainer diagram editor (orbit, place model, bind quaternion to `bmi270.quat` paths). 2D and 3D share selection list and binding inspector.

### 16.14 Grid layout composition (Wix-style page builder)

**Idea:** In **maintainer mode**, each slide or document page is a **CSS grid canvas**. Authors drag **blocks** into cells, set **column/row span**, resize — Wix/Webflow-style — without editing TSX per slide.

**Verdict:** **Strong fit** for alive documents. Reuse proven patterns from **Sensor Studio Dashboard** (`DashboardPlacementV1`: `column`, `row`, `columnSpan`, `rowSpan` on a 12-column grid).

#### Two grids (do not confuse)

| Layer | What it lays out |
|-------|------------------|
| **Page grid** (this section) | Blocks on a slide/page: heading, markdown, 2D diagram, 3D viewport, live chart |
| **Diagram grid** (internal) | Shapes *inside* a diagram block — snap, curves, bindings |

#### Page schema (`page.v1.json` or section inside `alive-document.v1.json`)

```json
{
  "version": 1,
  "grid": { "columns": 12, "rowHeightPx": 48, "gapPx": 12, "paddingPx": 32 },
  "blocks": [
    { "id": "h1", "kind": "heading", "placement": { "column": 1, "row": 1, "columnSpan": 8, "rowSpan": 2 }, "props": { "title": "..." } },
    { "id": "diag", "kind": "diagram-2d", "placement": { "column": 9, "row": 1, "columnSpan": 4, "rowSpan": 6 }, "src": "diagram.v1.json" },
    { "id": "theory", "kind": "markdown", "placement": { "column": 1, "row": 3, "columnSpan": 8, "rowSpan": 8 }, "src": "theory.md" }
  ]
}
```

#### Block kinds (v1 → v2)

| Kind | Content |
|------|---------|
| `heading` | Eyebrow, title, subtitle (replaces hardcoded `SlideHeading`) |
| `markdown` | `theory.md` / reader excerpt / inline prose |
| `diagram-2d` | `diagram.v1.json` infographic |
| `diagram-3d` | R3F layer + GLB |
| `live-widget` | Waveform, value strip, connection badge (wraps existing presentation widgets) |
| `spacer` | Intentional whitespace |

#### Maintainer workflow

```text
1. New page from template (split-50, hero, full-grid, document-scroll)
2. Drag block from palette → drop on grid (auto-placement or pick cell)
3. Resize handles → update columnSpan / rowSpan
4. Select block → edit content (markdown / diagram / bindings)
5. Save page.v1.json (+ linked assets)
6. Present mode → grid renderer only (no drag chrome)
```

#### Relationship to today’s `SlideLayoutId`

| Today | Tomorrow |
|-------|----------|
| Fixed layouts in `SlidePage.tsx` | **Templates** = initial `page.v1.json` snapshots |
| `BmiAccelTheorySlide.tsx` per slide | Thin loader: `<AlivePage src="page.v1.json" />` |
| `grid-2x2`, `split-50` presets | Named template seeds, then fully editable |

Keep **template library** so authors start professional, then customize — avoids blank-canvas paralysis.

#### Presentation vs long-form document

| Mode | Canvas |
|------|--------|
| **Slide (16:9)** | Fixed viewport; grid rows grow downward; present/zoom as today |
| **Document page (future)** | Scrollable vertical grid; multiple pages in one chapter |

v1: **one grid per slide** (matches current deck navigation).

#### Reuse from Sensor Studio

- `DashboardPlacementV1` + collision / resize helpers (`dashboard-grid-resize.ts`)
- Edit chrome pattern (handles, highlight, drag)
- Optional dep: **`react-grid-layout`** only if dashboard code cannot port cleanly — prefer **shared `trn-grid-placement` primitive** under `ui/` for Dashboard + Presentation

#### Phase 7h — Grid page composer

- [ ] `page.v1.json` schema + `AlivePageRenderer`
- [ ] Maintainer: drag-drop, span resize, block palette
- [ ] Migrate one theory slide (e.g. BMI270 accel) from TSX layout → grid page
- [ ] Templates from existing `SlideLayoutId` presets

### 16.15 Power features backlog (beyond Phase 7 core)

Prioritized additions to make alive documents **useful in production** — not all required for first maintainer ship.

| Priority | Area | Features |
|----------|------|----------|
| **P0** | **Content packs** | Import/export `.trn-presentation-pack` (page + markdown + diagrams + assets); VSIX read-only consume |
| **P0** | **Validation** | Maintainer lint: broken bindings, missing assets, orphan `theory.md`, invalid grid overlap |
| **P0** | **Templates library** | Page + diagram + chapter starters; org-wide “TESA official” blocks |
| **P0** | **Symbol library** | Reusable MCU / sensor / protocol icons for diagrams (BS2-aware) |
| **P0** | **Presenter tools** | Agenda timer, deep links `#chapter/slide`, optional second-window presenter view |
| **P1** | **Reader UX** | Progress/bookmarks, glossary terms, checkpoint quizzes (answer in `notes.md`) |
| **P1** | **Capture & export** | Snapshot slide to PNG/PDF with frozen values; short screen recording hook |
| **P1** | **Session replay** | Record live sample window → replay offline in diagrams (classroom without hardware) |
| **P1** | **Binding power** | Sparkline/history in blocks; derived catalog paths (`magnitude(ax,ay,az)`); scenario presets |
| **P1** | **Master layout** | Shared header/footer row across slides; chapter theme override |
| **P1** | **Ecosystem links** | Jump to Sensor Telemetry / Studio / protocol spec from a slide block |
| **P2** | **Accessibility** | Reader a11y audit, reduced motion, high-contrast presentation theme |
| **P2** | **Localization** | Out of scope for repo Markdown policy today — pack slot for future |
| **P2** | **Collaboration** | Block comments, review status — defer; git + PR is v1 workflow |
| **P2** | **Analytics** | Which slides readers open — only if hosted portal exists later |

**CI gate (recommended):** `npm run presentation:validate` — schema + binding catalog + golden resolved frames (like `test:bitstream2`).

### 16.16 UI primitives, icons & GSAP animation

**Goal:** Authors drag **commonly used UI elements** (info/warning cards, metric tiles, badges, dividers) with **prefix icons**, **live bindings**, and **GSAP** motion — consistent with TRN presentation theme and strong UX.

#### 16.16.1 Presentation UI catalog (block + diagram + markdown)

Reuse TRN patterns where possible (`TRNFloatingNotice` tones, `TRNHintText`, lucide icons). Presentation-scoped wrappers under `presentation/ui/`:

| Primitive | Role | Default icon (lucide) |
|-----------|------|------------------------|
| `CalloutInfo` | Teaching note | `Info` |
| `CalloutWarning` | Caution / misconception | `AlertTriangle` |
| `CalloutDanger` | Safety / protocol critical | `AlertCircle` |
| `CalloutTip` | Instructor hint | `Lightbulb` |
| `Card` | Grouped content | optional prefix |
| `MetricCard` | Live value + label + unit | sensor icon |
| `Badge` | Status chip (UART / sim / stale) | `Radio` / `Cpu` |
| `Divider` | Section break | — |
| `CodeStrip` | Short protocol snippet | `Terminal` |
| `SpecRow` | Key / value datasheet row | — |

**Prefix icon:** every primitive supports `icon?: LucideId | "none" | custom asset URI` — rendered left of title (WYSIWYG inspector).

**Markdown parity:** `theory.md` admonitions (`> **Note:**`) render through the **same** callout components — one visual language for reader + grid blocks.

#### 16.16.2 Animation model (two channels)

| Channel | Driver | Use |
|---------|--------|-----|
| **Data motion** | Live binding → target prop → **GSAP `quickTo`** | Smooth position/color/size/rotation when sensor changes (not jumpy) |
| **Author motion** | Timeline in JSON → **GSAP timeline** on enter / emphasis / loop | Slide entrance, pulse attention, looped flow highlight |

**GSAP:** Already in `extension/package.json` — reuse patterns from `useGsapIconPulseOnValueChange`, `TRNParameterSlider`, `Bmi270AnimatedParameter`. Lazy-load in presentation maintainer if needed; **respect `prefers-reduced-motion`**.

**Animatable properties (all primitives + diagram nodes):**

`x`, `y`, `width`, `height`, `rotation`, `scale`, `opacity`, `fill`, `stroke` — each may be static, binding-driven, or timeline-keyed.

```json
{
  "animation": {
    "enter": { "kind": "fade-up", "durationMs": 400, "ease": "power2.out", "delayMs": 0 },
    "emphasis": { "kind": "pulse", "trigger": "on-visible" },
    "data": { "tweenMs": 280, "ease": "power2.out" }
  }
}
```

**Data tweens:** When binding updates `rotation`, GSAP tweens from previous → new (kill conflicting tweens — same as telemetry UI). **Stale / freeze-gray** pauses emphasis loops; data may hold last value per `LinkHealthPolicy`.

#### 16.16.3 UX / UI rules (presentation)

- **Theme tokens only** — callout borders/backgrounds from `--accent-*-bg`, `--surface-*` (light/dark presentation themes)
- **No native `title` tooltips** — `TRNTooltip` / `TRNHintTooltip` per `trn-no-native-tooltip.mdc`
- **Typography** — Inter; proportional numerals (no `tabular-nums` unless debug block)
- **Touch targets** — maintainer handles ≥ 44px; present mode read-only
- **Density** — slide grid blocks default comfortable; document scroll mode may compact
- **Icon pulse** — reuse `useGsapIconPulseOnValueChange` when bound value changes (metric cards)
- **Motion budget** — max one emphasis loop per viewport; entrance stagger via `delayMs` in grid row order
- **Accessibility** — `prefers-reduced-motion`: skip enter/emphasis; instant data updates only

#### 16.16.4 Phase 7i — UI primitives + motion

- [ ] `presentation/ui/catalog/` — Callout*, Card, MetricCard, Badge (present + maintainer inspector props)
- [ ] Grid block kinds: `callout`, `metric-card`, `card`
- [ ] `PresentationMotionController` — GSAP data tweens + authored timelines
- [ ] Markdown admonition → callout component mapping
- [ ] Document in `presentation/docs/UI_PRIMITIVES.md` (English)

### 16.12 Professional toolchain surface (target UX)

Single **Maintainer** workspace (dev / content authors):

| Tool | Output | Live preview |
|------|--------|--------------|
| **Markdown editor** | `theory.md`, `notes.md` | KaTeX reader panel |
| **2D diagram editor** | SVG scene layer in `diagram.v1.json` | Bound props + snap + curves |
| **3D layer editor** | R3F layer in same JSON | Model + transform bindings |
| **Grid page composer** | `page.v1.json` block placement | Wix-style drag, colspan/rowspan (§16.14) |
| **Document settings** | telemetry preference, stale policy | Status bar: UART / sim / stale |

**Present / reader mode:** No editing chrome; full-screen-quality infographics; reader (**R**) for prose; diagrams animate with live or frozen-gray data.

**Export (later):** Static PNG/SVG + “last captured values” PDF handout; alive mode stays in app.

### 16.13 Non-goals (v1)

- Collaborative real-time editing (Google Docs style)
- WYSIWYG slide deck designer (PowerPoint clone)
- Arbitrary user scripts or spreadsheet formulas in bindings
- Writing markdown/diagrams to disk from installed VSIX without a maintainer content pack workflow
- Full expression language (Excel / JS) — `MapOp` catalog only

---

## 17. v2 scaffold — start here before feature work

**Exit criteria for Phase 0:** Dev can open **Course Studio** (`course-studio` workspace), see one pilot page rendered from `page.v1.json`, v1 `presentation` unchanged.

### 17.1 Create tree

```text
extension/src/webview/course-studio/
  README.md
  CourseStudioWorkspace.tsx
  course-studio.css
  docs/ARCHITECTURE.md
  docs/SCHEMA.md
  schemas/           ← zod: page.v1, diagram.v1, document.meta, animation presets
  runtime/           ← present mode: CoursePageRenderer, binding evaluator stub
  maintainer/        ← dev-only shell (gate: import.meta.env.DEV)
  ui/catalog/        ← empty stubs: CalloutInfo, Card, MetricCard
  motion/            ← CourseMotionController stub (GSAP)
  content/chapters/  ← one pilot: bmi270/bmi-accel-theory/
  shared/live.ts     ← re-export v1 presentation hooks + store (no decode fork)
```

### 17.2 Wire workspace (minimal)

1. Add `"course-studio"` to `BitstreamWorkspaceId` (dev visibility only in switcher at first).
2. `BitstreamShellMain` → `<CourseStudioWorkspace />` when workspace matches.
3. Optional: Ctrl+Shift+4 shortcut in `webviewShellShortcuts.ts` (dev).
4. VS Code panel: defer or `TERNION_BITSTREAM_WORKSPACE=course-studio` for dogfood.

### 17.3 Freeze v1 policy

- Add `extension/src/webview/presentation/V1_FROZEN.md` — bugfix-only; features go to `course-studio/`.
- Tag git `presentation-v1` optional before large v2 merges.

### 17.4 Implementation order (after scaffold)

```text
0  Scaffold + workspace + pilot page JSON (static blocks only)
7a Markdown maintainer + theory.md
7b diagram.v1 schema + static SVG renderer
7i UI callouts/cards + GSAP presets
7h grid composer
7d bindings + MapOp
7c diagram editor (pro)
7f 3D layer
7g animation + link health + edge flow
7+ content packs, validate, templates
```

### 17.5 Pilot content

Migrate **one** slide end-to-end: `bmi270` / accel theory — `page.v1.json` + `theory.md` + `diagram.v1.json` + one `CalloutWarning` block. Proves all layers before bulk chapter port.

---

## 15. Document history

| Date | Change |
|------|--------|
| 2026-06-08 | **Course Studio** chosen as v2 name — `course-studio/` workspace; v1 `presentation/` frozen |
| 2026-06-08 | §17 v2 Phase 0 scaffold checklist; folder `course-studio/` |
| 2026-06-08 | §16.16 UI primitives (callouts, cards, prefix icons) + GSAP data/author animation |
| 2026-06-08 | §16.15 power features backlog (content packs, validation, templates, replay, export) |
| 2026-06-08 | §16.14 grid page composer (Wix-style blocks, reuse Dashboard placement model) |
| 2026-06-08 | §16.10–16.12 locked decisions: freeze-gray stale, UART/sim auto, edge animation, 3D layer, alive-document toolchain |
| 2026-06-08 | §16.9 data-driven diagram properties (transform, color, MapOp pipeline); §16.8 pro editor (curves, snap) |
| 2026-06-08 | Phase 7 authoring plan (§16): maintainer markdown + diagram editor with live bindings; theory.md backlog on Phases 3–5 |
| 2026-06-08 | Theory reader shipped: `theory.md` + KaTeX for all BMI270 and Euler theory slides |
| 2026-06-08 | Phase 2 BMI270 (16 slides) + Euler & Quaternion chapter (11 slides); ported live demos and R3F widgets |
| 2026-06-08 | Phase 0 scaffold shipped in `extension/src/webview/presentation/` — workspace tab, VS Code panel, light/dark themes, shared layouts, 4 slides (platform + BMI270 demo) |
| 2026-06-08 | Initial plan — chapter architecture, four sensors + platform chapter, BMI270 redesign, implementation phases |
