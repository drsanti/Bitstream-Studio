## Specific force

The accelerometer measures **specific force** — the force per unit mass acting on the proof mass inside the MEMS structure. It is **not** a direct measurement of velocity or position.

When the sensor is at rest on a table, the support exerts an upward reaction that balances gravity. In a typical sensor frame with $+Z$ upward:

$$
a_z \approx +1\,\text{g}
$$

The magnitude of the tri-axis vector is approximately $1\,\text{g}$ at rest:

$$
|\mathbf{a}| = \sqrt{a_x^2 + a_y^2 + a_z^2} \approx 1\,\text{g}
$$

## Free fall

In free fall (no aerodynamic drag, no contact forces), the net specific force on the proof mass approaches zero:

$$
\mathbf{a} \approx \mathbf{0}
$$

This is why accelerometers are used in drop-detection and some activity-classification algorithms.

## Dynamic motion

During translation or rotation, dynamic components add to the gravity vector. High-pass or complementary filtering separates "tilt" (low-frequency gravity direction) from vibration and impacts (higher frequency).

## Full-scale range trade-off

BMI270 supports configurable full-scale ranges (e.g. $\pm 2$, $\pm 4$, $\pm 8$, $\pm 16\,\text{g}$). Wider range improves headroom for shocks; narrower range improves resolution per LSB.

| Range | Typical use |
|-------|-------------|
| $\pm 2\,\text{g}$ | Fine tilt, slow motion |
| $\pm 16\,\text{g}$ | Impacts, sports, harsh vibration |

## Common mistake

> Students often assume $a_z = 0$ at rest because "nothing is moving." The correct model includes the **support reaction** — the sensor reports how hard the mass is being pushed, not how fast the package moves through space.

## On the wire (BS2)

Tri-axis accelerometer samples use EVT_SENSOR mask bit `0x01` (**ACC**). On the wire: `ax_ms2_x100`, `ay_ms2_x100`, `az_ms2_x100` as little-endian `int16` — divide by 100 for m/s²; the presentation UI often displays g.
