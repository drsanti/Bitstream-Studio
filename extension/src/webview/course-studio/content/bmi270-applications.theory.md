## Why accelerometers matter

A MEMS accelerometer answers: **how is the device being pushed right now?** That supports tilt, vibration, orientation, and motion context across many operator-facing apps.

| Domain | Signal | Operator view |
|--------|--------|---------------|
| Building automation | Damper / tracker tilt | Level gauge, angle alarm |
| Industrial machines | Vibration, shock | Trend chart, threshold LED |
| Robotics & AGV | Body attitude, braking | 3D orientation, axis readouts |
| Transport & logistics | Handling shocks | Peak-g capture, event counter |

This book focuses on **understanding the signal** and **mapping it to clear UI** — not firmware or backend services.

## Reading the signal

1. **At rest** — one axis near **+1 g** when pointing up; $|a| \approx 1\,\text{g}$.
2. **Tilt** — gravity moves between axes; magnitude stays near 1 g unless the body accelerates.
3. **Shake / impact** — magnitude spikes; rate of change matters for vibration apps.
4. **Rotation** — use gyro and fusion for stable attitude in 3D views.

## Sensor Studio workflow

1. Stream live BMI270 data (**Bitstream** or **Simulator**).
2. Add BMI270 input or tap nodes (accel, gyro, Euler, quaternion).
3. Wire outputs to Dashboard gauges, LEDs, charts, or 3D stages.
4. In Course Studio, add **Dashboard widget** or **Sensor card** blocks with the same binding paths.

## Designing an operator view

| Goal | Widget idea | Binding |
|------|-------------|---------|
| Is the board level? | Numeric + LED | Tilt axis vs threshold |
| Vibration rising? | Sparkline / gauge | $|a|$ or high-pass axis |
| Shock limit exceeded? | LED + event text | Peak $|a|$ |
| Device orientation? | 3D scene / Euler gauge | `bmi270.pitch`, `bmi270.roll`, … |

When visuals disagree with the physical setup, check **frame alignment** (MEMS design topic) before assuming a sensor fault.
