## Inertial Measurement Unit (IMU)

An **IMU** reports motion state using inertial sensors. A **6-DoF** IMU combines:

| Sensor | Measures | Units (typical UI) |
|--------|----------|-------------------|
| 3-axis accelerometer | Specific force | g or m/s² |
| 3-axis gyroscope | Angular rate $\omega$ | °/s or rad/s |

“6-DoF” counts **three translational** sensing axes (via accel) plus **three rotational** rate axes (via gyro) — not six independent position coordinates.

## Accelerometer role

The accelerometer responds to **how strongly** the proof mass is pushed — including the reaction from supports that balances gravity when the device is at rest.

## Gyroscope role

The gyroscope responds to **how fast** the sensor frame rotates about each axis:

$$
\omega_x,\ \omega_y,\ \omega_z
$$

Short-term integration of $\omega$ tracks fast rotation; long-term angle estimates drift without correction.

## Applications

- Attitude hints and sensor fusion (with accel + optional mag)
- Activity recognition, step counting, fall detection
- Stabilization and control (drones, gimbals, robotics)
- Vibration and motion profiling

## BMI270 beyond raw 6-DoF

The BMI270 adds **on-chip algorithms** (step counter, activity classification, FIFO, interrupts). This course focuses on **raw and fused streams** as published over BS2; algorithm configuration is firmware/product specific.

## Degrees of freedom vs pose

A full rigid-body **pose** in 3D has 6 DOF (3 position + 3 orientation), but an IMU alone does not directly measure position — integration of accel is doubly drift-prone without external aiding (GPS, vision, etc.).
