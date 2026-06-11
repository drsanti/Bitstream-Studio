# BMM350 — Overview & physical principles

**Hardware:** TESAIoT DevKit — on-board **BMM350** 3-axis magnetometer (+ chip temperature).

The **BMM350** answers: *"What does the local magnetic field look like in X, Y, and Z?"*

It is a **magnetometer** — a sensor that measures magnetic field strength along three perpendicular axes. Workshop narrative is **compass-style**: rotate the board and watch X/Y/Z trade dominance, not navigation-grade north finding.

It reports:

- **Magnetic field** along **X, Y, Z** in **µT** (microtesla)
- **Chip temperature** in **°C** (secondary)

Earth's field is weak — on the order of **25–65 µT** depending on location — much smaller than the sensor's wide catalog range (±1000 µT).

---

## Learning outcomes

After this topic you should be able to:

1. Read mag X/Y/Z as a **three-axis vector** and state units (µT).
2. Explain why indoor "compass" demos show **relative** change, not true north.
3. Compute **field strength** \( |B| = \sqrt{x^2 + y^2 + z^2} \) for gauge demos.
4. Run rotation and magnet-proximity labs safely on the DevKit.

---

## Where BMM350 fits in the workshop

| Workshop chapter | BMM350 role |
|------------------|-------------|
| **Ch5** — Pipelines | BMM350 vector → gauge or compass-style graphic |
| **Ch6** — Course Studio | Three-axis bars or compass infographic on four-sensor dashboard |

BMM350 appears alongside BMI270 on the **four-sensor** Course Studio page — motion (IMU) and field (mag) are **separate** lessons by design.

---

## Embedded identity

| Item | Value |
|------|--------|
| **Part** | BMM350 (Bosch) — 3-axis magnetometer + temperature |
| **Kit** | **KIT_PSE84_AI** (U20, **I3C**) · Eval kit (U4, **I2C**) |
| **BS2 sensorId** | `1` |
| **Catalog id** | `bmm350` |

**Software stack:**

```text
BMM350 chip (I3C on AI DevKit)
  → Bosch BMM350_SensorAPI + bmm350_core wrapper
  → sensor_bmm350 (startup / read)
  → bitstream_sensor_port_cm55_bmm350 (axis cache)
  → bs_pack_bmm350_evt() via get_bmm350_axes()
  → UART EVT_SENSOR → decodeBmm350Values() → Bitstream Studio UI
```

---

## Magnetic field as a vector

A magnetometer measures the **magnetic flux density** **B** around the sensor. Bitstream Studio shows three components:

| Axis | Meaning |
|------|---------|
| **magX** | Field along board X |
| **magY** | Field along board Y |
| **magZ** | Field along board Z |

Together they form a **vector** fixed to the PCB. When you **rotate** the board in Earth's field, components swap and sign-change — like tipping a pencil in a gentle breeze.

**Field strength** (scalar from the vector):

```text
|B| = √(magX² + magY² + magZ²)
```

Near Earth's field alone, |B| is often **25–65 µT** — use this for "how strong is the background field?" stories, not for ±1000 µT full-scale bars.

---

## Earth field vs workshop band

| Band | Range | Use in class |
|------|-------|--------------|
| **Earth field** | ~25–65 µT total | Narrative only |
| **Workshop axis band** | **±100 µT** per axis | Progress bars — visible rotation |
| **Catalog full scale** | ±1000 µT | Sensor capability; strong magnet demos |

Bars mapped to ±100 µT will **saturate** if you bring a strong magnet close — that is expected; warn trainees before the jump demo.

---

## Not a navigation compass (here)

Uncalibrated magnetometer + **indoor distortion** (steel desks, speakers, motors, phone magnets) means heading from mag alone **will not point to geographic north** in the classroom.

Teach **relative** field change:

- Slow rotate flat on table → X and Y swap dominance
- Compare before/after moving near steel leg
- Do **not** promise aviation-grade compass without calibration and hard/soft-iron correction

---

## Chip temperature (secondary)

Die temperature supports internal compensation — same pattern as DPS368 secondary temp. It is not a room thermometer.

---

## At-rest checklist (live widgets)

| Check | Expect |
|-------|--------|
| Board flat, away from magnets | Stable X/Y/Z; |B| in Earth band |
| Slow rotate ~360° | X and Y trade dominance |
| Move near steel leg | Offset shift — distortion, not fault |
| MAG enabled + Apply | Scalars and cards update live |

---

## Related

- **Engineering** topic — I3C bus, axis cache, BS2 wire, host decode
- **Labs** topic — rotate, steel interference, field strength walkthroughs
- Workshop source: `extension/docs/workshop/sensor-theory/CH4_BMM350.md`
