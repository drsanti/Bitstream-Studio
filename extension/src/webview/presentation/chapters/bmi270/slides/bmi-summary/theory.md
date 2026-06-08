## BMI270 chapter recap

### Core ideas

- **6-DoF IMU** = tri-axis accel + tri-axis gyro
- Accel measures **specific force** ($\approx 1\,\text{g}$ at rest on a support)
- Gyro measures **$\omega$**; integration **drifts** without fusion
- **Right-hand frame** explains static accel signatures

### MEMS (qualitative)

- Accel: proof mass + **differential capacitance**
- Gyro: **Coriolis** coupling from a resonating mass

### Integration

| Item | Value |
|------|-------|
| `sensorId` | `0` |
| Decode | `bmi270.ts` |
| Masks | `0x01` ACC … `0x10` QUAT |

### Demos you ran

- Live connection snapshot
- 3D board orientation
- Accel waveforms and MEMS animation
- Gyro dials and activity classifier
- Configuration lab (draft SENSOR_CFG in UI)

## Next chapter

**Euler & Quaternion** — why fusion exists, Euler vs quaternion, live attitude fields (`0x08`, `0x10`).

## Further sensors

| Chapter | `sensorId` | Sensor |
|---------|------------|--------|
| BMM350 | `1` | Magnetometer |
| SHT40 | `2` | RH / temperature |
| DPS368 | `3` | Barometric pressure |

## Practice suggestions

1. Predict accel vector for three board poses before looking at live data
2. Enable only ACC+GYR in publish mask, then add QUAT and compare 3D view
3. Build a one-widget Dashboard flow from the BMI270 node
