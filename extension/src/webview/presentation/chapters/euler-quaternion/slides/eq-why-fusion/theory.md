## Why sensor fusion?

Neither accelerometer nor gyroscope alone gives a stable **attitude** estimate over time.

## Frequency-domain intuition

| Sensor | Trust band | Failure mode |
|--------|------------|--------------|
| Gyro $\omega$ | High frequency (fast turns) | Bias → integrated drift |
| Accel $\mathbf{a}$ | Low frequency (gravity direction) | Linear accel, vibration |

A **complementary filter** (conceptually):

$$
\hat{\mathbf{q}} \leftarrow \alpha \cdot \hat{\mathbf{q}}_\text{gyro} + (1-\alpha) \cdot \hat{\mathbf{q}}_\text{accel}
$$

(Actual implementations use quaternion math or Kalman filters — $\alpha$ may be adaptive.)

## Gyro path

Integrate $\omega$ for smooth short-term motion:

$$
\theta(t) \approx \int \omega\, dt
$$

Bias makes $\theta$ wander even at rest.

## Accel path

When not accelerating linearly, $\mathbf{a}$ points opposite to gravity in the sensor frame — a **tilt** reference:

$$
\hat{\mathbf{g}}_\text{sensor} \approx -\frac{\mathbf{a}}{|\mathbf{a}|}
$$

Shocks and horizontal acceleration corrupt this vector.

## BMI270 firmware fusion

On-chip fusion can publish:

- **Euler** (mask `0x08`) — heading, pitch, roll
- **Quaternion** (mask `0x10`) — $(w,x,y,z)$

Host decodes and displays; fusion tuning is firmware-side in this course.

## Magnetometer (preview)

Yaw (heading) relative to **magnetic north** needs a **magnetometer** (BMM350) or external reference — accel+gyro alone cannot observe yaw drift.
