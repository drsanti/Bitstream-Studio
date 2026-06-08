## Gimbal lock

**Gimbal lock** is a **parameterization** problem, not a failure of the physical sensor.

When using **sequential Euler angles**, two rotation axes can become **parallel**. One degree of freedom in the angle triple becomes redundant — rates can explode in simulation and filters can become ill-conditioned.

## Classic example (pitch near ±90°)

For a common aerospace sequence, when pitch approaches $\pm 90°$:

$$
\cos\beta \to 0
$$

heading and roll become coupled — you cannot distinguish them with Euler rates alone.

## Physical vs mathematical

The rigid body still has a well-defined orientation in 3D. Only the **Euler triple** becomes singular as a chart on $SO(3)$.

## Engineering impact

| Domain | Symptom |
|--------|---------|
| 3D graphics | Sudden flip or jitter |
| Control | Gain spikes near singularity |
| Teaching | “Why did my yaw dial go crazy?” |

## Quaternion remedy

**Unit quaternions** live on $S^3$ and interpolate smoothly (**SLERP**) without aligning gimbal rings.

## Why BS2 still ships Euler

Human-readable plots and legacy dashboards expect degrees. Publish **both** when teaching: Euler for gauges, quaternion for 3D Stage scenes.

## Classroom demo

On the **live Euler demo**, rotate slowly through high pitch and watch rate coupling — compare with quaternion 3D view on the next demo slide.
