## MEMS gyroscope (Coriolis)

A MEMS gyro is **not** a spinning mechanical wheel. It uses a **resonating proof mass** driven into oscillation; **rotation** induces a **Coriolis** force that couples drive and sense modes.

## Physical intuition

1. **Drive mode** — electrostatic drive keeps the mass vibrating along a drive axis.
2. **Rotation** — when the package rotates about a sensitive axis, Coriolis coupling deflects the mass in the sense direction.
3. **Sense mode** — capacitive sense electrodes measure deflection $\propto \omega$.

## Output

For each sensitive axis, the digital output is approximately **proportional to angular rate**:

$$
V_{\text{sense}} \propto \omega
$$

Cross-axis sensitivity and temperature drift are corrected in firmware/ASIC within datasheet limits.

## Why drift still happens

Bias, noise, and integration errors accumulate when integrating $\omega$ to angle — even with excellent MEMS gyros. That is why **fusion with accelerometer** (and magnetometer for yaw) is standard practice.

## Demo link

The **gyro demo** integrates rates visually — watch angle wander when the board is held still to motivate the Euler & Quaternion chapter.

## Not covered here

- Drive frequency locking and quadrature error compensation (datasheet / app notes)
- In-run bias calibration algorithms on-chip
