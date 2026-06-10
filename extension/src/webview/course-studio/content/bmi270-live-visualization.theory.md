## Linked visuals on this page

All blocks consume the **same live BMI270 stream** and share link-health behavior (gray when stale or disabled).

| Block | What it shows |
|-------|----------------|
| **Telemetry cards** | Deck-style accelerometer and Euler panels |
| **3D Scene** | PCB mesh attitude from fusion |
| **Diagram** (MEMS) | Proof-mass offset and spring highlight |
| **Diagram** (3D layer) | Live PCB graphic in the diagram canvas |
| **HTML page block** | Provider API gyro X progress bar (`gyroX` via `postMessage`) |

In **Bitstream** mode, the HTML demo auto-enables BMI270 **raw gyro** when the active mask omits `gyroX`.

## Bench procedure

1. Start live streaming (hardware or Simulator).
2. Tilt slowly — tri-axis acceleration moves between axes while $|a|$ stays near **1 g** at rest.
3. Watch the **3D scene** track board attitude.
4. On the MEMS diagram, confirm proof-mass motion follows the sensitive axis under tilt.

In **Maintainer** mode, open the Diagram and 3D Scene editors to inspect how bindings connect geometry to live values — the same mindset used for Dashboard widgets in Sensor Studio.

## Course page vs operator dashboard

| Course block | Sensor Studio equivalent |
|--------------|--------------------------|
| Telemetry card | Bitstream deck card or Dashboard numeric panel |
| 3D scene | Stage / 3D view widget |
| Diagram animation | Custom diagram or trend + threshold LED |
