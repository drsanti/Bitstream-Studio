## Applications

- **Compass-style heading** for kiosk orientation and rough yaw when the board stays level.
- **Proximity / tamper hints** when |B| jumps from nearby magnets or enclosure changes.
- **Multi-sensor context** — combine with **BMI270** attitude for richer operator views.

## Sensor Studio workflow

1. Add **BMM350** input or tap nodes (field vector, heading, temperature).
2. Wire outputs to gauges, compass widgets, or threshold LEDs on the Dashboard.
3. Match publish modes with the Bitstream sensor configuration deck.
