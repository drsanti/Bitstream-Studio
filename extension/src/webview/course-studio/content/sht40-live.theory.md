## Live visualization

This topic uses **sensor telemetry cards** — the same card presets as the Bitstream right-hand deck — embedded in the course page grid.

| Card preset | Shows |
|-------------|-------|
| **SHT40 Humidity** | Relative humidity (%RH) with freshness styling |
| **SHT40 Temperature** | Ambient temperature (°C) |

Cards inherit page **link health** rules: when the stream is stale or SHT40 is disabled in sensor configuration, cards show the frozen/gray state instead of misleading numbers.

## Telemetry provider HTML demo

Below the deck cards, an **HTML page block** runs a single-file humidity progress bar. It uses the Course **`postMessage`** bridge (`bitstream:ready` → `bitstream:sample`) — the same contract as external AI-generated dashboards. Field: **`humidityPct`** on sensor **`sht40`**.

## Wiring elsewhere

The same `sht40.temp` and `sht40.rh` binding paths drive **Dashboard widgets**, **diagram** labels, and **Sensor Studio** tap nodes. Learn the paths here, then reuse them in operator layouts without duplicating decode logic.
