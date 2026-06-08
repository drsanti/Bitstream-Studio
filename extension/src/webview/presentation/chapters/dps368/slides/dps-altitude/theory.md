## Barometric altitude

Absolute altitude from pressure alone requires a **reference pressure** $P_0$ at a known height (often "ground level" at session start). The **barometric formula** (simplified ISA) estimates geopotential height:

$$
h \approx 44330 \left[1 - \left(\frac{P}{P_0}\right)^{0.1903}\right] \text{ m}
$$

Some references use exponent $1/5.255 \approx 0.1903$ for the troposphere approximation.

## Symbols

| Symbol | Meaning |
|--------|---------|
| $P$ | Measured static pressure (hPa) |
| $P_0$ | Reference pressure at calibration (hPa) |
| $h$ | Relative altitude change from reference (m) |

## Teaching vs survey grade

This estimate is excellent for:

- Relative climb/descent (delta height)
- Classroom demos with the DPS368

It is **not** a substitute for GNSS survey without frequent $P_0$ updates — weather systems move the pressure field over time.

## Weather drift

If $P_0$ is fixed at $1013.25\,\text{hPa}$ but a weather front lowers sea-level pressure, reported altitude drifts even when the sensor is stationary. Recalibrate $P_0$ when you need consistent absolute readings.

## Default in demos

The live altitude demo uses $P_0 = 1013.25\,\text{hPa}$ by default. Adjust reference in Sensor Telemetry when comparing against a known floor level.

## On the wire (BS2)

DPS368 pressure uses sensor id `3` with mask bit `0x01`. Temperature (mask `0x02`) supports compensation — see the product chapter and host decode modules for scale factors.
