**Duration:** ~5 min

**Talking points**
- sensorId order matches `extension/src/bitstream2/domains/sensors/sensor-ids.ts`.
- Empty rows mean no sample yet — check publish mask, route, and that the sensor is enabled in firmware/sim.
- Summary column is a teaching shorthand; full fields are in Sensor Telemetry plots and Studio nodes.

**Demo script**
- With Simulator streaming, all four rows should populate within seconds.
- With hardware, rotate board / heat sensor to show counter and value changes.

**Lab prompt**
- Ask attendees: which sensorId is the magnetometer? (Answer: 1 — BMM350)
