# Slide 03 — Accelerometer

**Key talking points:**

- The accelerometer measures **specific force** (not gravitational acceleration directly)
- Resolution at ±2 g range: **0.061 mg/LSB** (16-bit ADC)
- At ±16 g: **0.488 mg/LSB** — 8× coarser, but wider dynamic range

**Waveform interpretation:**

- When stationary: Z channel should float around +1 g, X and Y near 0
- Motion adds dynamic acceleration on top of the gravity component
- Shake detection: look for |a| sudden spikes above threshold

**Common exercise:**

> "Tilt the board 90° — which axis picks up the full gravity component?"
> Answer: whichever axis now points upward (or downward).

**Engineering insight:**

- To measure **only dynamic acceleration**, subtract the gravity vector (low-pass filtered aX/Y/Z)
- To measure **orientation**, use only the static gravity component (low-pass filter)
