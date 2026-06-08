## Publishing fusion on BS2

Fusion outputs are optional fields in BMI270 **EVT_SENSOR** payloads, selected by the **publish mask** in SENSOR_CFG.

## Enable in SENSOR_CFG

Set mask bits:

- `0x08` — Euler triplet
- `0x10` — Quaternion quartet

You may enable raw ACC+GYR alongside fusion for teaching comparisons.

## Decode order (canonical)

From `extension/src/bitstream2/domains/sensors/bmi270.ts`:

```text
ACC (0x01) → GYR (0x02) → TMP (0x04) → EULER (0x08) → QUAT (0x10)
```

Only fields whose bits are set appear, in this order, as little-endian int16/u16 values.

## Quaternion wire note

- `qw` — unsigned bucket (see decode comments in `bmi270.ts`)
- `qx`, `qy`, `qz` — signed scaled components

Normalize to unit quaternion on the host before driving 3D scenes.

## Host store fields

Presentation and Telemetry read the same decoded hints, e.g.:

- `fusionHeadingRadX100`, pitch, roll
- Quaternion bucket fields for R3F orientation scenes

## Bandwidth tip

Attitude-only dashboards: publish **QUAT** or **EULER**, not necessarily full 6-DoF at max ODR.

## Verify

1. Enable fusion bits in sensor settings draft
2. Stream via UART or Simulator
3. Open **Live Euler** / **Live quaternion** demo slides
4. Cross-check with Sensor Telemetry plots

## Reference

- `extension/src/bitstream2/docs/SENSOR_CFG_V2.md`
- `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` — Bitstream vs Simulator parity
