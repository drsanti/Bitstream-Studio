# Chapter 1 — SHT40 (Temperature & Humidity)

**Audience:** Workshop trainees, instructors, and embedded developers (hardware + firmware).

**Hardware:** TESAIoT DevKit — on-board **SHT40** environmental sensor.

**Companion:** [WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) (Ch2, Ch4–6 demos) · [SENSOR_THEORY.md](../SENSOR_THEORY.md) (shared core ideas)

Each major section has two tracks:

| Track | Who | Focus |
|-------|-----|-------|
| **Workshop** | Trainees | Plain language, live demos, Bitstream Studio UI |
| **Embedded** | HW / FW engineers | Schematic, I²C, driver stack, BS2 wire, debug |

---

## 1. Introduction

### Workshop

The **SHT40** answers one question on the DevKit: *“How warm and how moist is the air near the board?”*

It reports two scalar readings:

- **Air temperature** at the chip (°C)
- **Relative humidity** (%RH) — how much moisture the air holds compared to the maximum it could hold at that temperature

**Learning outcomes**

After this chapter you should be able to:

1. Explain what temperature and relative humidity mean in plain language.
2. Read live SHT40 values in **Sensor Telemetry** and name value + unit aloud.
3. Map humidity (or temperature) to a 0–100% progress bar using a chosen range.
4. Run hands-on climate labs on the DevKit and predict which reading moves.
5. *(Embedded)* Trace a sample from I²C through firmware to `EVT_SENSOR` and host decode.

**Where this chapter fits**

| Workshop chapter | SHT40 role |
|------------------|------------|
| **Ch2** — Sensor Telemetry | Live temp/humidity readouts; humidity progress bar |
| **Ch4** — Sensor Studio | SHT40 node → gauge; optional °C → °F **Math** node |
| **Ch5** — Pipelines | Weather strip with SHT40 + DPS368 |
| **Ch6** — Course Studio | Thermometer / droplet widgets on a lesson page |

### Embedded

| Item | Value |
|------|--------|
| **Part** | SHT40 (Sensirion) — digital humidity + temperature |
| **Kit** | **KIT_PSE84_AI** only (not on KIT_PSE84_EVAL) |
| **Schematic ref** | U22 |
| **BS2 sensorId** | `2` (`BS2_SENSOR_ID.SHT40`) |
| **Catalog id** | `sht40` |

**Software stack (five layers)**

```text
SHT40 chip (I²C 0x44)
  → Sensirion sht4x driver + platform HAL
  → sensor_sht40 (TESAIoT CM55 module)
  → bitstream_sensor_port_cm55_sht40
  → bitstream_bs_sensor — bs_pack_sht40_evt()
  → UART BS2 frame → host decodeSht40Values() → Bitstream Studio UI
```

**Authoritative references (outside this repo)**

| Doc | Path |
|-----|------|
| SHT40 integration analysis | `TESAIoT_Library/docs/SHT40_ANALYSIS.md` |
| EVT_SENSOR wire layout | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| Host SENSOR_CFG | `extension/src/bitstream2/docs/SENSOR_CFG_V2.md` |
| Host decode | `extension/src/bitstream2/domains/sensors/sht40.ts` |

---

## 2. Physical principles

### Workshop — temperature

**Temperature** measures how hot or cold something is. On the SHT40 it is **air temperature at the chip**, in **degrees Celsius (°C)**.

Warmer air means faster molecular motion. When you cup the board, your hands transfer heat; the reading drifts up over several seconds.

Typical indoor workshop band: **20–30 °C**. The sensor catalog allows **−40 … 125 °C**, but classroom dashboards usually map **0–50 °C** so the bar is readable.

### Workshop — relative humidity

**Relative humidity (%RH)** is *not* “how many millilitres of water are in the air.” It is the **percentage of saturation** at the current temperature.

Think of warm air as a bigger sponge: it can hold more water vapour. **62 %RH** means the air holds 62% of the maximum it could hold at that temperature.

Important coupling: if temperature rises and moisture stays the same, **%RH often drops** because the “sponge” grew. Trainees should expect temp and RH to move together in some demos.

Comfort band for people and many stored goods: roughly **30–60 %RH**. Below ~30% feels dry; above ~70% encourages mould in long-term storage.

**Dew point (teaser):** When RH reaches 100% at a given temperature, water condenses (fog, condensation on cold surfaces). Cold-chain and museum labs care about staying below that point.

### Embedded — sensing elements

| Quantity | Element | Mechanism |
|----------|---------|-----------|
| **Temperature** | Band-gap / silicon junction | Junction voltage vs temperature; factory-calibrated in chip |
| **Humidity** | Capacitive polymer dielectric | Water absorption changes capacitance; converted to %RH |

**Datasheet conversion** (from raw 16-bit ticks returned by the chip):

```text
T (°C)  = (175 × T_ticks / 65535) − 45
RH (%RH) = (125 × RH_ticks / 65535) − 6
```

The Sensirion driver performs this internally and exposes **millidegrees** and **milli-%RH** (e.g. `25000` → 25.000 °C, `62000` → 62.0 %RH).

**Spec sheet (typical, high-precision mode)**

| Parameter | Typical | Notes |
|-----------|---------|-------|
| Temperature accuracy | ±0.2 °C | At 25 °C |
| Humidity accuracy | ±1.8 %RH | At 25 °C, 33–75 %RH |
| Resolution | 0.01 °C / 0.01 %RH | After ÷100 wire scale |
| Response time τ63 | ~3–4 s (humidity) | Air must reach the sensor opening |
| Repeatability | ±0.1 °C / ±0.8 %RH | Short-term, same conditions |

**Accuracy vs resolution vs repeatability**

- **Accuracy** — how close to a reference standard.
- **Resolution** — smallest step the digital output can represent.
- **Repeatability** — how stable readings are when conditions do not change.

### Embedded — thermal and self-heating

The SHT40 sits on the PCB next to the MCU and other sensors. The board has **thermal mass**: it warms and cools slower than free air. Readings lag real air changes by seconds.

Frequent high-precision I²C reads (~10 ms each) add a small **self-heating** effect if the sensor is in a still, enclosed volume. For climate logging, **1–5 Hz** is usually enough; faster sampling is for responsive UI, not metrology.

---

## 3. Hardware design (DevKit integration)

> **Embedded depth** — hardware and PCB integration.

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x44** (default) or **0x45** (ADDR pin high) |
| **TESAIoT default** | `SHT40_I2C_ADDR_44` (`0x44`) |
| **Voltage** | **1.8 V** I²C domain (SCB0 / P8) |
| **Pins** | P8[0] SCL, P8[1] SDA |

### Shared bus with BMI270

The SHT40 shares **Bus 1 (SCB0)** with the **BMI270** IMU on the same DevKit. All transactions must go through the **I²C manager**:

```text
cm55_i2c_manager_i2c_lock()
  → I²C transfer (SHT40 or BMI270)
cm55_i2c_manager_i2c_unlock()
```

Never call the Sensirion driver from two tasks without the manager lock. A high-precision SHT40 measurement holds the bus for **~10 ms** including conversion wait — plan IMU reads around that.

```text
        ┌──────────────┐
        │  PSoC CM55   │
        │  I²C manager │
        └──────┬───────┘
               │ Bus 1 (1.8 V)
       ┌───────┴───────┐
       │               │
   ┌───▼───┐      ┌────▼────┐
   │ SHT40 │      │ BMI270  │
   │  U22  │      │  (IMU)  │
   └───────┘      └─────────┘
```

### Layout and mechanical

- Place the sensor where **ambient air** can reach the opening; avoid sealing it against a hot copper pour or under a battery.
- Keep away from direct MCU exhaust or LDO heat if RH accuracy matters.
- Standard ESD handling; the assembled module is robust in normal lab use.

### Power

Decouple per schematic (typically 100 nF + bulk near the sensor). No separate enable GPIO — chip is always powered when the board is on.

---

## 4. Chip protocol and measurement modes

> **Embedded depth** — Sensirion command set and transaction timing.

### Commands (single-byte)

| Command | Mode | Typical conversion time |
|---------|------|-------------------------|
| `0xFD` | High precision | ~10 ms |
| `0xF6` | Medium precision | ~5 ms |
| `0xE0` | Lowest precision | ~2 ms |
| `0x94` | Soft reset | — |
| `0x89` | Read serial number | 4 data bytes |

**TESAIoT production path:** `sht4x_measure_high_precision()` — best accuracy for workshop and telemetry.

### Transaction sequence

1. **Write** command byte to I²C address.
2. **Wait** for conversion (driver uses `sensirion_i2c_hal_sleep_usec`).
3. **Read** 4 bytes: `T_ticks[15:0]`, `T_CRC`, `RH_ticks[15:0]`, `RH_CRC`.
4. Driver validates CRC; returns millidegrees / milli-%RH or an error code.

### Driver API (application layer)

```c
void sht4x_init(uint8_t i2c_address);   // e.g. 0x44

int16_t sht4x_measure_high_precision(int32_t *temperature, int32_t *humidity);
// temperature: millidegrees C; humidity: milli-%RH; 0 = success
```

The TESAIoT wrapper `sensor_sht40_read()` converts to float °C and %RH in `sht40_sample_t`:

```c
typedef struct {
    float temperature;   // °C
    float humidity;      // %RH
} sht40_sample_t;
```

---

## 5. Firmware architecture (TESAIoT)

> **Embedded depth** — CM55 modules and data scaling.

### Layer map

| Layer | File | Responsibility |
|-------|------|----------------|
| Driver | `TESAIoT_Library/CM55/modules/sensors/sensor_sht40/sensor_sht40.c` | Init, read, state machine |
| Bitstream port | `.../bitstream/modules/sensor/src/bitstream_sensor_port_cm55_sht40.c` | Fixed-point scaling for BS2 |
| BS2 pack | `.../bitstream/protocol/src/bitstream_bs_sensor.c` | `bs_pack_sht40_evt()` |
| UI feed | `bitstream_protocol_ui_set_sht40()` | On-device HMI (if enabled) |

### Initialization flow

1. `sensor_sht40_startup()` registers with `sensor_state_store` and `sensor_event_bus`.
2. Wait up to 10 s for `cm55_i2c_manager_wait_shared_i2c_ready()`.
3. `sensirion_i2c_hal_init()` + `sht4x_init(SHT40_I2C_ADDR_44)`.
4. **Probe read** — up to 3 attempts, 20 ms apart; failure → `SENSOR_STATE_ERROR`.
5. Success → `SENSOR_STATE_READY`, log `SHT40 ready`.

`bitstream_sensor_port_cm55_sht40_init()` is idempotent; CM55 init already calls startup.

### Read flow

1. `sensor_sht40_read(&sample)` → `sht4x_measure_high_precision()`.
2. Milli values ÷ 1000 → float in `sample.temperature`, `sample.humidity`.
3. Port scales to wire integers:

```text
temperature_c_x100 = round(sample.temperature × 100)   // int16, clamped ±32767
humidity_pct_x100  = round(sample.humidity × 100)     // uint16, clamped 0…65535
```

4. `bs_pack_sht40_evt()` appends channels in order **TEMP → HUM** according to `cfg.mask`.
5. Frame transmitted as `EVT_SENSOR` on UART @ **921600** baud (BS2).

### State and events

| API | Use |
|-----|-----|
| `sensor_sht40_is_ready()` | Bitstream port readiness gate |
| `sensor_sht40_get_state()` | `READY` / `ERROR` / etc. |
| `sensor_sht40_get_last_result()` | Last `cy_rslt_t` for debug |
| `sensor_sht40_subscribe_events()` | Data-ready callbacks on event bus |

On read failure the driver sets `SENSOR_STATE_ERROR` and returns `false`; the port returns **-2**.

---

## 6. BS2 wire format and host decode

> **Embedded depth** — protocol and host TypeScript.

### Identity and mask

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `2` |
| **Mask TEMP** | `0x01` (`SHT40_MASK.TEMP`) |
| **Mask HUM** | `0x02` (`SHT40_MASK.HUM`) |
| **Default mask** | `0x03` (both channels) |
| **EVT value order** | TEMP, then HUM — only bits set in mask |
| **Encoding** | `int16` little-endian per channel |
| **wireScale** | `100` — host divides by 100 for display |

Host mask constants (`extension/src/bitstream2/domains/sensors/sht40.ts`):

```typescript
export const SHT40_MASK = { TEMP: 0x01, HUM: 0x02 } as const;
```

### Catalog fields (Bitstream Studio)

| Field key | Label | Unit | Range |
|-----------|-------|------|-------|
| `temperatureC` | Temperature | °C | −40 … 125 |
| `humidityPct` | Humidity | %RH | 0 … 100 |

### Default SENSOR_CFG (firmware + catalog)

| Field | Default | Meaning |
|-------|---------|---------|
| `enabled` | `true` | Stream when linked |
| `publishMode` | `periodic` | Emit on sampling tick |
| `mask` | `3` | Temp + humidity |
| `samplingIntervalMs` | `200` | 5 Hz internal sample |
| `publishIntervalMs` | `0` | Same as sampling |
| `deltaX100` | `0` | On-change threshold (0 = use firmware default) |
| `minPublishIntervalMs` | `0` | No extra publish floor |
| `staleAfterMs` (host) | `600` | UI stale if no sample in 600 ms |

Full SENSOR_CFG schema: `extension/src/bitstream2/docs/SENSOR_CFG_V2.md`.

### Worked wire example

Room conditions: **24.50 °C**, **62.00 %RH**, mask `0x03`.

| Channel | Physical | ×100 | int16 (hex) |
|---------|----------|------|-------------|
| TEMP | 24.50 °C | 2450 | `0x0992` |
| HUM | 62.00 %RH | 6200 | `0x1838` |

Payload bytes (little-endian): `92 09 38 18` plus BS2 framing, CRC, and `EVT_SENSOR` header.

Host decode divides by 100 → `24.5` and `62.0` in the telemetry provider JSON.

### Simulator parity

The external **bitstream-simulator** synthesizes `sht40.temp` and `sht40.hum` channels with sine waves when no DevKit is connected. Field keys and mask layout match UART so the same UI and HTML dashboards work in both modes.

---

## 7. Configuration and rate planning

### Workshop — settings that matter

In **Sensor Telemetry**, open the **SHT40** card:

| Setting | Climate lab suggestion |
|---------|------------------------|
| **Enabled** | On |
| **Sampling rate** | **1–2 s** (slow, easy to read) or default **200 ms** for lively demos |
| **Publish mode** | **Periodic** for steady traces; **On change** to reduce USB traffic |
| **On-change sensitivity** | ~**100** in `deltaX100` → ~1.00 °C / %RH step before emit |
| **Telemetry channels** | Both **Temp** and **Humidity** enabled |

Flow: adjust → **Apply** → device confirms → live deck matches new settings.

### Embedded — timing and bus budget

SHT40 is classified as a **slow sensor** in the host UI (`SLOW_SENSOR_SAMPLING_HZ_PRESETS`: 0.33–20 Hz).

| Rate | intervalMs | I²C load (approx.) |
|------|------------|---------------------|
| 0.5 Hz | 2000 ms | Low — good for logging |
| 1 Hz | 1000 ms | Comfortable default for climate |
| 5 Hz | 200 ms | **Catalog default** |
| 10 Hz | 100 ms | Responsive UI; watch bus sharing with BMI270 |

Each high-precision read ≈ **10 ms** blocked I²C time. At 10 Hz on SHT40 alone that is ~10% bus duty; add IMU at 50–100 Hz and plan intervals carefully.

**Publish decimation:** Set `publishIntervalMs` > `samplingIntervalMs` to sample internally but emit EVT less often (saves UART bandwidth).

**On-change / hybrid:** `deltaX100` is threshold × **0.01**. Example: `deltaX100 = 150` → 1.50 %RH (or °C) change required before publish.

**SENSOR_CFG under load:** When many sensors stream fast, REQ/RES may delay. Before cfg-only work: disable unused sensors or set `samplingIntervalMs` ≥ **500 ms**, **Apply**, wait **~600 ms**, then retry GET/SET if needed (`BS_WIRE.md` § Configuration access).

---

## 8. From chip to screen

### Workshop — reading discipline

Bitstream Studio never shows a bare number without context. Always state three parts:

- **Name** — “Humidity”
- **Number** — `62`
- **Unit** — `%RH`

Say aloud: *“Humidity is sixty-two percent.”*

**Map to a progress bar**

```text
percent = (value − minimum) ÷ (maximum − minimum) × 100
(capped at 0% and 100%)
```

| Reading | Workshop range | Example value | Bar |
|---------|------------------|---------------|-----|
| Humidity | 0–100 %RH | 62 %RH | 62% |
| Temperature | 0–50 °C | 25 °C | 50% |

Humidity already spans 0–100; the bar can match the number directly. Temperature needs an explicit lesson range.

**Connection states**

| State | Meaning |
|-------|---------|
| **Live** | DevKit or Simulator linked; values change when the world changes |
| **Offline** | Not connected |
| **Stale** | Link lost; last value may still display but is **old** |

If the board is moving and the number is frozen, treat the display with suspicion.

### Embedded — end-to-end pipeline

```text
Time T0  sht4x_measure_high_precision → 24500 md°C, 62000 md%RH
Time T1  sensor_sht40_read → 24.5f °C, 62.0f %RH
Time T2  port → temp_c_x100=2450, hum_pct_x100=6200
Time T3  bs_pack_sht40_evt → int16[2] in EVT_SENSOR body
Time T4  UART → bridge → JSON sample { temperatureC: 24.5, humidityPct: 62 }
Time T5  Webview ingest → Sensor Telemetry / Studio / Course widgets
Time T6  stale timer — if no T4+ within 600 ms → mark stale
```

Scaling happens once at the port (float → ×100 int). The host **divides by wireScale 100** — do not double-scale in application code.

---

## 9. Hands-on labs (DevKit)

### Workshop labs

**Lab 1 — Warm-up (temperature)**

1. Link DevKit (**Bitstream** + **Link**).
2. Note baseline temperature in **Sensor Telemetry**.
3. Cup the board in both hands for **30 seconds**.
4. **Expect:** temperature rises **1–3 °C**; humidity may rise slightly from breath.

**Lab 2 — Dry air (humidity)**

1. Hold the board near a desk fan or AC vent (not too close to condensation).
2. **Expect:** humidity drifts **down slowly** over 30–60 s; temperature may dip slightly.

**Lab 3 — Steady room (periodic trace)**

1. Leave the board flat on the table.
2. Set **publish mode** to **Periodic**, sampling **1–2 s**.
3. **Expect:** gentle trace; small noise ±0.1 °C is normal.

**Lab 4 — Channel mask**

1. Open SHT40 **Telemetry channels**; disable **Humidity**, **Apply**.
2. **Expect:** only temperature updates in the deck.
3. Re-enable humidity and confirm both return.

### Embedded labs

**Lab 5 — UART probe**

From `extension/`:

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter for `sensorId: 2` / SHT40 in the output; confirm TEMP and HUM int16 values match hand warmth experiment (÷100).

**Lab 6 — Rate change**

1. Set `samplingIntervalMs` from **200** → **2000**, **Apply**, wait **≥600 ms**.
2. Count EVT rate (should drop to ~0.5 Hz).
3. Observe I²C / CPU headroom if you have bridge logging enabled.

**Lab 7 — Error path (instructor / advanced)**

Discuss what happens when `sensor_sht40_read()` fails: port returns **-2**, state → `ERROR`, last good sample may remain on screen until **stale** timeout. Recovery: power cycle or soft reset path in driver (`sht4x_soft_reset`).

---

## 10. Build it in Bitstream Studio

### Workshop walkthroughs

**Sensor Telemetry (WORKSHOP Ch2)**

1. Open telemetry deck with DevKit linked.
2. Locate **SHT40** temperature and humidity.
3. Add or study a dual progress bar (see **Applications / Examples** humidity bar).
4. Show value, unit, and bar percent side by side.

**Sensor Studio (WORKSHOP Ch4)**

1. Add **SHT40** sensor node.
2. Wire **temperature** → **Radial Gauge** (°C live).
3. Insert **Math** node: °C → °F (`°F = °C × 9/5 + 32`).
4. Save flow; reload and verify.

**Weather strip (WORKSHOP Ch5)**

Place **SHT40** temperature beside **DPS368** pressure on one stage — preview for the four-sensor dashboard narrative.

**Course Studio (WORKSHOP Ch6)**

Embed thermometer / droplet infographic widgets bound to `temperatureC` and `humidityPct`. Use a consistent warm accent (workshop examples use `#5ee89a`).

### Embedded — external dashboards

| Item | Value |
|------|-------|
| Provider WebSocket | `ws://127.0.0.1:9997` |
| Sensor id | `sht40` |
| Field keys | `temperatureC`, `humidityPct` |
| Example HTML | `extension/docs/workshop/examples/sht40-climate-dashboard.html` |
| Generator prompt | `extension/docs/workshop/prompts/SENSOR_SHT40.md` |

Regenerate example HTML:

```bash
node extension/docs/workshop/scripts/generate-workshop-html.mjs
```

---

## 11. Real-world use cases

### Workshop stories

| Domain | Why SHT40 |
|--------|-----------|
| **HVAC / comfort** | Room temp + RH for occupant comfort and energy control |
| **Cold-chain** | Alert when temp or RH leaves safe band for food and pharma |
| **Cleanrooms / labs** | Humidity control for processes and static mitigation |
| **Greenhouses** | Crop climate monitoring |
| **Museums / archives** | Prevent mould (high RH) and brittle materials (very low RH) |

### Embedded product notes

- **Mounting:** Sensor must sense **ambient** air, not PCB temperature alone. Enclosure vents matter.
- **Thresholds:** Implement critical alarms in firmware for offline safety, or on host with `on_change` + `deltaX100` to save bandwidth.
- **Logging:** 0.33–1 Hz is typical for battery climate loggers; burst to 5 Hz only during calibration or UI session.
- **Pair with pressure:** SHT40 + DPS368 gives a minimal **weather station** without IMU — useful for environmental gateways.

---

## 12. Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Why don’t values change instantly? | PCB thermal mass and air flow delay; SHT40 is fast but the board and air volume are not. |
| Why did RH drop when I warmed the board? | Relative humidity is relative to temperature; warming expands the “sponge.” |
| Simulator vs DevKit? | Same fields and UI; DevKit proves real physics. |

### Embedded debug table

| Symptom | Likely cause | What to check |
|---------|--------------|---------------|
| Init probe failed | I²C not ready, wrong address, wiring | `sensor_sht40_get_state()`, manager logs, `0x44` vs `0x45` |
| Port returns `-2` | `sensor_sht40_read()` failed | `sensor_sht40_get_last_result()`, CRC / bus lock |
| Frozen UI value | EVT stopped, USB drop | Link state, `staleAfterMs` (600 ms) |
| RH jumps at temp step | Physics coupling | Expected; teach relative humidity |
| CRC / I²C errors | Noise, contention with BMI270 | Lock discipline, reduce parallel high-rate sensors |
| CFG SET timeout | UART saturated | Slow other sensors; interval ≥ 500 ms; retry |

**Caution:** Do not point a hot air gun at the sensor for demos — rapid thermal shock can confuse RH readings and is hard to interpret pedagogically.

---

## 13. Knowledge check

1. What two quantities does the SHT40 report on the DevKit?
2. What does **62 %RH** mean in plain language?
3. Map **25 °C** to a bar with range **0–50 °C**.
4. What are the BS2 mask bits for temperature and humidity?
5. In what order does `EVT_SENSOR` pack SHT40 channels when mask is `0x03`?
6. What is `wireScale` for SHT40 fields on the host?
7. What I²C address does TESAIoT firmware use by default?
8. Why must I²C transactions use `cm55_i2c_manager` lock on this board?
9. What does port return code **-2** mean?
10. Name one Industry 4.0 use case for temp + humidity monitoring.

### Answers

1. Air **temperature (°C)** and **relative humidity (%RH)**.
2. The air holds 62% of the maximum water vapour it could hold at the current temperature.
3. `(25 − 0) / (50 − 0) × 100` = **50%**.
4. TEMP = `0x01`, HUM = `0x02`.
5. **TEMP**, then **HUM**.
6. **100** — host divides wire int16 by 100.
7. **0x44**.
8. SHT40 shares Bus 1 with BMI270; lock prevents concurrent transfers and corruption.
9. `sensor_sht40_read()` failed in the bitstream sensor port.
10. Examples: HVAC comfort, cold-chain compliance, cleanroom humidity control, greenhouse climate.

---

## 14. Instructor and maintainer notes

- **Timing:** Allow ~5 minutes per workshop lab; full chapter content supports a **45–60 min** deep dive or split across Ch2 + Ch4.
- **Simulator fallback:** Toolbar **Simulator** + **Link** — synthetic sine on temperature and humidity; same field keys.
- **First sensor:** SHT40 is the gentlest intro (scalars, slow, intuitive physics) before IMU vectors and magnetometer distortion.
- **Firmware deep dive:** Point embedded trainees to `TESAIoT_Library/docs/SHT40_ANALYSIS.md` for HAL integration history and build flags.
- **Protocol changes:** Any wire or mask change must follow `extension/docs/BS2_PROTOCOL_INDEX.md` and sync firmware + simulator.

---

## 15. Summary and quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | “How warm and how moist is the air near the board?” |
| Readings | Temperature, Humidity |
| Units | °C, %RH |
| Workshop bar ranges | 0–50 °C, 0–100 %RH |
| Try it | Cup hands → temp up; fan → RH down |
| Studio apps | Sensor Telemetry, Sensor Studio, Course Studio |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `2` |
| I²C address | `0x44` (Bus 1, 1.8 V) |
| Mask / default | `0x03` (TEMP + HUM) |
| EVT order | TEMP → HUM |
| Wire encoding | int16 LE, scale ×100 |
| Field keys | `temperatureC`, `humidityPct` |
| Default sample interval | 200 ms (5 Hz) |
| staleAfterMs | 600 |
| Driver | `sensor_sht40.c` |
| Host decode | `extension/src/bitstream2/domains/sensors/sht40.ts` |
| Wire doc | `TESAIoT_Library/.../bitstream/docs/BS_WIRE.md` |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [SENSOR_THEORY.md](../SENSOR_THEORY.md) | Shared core ideas + chapter index |
| [WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) | Session plan and timing |
| [CH2_DPS368.md](./CH2_DPS368.md) | Barometric pressure chapter |
| [prompts/SENSOR_SHT40.md](../prompts/SENSOR_SHT40.md) | HTML dashboard generator prompt |

*Developer catalog API: `extension/docs/bitstream-telemetry-provider/` — optional for workshop track.*
