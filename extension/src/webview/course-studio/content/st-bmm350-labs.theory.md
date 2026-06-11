# BMM350 — Hands-on labs & Bitstream Studio

Workshop labs on the DevKit plus embedded UART probes. Use toolbar **Bitstream** + **Link** (or **Simulator** as fallback).

---

## Workshop labs (DevKit)

### Lab 1 — Quiet baseline

1. Board flat, away from magnets and steel legs.
2. **Expect:** stable X/Y/Z; discuss Earth field as soft background; |B| often **25–65 µT**.

### Lab 2 — Slow rotate flat

1. Rotate board ~360° on table over 20 s.
2. **Expect:** X and Y trade dominance; Z may shift modestly — compass-style **relative** story.

### Lab 3 — Steel interference

1. Note values above open air.
2. Move board directly onto steel desk surface or near steel leg.
3. **Expect:** offset shift — distortion, not sensor fault.

### Lab 4 — Small magnet (caution)

1. Instructor only: bring a **small** magnet near U20 for 2 s.
2. **Expect:** large jump; bars may peg at ±100 µT scale.
3. Remove magnet; values settle after a few seconds.

### Lab 5 — Field strength readout

1. Watch **|B|** on the scalar widget or **Vector Length** in Sensor Studio.
2. **Expect:** |B| roughly tens of µT indoors — not hundreds.

### Lab 6 — Axis mask

1. Disable **Temp** channel, **Apply**.
2. Confirm EVT carries mag only (shorter payload).

---

## Embedded labs

### Lab 7 — UART probe

From `extension/`:

```bash
npm run bitstream2:uart-probe -- --path COMx --baud 921600
```

Filter `sensorId: 1`; verify three mag int16s then temp when mask `0x03`.

### Lab 8 — Read retry

Induce a single failed read (brief bus glitch); observe port retry and axis cache holding last good axes until next success.

---

## Build it in Bitstream Studio

### Sensor Telemetry

1. Open **BMM350** mag X/Y/Z readouts on the live cards above.
2. Rotate board while watching all three axes.

### Sensor Studio (Ch5)

1. **BMM350** magnetometer node → three numeric outputs or one **Radial Gauge** on a single axis.
2. **Vector Length** on mag vector → strength gauge.
3. Optional: compare with BMI270 **heading** from fusion — discuss why they disagree indoors.

### Course Studio (Ch6)

- Three-axis bars or compass-style infographic
- Caption: *"Local magnetic field — relative demo, not calibrated north"*

---

## Settings that matter

| Setting | Magnetometer lab suggestion |
|---------|----------------------------|
| **Enabled** | On for Ch5–6 mag widgets |
| **Sampling rate** | **10–20 Hz** default feel; **50 Hz** for snappy rotation demos |
| **Publish mode** | **On change** with `deltaX100 ≈ 50` (~0.50 µT) reduces UART noise when still |
| **Telemetry channels** | MAG enables all three axes; disable **Temp** to save bandwidth |

Always **Apply** after changes.
