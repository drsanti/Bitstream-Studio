## Euler vs quaternion — engineering trade-offs

Use **both** in a product: each wins in different layers of the stack.

## Comparison table

| Topic | Euler | Quaternion |
|-------|-------|------------|
| Human readability | Excellent — degrees on dashboards | Opaque without practice |
| 3D graphics | Gimbal lock risk at extreme pitch | Smooth SLERP, no gimbal rings |
| Singularities | At $\pm 90°$ pitch (typical seq.) | None on unit sphere |
| Storage | 3 angles | 4 numbers + constraint |
| BS2 mask | `0x08` | `0x10` |

## Interpolation

Quaternion **SLERP** (spherical linear interpolation) follows the shortest rotation path — preferred for animation and camera blends.

Euler interpolation component-wise is **not** rotation-invariant and can take the “long way” around.

## Conversion

Given unit quaternion $q$, extract Euler only with a **fixed convention** and handle singularities explicitly — host utilities should document axis order.

## Teaching workflow

1. Introduce attitude with **Euler** (intuition)
2. Show **gimbal lock** failure mode
3. Introduce **quaternion** as the robust representation
4. Run **both demos** side by side from the same fusion filter

## When to log which

| Log Euler | Log quaternion |
|-----------|----------------|
| Operator displays | Robotics / graphics replay |
| Quick classroom plots | Sensor Studio 3D drives |
