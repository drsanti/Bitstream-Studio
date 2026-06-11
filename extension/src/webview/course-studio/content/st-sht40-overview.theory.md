# SHT40 — Overview & physical principles

**Hardware:** TESAIoT DevKit — on-board **SHT40** environmental sensor (KIT_PSE84_AI only, schematic **U22**).

The **SHT40** answers one question: *"How warm and how moist is the air near the board?"*

It reports two scalar readings:

- **Air temperature** at the chip (°C)
- **Relative humidity** (%RH) — how much moisture the air holds compared to the maximum it could hold at that temperature

---

## Learning outcomes

After this topic you should be able to:

1. Explain what temperature and relative humidity mean in plain language.
2. Read live SHT40 values in **Sensor Telemetry** and name value + unit aloud.
3. Map humidity (or temperature) to a 0–100% progress bar using a chosen range.
4. Describe where SHT40 fits in the workshop (Ch2 telemetry, Ch4 Studio, Ch5 pipelines, Ch6 Course Studio).

---

## Where SHT40 fits in the workshop

| Workshop chapter | SHT40 role |
|------------------|------------|
| **Ch2** — Sensor Telemetry | Live temp/humidity readouts; humidity progress bar |
| **Ch4** — Sensor Studio | SHT40 node → gauge; optional °C → °F **Math** node |
| **Ch5** — Pipelines | Weather strip with SHT40 + DPS368 |
| **Ch6** — Course Studio | Thermometer / droplet widgets on a lesson page |

---

## Embedded identity

| Item | Value |
|------|--------|
| **Part** | SHT40 (Sensirion) |
| **BS2 sensorId** | `2` |
| **Catalog id** | `sht40` |

**Software stack:**

```text
SHT40 chip (I²C 0x44)
  → Sensirion sht4x driver + platform HAL
  → sensor_sht40 (TESAIoT CM55 module)
  → bitstream_sensor_port_cm55_sht40
  → bitstream_bs_sensor — bs_pack_sht40_evt()
  → UART BS2 frame → host decode → Bitstream Studio UI
```

---

## Temperature

**Temperature** measures how hot or cold something is. On the SHT40 it is **air temperature at the chip**, in **degrees Celsius (°C)**.

Warmer air means faster molecular motion. When you cup the board, your hands transfer heat; the reading drifts up over several seconds.

Typical indoor workshop band: **20–30 °C**. The sensor catalog allows **−40 … 125 °C**, but classroom dashboards usually map **0–50 °C** so the bar is readable.

---

## Relative humidity

**Relative humidity (%RH)** is *not* "how many millilitres of water are in the air." It is the **percentage of saturation** at the current temperature.

Think of warm air as a bigger sponge: it can hold more water vapour. **62 %RH** means the air holds 62% of the maximum it could hold at that temperature.

Important coupling: if temperature rises and moisture stays the same, **%RH often drops** because the "sponge" grew. Trainees should expect temp and RH to move together in some demos.

Comfort band for people and many stored goods: roughly **30–60 %RH**. Below ~30% feels dry; above ~70% encourages mould in long-term storage.

**Dew point (teaser):** When RH reaches 100% at a given temperature, water condenses. Cold-chain and museum labs care about staying below that point.

---

## Sensing elements (embedded)

| Quantity | Element | Mechanism |
|----------|---------|-----------|
| **Temperature** | Band-gap / silicon junction | Junction voltage vs temperature; factory-calibrated |
| **Humidity** | Capacitive polymer dielectric | Water absorption changes capacitance → %RH |

**Datasheet conversion** (from raw 16-bit ticks):

```text
T (°C)  = (175 × T_ticks / 65535) − 45
RH (%RH) = (125 × RH_ticks / 65535) − 6
```

The Sensirion driver exposes **millidegrees** and **milli-%RH** (e.g. `25000` → 25.000 °C, `62000` → 62.0 %RH).

**Typical accuracy (high-precision mode):**

| Parameter | Typical |
|-----------|---------|
| Temperature | ±0.2 °C at 25 °C |
| Humidity | ±1.8 %RH at 25 °C, 33–75 %RH |
| Resolution | 0.01 °C / 0.01 %RH |
| Response time τ63 | ~3–4 s (humidity) |

---

## Thermal mass and self-heating

The SHT40 sits on the PCB next to the MCU and other sensors. The board has **thermal mass**: it warms and cools slower than free air. Readings lag real air changes by seconds.

Frequent high-precision I²C reads (~10 ms each) add a small **self-heating** effect in still, enclosed volumes. For climate logging, **1–5 Hz** is usually enough.
