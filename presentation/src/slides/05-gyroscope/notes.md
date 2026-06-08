# Slide 05 — Gyroscope

**Key talking points:**

- The gyroscope measures **angular velocity** (rate of rotation), NOT angle
- To get angle, you must **integrate** ω over time — which accumulates **drift**
- The BMI270 fusion engine (on-chip) compensates drift using the accelerometer

**Coriolis effect (MEMS gyroscope principle):**

1. A resonating proof mass vibrates at a known frequency (drive axis)
2. When the device rotates, Coriolis force deflects the mass on the **sense axis**
3. `F_coriolis = 2m × v × Ω` — proportional to angular rate Ω

**Units:**

- Output in °/s (degrees per second)
- Typical human motion: 0–200 °/s
- Aggressive rotation (sports, industrial): up to 2000 °/s

**3D gimbal:**

- The three rings represent the three axes of rotation
- Each ring integrates live ω → accumulated angle (simplified — no drift correction shown here)
- This is why IMU fusion algorithms exist: gyro gives rate, accelerometer gives absolute tilt reference
