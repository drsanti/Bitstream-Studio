## Right-hand coordinate frame

Use the **right-hand rule** for axis directions:

- **+X** — thumb
- **+Y** — index finger
- **+Z** — middle finger

Rotations follow the same convention: positive $\omega$ about $+Z$ is counter-clockwise when looking down the $+Z$ axis.

## Sensor frame vs body frame

On the PCB, the BMI270 die has a fixed **sensor frame** relative to the package. Your mechanical design may define a **body frame** — always document the rotation matrix or mounting offset between them.

## Gravity as a static accel signature

When the board is **level** on a table with $+Z$ pointing up, gravity’s reaction through the support appears as upward specific force:

| Axis | Static accel (approx.) |
|------|------------------------|
| $a_X$ | $0$ |
| $a_Y$ | $0$ |
| $a_Z$ | $+1\,\text{g}$ |

When **+X** points up (board on its side):

| $a_X$ | $a_Y$ | $a_Z$ |
|-------|-------|-------|
| $+1\,\text{g}$ | $0$ | $0$ |

## Magnitude check

For a stationary pose (no vibration):

$$
|\mathbf{a}| = \sqrt{a_x^2 + a_y^2 + a_z^2} \approx 1\,\text{g}
$$

Linear acceleration and vibration add transients on top of this vector.

## Teaching tip

Have students **predict** the table before connecting hardware, then compare with the live demo slide. Sign errors usually mean frame mismatch, not sensor failure.
