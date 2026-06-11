# Vehicle GLB authoring guide (Bitstream Studio)

Authoring rules for **vehicle physics** GLB/GLTF assets used in the Vehicle Physics simulation (`extension/src/webview/simulations/vehicle-physics/`).

**Audience:** 3D artists, technical artists, and engineers exporting from Blender (or similar DCC tools).

**Canonical code reference:** `utils/vehicleConfigUtils.ts` (`extractVehicleModels`).

---

## 1. Design principles

| Principle | What it means |
|-----------|----------------|
| **Role names, not brand names** | Use `wheel_left_front`, not `tesla_wheel_fl` or `sedan_v2_wheel`. Vehicle identity lives in the **file name** and catalog, not on every node. |
| **Same names across all cars** | Every four-wheel vehicle GLB uses the same part names so one runtime loader works for all types. |
| **Visual parent, collider child** | Each drivable part is a **visual** object. Its **physics proxy** is a **child** mesh named `{part}_collider`. |
| **One GLB per vehicle** | Export one self-contained vehicle file (e.g. `sedan_colliders.glb`). Do not mix unrelated vehicles in one file. |
| **Separate arena props** | Floor, balls, and other environment props belong in a **scene/arena** GLB unless you intentionally ship a demo bundle. |

---

## 2. Standard four-wheel layout

This matches the current Jolt four-wheel vehicle (`FourWheelVehicle.ts`).

```
root                          # empty group — scene / export pivot (no mesh)
├── car_body                  # chassis visual (mesh or group)
│   └── car_body_collider     # chassis physics proxy
├── wheel_left_front
│   └── wheel_left_front_collider
├── wheel_right_front
│   └── wheel_right_front_collider
├── wheel_left_rear
│   └── wheel_left_rear_collider
└── wheel_right_rear
    └── wheel_right_rear_collider
```

### Required part names (runtime lookup)

| Part | Object name | Used for |
|------|-------------|----------|
| Root | `root` | Recommended export root (optional for code; good practice) |
| Chassis visual | `car_body` | Body mesh attached to vehicle physics body |
| Front left wheel | `wheel_left_front` | Wheel visual + suspension attachment |
| Front right wheel | `wheel_right_front` | Same |
| Rear left wheel | `wheel_left_rear` | Same |
| Rear right wheel | `wheel_right_rear` | Same |

### Wheel naming pattern

```
wheel_{left|right}_{front|rear}
```

- **Side first** (`left` / `right`), then **axle** (`front` / `rear`).
- Do **not** use `wheel_front_left` (wrong order for this project).

### Collider naming pattern

```
{visual_part_name}_collider
```

Examples: `car_body_collider`, `wheel_left_front_collider`.

---

## 3. Collider authoring

### Hierarchy

- Collider mesh is a **child** of the visual part object.
- Collider children should use **identity local transform** (0,0,0 position, no extra rotation) when the proxy is aligned in the parent’s local space.
- The collider inherits the parent’s translation, rotation, and scale in the scene.

### Geometry

- Use **simple primitives** where possible: box for body, cylinder/capsule for wheels.
- Collider meshes may be slightly larger than visuals (~1% padding) to reduce tunneling.
- Keep collider meshes **low complexity** when possible; high-poly colliders work but cost more at cook time.

### Materials (recommended)

- Assign all collider meshes a dedicated material named **`collider_material`**.
- Use a distinct color in Blender so proxies are easy to spot.
- At runtime, collider meshes should be **hidden from rendering** (artist can set invisible in viewport; engineering may strip/hide on load).

### Custom properties (optional)

You may add a Blender custom property `collider` on proxy objects. For it to appear in glTF:

1. Blender **File → Export → glTF 2.0**
2. Enable **Export Custom Properties**

Without that option, rely on **`*_collider` names** and **`collider_material`** (both are sufficient today).

---

## 4. Naming rules (all vehicles)

1. **snake_case** only — `wheel_left_front`, not `WheelLeftFront` or `wheel-left-front`.
2. **Unique names** under the vehicle root — duplicates break `getObjectByName` lookup.
3. **No spaces** in object names.
4. **ASCII letters, numbers, underscore** — avoid special characters.
5. **No vehicle model prefix on parts** — put model id in the file name: `forklift_colliders.glb`, not `forklift_wheel_left_front` inside every node.

---

## 5. File naming

| Asset type | Pattern | Example |
|------------|---------|---------|
| Vehicle | `{type}_colliders.glb` or `{type}.glb` | `car_colliders.glb`, `van_colliders.glb` |
| Arena / demo scene | `{scene}_arena.glb` | `vehicle_arena.glb` |

Store vehicle GLBs under `extension/src/assets/models/` (or the path your catalog/manifest points to).

---

## 6. Environment props (arena GLB)

The legacy demo bundle may include these names in the **same** GLB. For a multi-vehicle pipeline, put them in a **separate** arena file:

| Name | Role |
|------|------|
| `floor` | Static ground mesh / collider |
| `ball` | Template mesh for spawned physics balls |
| `prank` | Template mesh for spawned props |

Pure vehicle files should **omit** these unless you are shipping a one-file demo.

---

## 7. Optional parts (future / extras)

Only include what the vehicle needs. Suggested names if you add them:

| Part | Name |
|------|------|
| Steering wheel (cabin) | `steering_wheel` |
| Door | `door_left_front`, `door_right_front`, `door_left_rear`, `door_right_rear` |
| Hood / trunk | `hood`, `trunk` |
| Chase camera mount | `camera_chase` |
| Headlight / tail light | `light_head_left`, `light_tail_right` |

Collider follow-up: `{part}_collider` when that part needs its own physics shape.

---

## 8. Other vehicle families (future)

Use the same **role vocabulary**. Extend with axle index when there are more than two axles.

### Six-wheel truck (example)

```
wheel_left_front
wheel_right_front
wheel_left_rear_1
wheel_right_rear_1
wheel_left_rear_2
wheel_right_rear_2
```

### Motorcycle (example)

```
body          # or car_body if sharing four-wheel loader aliases
wheel_front
wheel_rear
```

### Tracked vehicle (example)

```
body
track_left
track_right
```

**Note:** Multi-layout vehicles need a manifest (`wheelCount`, `layout`) and loader support before these names are wired in code. Agree on names with engineering before authoring.

---

## 9. Blender export checklist

1. **Object names** match this document (§2 required table).
2. **Hierarchy:** visual parent → `{name}_collider` child.
3. **Apply transforms** where appropriate (`Ctrl+A` → Rotation & Scale on parts before export).
4. **Export format:** glTF **`.glb`** (binary).
5. **Custom properties:** enable if using `collider` extras; otherwise names + material are enough.
6. **Pivot:** `root` at the intended vehicle origin (ground contact or design pivot — document choice per vehicle).
7. **No extra cameras/lights** in pure vehicle files unless required.
8. **Validate** in a glTF viewer: tree matches §2, wheel names spelled exactly.

---

## 10. Artist validation checklist

Before handoff:

- [ ] File name identifies the vehicle (`{type}_colliders.glb`).
- [ ] `car_body` exists and is the chassis visual parent.
- [ ] Four wheels named `wheel_left_front`, `wheel_right_front`, `wheel_left_rear`, `wheel_right_rear`.
- [ ] Each of the five parts has a `{name}_collider` child.
- [ ] Collider meshes use `collider_material` (or equivalent single proxy material).
- [ ] No duplicate object names under `root`.
- [ ] Wheel naming uses `left|right` **before** `front|rear`.
- [ ] Colliders are simple primitives aligned to visuals.
- [ ] Environment props (`floor`, `ball`, `prank`) only if this is a demo/arena bundle.

---

## 11. Runtime behavior (engineering reference)

| Topic | Current behavior |
|-------|------------------|
| Visual lookup | `extractVehicleModels()` uses `getObjectByName` for §2 table |
| Body physics | Procedural Jolt **box** from config (`halfVehicleWidth`, etc.) — **not** yet from `car_body_collider` |
| Wheel physics | Jolt **vehicle constraint** (ray/cylinder/sphere cast) — **not** yet from wheel collider meshes |
| Collider discovery (future) | `*_collider` suffix and/or `collider_material` |
| GLB preview elsewhere | Catalog / Sensor Studio use **authored transform** — do not auto-center vehicle GLBs meant for physics |

When collider-from-GLB is implemented, the hierarchy and names in this document are the contract artists should follow.

---

## 12. Example reference asset

**Path:** `extension/src/assets/models/car_colliders.glb`

Validated structure:

```
root
├── car_body
│   └── car_body_collider
├── wheel_left_front
│   └── wheel_left_front_collider
├── wheel_left_rear
│   └── wheel_left_rear_collider
├── wheel_right_front
│   └── wheel_right_front_collider
└── wheel_right_rear
    └── wheel_right_rear_collider
```

---

## Related files

| File | Role |
|------|------|
| `utils/vehicleConfigUtils.ts` | Loads visual parts from GLB |
| `vehicle/FourWheelVehicle.ts` | Jolt vehicle sim |
| `config/vehicleConfig.ts` | Default physics dimensions |
| `config/modelConfig.ts` | Default model path (legacy remote GLB) |
| `../model-catalog/HOW_TO_EXPORT_MODEL.md` | Catalog thumbnail / camera export (different use case) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | Initial guide from `car_colliders.glb` authoring session |
