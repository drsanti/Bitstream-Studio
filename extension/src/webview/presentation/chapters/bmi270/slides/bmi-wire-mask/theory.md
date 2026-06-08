## BMI270 on the BS2 wire

`EVT_SENSOR` payloads for `sensorId = 0` include a **mask** byte. Each set bit appends fields in **canonical decode order**:

```text
ACC → GYR → TMP → EULER → QUAT
```

Canonical implementation: `extension/src/bitstream2/domains/sensors/bmi270.ts`

## Mask bits

| Bit | Name | Payload fields (int16 LE unless noted) |
|-----|------|----------------------------------------|
| `0x01` | ACC | `ax_ms2_x100`, `ay_ms2_x100`, `az_ms2_x100` |
| `0x02` | GYR | `gx_rads_x100`, `gy_rads_x100`, `gz_rads_x100` |
| `0x04` | TMP | `temp_cx100` |
| `0x08` | EULER | `heading_radx100`, `pitch_radx100`, `roll_radx100` |
| `0x10` | QUAT | `qw` (u16 bucket), `qx`, `qy`, `qz` (i16 ×10000 style) |

## Scale examples

| Field | Host conversion |
|-------|-----------------|
| Accel ×100 | value / 100 → m/s² |
| Gyro ×100 | value / 100 → rad/s |
| Temp ×100 | value / 100 → °C |
| Euler ×100 | value / 100 → rad |
| Quaternion | See `bmi270.ts` comments for `qw` bucket vs `qx..qz` |

## SENSOR_CFG link

The firmware **publish mask** in SENSOR_CFG determines which bits appear in each EVT. Enable only what you need — smaller payloads, lower UART load.

## Teaching labs

| Lab focus | Suggested mask |
|-----------|----------------|
| Raw 6-DoF | ACC + GYR |
| Temperature sanity | add TMP |
| Attitude dashboards | add EULER or QUAT |

## Validation

Use `npm run bitstream2:uart-probe` or Simulator streaming and compare decoded JSON with the multi-sensor demo in the platform chapter.
