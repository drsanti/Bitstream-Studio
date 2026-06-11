# BMI270 — Hardware, firmware & BS2 wire

Embedded depth — I²C integration, output profiles, fusion feed vs telemetry, and host decode.

---

## Hardware design (DevKit)

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x68** default (`MTB_BMI270_ADDRESS_DEFAULT`); alt **0x69** |
| **Kit placement** | AI kit **U18**; Eval kit **U5** |
| **Voltage / pins** | Bus 1 — SCB0, P8[0] SCL, P8[1] SDA, **1.8 V** |

### Shared bus

BMI270 shares Bus 1 with **SHT40**, **DPS368**, and (on AI kit) **BMM350**. IMU at **50–100 Hz** dominates I²C time — plan slow-sensor intervals accordingly.

### Transducer ranges (driver)

| Axis | TESAIoT config | Conversion |
|------|----------------|------------|
| Accel | **±2 g** | LSB → m/s² via `GRAVITY_EARTH` (9.80665) |
| Gyro | **±2000 °/s** | LSB → rad/s via `DEG_TO_RAD` |
| Temp | Bosch BMI2 formula | `((int16_t)raw) / 512.0 + 23.0` °C |

---

## Output profiles and stream modes

Host presets map to firmware stream mode + SENSOR_CFG mask.

| Profile | Label | Stream mode | Mask (hex) | Channels in telemetry |
|---------|-------|-------------|------------|------------------------|
| **Raw** | Raw | `raw` | `0x07` | Accel X/Y/Z, Gyro X/Y/Z, chip temp |
| **Fusion** | Fusion | `fusion` | `0x18` | Heading, pitch, roll, quaternion |
| **All** | All | `hybrid` | `0x1f` | Alternating **raw group** and **fusion group** |

Mask bit definitions:

| Bit | Name | Value | Payload |
|-----|------|-------|---------|
| ACC | Accelerometer | `0x01` | 3 × int16 (X, Y, Z) |
| GYR | Gyroscope | `0x02` | 3 × int16 |
| TMP | Temperature | `0x04` | 1 × int16 |
| EULER | Fusion Euler | `0x08` | 3 × int16 (heading, pitch, roll) |
| QUAT | Fusion quaternion | `0x10` | 4 × int16 |

**Firmware stream modes** (`bitstream_bmi270_runtime.h`):

```c
#define BITSTREAM_BMI270_STREAM_MODE_RAW    (0U)
#define BITSTREAM_BMI270_STREAM_MODE_FUSION (1U)
#define BITSTREAM_BMI270_STREAM_MODE_HYBRID (2U)
```

Host applies profile via **SENSOR_CFG** mask + **`BMI270_MODE_SET`** (REQ `0x14` / GET `0x15`). Always **Apply** both mask and mode.

**Hybrid / All caveat:** UART frames **alternate** raw-heavy and fusion-heavy payloads — not all 14 scalars every EVT.

---

## Firmware architecture

| Layer | File | Role |
|-------|------|------|
| Driver | `sensor_bmi270.c` | `mtb_bmi270_init_i2c`, read, LSB→SI |
| Runtime | `bitstream_bmi270_runtime.c` | Mode, fusion feed tick, EVT pack |
| BS2 sensor | `bitstream_bs_sensor.c` | Publish scheduling |
| Fusion IPC | CM33 BSXLite bridge | Orientation from acc/gyr feed |

### Fusion feed vs telemetry (critical)

| Path | Default cadence | On UART? |
|------|-----------------|----------|
| **Fusion feed** | **10 ms** (`FUSION_FEED_SET` `0x16`/`0x17`) | No — feeds CM33 BSX only |
| **Telemetry** | `samplingIntervalMs` (default **20 ms** = 50 Hz) | Yes — `EVT_SENSOR` |

`fusion_tick` performs a **fresh IMU read** before pushing acc/gyr to CM33. Euler/quaternion in EVT reflect the **latest fusion result** at **publish** time, not every 10 ms feed tick.

Fusion feed interval bounds: **10–100 ms**.

### EVT pack order

`decodeBmi270Values()` canonical order (only set mask bits):

```text
ACC(3) → GYR(3) → TMP(1) → EULER(3) → QUAT(4)
```

Full mask `0x1f` with fusion available → **14** int16 values per frame.

---

## BS2 wire format and host decode

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `0` |
| **Default mask** | `0x1f` |
| **Default samplingIntervalMs** | `20` (50 Hz) |
| **staleAfterMs** | `500` |

### Wire scales

| Field group | Keys | wireScale | Notes |
|-------------|------|-----------|-------|
| Accel | `accelX`, `accelY`, `accelZ` | 100 | m/s² × 100 |
| Gyro | `gyroX`, `gyroY`, `gyroZ` | 100 | rad/s × 100 |
| Temp | `temperatureC` | 100 | °C × 100 |
| Euler | `headingRad`, `pitchRad`, `rollRad` | 100 | rad × 100 |
| Quaternion | `quatW`, `quatX`, `quatY`, `quatZ` | 10000 | W: unsigned bucket |

### Worked example — flat board, Raw profile (mask `0x07`)

Approximate: accel (0, 0, 9.8) m/s², gyro (0, 0, 0), temp 25 °C.

| Channel | Physical | ×100 | int16 |
|---------|----------|------|-------|
| accZ | 9.8 m/s² | 980 | 980 |
| gyr X/Y/Z | 0 | 0 | 0 |
| temp | 25 °C | 2500 | 2500 |

### REQ commands (BMI270-specific)

| REQ | Purpose |
|-----|---------|
| `0x14` / `0x15` | BMI270_MODE_SET / GET |
| `0x16` / `0x17` | FUSION_FEED_SET / GET |

Plus shared **SENSOR_CFG** GET/SET for enable, mask, rates, publish mode.

---

## Rate planning

| Rate | intervalMs | UART load |
|------|------------|-----------|
| 20 Hz | 50 ms | Moderate |
| 50 Hz | 20 ms | **Catalog default** |
| 100 Hz | 10 ms | High — stress test |

At 50 Hz with mask `0x1f`, UART carries large EVT bodies — disable unused channels or use **Raw** `0x07` for busier multi-sensor setups.

---

## Authoritative references

| Doc | Path |
|-----|------|
| EVT layout + fusion feed | `TESAIoT_Library/CM55/modules/bitstream/docs/BS_WIRE.md` |
| Host decode | `extension/src/bitstream2/domains/sensors/bmi270.ts` |
| Output presets (host) | `extension/src/webview/bitstream-app/lib/bmi270OutputProfiles.ts` |
