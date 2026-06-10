## Measurement model

The **BMM350** reports a three-axis **magnetic field** vector in microtesla (µT) plus an on-die **temperature** reading. The field vector combines Earth's ambient field with local distortions from ferrous materials, speakers, and PCB traces.

Heading derived on the host uses the horizontal components when the board is level — treat it as a **level compass**, not a full tilt-compensated navigation solution unless you fuse with IMU attitude.

## Live data on the bench

Connect **Bitstream** or **Simulator** and enable **BMM350** with **MAG** (and **TMP** if needed) in the sensor configuration wire mask.

## Bench checks

1. Hold the board flat and rotate slowly — **level heading** should sweep 0–360°.
2. Move a magnet nearby — **|B|** and axis components change sharply.
3. Confirm **mag valid** when the stream is healthy.
