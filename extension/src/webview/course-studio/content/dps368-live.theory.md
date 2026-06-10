## Live visualization

Embedded **sensor telemetry cards** mirror the Bitstream deck:

| Card preset | Shows |
|-------------|-------|
| **DPS368 Pressure** | Pressure (hPa) with freshness styling |
| **DPS368 Temperature** | On-die temperature |

Bind **`dps368.pressureHpa`**, **`dps368.altitudeM`**, and **`dps368.temp`** in Dashboard widgets and diagrams for custom layouts beyond the deck cards.

## Telemetry provider HTML demo

An **HTML page block** at the bottom of this topic shows a **pressure progress bar** fed by `bitstream:sample` over `postMessage` (field **`pressureHpa`**, sea-level gauge band from the catalog).
