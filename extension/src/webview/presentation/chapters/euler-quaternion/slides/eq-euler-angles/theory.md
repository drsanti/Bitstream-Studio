## Euler angles

**Euler angles** describe orientation as **three successive rotations** about coordinate axes — usually roll, pitch, and yaw (or heading).

## Common naming

| Angle | Axis (typical body frame) | Intuition |
|-------|---------------------------|-----------|
| Roll | $X$ | Bank left/right |
| Pitch | $Y$ | Nose up/down |
| Yaw / heading | $Z$ | Turn left/right |

Convention **order matters** (e.g. ZYX vs XYZ). BS2 publishes three radian values — align your UI labels with firmware convention documented in `bmi270.ts`.

## Rotation composition (concept)

A rotation matrix can be built from three elementary rotations $R_z(\psi) R_y(\theta) R_x(\phi)$ — order fixed by convention.

## BS2 wire format

Mask bit **`0x08` (EULER)** appends:

| Field | Scale |
|-------|-------|
| `heading_radx100` | ÷ 100 → rad |
| `pitch_radx100` | ÷ 100 → rad |
| `roll_radx100` | ÷ 100 → rad |

Display in degrees: multiply by $180/\pi$.

## Human-readable strength

Euler angles map directly to cockpit-style gauges — excellent for teaching and dashboards.

## Weakness preview

Near **gimbal lock** (next slide), two gimbal axes align and one Euler rate becomes ill-conditioned — same physical orientation, problematic parameterization.
