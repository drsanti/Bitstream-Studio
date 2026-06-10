## Relative humidity basics

**Relative humidity (%RH)** compares current vapor pressure to saturation at the same temperature. At 100 %RH the air cannot hold more water at that temperature without condensation.

On the wire, humidity is often published as **%RH×100** in the secondary field when the **HUM** mask bit is set. Host decode maps this to a floating %RH value for dashboards and course blocks.

## Comfort zones (simplified)

For indoor operator comfort, a common teaching band is roughly:

| Zone | Temperature | %RH (indicative) |
|------|-------------|------------------|
| Too dry | any | below ~30 %RH |
| Comfortable | ~20–26 °C | ~30–60 %RH |
| Too humid | warm | above ~60 %RH |

These are teaching guides — not HVAC specifications. Pair **T** and **%RH** before classifying comfort.

## Signal quality

- Enable **SHT40** in sensor configuration and set a publish interval appropriate for slow environmental drift (often 500 ms–2 s).
- Watch **valid** flags — stale or partial frames should not drive alarms.
- Compare against a reference hygrometer when validating bench setup.
