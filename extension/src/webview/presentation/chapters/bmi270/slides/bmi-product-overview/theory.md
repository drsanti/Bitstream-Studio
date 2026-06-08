## BMI270 product snapshot

High-level datasheet facts for instructors — **not** a register programming guide.

## Interfaces

| Interface | Notes |
|-----------|-------|
| I²C | Common on embedded modules |
| SPI | Higher throughput when wired |

TESAIoT firmware abstracts the bus; BS2 publishes decoded samples to the host.

## Accelerometer full-scale

| Range | Typical teaching use |
|-------|---------------------|
| $\pm 2\,\text{g}$ | Tilt, gentle motion |
| $\pm 4\,\text{g}$ | General purpose |
| $\pm 8\,\text{g}$ | Moderate impacts |
| $\pm 16\,\text{g}$ | Harsh vibration / shocks |

## Gyroscope full-scale

Typical configurable ranges from **$\pm 125$°/s** up to **$\pm 2000$°/s**. Match range to expected spin rate in your lab.

## Output data rate (ODR)

Higher ODR captures faster motion; increases bus bandwidth and processing load. “Up to 6.4 kHz” is sensor-dependent — verify against your firmware configuration.

## On-chip features

- Step counter and activity recognition
- FIFO buffering
- Interrupt lines for motion events

These can run while raw 6-DoF streams over UART — product integration varies by firmware build.

## Where to go deeper

- Bosch BMI270 datasheet (mechanical, electrical, register map)
- Host decode: `extension/src/bitstream2/domains/sensors/bmi270.ts`
- SENSOR_CFG: `extension/src/bitstream2/docs/SENSOR_CFG_V2.md`
