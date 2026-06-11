# SHT40 — Hardware, firmware & BS2 wire

Embedded depth for hardware and firmware engineers — I²C integration through host decode.

---

## Hardware design (DevKit)

### Electrical interface

| Topic | Detail |
|-------|--------|
| **Bus** | I²C |
| **7-bit address** | **0x44** (default) or **0x45** (ADDR pin high) |
| **TESAIoT default** | `SHT40_I2C_ADDR_44` (`0x44`) |
| **Voltage** | **1.8 V** I²C domain (SCB0 / P8) |
| **Pins** | P8[0] SCL, P8[1] SDA |

### Shared bus with BMI270

The SHT40 shares **Bus 1 (SCB0)** with the **BMI270** IMU. All transactions must go through the **I²C manager**:

```text
cm55_i2c_manager_i2c_lock()
  → I²C transfer (SHT40 or BMI270)
cm55_i2c_manager_i2c_unlock()
```

A high-precision SHT40 measurement holds the bus for **~10 ms** including conversion wait — plan IMU reads around that.

```text
        ┌──────────────┐
        │  PSoC CM55   │
        │  I²C manager │
        └──────┬───────┘
               │ Bus 1 (1.8 V)
       ┌───────┴───────┐
   ┌───▼───┐      ┌────▼────┐
   │ SHT40 │      │ BMI270  │
   │  U22  │      │  (IMU)  │
   └───────┘      └─────────┘
```

### Layout and power

- Place the sensor where **ambient air** can reach the opening.
- Keep away from direct MCU exhaust or LDO heat if RH accuracy matters.
- Decouple per schematic; no separate enable GPIO.

---

## Chip protocol and measurement modes

| Command | Mode | Typical conversion time |
|---------|------|-------------------------|
| `0xFD` | High precision | ~10 ms |
| `0xF6` | Medium precision | ~5 ms |
| `0xE0` | Lowest precision | ~2 ms |
| `0x94` | Soft reset | — |

**TESAIoT production path:** `sht4x_measure_high_precision()`.

### Transaction sequence

1. **Write** command byte to I²C address.
2. **Wait** for conversion.
3. **Read** 4 bytes: `T_ticks`, `T_CRC`, `RH_ticks`, `RH_CRC`.
4. Driver validates CRC; returns millidegrees / milli-%RH.

```c
void sht4x_init(uint8_t i2c_address);

int16_t sht4x_measure_high_precision(int32_t *temperature, int32_t *humidity);
// temperature: millidegrees C; humidity: milli-%RH; 0 = success
```

---

## Firmware architecture (TESAIoT)

| Layer | Responsibility |
|-------|----------------|
| `sensor_sht40.c` | Init, read, state machine |
| `bitstream_sensor_port_cm55_sht40.c` | Fixed-point scaling for BS2 |
| `bitstream_bs_sensor.c` | `bs_pack_sht40_evt()` |

### Initialization

1. `sensor_sht40_startup()` registers with state store and event bus.
2. Wait up to 10 s for shared I²C ready.
3. `sht4x_init(SHT40_I2C_ADDR_44)`.
4. **Probe read** — up to 3 attempts; failure → `SENSOR_STATE_ERROR`.
5. Success → `SENSOR_STATE_READY`.

### Read flow and scaling

```text
sensor_sht40_read() → float °C and %RH
port → temperature_c_x100 = round(temp × 100)   // int16
     → humidity_pct_x100  = round(hum × 100)     // uint16
bs_pack_sht40_evt() → EVT_SENSOR on UART @ 921600 baud
```

On read failure the port returns **-2** and state → `ERROR`.

---

## BS2 wire format and host decode

| Property | Value |
|----------|-------|
| **BS2 sensorId** | `2` |
| **Mask TEMP** | `0x01` |
| **Mask HUM** | `0x02` |
| **Default mask** | `0x03` (both) |
| **EVT value order** | TEMP, then HUM |
| **Encoding** | int16 little-endian per channel |
| **wireScale** | `100` |

### Catalog fields

| Field key | Label | Unit | Range |
|-----------|-------|------|-------|
| `temperatureC` | Temperature | °C | −40 … 125 |
| `humidityPct` | Humidity | %RH | 0 … 100 |

### Default SENSOR_CFG

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `publishMode` | `periodic` |
| `mask` | `3` |
| `samplingIntervalMs` | `200` (5 Hz) |
| `staleAfterMs` (host) | `600` |

### Worked wire example

Room: **24.50 °C**, **62.00 %RH**, mask `0x03`.

| Channel | ×100 | int16 (hex) |
|---------|------|-------------|
| TEMP | 2450 | `0x0992` |
| HUM | 6200 | `0x1838` |

Payload bytes (LE): `92 09 38 18` plus BS2 framing and CRC.

Host decode: `extension/src/bitstream2/domains/sensors/sht40.ts`.

---

## Configuration and rate planning

### Workshop settings

| Setting | Climate lab suggestion |
|---------|------------------------|
| **Sampling rate** | 1–2 s (slow) or default 200 ms (lively demos) |
| **Publish mode** | Periodic for traces; on change to reduce traffic |
| **On-change sensitivity** | ~100 in `deltaX100` → ~1.00 °C / %RH step |

### Embedded timing

SHT40 is a **slow sensor** (`SLOW_SENSOR_SAMPLING_HZ_PRESETS`: 0.33–20 Hz).

| Rate | intervalMs | Notes |
|------|------------|-------|
| 0.5 Hz | 2000 ms | Good for logging |
| 5 Hz | 200 ms | Catalog default |
| 10 Hz | 100 ms | Watch bus sharing with BMI270 |

Each high-precision read ≈ **10 ms** blocked I²C. Use `publishIntervalMs` > `samplingIntervalMs` to decimate EVT traffic.

**SENSOR_CFG under load:** Slow other sensors to ≥500 ms interval before cfg-only work; wait ~600 ms; retry GET/SET if needed.

---

## From chip to screen

### Reading discipline

Always state three parts: **name**, **number**, **unit** — e.g. *"Humidity is sixty-two percent."*

**Map to a progress bar:**

```text
percent = (value − minimum) ÷ (maximum − minimum) × 100
```

| Reading | Workshop range | Example | Bar |
|---------|------------------|---------|-----|
| Humidity | 0–100 %RH | 62 %RH | 62% |
| Temperature | 0–50 °C | 25 °C | 50% |

### End-to-end pipeline

```text
T0  sht4x_measure_high_precision → millidegrees / milli-%RH
T1  sensor_sht40_read → float °C, %RH
T2  port → ×100 integers
T3  bs_pack_sht40_evt → EVT_SENSOR body
T4  UART → bridge → JSON { temperatureC, humidityPct }
T5  Webview → Sensor Telemetry / Studio / Course widgets
T6  stale timer — no sample within 600 ms → mark stale
```

Scaling happens once at the port. The host **divides by wireScale 100** — do not double-scale in application code.
