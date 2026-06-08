# Slide 06 — Activity Recognition

**Key talking points:**

- This is a **threshold classifier** — the simplest possible activity detection
- Real-world products use machine learning (e.g., BMI270 built-in context recognition engine)

**Classifier logic walkthrough:**

1. Compute scalar magnitude: `|a| = √(ax² + ay² + az²)`
2. Apply threshold comparisons in priority order
3. Walking detection uses a zero-crossing counter over a 2-second sliding window

**BMI270 on-chip features (hardware classifiers):**

- **Step counter** — ISO-calibrated, ultra-low power
- **Significant motion** — wakes MCU only on real movement
- **No-motion / Any-motion** — detects stillness vs. motion
- **Activity recognition** — stationary / walking / running (on-chip ML)

**Demo interaction:**

> Try: hold flat → show "Flat" · tilt → "Tilted" · shake vigorously → "Shake"
> Show how the confidence bar changes — in a real product this would be a probabilistic output

**Engineering insight:**

- BMI270's on-chip classifiers run at ~400 µA, saving the host MCU from waking up
- This is the key advantage over a standalone gyro/accel chip
