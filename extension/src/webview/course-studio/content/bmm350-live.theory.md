## Live visualization

This topic embeds **sensor telemetry cards** for the BMM350 — the same presets as the Bitstream deck:

| Card preset | Shows |
|-------------|-------|
| **BMM350 Magnetic field** | Bx, By, Bz, |B|, level heading |
| **BMM350 Temperature** | On-die temperature |

Cards respect page link health: gray/frozen when the stream is stale or BMM350 is disabled in sensor configuration.

## Binding paths

Use `bmm350.bx`, `bmm350.by`, `bmm350.bz`, `bmm350.magnitude`, and `bmm350.headingDeg` in Dashboard widgets and diagram bindings.
