## BMI270 training chapter

This chapter covers the **Bosch BMI270** — a 6-DoF inertial measurement unit (IMU) with on-chip motion features — as it appears on the **TESAIoT** platform and in **Bitstream Studio**.

## Prerequisites

- Basic vectors and units (m/s², °/s, g)
- Familiarity with Bitstream Studio workspaces (Sensor Telemetry minimum)
- Optional: completion of the **Bitstream Studio platform** presentation chapter

## What you will build mentally

By the end you should be able to:

1. Read tri-axis accel and gyro from the live store
2. Explain specific force vs angular rate
3. Decode BMI270 **EVT_SENSOR** mask fields on the wire
4. Connect the same data in **Sensor Studio** flow graphs

## Chapter rhythm

| Section | Focus |
|---------|--------|
| Opening | Objectives and scope |
| Foundations | Physics before silicon |
| Product | Datasheet-level facts |
| MEMS | How capacitive sensing works |
| Demos | Live proof with hardware or Simulator |
| Integration | Wire format + Studio node |

## BS2 identity

| Field | Value |
|-------|-------|
| `sensorId` | `0` |
| Canonical decode | `extension/src/bitstream2/domains/sensors/bmi270.ts` |

## Next chapter

After BMI270, continue to **Euler & Quaternion** for attitude fusion outputs (mask `0x08` / `0x10`).
