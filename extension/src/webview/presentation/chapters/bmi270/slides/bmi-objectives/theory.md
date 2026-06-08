## Learning objectives

After this chapter you should be able to:

### Conceptual

- Distinguish **accelerometer** (specific force, includes gravity reaction when supported) from **gyroscope** (angular rate $\omega$)
- Describe a **right-hand sensor frame** and predict static accel signs for common board poses
- Explain why **gyro integration drifts** and why **fusion** exists (preview — full treatment in the Euler chapter)

### Product & MEMS

- Summarize BMI270 datasheet-level capabilities (ranges, ODR, on-chip features) without register-level programming
- Describe capacitive MEMS accel and Coriolis MEMS gyro at a block-diagram level

### Integration

- Map **EVT_SENSOR** mask bits to payload fields for `sensorId = 0`
- Locate decoded values in `useBitstreamLiveStore` and wire them in Sensor Studio

## Skills checklist

| Skill | Evidence |
|-------|----------|
| Read live accel | Demo: accel waveforms, $|a| \approx 1$ g at rest |
| Read live gyro | Demo: rate dials while rotating board |
| Configure ranges | Lab: ODR / full-scale trade-offs (draft in Telemetry deck) |
| Decode mask | Integration slide + host `bmi270.ts` |

## Out of scope (this chapter)

- Full BS2 framing specification (see platform chapter)
- Magnetometer-assisted heading (BMM350 chapter)
- Writing SENSOR_CFG to firmware (v0.1 draft-only in webview)
