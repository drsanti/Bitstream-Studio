# SHT40 — Reference & knowledge check

Use cases, pitfalls, instructor notes, and quick reference tables.

---

## Real-world use cases

| Domain | Why SHT40 |
|--------|-----------|
| **HVAC / comfort** | Room temp + RH for occupant comfort and energy control |
| **Cold-chain** | Alert when temp or RH leaves safe band for food and pharma |
| **Cleanrooms / labs** | Humidity control for processes and static mitigation |
| **Greenhouses** | Crop climate monitoring |
| **Museums / archives** | Prevent mould (high RH) and brittle materials (very low RH) |

**Embedded product notes:**

- **Mounting:** Sensor must sense **ambient** air, not PCB temperature alone.
- **Thresholds:** Implement alarms in firmware or use `on_change` + `deltaX100` on host.
- **Logging:** 0.33–1 Hz typical for battery loggers; burst to 5 Hz for UI sessions.
- **Pair with pressure:** SHT40 + DPS368 = minimal **weather station** without IMU.

---

## Limitations, pitfalls, and debug

### Workshop FAQ

| Question | Answer |
|----------|--------|
| Why don't values change instantly? | PCB thermal mass and air flow delay. |
| Why did RH drop when I warmed the board? | Relative humidity is relative to temperature; warming expands the "sponge." |
| Simulator vs DevKit? | Same fields and UI; DevKit proves real physics. |

### Embedded debug table

| Symptom | Likely cause | What to check |
|---------|--------------|---------------|
| Init probe failed | I²C not ready, wrong address | State, manager logs, `0x44` vs `0x45` |
| Port returns `-2` | Read failed | `sensor_sht40_get_last_result()`, CRC / bus lock |
| Frozen UI value | EVT stopped, USB drop | Link state, `staleAfterMs` (600 ms) |
| RH jumps at temp step | Physics coupling | Expected; teach relative humidity |
| CFG SET timeout | UART saturated | Slow other sensors; interval ≥ 500 ms; retry |

**Caution:** Do not point a hot air gun at the sensor for demos.

---

## Knowledge check

1. What two quantities does the SHT40 report on the DevKit?
2. What does **62 %RH** mean in plain language?
3. Map **25 °C** to a bar with range **0–50 °C**.
4. What are the BS2 mask bits for temperature and humidity?
5. In what order does `EVT_SENSOR` pack SHT40 channels when mask is `0x03`?
6. What is `wireScale` for SHT40 fields on the host?
7. What I²C address does TESAIoT firmware use by default?
8. Why must I²C transactions use `cm55_i2c_manager` lock on this board?
9. What does port return code **-2** mean?
10. Name one Industry 4.0 use case for temp + humidity monitoring.

### Answers

1. Air **temperature (°C)** and **relative humidity (%RH)**.
2. The air holds 62% of the maximum water vapour it could hold at the current temperature.
3. `(25 − 0) / (50 − 0) × 100` = **50%**.
4. TEMP = `0x01`, HUM = `0x02`.
5. **TEMP**, then **HUM**.
6. **100** — host divides wire int16 by 100.
7. **0x44**.
8. SHT40 shares Bus 1 with BMI270; lock prevents concurrent transfers.
9. `sensor_sht40_read()` failed in the bitstream sensor port.
10. Examples: HVAC comfort, cold-chain compliance, cleanroom humidity control.

---

## Instructor notes

- **Timing:** ~5 minutes per workshop lab; full chapter supports **45–60 min** or split across Ch2 + Ch4.
- **Simulator fallback:** Toolbar **Simulator** + **Link** — synthetic sine on temperature and humidity.
- **First sensor:** SHT40 is the gentlest intro (scalars, slow, intuitive physics) before IMU vectors and magnetometer distortion.
- **Protocol changes:** Follow `extension/docs/BS2_PROTOCOL_INDEX.md` and sync firmware + simulator.

---

## Quick reference

### Workshop cheat sheet

| Item | Value |
|------|-------|
| Role | How warm and how moist is the air near the board? |
| Readings | Temperature, Humidity |
| Units | °C, %RH |
| Workshop bar ranges | 0–50 °C, 0–100 %RH |
| Try it | Cup hands → temp up; fan → RH down |

### Embedded cheat sheet

| Item | Value |
|------|-------|
| BS2 sensorId | `2` |
| I²C address | `0x44` (Bus 1, 1.8 V) |
| Mask / default | `0x03` (TEMP + HUM) |
| EVT order | TEMP → HUM |
| Wire encoding | int16 LE, scale ×100 |
| Field keys | `temperatureC`, `humidityPct` |
| Default sample interval | 200 ms (5 Hz) |
| staleAfterMs | 600 |
| Host decode | `extension/src/bitstream2/domains/sensors/sht40.ts` |
