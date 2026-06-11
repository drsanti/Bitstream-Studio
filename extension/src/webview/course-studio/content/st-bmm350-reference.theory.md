# BMM350 — Reference & knowledge check

Use cases, pitfalls, instructor notes, and quick reference tables.

---

## Real-world use cases

| Domain | BMM350 role |
|--------|-------------|
| **Compass / heading aid** | After calibration + fusion (products; not this lab) |
| **Metal proximity** | Detect ferrous object near sensor |
| **Robotics / drones** | Yaw aiding when fused with IMU + GPS |
| **Door / lid detection** | Magnet + reed switch patterns in industry |

**Embedded product notes:**

- Plan **calibration** (figure-8 motion) for any navigation use.
- Keep mag sensor away from DC motors, speakers, and high-current traces.
- **I3C** on AI kit: ensure PREBUILD fix applied when upgrading Bosch API.
- **IPC path:** Legacy CM33 `IPC_CMD_MAG_RAW` still exists for console — Bitstream workshop uses **EVT_SENSOR** on UART.

---

## Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Compass doesn't point north. | Uncalibrated + indoor steel — teach **relative** rotation only. |
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

## Knowledge check

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

## Instructor notes

- **Safety:** Magnet demo is optional and brief — no strong neodymium on student kits unsupervised.
- **Desk setup:** Open air above table beats flat on steel for baseline lab.
- **Pair with BMI270:** Four-sensor dashboard — motion teal, mag violet; do not merge into one "compass widget" without explaining fusion limits.
- **Simulator:** Same `magX/Y/Z` keys — good for backup seats without hardware.
- **Eval vs AI:** If a bench uses Eval kit, mention I2C at U4 instead of I3C U20.

---

## Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | "Local magnetic field in X, Y, Z" |
| Vector | magX, magY, magZ (µT) |
| Earth | ~25–65 µT \|B\| |
| Workshop axis band | ±100 µT |
| Strength | √(x²+y²+z²) |
| Caution | Steel, speakers, phone magnets |
| Studio | Ch5 compass-style, Ch6 infographic |

---

## Embedded cheat sheet

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
| `extension/docs/workshop/SENSOR_THEORY.md` | Hub — vectors, magnitude, multi-sensor dashboard |
| `extension/docs/workshop/sensor-theory/CH3_BMI270.md` | IMU / fusion (separate from raw mag) |
| `extension/docs/workshop/prompts/SENSOR_BMM350.md` | HTML dashboard generator |
