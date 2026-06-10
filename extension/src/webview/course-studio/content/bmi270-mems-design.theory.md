## Capacitive MEMS accelerometer

A movable **proof mass** sits between fixed and mobile capacitor fingers. Displacement changes capacitance; the ASIC converts the result to acceleration along each sensitive axis.

At rest with **+Z** up, the support reaction appears as **+1 g** on the vertical axis. Horizontal tilt shifts the proof mass — the **diagram** on this page animates offset and spring highlight from live axis values.

## Gyroscope and fusion

- **Gyro** channels report angular rate (**°/s**) for rotation and vibration-rate cues.
- **Fusion** (Euler / quaternion) combines accel and gyro for stable attitude on 3D views — only as good as frame alignment and motion profile allow.

## Mechanics and bandwidth

- **Springs** restore the mass; stronger deflection increases spring stress (visible on the diagram).
- **Output data rate (ODR)** and filtering set effective bandwidth — higher ODR for impacts and vibration; lower ODR for slow tilt.

## Mounting checklist

| Check | Why it matters |
|-------|----------------|
| Silkscreen axes vs mechanical drawing | Frame mismatch breaks fusion, 3D preview, and diagrams |
| Rigid mount | Flex adds low-frequency noise |
| Temperature | Monitor die temp during long runs |

## Typical full-scale ranges

| Accel range | Application |
|-------------|-------------|
| ±2 g | Tilt, fine motion |
| ±4 / ±8 g | General IMU |
| ±16 g | Impacts, vibration |
