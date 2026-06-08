## Euler & Quaternion chapter

Attitude (3D orientation) appears constantly in IMU applications — dashboards, 3D scenes, control loops. This chapter explains **how BMI270 fusion outputs are represented** and **why two formats coexist** on the wire.

## Prerequisites

- Completed **BMI270** chapter (accel, gyro, coordinates)
- Live or simulated stream with fusion publish enabled

## Topics

1. Motivation for **sensor fusion**
2. **Euler angles** (roll, pitch, yaw / heading)
3. **Gimbal lock** limitation
4. **Unit quaternions** as a robust representation
5. **BS2 mask bits** `0x08` and `0x10`

## Same data path

Presentation demos read **`fusionHeadingRadX100`**, quaternion buckets, and related fields from the same `useBitstreamLiveStore` path as Sensor Telemetry.

## Duration guide

| Profile | Time |
|---------|------|
| Keynote excerpt | 15–20 min (fusion + one demo) |
| Full chapter | 45–60 min with labs |
