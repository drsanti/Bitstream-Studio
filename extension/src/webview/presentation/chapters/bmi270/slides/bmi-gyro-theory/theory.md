## Angular rate

A gyroscope measures **instantaneous angular velocity** $\boldsymbol{\omega}$ in the sensor frame:

$$
\boldsymbol{\omega} = (\omega_x,\ \omega_y,\ \omega_z)
$$

Units: **rad/s** on the wire (often displayed as **°/s**).

## Integration and drift

Angle about an axis from gyro alone:

$$
\theta(t) \approx \theta_0 + \int_0^t \omega(\tau)\, d\tau
$$

In practice, **bias** and noise integrate into **drift** — the estimated angle wanders even when the device is still.

## Complementary roles (accel + gyro)

| Sensor | Strength | Weakness |
|--------|----------|----------|
| Gyro | Fast rotation, short-term smooth | Drift over seconds–minutes |
| Accel | Gravity direction at low frequency | Corrupted by linear accel / vibration |

**Sensor fusion** (complementary filter, Kalman filter, etc.) blends gyro integration with gravity correction from the accelerometer. BMI270 firmware can publish fused **Euler** and **quaternion** — see the next chapter.

## Axis naming intuition

| Rate | Often associated with |
|------|------------------------|
| $\omega_x$ | Roll rate |
| $\omega_y$ | Pitch rate |
| $\omega_z$ | Yaw rate |

Exact mapping depends on mounting and convention — always verify against your PCB silkscreen and demo 3D view.

## On the wire (BS2)

Gyro samples use mask bit `0x02` (**GYR**). Fields: `gx_rads_x100`, `gy_rads_x100`, `gz_rads_x100` — divide by 100 for rad/s.

## Full-scale range

Higher **°/s** range avoids saturation during fast spins; lower range improves resolution per LSB. Configure in SENSOR_CFG / sensor settings deck when teaching trade-offs.
