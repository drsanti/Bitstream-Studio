# Chapter 2 — DPS368 (Barometric Pressure)

**Audience:** Workshop trainees, instructors, and embedded developers (hardware + firmware).

**Hardware:** TESAIoT DevKit — on-board **DPS368** barometric pressure sensor.

**Companion:** [WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) (Ch2, Ch4–6 demos) · [SENSOR_THEORY.md](../SENSOR_THEORY.md) (shared core ideas) · [CH1_SHT40.md](./CH1_SHT40.md) (climate pair for weather strip)

Each major section has two tracks:

| Track | Who | Focus |
|-------|-----|-------|
| **Workshop** | Trainees | Plain language, live demos, Bitstream Studio UI |
| **Embedded** | HW / FW engineers | Schematic, I²C, driver stack, BS2 wire, debug |

---

## 1. Introduction

### Workshop

The **DPS368** answers: *“What is the air pressure around the board?”*

It reports:

- **Barometric pressure** in **hPa** (hectopascals) — the same unit family weather apps use
- **Chip temperature** in **°C** — mainly for internal compensation; useful as a secondary reading

In a one-room workshop, pressure looks **stable** unless the air mass changes (door to outside, HVAC cycle) or you tell an **altitude / weather** story. A reading near **1013 hPa** is ordinary at sea level.

**Learning outcomes**

After this chapter you should be able to:

1. Explain barometric pressure and why it is measured in hPa.
2. Read live DPS368 pressure in **Sensor Telemetry** and interpret the sea-level band (900–1100 hPa).
3. Map pressure to a 0–100% bar using **Map Range** or a chosen min/max.
4. Pair DPS368 with SHT40 for a minimal “weather panel” narrative.
5. *(Embedded)* Trace Pa → hPa scaling, EVT pack order (PRESS → TMP), and the port recovery state machine.

**Where this chapter fits**

| Workshop chapter | DPS368 role |
|------------------|-------------|
| **Ch2** — Sensor Telemetry | Optional pressure bar; numeric readout |
| **Ch4** — Sensor Studio | DPS368 node → bar meter or numeric display |
| **Ch5** — Pipelines | Weather strip with SHT40 + DPS368 |
| **Ch6** — Course Studio | Manometer column or pressure ring widget |

### Embedded

| Item | Value |
|------|--------|
| **Part** | DPS368 (Infineon XENSIV™) — barometric pressure + temperature |
| **Kit** | **KIT_PSE84_AI** only |
| **Schematic ref** | U6 |
| **BS2 sensorId** | `3` (`BS2_SENSOR_ID.DPS368`) |
| **Catalog id** | `dps368` |

**Software stack (five layers)**

```text
DPS368 chip (I²C 0x77)
  → Infineon xensiv_dps3xx driver + MTB HAL wrapper
  → sensor_dps368 (TESAIoT CM55 module)
  → bitstream_sensor_port_cm55_dps368 (unit normalize + recovery)
  → bitstream_bs_sensor — bs_pack_dps368_evt()
  → UART BS2 frame → decodeDps368Values() → Bitstream Studio UI
```

**Authoritative references (outside this repo)**

| Doc | Path |
|-----|------|
| DPS368 integration analysis | `TESAIoT_Library/docs/DPS368_ANALYSIS.md` |
| EVT_SENSOR wire layout | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| Host SENSOR_CFG | `extension/src/bitstream2/docs/SENSOR_CFG_V2.md` |
| Host decode | `extension/src/bitstream2/domains/sensors/dps368.ts` |

---

## 2. Physical principles

### Workshop — atmospheric pressure

**Air pressure** is the weight of the atmosphere pressing on everything at your altitude. We express it in **hectopascals (hPa)**:

- **1 hPa = 100 Pa** (pascals)
- Weather reports and aviation often use hPa (or mb — numerically the same)

At sea level, typical station pressure is about **1013 hPa**. In a classroom:

- **900–1100 hPa** is a good **sea-level band** for gauges and lesson narrative
- Slow drift over minutes may reflect HVAC or an open door — not a sensor fault

### Workshop — pressure vs altitude vs weather

| Effect | What trainees should expect on the desk |
|--------|----------------------------------------|
| **Lift the board 30 cm** | Almost no visible change — altitude effect is tiny over desk height |
| **Weather front / air mass** | Slow change over hours (often outside a 75 min workshop) |
| **Open door to humid outside air** | Pressure may shift slightly; pair with SHT40 for a richer story |
| **AC cycle** | Very small drift possible in a sealed-ish room |

Teach the **weather band** story, not elevator physics. For altitude labs, use narrative (“higher floor → slightly lower pressure”) rather than expecting a desk demo to move the needle.

### Workshop — chip temperature (secondary)

The DPS368 die temperature is **not** a room thermometer. It tracks the **chip package** and helps the driver compensate pressure readings. Show it as optional meta (“sensor temp”) beside the main pressure readout.

### Embedded — sensing principle

The DPS368 is a **MEMS barometer**: a thin membrane deflects with ambient pressure; the chip converts deflection to a digital pressure value using factory-stored **calibration coefficients** (read from on-chip OTP/registers at init).

| Quantity | Mechanism | Driver output |
|----------|-----------|---------------|
| **Pressure** | MEMS capacitive / piezo cell + coeff math | **Pascals (Pa)** from `xensiv_dps3xx_read()` |
| **Temperature** | On-chip temp sensor | **°C** (`cy_float32_t`) |

**Unit chain to the UI**

```text
Driver: pressure_pa (float, Pa)
Port:   normalize → pressure_hpa (float)
Wire:   pressure_hpa × 10 → int16 (hPa×10)
Host:   ÷ wireScale 10 → pressureHpa (float, hPa)
```

Example: **101325 Pa** → **1013.25 hPa** → wire **10133** → display **1013.3 hPa** (0.1 hPa resolution on wire).

**Typical specs (order-of-magnitude for teaching)**

| Parameter | Typical | Notes |
|-----------|---------|-------|
| Pressure range | 300–1200 hPa | Catalog matches sensor capability |
| Pressure accuracy | ±1 hPa class | After calibration; verify datasheet for your lot |
| Temperature range | −40 … 85 °C | Chip temp channel |
| Resolution (wire) | 0.1 hPa | hPa×10 integer on UART |

---

## 3. Hardware design (DevKit integration)

> **Embedded depth** — hardware and PCB integration.

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x77** default (`XENSIV_DPS3XX_I2C_ADDR_DEFAULT`, SDO floating) |
| **Alternate address** | **0x76** (`XENSIV_DPS3XX_I2C_ADDR_ALT`, SDO to GND) |
| **TESAIoT default** | `0x77` |
| **Voltage** | **1.8 V** I²C domain (SCB0 / P8) |
| **Pins** | P8[0] SCL, P8[1] SDA |

### Shared bus

DPS368 shares **Bus 1 (SCB0)** with **BMI270**, **SHT40**, and other peripherals. All access through **I²C manager** lock/unlock — same discipline as [CH1_SHT40.md](./CH1_SHT40.md).

```text
        ┌──────────────┐
        │  PSoC CM55   │
        │  I²C manager │
        └──────┬───────┘
               │ Bus 1 (1.8 V)
       ┌───────┼───────┐
       │       │       │
   ┌───▼───┐ ┌─▼───┐ ┌─▼────┐
   │DPS368 │ │SHT40│ │BMI270│
   │  U6   │ │ U22 │ │ IMU  │
   └───────┘ └─────┘ └──────┘
```

### Layout notes

- Barometric sensors are sensitive to **airflow and enclosure**: a sealed project box without a vent port will not track room weather.
- Keep away from direct fan blast onto the port hole if you want stable baseline demos.
- Unlike the magnetometer, pressure is relatively immune to nearby steel — but rapid temperature transients affect accuracy slightly.

---

## 4. Chip protocol and measurement modes

> **Embedded depth** — Infineon driver behavior.

### Register-oriented model (unlike SHT40 single-byte commands)

| Area | Registers (examples) | Role |
|------|----------------------|------|
| Measurement | 0x00–0x05 | Pressure / temperature raw (3 bytes each) |
| Config | 0x06–0x09 | Oversampling, measurement mode |
| Calibration | 0x10+ (18 bytes) | Coefficients applied inside driver |
| ID | 0x0D | Product / revision |

### Measurement modes (`MEAS_CFG`)

| Mode | Value | Use |
|------|-------|-----|
| Command pressure | `0x01` | Single-shot pressure |
| Command temperature | `0x02` | Single-shot temperature |
| Background pressure | `0x05` | Continuous pressure |
| Background temperature | `0x06` | Continuous temperature |
| Background all | `0x07` | Continuous P + T |

**TESAIoT path:** `xensiv_dps3xx_read()` in default **command** configuration — driver re-triggers as needed per call. Each `sensor_dps368_read()` performs lock → read → unlock.

### Oversampling

Driver supports 1, 2, 4, 8, 16, 32, 64, 128× oversampling for pressure and temperature. Higher oversampling → better noise performance, longer conversion time. Workshop firmware uses library defaults unless you change `xensiv_dps3xx_set_config()` in a custom build.

### Key API

```c
cy_rslt_t mtb_xensiv_dps3xx_init_i2c(xensiv_dps3xx_t *obj, mtb_hal_i2c_t *i2c,
                                     xensiv_dps3xx_i2c_addr_t i2c_addr);

cy_rslt_t xensiv_dps3xx_read(xensiv_dps3xx_t *obj, cy_float32_t *pressure,
                             cy_float32_t *temperature);
// pressure: Pa; temperature: °C; either pointer may be NULL
```

Application sample type:

```c
typedef struct {
    float pressure;      // Pa from driver (see port normalization)
    float temperature;   // °C
} dps368_sample_t;
```

**RTOS note:** Init and blocking reads must run **after** the scheduler starts; the MTB layer uses `mtb_hal_system_delay_us` while waiting for data ready.

---

## 5. Firmware architecture (TESAIoT)

> **Embedded depth** — CM55 modules, scaling, and recovery.

### Layer map

| Layer | File | Responsibility |
|-------|------|----------------|
| Driver | `TESAIoT_Library/CM55/modules/sensors/sensor_dps368/sensor_dps368.c` | Init, read, state |
| Bitstream port | `.../bitstream/modules/sensor/src/bitstream_sensor_port_cm55_dps368.c` | hPa normalize, retries, re-init |
| BS2 pack | `.../bitstream/protocol/src/bitstream_bs_sensor.c` | `bs_pack_dps368_evt()` |
| UI feed | `bitstream_protocol_ui_set_dps368()` | On-device HMI (if enabled) |

### Initialization flow

1. `sensor_dps368_startup()` registers state store + event bus.
2. Wait for shared I²C ready (10 s timeout).
3. `mtb_xensiv_dps3xx_init_i2c(&s_dps368_obj, shared_hal, XENSIV_DPS3XX_I2C_ADDR_DEFAULT)` inside lock — up to **3 retries**, 20 ms apart.
4. Success → `SENSOR_STATE_READY`; failure → `SENSOR_STATE_ERROR`.

**Bitstream port init is fail-soft:** `bitstream_sensor_port_cm55_dps368_init()` calls startup but **does not block** the whole Bitstream link if DPS368 is slow to come up. Recovery continues in `is_ready()` / `read_sample()`.

### Read flow and unit normalization

1. `sensor_dps368_read()` → `xensiv_dps3xx_read()` → `pressure_pa`, `temperature_c`.
2. Port converts pressure to **hPa** with heuristic normalization (handles Pa / hPa / kPa variants):

```text
if pressure > 2000   → treat as Pa,  hPa = pressure / 100
else if pressure > 200 → treat as hPa, hPa = pressure
else                  → treat as kPa, hPa = pressure × 10
```

3. Wire integers:

```text
pressure_hpa_x10  = round(hPa × 10)   // uint16, clamped 0…65535
temperature_c_x100 = round(°C × 100)  // int16, clamped ±32767
```

4. `bs_pack_dps368_evt()` emits **PRESS → TMP** per mask.

### Recovery state machine (port-specific)

DPS368 has richer recovery than SHT40:

| Mechanism | Constant | Behavior |
|-----------|----------|----------|
| Read retries | `BITSTREAM_SENSOR_DPS368_READ_RETRIES` (3) | Retry transient I²C / not-ready |
| Re-init threshold | `READ_FAIL_REINIT_THRESHOLD` (5) | After 5 consecutive failures → `sensor_dps368_startup()` |
| Startup retry poll | `STARTUP_RETRY_POLL_INTERVAL` (100) | Backoff re-init in `is_ready()` |
| `is_ready()` | — | Returns `true` to avoid hard-blocking scheduler (read path still validates) |

Port return codes: **-1** null args, **-2** read failed after retries.

---

## 6. BS2 wire format and host decode

> **Embedded depth** — protocol and host TypeScript.

### Identity and mask

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `3` |
| **Mask PRESS** | `0x01` (`DPS368_MASK.PRESS`) |
| **Mask TMP** | `0x02` (`DPS368_MASK.TMP`) |
| **Default mask** | `0x03` (pressure + chip temp) |
| **EVT value order** | **PRESS**, then **TMP** — only bits set in mask |
| **Encoding** | `int16` little-endian per channel |
| **Pressure wireScale** | **10** — wire stores **hPa×10** |
| **Temperature wireScale** | **100** — wire stores **°C×100** |

Host decode (`extension/src/bitstream2/domains/sensors/dps368.ts`):

```typescript
export const DPS368_MASK = { PRESS: 0x01, TMP: 0x02 } as const;
// decoded.pressure_hpa_x10, decoded.temp_cx100
```

### Catalog fields (Bitstream Studio)

| Field key | Label | Unit | Range | wireScale |
|-----------|-------|------|-------|-----------|
| `pressureHpa` | Pressure | hPa | 300 … 1200 | 10 |
| `temperatureC` | Temperature | °C | −40 … 85 | 100 |

**Gauge hints** (catalog):

| Hint key | Range | Label |
|----------|-------|-------|
| `pressureSeaLevel` | 900 … 1100 hPa | Sea-level band |
| `pressureFull` | 300 … 1200 hPa | Full sensor range |

### Default SENSOR_CFG

| Field | Default | Meaning |
|-------|---------|---------|
| `enabled` | `true` | Stream when linked |
| `publishMode` | `periodic` | Emit on sampling tick |
| `mask` | `3` | Pressure + temp |
| `samplingIntervalMs` | `200` | 5 Hz |
| `publishIntervalMs` | `0` | Same as sampling |
| `deltaX100` | `0` | On-change threshold |
| `staleAfterMs` (host) | `600` | Stale if no sample in 600 ms |

### Worked wire example

Conditions: **1013.2 hPa**, **24.0 °C** chip temp, mask `0x03`.

| Channel | Physical | Wire scale | int16 (hex) |
|---------|----------|------------|-------------|
| PRESS | 1013.2 hPa | ×10 → 10132 | `0x2794` |
| TMP | 24.0 °C | ×100 → 2400 | `0x0960` |

Payload body (little-endian): `94 27 60 09` plus BS2 framing.

Host displays **1013.2 hPa** and **24.0 °C** after dividing by wireScale.

### Simulator parity

Simulator synthesizes gentle sine on `dps368.press` (~1013 hPa ± small drift) and `dps368.tmp`. Field keys match UART for dual-runtime parity.

---

## 7. Configuration and rate planning

### Workshop — settings that matter

| Setting | Pressure lab suggestion |
|---------|-------------------------|
| **Enabled** | On (disable only for temp-only labs) |
| **Sampling rate** | **1–5 s** for calm demos; default **200 ms** OK |
| **Publish mode** | **Periodic** — pressure is slow; **On change** with `deltaX100 ≈ 10` (~0.10 hPa) filters noise |
| **Telemetry channels** | **Pressure** required; **Temp** optional for compact UART |

Flow: adjust → **Apply** → confirm → deck updates.

### Embedded — timing

DPS368 uses **slow sensor** presets (`SLOW_SENSOR_SAMPLING_HZ_PRESETS`, same class as SHT40).

| Rate | intervalMs | Notes |
|------|------------|-------|
| 0.33 Hz | 3000 ms | Weather logging |
| 1 Hz | 1000 ms | Comfortable classroom default |
| 5 Hz | 200 ms | **Catalog default** |
| 10 Hz | 100 ms | Diminishing returns for baro; adds I²C load |

Each `xensiv_dps3xx_read()` blocks through conversion + I²C — budget alongside SHT40 (~10 ms) and BMI270 bursts.

**On-change:** `deltaX100 = 50` → **0.50 hPa** minimum change before publish (×0.01 rule).

**SENSOR_CFG under load:** Same as SHT40 — quiet the bus before cfg work; settle ~600 ms after SET (`BS_WIRE.md`).

---

## 8. From chip to screen

### Workshop — reading discipline

State three parts: **name**, **number**, **unit**.

*“Pressure is one thousand thirteen hectopascals.”*

**Sea-level bar mapping**

```text
percent = (pressureHpa − 900) ÷ (1100 − 900) × 100
(capped at 0% and 100%)
```

| Reading | Workshop range | Example | Bar |
|---------|----------------|---------|-----|
| Pressure | 900–1100 hPa | 1013 hPa | ~56% |
| Pressure | 300–1200 hPa (full) | 1013 hPa | ~72% |

Use **900–1100 hPa** for weather narrative; use **300–1200** only when teaching full sensor span.

**Connection states** — same as [SENSOR_THEORY.md](../SENSOR_THEORY.md): live, offline, stale. Pressure should not jump wildly in a still room; sudden spikes suggest decode or link issues, not weather.

### Embedded — end-to-end pipeline

```text
T0  xensiv_dps3xx_read → 101325 Pa, 24.0 °C
T1  sensor_dps368_read → float Pa, float °C in dps368_sample_t
T2  port normalize → 1013.25 hPa, temp_c_x100=2400, pressure_hpa_x10=10133
T3  bs_pack_dps368_evt → PRESS int16, TMP int16
T4  UART → broker → mapDps368Fields → { pressureHpa: 1013.3, temperatureC: 24 }
T5  Sensor Telemetry / Studio / Course widgets
```

**Do not confuse** SHT40 environmental temp with DPS368 **chip** temp — different physical meaning and sensor locations.

---

## 9. Hands-on labs (DevKit)

### Workshop labs

**Lab 1 — Sea-level baseline**

1. Link DevKit (**Bitstream** + **Link**).
2. Open **DPS368** in Sensor Telemetry.
3. **Expect:** pressure near **1000–1020 hPa** indoors; say “about one thousand hectopascals.”

**Lab 2 — Slow drift story**

1. Note pressure at session start.
2. Compare after lunch or HVAC cycle (if any).
3. **Expect:** small drift (often &lt; 1 hPa) — discuss weather / air mass, not sensor noise.

**Lab 3 — Weather strip with SHT40**

1. Enable **SHT40** and **DPS368** on the telemetry deck.
2. Place boards side by side in the same air.
3. **Expect:** climate (temp/RH) moves faster than pressure; narrate “room weather panel.”

**Lab 4 — Sea-level bar**

1. Open **Applications / Examples** or workshop `dps368-pressure-dashboard.html`.
2. Map **900–1100 hPa** on the bar; show numeric hPa beside percent.
3. **Expect:** ~1013 hPa → bar slightly above mid-scale.

**Lab 5 — Lift test (expect no drama)**

1. Rest on desk → note pressure.
2. Lift board ~50 cm for 30 s → return to desk.
3. **Expect:** no obvious change — use this to debunk “pressure as altitude meter at desk scale.”

### Embedded labs

**Lab 6 — UART probe**

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter `sensorId: 3`; verify PRESS wire ÷10 matches bench readout.

**Lab 7 — Mask pressure-only**

1. Disable **Temp** channel in telemetry mask, **Apply**.
2. Confirm EVT payload shrinks to one int16 (PRESS only).

**Lab 8 — Recovery observe (instructor)**

1. With logging enabled, induce transient read errors (brief I²C contention).
2. Watch port retry and optional re-init after 5 failures.

---

## 10. Build it in Bitstream Studio

### Workshop walkthroughs

**Sensor Telemetry (WORKSHOP Ch2)**

1. Locate **DPS368** pressure (and optional chip temp).
2. Study pressure bar example; show **900–1100 hPa** band in meta copy.

**Sensor Studio (WORKSHOP Ch4)**

1. Add **DPS368** sensor node.
2. Wire **pressure** → **Radial Gauge** or numeric readout.
3. Optional: **Map Range** 900–1100 → 0–100 for dashboard gauge fill.
4. Save and reload flow.

**Weather strip (WORKSHOP Ch5)**

Side-by-side **SHT40** (temp + humidity) and **DPS368** (pressure) on one stage.

**Course Studio (WORKSHOP Ch6)**

Manometer column or pressure ring infographic; workshop accent **`#5eb8f5`** (cool blue).

### Embedded — external dashboards

| Item | Value |
|------|-------|
| Provider WebSocket | `ws://127.0.0.1:9997` |
| Sensor id | `dps368` |
| Primary field | `pressureHpa` |
| Secondary field | `temperatureC` (chip) |
| Example HTML | `extension/docs/workshop/examples/dps368-pressure-dashboard.html` |
| Generator prompt | `extension/docs/workshop/prompts/SENSOR_DPS368.md` |

---

## 11. Real-world use cases

### Workshop stories

| Domain | Why DPS368 |
|--------|------------|
| **Weather stations** | Local barometric trend input |
| **Altitude / floor hint** | Drones, wearables — pressure altimetry (needs calibration) |
| **HVAC / building** | Indirect air-density and weather context |
| **Leak / overpressure** | Wide 300–1200 hPa range (advanced; not typical intro lab) |

### Embedded product notes

- **Altimeter:** Convert pressure to altitude with **sea-level reference** and temperature compensation — requires calibration, not raw hPa alone.
- **Power:** 1 Hz often enough for weather; burst to 5 Hz during active UI session only.
- **Enclosure:** Provide a **vent** to ambient if the product case is sealed.
- **Pair with SHT40:** Minimal environmental gateway without IMU — temp, RH, pressure for agriculture and building IoT.

---

## 12. Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Pressure didn’t change when I lifted the board. | Correct for desk height — altitude effect is ~0.12 hPa per metre near sea level. |
| Why two temperatures (SHT40 vs DPS368)? | SHT40 ≈ air near chip; DPS368 temp is **die temp** for compensation. |
| Simulator vs DevKit? | Same fields; DevKit shows real room pressure. |

### Embedded debug table

| Symptom | Likely cause | What to check |
|---------|--------------|---------------|
| Init `0x…` error | Wrong address, I²C not ready | `0x77` vs `0x76`, manager ready |
| Port `-2` after retries | `DATA_NOT_READY`, bus contention | Lock held too long by other task |
| Pressure ~10× wrong | Unit normalize path | Raw Pa vs hPa in `sample.pressure` |
| Pressure stuck | EVT stopped / stale link | `staleAfterMs`, USB |
| Repeated re-init | 5 fail threshold tripping | Power, wiring, oversampling too aggressive |
| CFG timeout | UART saturated | Slow other sensors; retry SET |

---

## 13. Knowledge check

1. What is the primary quantity the DPS368 measures for workshop demos?
2. What unit does Bitstream Studio use for pressure?
3. Map **1013 hPa** to a bar with range **900–1100 hPa**.
4. What is the BS2 sensorId for DPS368?
5. In what order are PRESS and TMP packed when mask is `0x03`?
6. What is `wireScale` for `pressureHpa`?
7. What I²C address does TESAIoT use by default?
8. Why does the port normalize pressure with Pa / hPa / kPa heuristics?
9. What does port return code **-2** mean?
10. Why is lifting the board a poor altitude demo?

### Answers

1. **Barometric pressure** (air pressure around the board).
2. **hPa** (hectopascals).
3. `(1013 − 900) / (1100 − 900) × 100` ≈ **56.5%**.
4. **3**.
5. **PRESS**, then **TMP**.
6. **10** (wire value is hPa×10).
7. **0x77**.
8. Driver returns **Pa**; upstream variants must map safely to hPa for consistent wire encoding.
9. Read failed after bounded retries in the bitstream sensor port.
10. Desk-height change is far too small to show a clear pressure delta; teach weather band instead.

---

## 14. Instructor and maintainer notes

- **Timing:** Pressure labs are calm — pair with SHT40 motion labs for pacing.
- **Narrative:** “~1013 hPa at sea level” is the anchor phrase for Ch2 and Ch6.
- **Simulator:** Gentle drift only — pressure should not jump like IMU accel.
- **Firmware deep dive:** `TESAIoT_Library/docs/DPS368_ANALYSIS.md` for register map and build flags.
- **Cross-chapter:** Weather strip is the bridge to [CH1_SHT40.md](./CH1_SHT40.md) and preview of multi-sensor dashboards in WORKSHOP Ch5–6.

---

## 15. Summary and quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | “What is the air pressure around the board?” |
| Primary reading | Barometric pressure |
| Unit | hPa |
| Sea-level band | 900–1100 hPa (~1013 normal) |
| Secondary | Chip temperature (°C) |
| Try it | Baseline → weather strip with SHT40 |
| Studio apps | Sensor Telemetry, Sensor Studio, Course Studio |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `3` |
| I²C address | `0x77` (Bus 1, 1.8 V) |
| Mask / default | `0x03` (PRESS + TMP) |
| EVT order | PRESS → TMP |
| Pressure wire | int16 LE, **hPa×10**, wireScale **10** |
| Temp wire | int16 LE, **°C×100**, wireScale **100** |
| Field keys | `pressureHpa`, `temperatureC` |
| Default sample interval | 200 ms (5 Hz) |
| staleAfterMs | 600 |
| Driver | `sensor_dps368.c` |
| Host decode | `extension/src/bitstream2/domains/sensors/dps368.ts` |
| Port extras | Read retries, fail-soft init, re-init after 5 failures |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [SENSOR_THEORY.md](../SENSOR_THEORY.md) | Shared core ideas + chapter index |
| [CH1_SHT40.md](./CH1_SHT40.md) | Climate pair for weather strip |
| [CH3_BMI270.md](./CH3_BMI270.md) | IMU / motion chapter |
| [prompts/SENSOR_DPS368.md](../prompts/SENSOR_DPS368.md) | HTML dashboard generator prompt |

*Developer catalog API: `extension/docs/bitstream-telemetry-provider/` — optional for workshop track.*
