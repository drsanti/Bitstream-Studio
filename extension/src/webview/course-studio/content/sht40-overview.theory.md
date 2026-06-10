## Measurement model

The **SHT40** reports ambient **temperature** (°C) and **relative humidity** (%RH). Relative humidity is the ratio of actual water vapor to the saturation level at the current temperature — not absolute moisture content.

Both values arrive on the BS2 stream as **EVT_SENSOR** samples for sensor id **SHT40**. Enable **TEMP** and **HUM** in the wire mask before expecting live blocks to update.

## Why temperature and RH together

%RH is temperature-dependent. A cold surface can read “dry” in %RH while absolute moisture is unchanged. Operator views should show **both** fields when diagnosing comfort or condensation risk.

## Live data on the bench

Connect live sensor data from the toolbar (**Bitstream** for hardware, **Simulator** for practice). Blocks on this page turn gray when no fresh sample is available.

## Bench checks (overview)

1. Breathe gently toward the sensor — **%RH** should rise within a few seconds.
2. Hold the board near a warm surface — **temperature** rises; watch how **%RH** responds.
3. Confirm both **temp valid** and **rh valid** indicators when the stream is healthy.

Use the live widgets while performing the checks. The **Live visualization** topic adds telemetry cards matching the Bitstream deck layout.
