# Chapter 4 — BMM350 (Magnetic Field)

**Audience:** Workshop trainees, instructors, and embedded developers (hardware + firmware).

**Hardware:** TESAIoT DevKit — on-board **BMM350** 3-axis magnetometer (+ chip temperature).

**Companion:** [WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) (Ch5–6 demos) · [SENSOR_THEORY.md](../SENSOR_THEORY.md) (shared core ideas) · [CH3_BMI270.md](./CH3_BMI270.md) (IMU — separate from mag in this workshop)

Each major section has two tracks:

| Track | Who | Focus |
|-------|-----|-------|
| **Workshop** | Trainees | 3-axis vectors, Earth field, rotation labs, interference caution |
| **Embedded** | HW / FW engineers | I3C bus (AI kit), Bosch driver, EVT pack, axis cache |

---

## 1. Introduction

### Workshop

The **BMM350** answers: *“What does the local magnetic field look like in X, Y, and Z?”*

It is a **magnetometer** — a sensor that measures magnetic field strength along three perpendicular axes. Workshop narrative is **compass-style**: rotate the board and watch X/Y/Z trade dominance, not navigation-grade north finding.

It reports:

- **Magnetic field** along **X, Y, Z** in **µT** (microtesla)
- **Chip temperature** in **°C** (secondary)

Earth’s field is weak — on the order of **25–65 µT** depending on location — much smaller than the sensor’s wide catalog range (±1000 µT).

**Learning outcomes**

After this chapter you should be able to:

1. Read mag X/Y/Z as a **three-axis vector** and state units (µT).
2. Explain why indoor “compass” demos show **relative** change, not true north.
3. Compute **field strength** \( |B| = \sqrt{x^2 + y^2 + z^2} \) for gauge demos.
4. Run rotation and magnet-proximity labs safely on the DevKit.
5. *(Embedded)* Trace I3C read → axis cache → `EVT_SENSOR` MAG→TMP order and wire scale ×100.

**Where this chapter fits**

| Workshop chapter | BMM350 role |
|------------------|-------------|
| **Ch5** — Pipelines | BMM350 vector → gauge or compass-style graphic |
| **Ch6** — Course Studio | Three-axis bars or compass infographic on four-sensor dashboard |

BMM350 also appears alongside BMI270 on the **four-sensor** Course Studio page — motion (IMU) and field (mag) are **separate** lessons by design.

### Embedded

| Item | Value |
|------|--------|
| **Part** | BMM350 (Bosch) — 3-axis magnetometer + temperature |
| **Kit** | **KIT_PSE84_AI** (U20, **I3C**) · Eval kit (U4, **I2C**) |
| **BS2 sensorId** | `1` (`BS2_SENSOR_ID.BMM350`) |
| **Catalog id** | `bmm350` |

**Software stack**

```text
BMM350 chip (I3C on AI DevKit)
  → Bosch BMM350_SensorAPI + bmm350_core wrapper
  → sensor_bmm350 (startup / read)
  → bitstream_sensor_port_cm55_bmm350 (axis cache)
  → bitstream_bs_sensor — bs_pack_bmm350_evt() via get_bmm350_axes()
  → UART EVT_SENSOR → decodeBmm350Values() → Bitstream Studio UI
```

**Authoritative references**

| Doc | Path |
|-----|------|
| CM55 implementation | `TESAIoT_Library/docs/BMM350_CM55_IMPLEMENTATION.md` |
| Kit sensor list | `TESAIoT_Library/docs/SENSORS_COMPARISON.md` |
| EVT layout | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| Host decode | `extension/src/bitstream2/domains/sensors/bmm350.ts` |

---

## 2. Physical principles

### Workshop — magnetic field as a vector

A magnetometer measures the **magnetic flux density** **B** around the sensor. Bitstream Studio shows three components:

| Axis | Meaning |
|------|---------|
| **magX** | Field along board X |
| **magY** | Field along board Y |
| **magZ** | Field along board Z |

Together they form a **vector** fixed to the PCB. When you **rotate** the board in Earth’s field, components swap and sign-change — like tipping a pencil in a gentle breeze.

**Field strength** (scalar from the vector):

```text
|B| = √(magX² + magY² + magZ²)
```

Near Earth’s field alone, \(|B|\) is often **25–65 µT** — use this for “how strong is the background field?” stories, not for ±1000 µT full-scale bars.

### Workshop — Earth field vs workshop band

| Band | Range | Use in class |
|------|-------|--------------|
| **Earth field** | ~25–65 µT total | Narrative only |
| **Workshop axis band** | **±100 µT** per axis | Progress bars — visible rotation |
| **Catalog full scale** | ±1000 µT | Sensor capability; strong magnet demos |

Bars mapped to ±100 µT will **saturate** if you bring a strong magnet close — that is expected; warn trainees before the jump demo.

### Workshop — not a navigation compass (here)

Uncalibrated magnetometer + **indoor distortion** (steel desks, speakers, motors, phone magnets) means heading from mag alone **will not point to geographic north** in the classroom.

Teach **relative** field change:

- Slow rotate flat on table → X and Y swap dominance
- Compare before/after moving near steel leg
- Do **not** promise aviation-grade compass without calibration and hard/soft-iron correction

### Workshop — chip temperature

Die temperature supports internal compensation — same pattern as DPS368 secondary temp. It is not a room thermometer.

### Embedded — sensing principle

The BMM350 uses Bosch **TMR (tunnel magnetoresistance)** technology with factory trim/OTP coefficients. The driver returns calibrated **µT** on X/Y/Z plus temperature in °C.

| Quantity | Driver output | Wire |
|----------|---------------|------|
| mag X/Y/Z | float µT | int16 × 100 per axis |
| temperature | float °C | int16 × 100 |

**Hard/soft iron:** PCB, battery, and enclosure steel bias the field. Product compass fusion (IMU + mag + calibration) is out of scope for this workshop — [CH3_BMI270.md](./CH3_BMI270.md) fusion heading and BMM350 mag are taught **separately**.

---

## 3. Hardware design (DevKit integration)

> **Embedded depth**

### Bus and placement (TESAIoT DevKit = KIT_PSE84_AI)

| Topic | AI kit (workshop hardware) |
|-------|----------------------------|
| **Interface** | **I3C** (dedicated controller — **not** shared I²C manager bus) |
| **Schematic ref** | **U20** |
| **Controller** | `CYBSP_I3C_CONTROLLER_*` (PSoC I3C block) |
| **Init** | `Cy_I3C_Init` + IRQ + `mtb_bmm350_init_i3c()` |
| **Static address** | `MTB_BMM350_ADDRESS_SEC` on I3C device struct |

**Eval kit note:** KIT_PSE84_EVAL uses **I2C** at **U4** — same BMM350 part, different bus wiring. Workshop prose targets the **AI DevKit** path unless your bench is Eval-specific.

```text
  ┌──────────── CM55 ────────────┐
  │  I²C manager bus             │── BMI270, SHT40, DPS368
  │  (SCB0 / P8)                 │
  └──────────────────────────────┘

  ┌──────────── CM55 ────────────┐
  │  I3C controller (separate)   │── BMM350 (U20)
  └──────────────────────────────┘
```

Separation matters for firmware: mag reads do **not** take the I²C manager mutex, but IMU + environmental sensors still share I²C bandwidth.

### Build flags

| Flag | Role |
|------|------|
| `MAG_BMM350_ENABLE=1` | Compile BMM350 sources (`proj_cm55/Makefile`) |
| PREBUILD `bmm350_fix.bash` | Patch Bosch driver line that can break I3C after soft reset |

### Layout and interference

- Demo **above** the table when possible — steel surface biases the field.
- Keep **phone magnets**, speakers, and clamp leads away from U20.
- Strong permanent magnets can saturate readings — use small magnets briefly for “field jump” demos only.

---

## 4. Chip protocol and driver behavior

> **Embedded depth**

### Bosch stack

| Layer | Location |
|-------|----------|
| **BMM350_SensorAPI** | Bosch driver v1.4.0 (`deps/BMM350_SensorAPI.mtb`) |
| **bmm350_core** | `mtb_bmm350_init_i3c`, `mtb_bmm350_read` |
| **sensor_bmm350** | Application startup/read + state store |

### Key API

```c
cy_rslt_t mtb_bmm350_init_i3c(mtb_bmm350_t *dev, void *i3c_hw,
                              void *i3c_context, void *i3c_device);

cy_rslt_t mtb_bmm350_read(mtb_bmm350_t *dev, mtb_bmm350_data_t *data);
// data.sensor_data: x, y, z (µT), temperature (°C)
```

Application sample:

```c
typedef struct {
    float mag_x, mag_y, mag_z;   // µT
    float temperature;            // °C
} bmm350_sample_t;
```

### Read reliability

`sensor_bmm350_read()` retries `mtb_bmm350_read()` once on failure. Bitstream port adds up to **2** read attempts before returning **-2**.

---

## 5. Firmware architecture (TESAIoT)

> **Embedded depth**

### Layer map

| Layer | File | Role |
|-------|------|------|
| Driver | `sensor_bmm350.c` | I3C bring-up, init retries, read |
| Bitstream port | `bitstream_sensor_port_cm55_bmm350.c` | Scale µT×100, cache axes |
| BS2 pack | `bitstream_bs_sensor.c` | `bs_pack_bmm350_evt()` pulls cached axes |

### Initialization flow

1. Register state store + event bus.
2. If `CYBSP_I3C_CONTROLLER_HW` defined: init I3C HW, IRQ, enable controller.
3. `mtb_bmm350_init_i3c()` — up to **3** attempts, 20 ms apart.
4. `SENSOR_STATE_READY` or `SENSOR_STATE_ERROR`.

**Fail-soft:** `bitstream_sensor_port_cm55_bmm350_init()` keeps Bitstream link alive if mag is not ready; `is_ready()` can retry startup.

### Axis cache and EVT pack

Each successful port read updates cached **mag_x/y/z_ut_x100**. `bitstream_protocol_sensor_get_bmm350_axes()` supplies the last axes when packing EVT:

```text
sensor_bmm350_read() → float µT
  → port scales ×100 → s_bmm350_last_mag_* 
  → bs_pack_bmm350_evt: MAG(3) then TMP(1) per mask
```

The port’s `magnetic_flux_ut_x100` out-parameter stores a **max(|x|,|y|,|z|)** proxy (legacy internal slot) — **telemetry field keys** for workshops are always **magX/magY/magZ** from EVT decode, not that proxy.

---

## 6. BS2 wire format and host decode

> **Embedded depth**

### Identity and mask

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `1` |
| **Mask MAG** | `0x01` (`BMM350_MASK.MAG`) — all three axes together |
| **Mask TMP** | `0x02` (`BMM350_MASK.TMP`) |
| **Default mask** | `0x03` (mag + temp) |
| **EVT order** | **MAG X,Y,Z** → **TMP** (only bits set in mask) |
| **Mag wireScale** | **100** — µT × 100 per axis |
| **Temp wireScale** | **100** — °C × 100 |

Host decode (`extension/src/bitstream2/domains/sensors/bmm350.ts`):

```typescript
export const BMM350_MASK = { MAG: 0x01, TMP: 0x02 } as const;
```

**Note:** MAG is one mask bit but payload is **three** int16 values (X, Y, Z).

### Catalog fields

| Field key | Unit | Range |
|-----------|------|-------|
| `magX`, `magY`, `magZ` | µT | −1000 … 1000 |
| `temperatureC` | °C | −40 … 85 |

**Gauge hints:** `magAxis` ±100 µT; `magMagnitude` 0–100 µT (Earth |B| band).

### Default SENSOR_CFG

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `publishMode` | `periodic` |
| `mask` | `3` |
| `samplingIntervalMs` | `100` (10 Hz) |
| `staleAfterMs` (host) | `500` |

### Worked wire example

Field ~40 µT on X, ~10 µT on Y, ~45 µT on Z, temp 26 °C, mask `0x03`.

| Channel | Physical | ×100 | int16 |
|---------|----------|------|-------|
| magX | 40 µT | 4000 | 4000 |
| magY | 10 µT | 1000 | 1000 |
| magZ | 45 µT | 4500 | 4500 |
| temp | 26 °C | 2600 | 2600 |

Host displays **40.0 µT**, etc., after ÷100.

### Simulator parity

Simulator synthesizes sine on `bmm350.mag.x/y/z` within ±50 µT class swing — same field keys as UART.

---

## 7. Configuration and rate planning

### Workshop — settings that matter

| Setting | Magnetometer lab suggestion |
|---------|----------------------------|
| **Enabled** | On for Ch5–6 mag widgets |
| **Sampling rate** | **10–20 Hz** default feel; **50 Hz** for snappy rotation demos |
| **Publish mode** | **On change** with `deltaX100 ≈ 50` (~0.50 µT) reduces UART noise when still |
| **Telemetry channels** | MAG enables all three axes; disable **Temp** to save bandwidth |

Always **Apply** after changes.

### Embedded — timing

BMM350 uses **fast sensor** presets (same class as BMI270 — up to 100 Hz).

| Rate | intervalMs | Notes |
|------|------------|-------|
| 10 Hz | 100 ms | **Catalog default** |
| 20 Hz | 50 ms | Responsive rotation UI |
| 50–100 Hz | 20–10 ms | Higher I3C + UART load |

Mag + BMI270 at high rate together can stress UART — trim unused channels on other sensors during mag-heavy labs.

---

## 8. From chip to screen

### Workshop — three bars + strength

Map each axis to **±100 µT** for classroom visibility:

```text
percent = (magX − (−100)) ÷ (100 − (−100)) × 100
```

Show **|B|** as optional footer:

```text
|B| = √(magX² + magY² + magZ²)
```

Use gauge hint **0–100 µT** for magnitude bar (Earth band), not 0–1000.

### Embedded — pipeline

```text
I3C read → float µT in bmm350_sample_t
  → port ×100 → axis cache
  → bs_pack_bmm350_evt → 3× int16 + temp
  → host mapBmm350Fields → magX/magY/magZ
  → Sensor Telemetry / Studio / Course / HTML dashboard
```

---

## 9. Hands-on labs (DevKit)

### Workshop labs

**Lab 1 — Quiet baseline**

1. Board flat, away from magnets and steel legs.
2. **Expect:** stable X/Y/Z; discuss Earth field as soft background.

**Lab 2 — Slow rotate flat**

1. Rotate board ~360° on table over 20 s.
2. **Expect:** X and Y trade dominance; Z may shift modestly — compass-style **relative** story.

**Lab 3 — Steel interference**

1. Note values above open air.
2. Move board directly onto steel desk surface or near steel leg.
3. **Expect:** offset shift — distortion, not sensor fault.

**Lab 4 — Small magnet (caution)**

1. Instructor only: bring a **small** magnet near U20 for 2 s.
2. **Expect:** large jump; bars may peg at ±100 µT scale.
3. Remove magnet; values settle after a few seconds.

**Lab 5 — Field strength readout**

1. Compute or display \( |B| \) in Sensor Studio (**Vector Length**) or workshop HTML.
2. **Expect:** |B| roughly tens of µT indoors — not hundreds.

**Lab 6 — Axis mask**

1. Disable **Temp** channel, **Apply**.
2. Confirm EVT carries mag only (shorter payload).

### Embedded labs

**Lab 7 — UART probe**

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter `sensorId: 1`; verify three mag int16s then temp when mask `0x03`.

**Lab 8 — Read retry**

Induce a single failed read (brief bus glitch); observe port retry and axis cache holding last good axes until next success.

---

## 10. Build it in Bitstream Studio

### Workshop walkthroughs

**Sensor Telemetry**

1. Open **BMM350** mag X/Y/Z readouts.
2. Rotate board while watching all three axes.

**Sensor Studio (Ch5)**

1. **BMM350** magnetometer node → three numeric outputs or one **Radial Gauge** on a single axis.
2. **Vector Length** on mag vector → strength gauge.
3. Optional: compare with BMI270 **heading** from fusion — discuss why they disagree indoors.

**Course Studio (Ch6)**

- Three-axis bars or compass-style infographic
- Violet accent **`#b88cff`**
- Caption: “Local magnetic field — relative demo, not calibrated north”

### Embedded — external dashboards

| Item | Value |
|------|-------|
| Sensor id | `bmm350` |
| Fields | `magX`, `magY`, `magZ`, `temperatureC` |
| Example HTML | `extension/docs/workshop/examples/bmm350-magnetometer-dashboard.html` |
| Prompt | `extension/docs/workshop/prompts/SENSOR_BMM350.md` |

---

## 11. Real-world use cases

### Workshop stories

| Domain | BMM350 role |
|--------|-------------|
| **Compass / heading aid** | After calibration + fusion (products; not this lab) |
| **Metal proximity** | Detect ferrous object near sensor |
| **Robotics / drones** | Yaw aiding when fused with IMU + GPS |
| **Door / lid detection** | Magnet + reed switch patterns in industry |

### Embedded product notes

- Plan **calibration** (figure-8 motion) for any navigation use.
- Keep mag sensor away from DC motors, speakers, and high-current traces.
- **I3C** on AI kit: ensure PREBUILD fix applied when upgrading Bosch API.
- **IPC path:** Legacy CM33 `IPC_CMD_MAG_RAW` still exists for console — Bitstream workshop uses **EVT_SENSOR** on UART.

---

## 12. Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Compass doesn’t point north. | Uncalibrated + indoor steel — teach **relative** rotation only. |
| Values jumped when I moved my phone. | Magnets in phone cases/speakers — expected distortion. |
| One axis pegged at bar edge. | Workshop band ±100 µT — use full scale only in advanced demos. |
| Mag vs IMU heading differ. | Fusion heading ≠ raw magnetometer; different sensors and filters. |

### Embedded debug table

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| Init error 0x… | I3C HW missing in BSP | `CYBSP_I3C_CONTROLLER_HW`, Device Configurator |
| Read fails | I3C IRQ, soft-reset bug | PREBUILD `bmm350_fix.bash` ran |
| Stale axes on EVT | Pack uses cache; read failed silently | `get_bmm350_axes`, port return -2 |
| All zeros | Sensor disabled in SENSOR_CFG | `enabled`, mask MAG bit |
| UART starvation | 100 Hz mag + 50 Hz IMU | Lower rates or trim masks |

---

## 13. Knowledge check

1. What physical quantity does the BMM350 measure on three axes?
2. What unit does Bitstream Studio use for mag X/Y/Z?
3. Approximate Earth field strength in µT?
4. Why use ±100 µT workshop bars instead of ±1000 µT?
5. What is the BS2 sensorId for BMM350?
6. EVT order when mask is `0x03`?
7. How many int16 values does mask bit MAG (`0x01`) contribute?
8. What bus does BMM350 use on the **AI** DevKit?
9. Compute |B| for (30, 40, 0) µT.
10. Why keep strong magnets away from the lab kit?

### Answers

1. **Magnetic flux density** (magnetic field) along X, Y, Z.
2. **µT** (microtesla).
3. Roughly **25–65 µT** (location dependent).
4. Earth field is weak — ±100 µT makes rotation visible on bars.
5. **1**.
6. **MAG X,Y,Z** then **temperature**.
7. **Three** (X, Y, Z together under one mask bit).
8. **I3C** (dedicated controller, not shared I²C manager).
9. √(900+1600) = **50 µT**.
10. Strong magnets saturate/distort readings and can affect other sensors.

---

## 14. Instructor and maintainer notes

- **Safety:** Magnet demo is optional and brief — no strong neodymium on student kits unsupervised.
- **Desk setup:** Open air above table beats flat on steel for baseline lab.
- **Pair with BMI270:** Four-sensor dashboard — motion teal, mag violet; do not merge into one “compass widget” without explaining fusion limits.
- **Simulator:** Same `magX/Y/Z` keys — good for backup seats without hardware.
- **Eval vs AI:** If a bench uses Eval kit, mention I2C at U4 instead of I3C U20.

---

## 15. Summary and quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | “Local magnetic field in X, Y, Z” |
| Vector | magX, magY, magZ (µT) |
| Earth | ~25–65 µT \|B\| |
| Workshop axis band | ±100 µT |
| Strength | √(x²+y²+z²) |
| Caution | Steel, speakers, phone magnets |
| Studio | Ch5 compass-style, Ch6 infographic |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `1` |
| AI kit bus | **I3C** U20 |
| Mask / default | `0x03` (MAG + TMP) |
| EVT order | MAG(3) → TMP(1) |
| wireScale | 100 (µT×100, °C×100) |
| Field keys | `magX`, `magY`, `magZ`, `temperatureC` |
| Default sample | 100 ms (10 Hz) |
| staleAfterMs | 500 |
| Driver | `sensor_bmm350.c` |
| Host decode | `extension/src/bitstream2/domains/sensors/bmm350.ts` |
| Build | `MAG_BMM350_ENABLE`, `bmm350_fix.bash` |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [SENSOR_THEORY.md](../SENSOR_THEORY.md) | Hub — vectors, magnitude, multi-sensor dashboard |
| [CH3_BMI270.md](./CH3_BMI270.md) | IMU / fusion (separate from raw mag) |
| [prompts/SENSOR_BMM350.md](../prompts/SENSOR_BMM350.md) | HTML dashboard generator |
| [prompts/DASHBOARD_FOUR_SENSORS.md](../prompts/DASHBOARD_FOUR_SENSORS.md) | Full four-sensor page |

*Developer catalog API: `extension/docs/bitstream-telemetry-provider/` — optional for workshop track.*
