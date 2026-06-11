# DPS368 — Overview & physical principles

**Hardware:** TESAIoT DevKit — on-board **DPS368** barometric pressure sensor (KIT_PSE84_AI only, schematic **U6**).

The **DPS368** answers: *"What is the air pressure around the board?"*

It reports:

- **Barometric pressure** in **hPa** (hectopascals) — the same unit family weather apps use
- **Chip temperature** in **°C** — mainly for internal compensation; useful as a secondary reading

In a one-room workshop, pressure looks **stable** unless the air mass changes (door to outside, HVAC cycle) or you tell an **altitude / weather** story. A reading near **1013 hPa** is ordinary at sea level.

---

## Learning outcomes

After this topic you should be able to:

1. Explain barometric pressure and why it is measured in hPa.
2. Read live DPS368 pressure in **Sensor Telemetry** and interpret the sea-level band (900–1100 hPa).
3. Map pressure to a 0–100% bar using a chosen min/max.
4. Pair DPS368 with SHT40 for a minimal weather panel narrative.

---

## Where DPS368 fits in the workshop

| Workshop chapter | DPS368 role |
|------------------|-------------|
| **Ch2** — Sensor Telemetry | Optional pressure bar; numeric readout |
| **Ch4** — Sensor Studio | DPS368 node → bar meter or numeric display |
| **Ch5** — Pipelines | Weather strip with SHT40 + DPS368 |
| **Ch6** — Course Studio | Manometer column or pressure ring widget |

---

## Embedded identity

| Item | Value |
|------|--------|
| **Part** | DPS368 (Infineon XENSIV) |
| **BS2 sensorId** | `3` |
| **Catalog id** | `dps368` |

**Software stack:**

```text
DPS368 chip (I²C 0x77)
  → xensiv_dps3xx driver + MTB HAL
  → sensor_dps368 (TESAIoT CM55)
  → bitstream_sensor_port_cm55_dps368
  → bs_pack_dps368_evt()
  → UART BS2 frame → host decode → Bitstream Studio UI
```

---

## Atmospheric pressure

**Air pressure** is the weight of the atmosphere pressing on everything at your altitude, expressed in **hectopascals (hPa)**:

- **1 hPa = 100 Pa**
- Weather reports often use hPa (or mb — numerically the same)

At sea level, typical station pressure is about **1013 hPa**. In a classroom:

- **900–1100 hPa** is a good **sea-level band** for gauges and lesson narrative
- Slow drift over minutes may reflect HVAC or an open door — not a sensor fault

---

## Pressure vs altitude vs weather

| Effect | What trainees should expect on the desk |
|--------|----------------------------------------|
| **Lift the board 30 cm** | Almost no visible change |
| **Weather front / air mass** | Slow change over hours |
| **Open door to outside air** | Pressure may shift slightly; pair with SHT40 |
| **AC cycle** | Very small drift possible |

Teach the **weather band** story, not elevator physics at desk scale.

---

## Chip temperature (secondary)

The DPS368 die temperature is **not** a room thermometer. It tracks the **chip package** and helps compensate pressure readings. Show it as optional meta beside the main pressure readout.

**Do not confuse** SHT40 environmental temp with DPS368 **chip** temp — different physical meaning.

---

## Sensing principle (embedded)

The DPS368 is a **MEMS barometer**: a thin membrane deflects with ambient pressure; factory **calibration coefficients** convert deflection to digital pressure.

**Unit chain to the UI:**

```text
Driver: pressure_pa (float, Pa)
Port:   normalize → pressure_hpa (float)
Wire:   pressure_hpa × 10 → int16 (hPa×10)
Host:   ÷ wireScale 10 → pressureHpa (float, hPa)
```

Example: **101325 Pa** → **1013.25 hPa** → wire **10133** → display **1013.3 hPa** (0.1 hPa wire resolution).

| Parameter | Typical |
|-----------|---------|
| Pressure range | 300–1200 hPa |
| Pressure accuracy | ±1 hPa class |
| Wire resolution | 0.1 hPa (hPa×10 integer) |
