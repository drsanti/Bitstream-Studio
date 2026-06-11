# DPS368 — Hardware, firmware & BS2 wire

Embedded depth — I²C integration, unit normalization, port recovery, and host decode.

---

## Hardware design (DevKit)

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x77** default; **0x76** if SDO to GND |
| **TESAIoT default** | `0x77` |
| **Voltage** | **1.8 V** I²C domain (SCB0 / P8) |
| **Pins** | P8[0] SCL, P8[1] SDA |

### Shared bus

DPS368 shares **Bus 1 (SCB0)** with **BMI270**, **SHT40**, and other peripherals. All access through **I²C manager** lock/unlock — same discipline as SHT40.

```text
        ┌──────────────┐
        │  PSoC CM55   │
        │  I²C manager │
        └──────┬───────┘
               │ Bus 1 (1.8 V)
       ┌───────┼───────┐
   ┌───▼───┐ ┌─▼───┐ ┌─▼────┐
   │DPS368 │ │SHT40│ │BMI270│
   │  U6   │ │ U22 │ │ IMU  │
   └───────┘ └─────┘ └──────┘
```

### Layout notes

- Provide **airflow / vent** to ambient — sealed boxes do not track room weather.
- Keep away from direct fan blast onto the port hole for stable baseline demos.

---

## Chip protocol and measurement modes

Register-oriented model (unlike SHT40 single-byte commands):

| Area | Role |
|------|------|
| Measurement 0x00–0x05 | Pressure / temperature raw |
| Config 0x06–0x09 | Oversampling, measurement mode |
| Calibration 0x10+ | Coefficients inside driver |

**TESAIoT path:** `xensiv_dps3xx_read()` in default **command** configuration per call.

```c
cy_rslt_t xensiv_dps3xx_read(xensiv_dps3xx_t *obj, cy_float32_t *pressure,
                             cy_float32_t *temperature);
// pressure: Pa; temperature: °C; either pointer may be NULL
```

---

## Firmware architecture (TESAIoT)

| Layer | Responsibility |
|-------|----------------|
| `sensor_dps368.c` | Init, read, state |
| `bitstream_sensor_port_cm55_dps368.c` | hPa normalize, retries, re-init |
| `bitstream_bs_sensor.c` | `bs_pack_dps368_evt()` |

### Initialization

1. `sensor_dps368_startup()` registers state store + event bus.
2. Wait for shared I²C ready (10 s timeout).
3. `mtb_xensiv_dps3xx_init_i2c` at **0x77** — up to 3 retries, 20 ms apart.
4. Success → `SENSOR_STATE_READY`.

**Bitstream port init is fail-soft** — recovery continues in `is_ready()` / `read_sample()`.

### Unit normalization (port)

```text
if pressure > 2000   → treat as Pa,  hPa = pressure / 100
else if pressure > 200 → treat as hPa, hPa = pressure
else                  → treat as kPa, hPa = pressure × 10

pressure_hpa_x10  = round(hPa × 10)   // uint16
temperature_c_x100 = round(°C × 100)  // int16
```

### Recovery state machine

| Mechanism | Behavior |
|-----------|----------|
| Read retries | 3 attempts on transient I²C / not-ready |
| Re-init threshold | After 5 consecutive failures → `sensor_dps368_startup()` |
| Port return codes | **-1** null args, **-2** read failed after retries |

---

## BS2 wire format and host decode

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `3` |
| **Mask PRESS** | `0x01` |
| **Mask TMP** | `0x02` |
| **Default mask** | `0x03` |
| **EVT order** | **PRESS**, then **TMP** |
| **Pressure wireScale** | **10** (hPa×10) |
| **Temperature wireScale** | **100** |

### Catalog fields

| Field key | Label | Unit | Range |
|-----------|-------|------|-------|
| `pressureHpa` | Pressure | hPa | 300 … 1200 |
| `temperatureC` | Temperature | °C | −40 … 85 |

**Gauge hints:** `pressureSeaLevel` 900–1100 hPa; `pressureFull` 300–1200 hPa.

### Worked wire example

**1013.2 hPa**, **24.0 °C**, mask `0x03`.

| Channel | Wire value | int16 (hex) |
|---------|------------|-------------|
| PRESS | 10132 (×10) | `0x2794` |
| TMP | 2400 (×100) | `0x0960` |

Host decode: `extension/src/bitstream2/domains/sensors/dps368.ts`.

---

## Configuration and rate planning

| Setting | Pressure lab suggestion |
|---------|-------------------------|
| **Sampling rate** | 1–5 s for calm demos; default 200 ms OK |
| **Publish mode** | Periodic; on-change with `deltaX100 ≈ 10` (~0.10 hPa) |
| **Channels** | Pressure required; chip temp optional |

| Rate | intervalMs | Notes |
|------|------------|-------|
| 1 Hz | 1000 ms | Comfortable classroom default |
| 5 Hz | 200 ms | Catalog default |

---

## From chip to screen

**Reading discipline:** name + number + unit — *"Pressure is one thousand thirteen hectopascals."*

**Sea-level bar mapping:**

```text
percent = (pressureHpa − 900) ÷ (1100 − 900) × 100
```

| Reading | Workshop range | Example | Bar |
|---------|----------------|---------|-----|
| Pressure | 900–1100 hPa | 1013 hPa | ~56% |

**End-to-end pipeline:**

```text
xensiv_dps3xx_read → Pa, °C
sensor_dps368_read → float sample
port → hPa×10, °C×100 integers
bs_pack_dps368_evt → EVT_SENSOR
UART → { pressureHpa, temperatureC }
```
