# Vector and quaternion math nodes

Catalog entries live in **`config/vector-quaternion-math-catalog.entries.ts`**. Evaluation: **`core/flow/vector-math-operations.ts`**, **`core/flow/quaternion-math-operations.ts`**, **`core/flow/flow-vector-quaternion-math-eval.ts`**.

## Conventions

- **Wire Euler:** `vector3` with **x = roll**, **y = pitch**, **z = heading (yaw)** in **radians** (same as BMI270 fusion Euler taps).
- **Quaternion:** `{ x, y, z, w }` (Studio / BS2 wire order).
- **Euler ↔ quaternion** nodes use **intrinsic ZYX** math. They do **not** apply firmware GLB axis remap — use **Transform from Euler** for fusion → Model Viewer paths.

## Node list (27)

| Id | Title |
|----|--------|
| `vector-length` | Vector Length |
| `vector-length-squared` | Vector Length² |
| `vector-normalize` | Normalize Vector |
| `vector-scale` | Vector Scale |
| `vector-add` | Vector Add (op: add / sub) |
| `vector-distance` | Vector Distance |
| `vector-dot` | Dot Product |
| `vector-cross` | Cross Product |
| `vector-lerp` | Vector Lerp |
| `vector-project` | Vector Project |
| `vector-reject` | Vector Reject |
| `vector-angle` | Angle Between Vectors |
| `compare-vector-length` | Compare Vector Length |
| `tilt-from-accel` | Tilt from Accel |
| `euler-heading` | Euler Heading |
| `accel-near-1g` | Accel Near 1 g |
| `degrees-to-radians` | Degrees to Radians |
| `radians-to-degrees` | Radians to Degrees |
| `quaternion-normalize` | Normalize Quaternion |
| `quaternion-multiply` | Multiply Quaternion |
| `quaternion-conjugate` | Quaternion Conjugate |
| `quaternion-inverse` | Quaternion Inverse |
| `quaternion-slerp` | Quaternion Slerp |
| `axis-angle-to-quaternion` | Axis Angle to Quaternion |
| `euler-to-quaternion` | Euler to Quaternion |
| `quaternion-to-euler` | Quaternion to Euler |
| `rotate-vector-by-quaternion` | Rotate Vector |

Related wiring nodes: **Split / Combine Vector**, **Split / Combine Quaternion**, constants **Vector** / **Quaternion**, scalar **Scalar Lerp** (catalog id `lerp`).

**Demo template:** Canvas inspector → **Run demo template** → **Vector magnitude** — Vector (3, 4, 0) → **Vector Length** → bar meter (live value **5**).

## UI

- Socket-only cards (`defaultVisible: true` in Shift+A under **Utilities** / **Logic**).
- Inspector hints via **`VectorQuaternionMathSettingsSection`**; **Vector Add** and **Compare Vector Length** expose operation selectors on the Node tab.

## Tests

`extension/tests/sensor-studio/vector-quaternion-math-operations.test.ts`
