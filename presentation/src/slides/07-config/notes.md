# Slide 07 — Sensor Configuration

**Key talking points:**

- Range and ODR are the two most impactful configuration parameters
- They trade off **resolution vs. dynamic range** and **bandwidth vs. noise**

**Range / Resolution trade-off:**

| Range   | Resolution   | Use case              |
|---------|--------------|-----------------------|
| ±2 g    | 0.061 mg/LSB | Wearable, low vibration |
| ±4 g    | 0.122 mg/LSB | Walking, running      |
| ±8 g    | 0.244 mg/LSB | Industrial vibration  |
| ±16 g   | 0.488 mg/LSB | High-g impacts        |

**ODR / Bandwidth trade-off:**

- Higher ODR → more samples/second → wider bandwidth → more current
- BMI270 at 1600 Hz: ~850 µA vs. 550 µA at 100 Hz
- Anti-aliasing filter cutoff tracks ODR automatically

**Write protocol (live demo):**

- Click "Write to Firmware" — this publishes a `bitstream2/req` JSON message to the T3D WS broker
- The bridge forwards it as a UART frame to the MCU
- Firmware responds on `bitstream2/res` (visible in Bitstream Studio terminal)

**Warning to mention:**

> Changing range mid-stream shifts the LSB scale — recalibrate any orientation filters after changing range
