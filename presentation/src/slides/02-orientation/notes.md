# Slide 02 — Coordinate System

**Key talking points:**

- BMI270 uses a **right-hand coordinate system** (same as most MEMS IMUs)
- **Specific force convention** (not raw gravity): sensor measures reaction force
  - Flat on table → aZ = **+1 g** (table pushing up against gravity)
  - Free fall → aZ = **0 g** (no reaction force)
- All three axes are orthogonal; the chip can be mounted in any orientation — software rotation matrix corrects for PCB mounting

**3D model interaction:**

- Drag to orbit, scroll to zoom
- When live data is connected, the model rotates using the **quaternion** output — fully fused, drift-compensated
- In simulation mode, Euler angles drive the rotation

**Common mistake to address:**

> Students often think "flat = 0 g on Z because gravity is balanced."
> Clarify: the accelerometer does NOT measure gravity directly — it measures the **contact/reaction force** from whatever is pushing on the proof mass.
