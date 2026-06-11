# BMM350 — Hardware, firmware & BS2 wire

Embedded depth — I3C integration, Bosch driver, axis cache, EVT pack, and host decode.

---

## Sensing principle

The BMM350 uses Bosch **TMR (tunnel magnetoresistance)** technology with factory trim/OTP coefficients. The driver returns calibrated **µT** on X/Y/Z plus temperature in °C.

| Quantity | Driver output | Wire |
|----------|---------------|------|
| mag X/Y/Z | float µT | int16 × 100 per axis |
| temperature | float °C | int16 × 100 |

**Hard/soft iron:** PCB, battery, and enclosure steel bias the field. Product compass fusion (IMU + mag + calibration) is out of scope for this workshop — BMI270 fusion heading and BMM350 mag are taught **separately**.

---

## Hardware design (DevKit)

### Bus and placement (KIT_PSE84_AI)

| Topic | AI kit (workshop hardware) |
|-------|----------------------------|
| **Interface** | **I3C** (dedicated controller — **not** shared I²C manager bus) |
| **Schematic ref** | **U20** |
| **Controller** | `CYBSP_I3C_CONTROLLER_*` (PSoC I3C block) |
| **Init** | `Cy_I3C_Init` + IRQ + `mtb_bmm350_init_i3c()` |
| **Static address** | `MTB_BMM350_ADDRESS_SEC` on I3C device struct |

**Eval kit note:** KIT_PSE84_EVAL uses **I2C** at **U4** — same BMM350 part, different bus wiring.

```text
  ┌──────────── CM55 ────────────┐
  │  I²C manager bus             │── BMI270, SHT40, DPS368
  │  (SCB0 / P8)                 │
  └──────────────────────────────┘

  ┌──────────── CM55 ────────────┐
  │  I3C controller (separate)   │── BMM350 (U20)
  └──────────────────────────────┘
```

Mag reads do **not** take the I²C manager mutex, but IMU + environmental sensors still share I²C bandwidth.

### Build flags

| Flag | Role |
|------|------|
| `MAG_BMM350_ENABLE=1` | Compile BMM350 sources |
| PREBUILD `bmm350_fix.bash` | Patch Bosch driver line that can break I3C after soft reset |

### Layout and interference

- Demo **above** the table when possible — steel surface biases the field.
- Keep **phone magnets**, speakers, and clamp leads away from U20.
- Strong permanent magnets can saturate readings — use small magnets briefly for "field jump" demos only.

---

## Chip protocol and driver behavior

### Bosch stack

| Layer | Location |
|-------|----------|
| **BMM350_SensorAPI** | Bosch driver v1.4.0 |
| **bmm350_core** | `mtb_bmm350_init_i3c`, `mtb_bmm350_read` |
| **sensor_bmm350** | Application startup/read + state store |

### Key API

```c
cy_rslt_t mtb_bmm350_init_i3c(mtb_bmm350_t *dev, void *i3c_hw,
                              void *i3c_context, void *i3c_device);

cy_rslt_t mtb_bmm350_read(mtb_bmm350_t *dev, mtb_bmm350_data_t *data);
// data.sensor_data: x, y, z (µT), temperature (°C)
```

### Read reliability

`sensor_bmm350_read()` retries `mtb_bmm350_read()` once on failure. Bitstream port adds up to **2** read attempts before returning **-2**.

---

## Firmware architecture

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

**Fail-soft:** port init keeps Bitstream link alive if mag is not ready; `is_ready()` can retry startup.

### Axis cache and EVT pack

```text
sensor_bmm350_read() → float µT
  → port scales ×100 → s_bmm350_last_mag_*
  → bs_pack_bmm350_evt: MAG(3) then TMP(1) per mask
```

Telemetry field keys for workshops are always **magX/magY/magZ** from EVT decode.

---

## BS2 wire format and host decode

### Identity and mask

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `1` |
| **Mask MAG** | `0x01` — all three axes together |
| **Mask TMP** | `0x02` |
| **Default mask** | `0x03` (mag + temp) |
| **EVT order** | **MAG X,Y,Z** → **TMP** |
| **Mag wireScale** | **100** — µT × 100 per axis |
| **Temp wireScale** | **100** — °C × 100 |

**Note:** MAG is one mask bit but payload is **three** int16 values (X, Y, Z).

Host decode: `extension/src/bitstream2/domains/sensors/bmm350.ts`

### Catalog fields

| Field key | Unit | Range |
|-----------|------|-------|
| `magX`, `magY`, `magZ` | µT | −1000 … 1000 |
| `temperatureC` | °C | −40 … 85 |

**Gauge hints:** `magAxis` ±100 µT; `magMagnitude` 0–100 µT (Earth |B| band).

### Worked wire example

Field ~40 µT on X, ~10 µT on Y, ~45 µT on Z, temp 26 °C, mask `0x03`.

| Channel | Physical | ×100 | int16 |
|---------|----------|------|-------|
| magX | 40 µT | 4000 | 4000 |
| magY | 10 µT | 1000 | 1000 |
| magZ | 45 µT | 4500 | 4500 |
| temp | 26 °C | 2600 | 2600 |

Host displays **40.0 µT**, etc., after ÷100.

### Default SENSOR_CFG

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `publishMode` | `periodic` |
| `mask` | `3` |
| `samplingIntervalMs` | `100` (10 Hz) |
| `staleAfterMs` (host) | `500` |

---

## Configuration and rate planning

| Rate | intervalMs | Notes |
|------|------------|-------|
| 10 Hz | 100 ms | **Catalog default** |
| 20 Hz | 50 ms | Responsive rotation UI |
| 50–100 Hz | 20–10 ms | Higher I3C + UART load |

Mag + BMI270 at high rate together can stress UART — trim unused channels on other sensors during mag-heavy labs.

---

## From chip to screen (embedded pipeline)

```text
I3C read → float µT in bmm350_sample_t
  → port ×100 → axis cache
  → bs_pack_bmm350_evt → 3× int16 + temp
  → host mapBmm350Fields → magX/magY/magZ
  → Sensor Telemetry / Studio / Course / HTML dashboard
```

Simulator synthesizes sine on `bmm350.mag.x/y/z` within ±50 µT class swing — same field keys as UART.

---

## Related

- **Overview** topic — vector narrative, Earth band, indoor compass limits
- **Reference** topic — FAQ, knowledge check, cheat sheets
- Workshop source: `extension/docs/workshop/sensor-theory/CH4_BMM350.md`
