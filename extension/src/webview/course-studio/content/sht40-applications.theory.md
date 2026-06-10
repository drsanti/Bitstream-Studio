## Applications

Environmental sensing supports operator-facing use cases beyond raw numbers:

- **Comfort monitoring** — classify warm/humid vs dry/cold zones for kiosk and lab signage.
- **Condensation risk** — rapid RH rise near cold surfaces; pair with DPS368 pressure context when teaching multi-sensor fusion.
- **HVAC sanity checks** — slow trends over minutes; not high-rate motion like IMU chapters.

## Sensor Studio workflow

1. Add an **SHT40** input or tap node (humidity / temperature / samples).
2. Wire outputs to **Dashboard** text gauges, trend plots, or LED thresholds.
3. Match publish modes and intervals with the Bitstream sensor configuration deck.

No firmware programming is required for visualization — configure publish fields on-device, then bind live paths in Studio.

## Course vs product deck

Course pages teach the **physics and bindings**. The Bitstream toolbar deck is the day-to-day operator view. Both consume the same decoded stream when **Bitstream** or **Simulator** is linked.
