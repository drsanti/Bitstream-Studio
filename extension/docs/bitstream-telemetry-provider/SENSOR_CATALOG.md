# Bitstream Telemetry Provider — sensor catalog reference

The **sensor catalog** is the static specification for all supported sensors: field names, units, physical min/max, mask bits, `staleAfterMs` (stale detection hint), and `SENSOR_CFG` schema.

---

## Files

| File | Role |
|------|------|
| **Source of truth (TypeScript)** | `extension/src/bitstream2/telemetry-provider/catalog/sensor-catalog-source.ts` _(repo)_ |
| **Generated JSON (bundled)** | `extension/src/bitstream2/telemetry-provider/sensor-catalog.v1.json` _(repo)_ |
| **Generated JSON (this kit)** | [sensor-catalog.v1.json](./sensor-catalog.v1.json) |

Regenerate after editing the TypeScript source:

```bash
cd extension
npm run bitstream2:telemetry-catalog:gen
npm run test:bitstream2
```

Bump `SENSOR_CATALOG_VERSION` in `sensor-catalog-source.ts` when the schema changes.

---

## Sensor IDs

| `id` | `sensorId` | Label |
|------|------------|-------|
| `bmi270` | 0 | BMI270 IMU / fusion |
| `bmm350` | 1 | BMM350 magnetometer |
| `sht40` | 2 | SHT40 temp / humidity |
| `dps368` | 3 | DPS368 pressure / temp |

---

## Field aliases (user names → catalog keys)

Use these when a prompt says `gx`, “gyro x”, etc. **`bitstream:sample` always uses catalog keys.**

| User / informal | Catalog key | Sensor `id` | Unit |
|-----------------|-------------|-------------|------|
| gx, gyro x, gyroscope x | **`gyroX`** | `bmi270` | rad/s |
| gy, gyro y | `gyroY` | `bmi270` | rad/s |
| gz, gyro z | `gyroZ` | `bmi270` | rad/s |
| ax, accel x | `accelX` | `bmi270` | m/s² |
| ay, accel y | `accelY` | `bmi270` | m/s² |
| az, accel z | `accelZ` | `bmi270` | m/s² |
| temp, temperature | `temperatureC` | any | °C |
| humidity, rh | `humidityPct` | `sht40` | %RH |
| pressure, baro | `pressureHpa` | `dps368` | hPa |
| mx, my, mz, mag x/y/z | `magX`, `magY`, `magZ` | `bmm350` | µT |

---

## Range types for gauges and bars

Three different “min/max” concepts — do not mix them:

| Type | Source | Use for |
|------|--------|---------|
| **Physical / catalog** | `fields[].min`, `fields[].max` in [sensor-catalog.v1.json](./sensor-catalog.v1.json) | **Default** progress bars and gauges (map endpoints → 0% and 100%) |
| **Gauge hint** | `gaugeHints` on a sensor entry | “Typical” or “motion” UI band (e.g. gyro ±1 rad/s) when user wants a narrower scale |
| **User display range** | User prompt with **physical values + units** | Only when user specifies e.g. “map -2…+2 rad/s”; otherwise use catalog |

### Progress bar 0–100% (default mapping)

```text
displayMin = fields[].min
displayMax = fields[].max
percent = clamp((value - displayMin) / (displayMax - displayMin) * 100, 0, 100)
```

**Example — BMI270 `gyroX`:** catalog min **-5**, max **+5** rad/s → `gyroX = 0` is **50%** bar fill, not 0%.

**Exception — SHT40 `humidityPct`:** physical range is already **0–100 %RH**; bar fill can equal the field value.

Full walkthrough: [RECIPES.md § Recipe 1](./RECIPES.md#recipe-1--progress-bar-0100-from-a-catalog-field).

---

## Wire scaling → `fields`

Public `bitstream:sample` values are **human-scale**. Wire integers use `wireScale` from the catalog:

| Field example | Wire | `fields` value |
|---------------|------|----------------|
| `temperatureC` | int16 × 100 | ÷ 100 |
| `humidityPct` | int16 × 100 | ÷ 100 |
| `pressureHpa` | int16 × 10 | ÷ 10 |
| `accelX` | int16 × 100 (m/s²) | ÷ 100 |
| `quatW` | uint16 bucket | `(wire - 10000) / 10000` |

BMI270 canonical wire order when all mask bits set: ACC(3) → GYR(3) → TMP(1) → EULER(3) → QUAT(4).

---

## Mask channels

Each sensor entry includes `maskChannels`: bitmask bit → first field key of that group.

Example SHT40:

| Bit | Key | Label |
|-----|-----|-------|
| `0x01` | `temperatureC` | Temp |
| `0x02` | `humidityPct` | Humidity |

`bitstream:config.payload.sensors.*.maskLabels` lists active keys for the current configuration.

---

## Config fields (shared)

All sensors share BS2 v2.1 `SENSOR_CFG` fields documented in [SENSOR_CFG_V2.md](../../src/bitstream2/docs/SENSOR_CFG_V2.md) _(Bitstream Studio repo)_:

| Field | Notes |
|-------|--------|
| `enabled` | Stream on/off |
| `publishMode` | `periodic` \| `on_change` \| `hybrid` |
| `mask` | Active EVT channels |
| `samplingIntervalMs` | Sample tick (10–60000 ms after firmware clamp) |
| `publishIntervalMs` | UART decimation; `0` = same as sampling |
| `deltaX100` | Change threshold × 0.01 |
| `minPublishIntervalMs` | Publish debounce cap |

Defaults in catalog match `BS2_SIM_BOARD_PROFILE` (simulator / board baseline). Live values come from `bitstream:config`.

---

## Gauge hints

Optional `gaugeHints` per sensor are **UI suggestions** (narrower than physical range):

| Sensor | Hint key | Typical band |
|--------|----------|----------------|
| `bmi270` | `gyro` | ±1 rad/s |
| `bmi270` | `accel` | ±2 m/s² |
| `bmm350` | `magAxis` | ±100 µT |
| `dps368` | `pressureSeaLevel` | 900–1100 hPa |

Use `fields[].min` / `max` unless the user or recipe explicitly selects a hint.

---

## Tests

`tests/bitstream2/telemetry-provider-catalog.test.ts` verifies:

- All `BS2_SENSOR_ID` entries exist
- Mask bits match domain constants
- Generated JSON matches `buildSensorCatalog()`
