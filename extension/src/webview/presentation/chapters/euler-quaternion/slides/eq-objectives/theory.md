## Learning objectives

After this chapter you should be able to:

### Fusion concept

- Explain why **gyro alone drifts** and **accel alone** is wrong under linear acceleration
- Describe a **complementary** blend at a high level (fast gyro + slow gravity correction)

### Representations

- Name **roll, pitch, yaw** (or heading) and read them from mask `0x08`
- Write the **unit quaternion constraint** and interpret $(w,x,y,z)$ as half-angle rotation
- State when **gimbal lock** affects Euler angles and why quaternions avoid that singularity

### Engineering choice

| Use Euler when… | Use quaternion when… |
|-----------------|---------------------|
| Human dashboards in degrees | 3D graphics, smooth blends |
| Teaching intuition | Avoiding singularities |
| BS2 mask `0x08` | BS2 mask `0x10` |

### Integration

- Enable EULER and/or QUAT in SENSOR_CFG publish mask
- Trace decode order ACC → GYR → TMP → EULER → QUAT in `bmi270.ts`

## Out of scope

- Full Kalman filter derivation
- Magnetometer heading correction (BMM350 chapter)
- Quaternion calculus for control (advanced robotics texts)
