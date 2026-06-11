# DPS368 — Reference & knowledge check

Use cases, pitfalls, instructor notes, and quick reference tables.

---

## Real-world use cases

| Domain | Why DPS368 |
|--------|------------|
| **Weather stations** | Local barometric trend input |
| **Altitude / floor hint** | Drones, wearables — needs calibration |
| **HVAC / building** | Indirect air-density and weather context |
| **Leak / overpressure** | Wide 300–1200 hPa range (advanced) |

**Embedded product notes:**

- **Altimeter:** Requires sea-level reference and temperature compensation — not raw hPa alone.
- **Power:** 1 Hz often enough for weather logging.
- **Enclosure:** Provide a **vent** to ambient if the case is sealed.
- **Pair with SHT40:** Minimal environmental gateway — temp, RH, pressure.

---

## Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Pressure didn't change when I lifted the board. | Correct for desk height — ~0.12 hPa per metre near sea level. |
| Why two temperatures (SHT40 vs DPS368)? | SHT40 ≈ air near chip; DPS368 temp is **die temp** for compensation. |
| Simulator vs DevKit? | Same fields; DevKit shows real room pressure. |

### Embedded debug table

| Symptom | Likely cause | What to check |
|---------|--------------|---------------|
| Init error | Wrong address, I²C not ready | `0x77` vs `0x76`, manager ready |
| Port `-2` | Read failed after retries | Bus contention, DATA_NOT_READY |
| Pressure ~10× wrong | Unit normalize path | Raw Pa vs hPa in sample |
| Pressure stuck | EVT stopped / stale link | `staleAfterMs`, USB |
| Repeated re-init | 5-fail threshold | Power, wiring, oversampling |
| CFG timeout | UART saturated | Slow other sensors; retry SET |

---

## Knowledge check

1. What is the primary quantity the DPS368 measures for workshop demos?
2. What unit does Bitstream Studio use for pressure?
3. Map **1013 hPa** to a bar with range **900–1100 hPa**.
4. What is the BS2 sensorId for DPS368?
5. In what order are PRESS and TMP packed when mask is `0x03`?
6. What is `wireScale` for `pressureHpa`?
7. What I²C address does TESAIoT use by default?
8. Why does the port normalize pressure with Pa / hPa / kPa heuristics?
9. What does port return code **-2** mean?
10. Why is lifting the board a poor altitude demo?

### Answers

1. **Barometric pressure** (air pressure around the board).
2. **hPa** (hectopascals).
3. `(1013 − 900) / (1100 − 900) × 100` ≈ **56.5%**.
4. **3**.
5. **PRESS**, then **TMP**.
6. **10** (wire value is hPa×10).
7. **0x77**.
8. Driver returns **Pa**; port maps safely to hPa for consistent wire encoding.
9. Read failed after bounded retries in the bitstream sensor port.
10. Desk-height change is too small for a clear pressure delta; teach weather band instead.

---

## Instructor notes

- **Timing:** Pressure labs are calm — pair with SHT40 motion labs for pacing.
- **Narrative:** *"~1013 hPa at sea level"* is the anchor phrase for Ch2 and Ch6.
- **Simulator:** Gentle drift only — pressure should not jump like IMU accel.
- **Cross-chapter:** Weather strip bridges SHT40 (Ch1) and multi-sensor dashboards (Ch5–6).

---

## Quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | What is the air pressure around the board? |
| Primary reading | Barometric pressure |
| Unit | hPa |
| Sea-level band | 900–1100 hPa (~1013 normal) |
| Secondary | Chip temperature (°C) |
| Try it | Baseline → weather strip with SHT40 |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `3` |
| I²C address | `0x77` (Bus 1, 1.8 V) |
| Mask / default | `0x03` (PRESS + TMP) |
| EVT order | PRESS → TMP |
| Pressure wire | int16 LE, hPa×10, wireScale **10** |
| Temp wire | int16 LE, °C×100, wireScale **100** |
| Field keys | `pressureHpa`, `temperatureC` |
| Default sample interval | 200 ms (5 Hz) |
| staleAfterMs | 600 |
| Host decode | `extension/src/bitstream2/domains/sensors/dps368.ts` |
