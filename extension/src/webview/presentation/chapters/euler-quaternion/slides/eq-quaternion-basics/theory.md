## Unit quaternion

A **unit quaternion** represents a 3D rotation with four components:

$$
q = (w, x, y, z), \quad x^2 + y^2 + z^2 + w^2 = 1
$$

For a rotation of angle $\theta$ about unit axis $\hat{\mathbf{n}}$:

$$
w = \cos\frac{\theta}{2}, \quad (x, y, z) = \hat{\mathbf{n}} \sin\frac{\theta}{2}
$$

## Why the half-angle?

Quaternions encode rotation in a way that avoids gimbal lock and interpolates smoothly (SLERP). The half-angle form is the standard Hamilton convention used in graphics and many fusion libraries.

## Composition

Rotation $q_2$ followed by $q_1$ (applied to vector $\mathbf{v}$ as $q_1 \otimes q_2$ depending on convention) is quaternion multiplication. Always document your product order when comparing with datasheets or firmware.

## Comparison with Euler angles

| Representation | Pros | Cons |
|----------------|------|------|
| Euler $(\phi,\theta,\psi)$ | Human-readable | Gimbal lock, order-dependent |
| Quaternion $(w,x,y,z)$ | Compact, smooth blend | Less intuitive at first |

## BS2 wire format

Fusion quaternion samples use mask bit `0x10`. The on-wire payload carries **scaled integers** — normalize and convert to float on the host using the documented scale factor before using in 3D scenes or math.

## Normalization

Drift from integration or numerical noise can break the unit constraint. Fusion filters re-normalize periodically:

$$
q \leftarrow \frac{q}{\|q\|}
$$
