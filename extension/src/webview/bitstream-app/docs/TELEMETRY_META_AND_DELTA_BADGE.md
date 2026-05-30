# Telemetry Meta card and LastUpdateBadge Δt

**Date:** 2026-05-29

## Telemetry Meta (gear menu)

Card: **`TelemetryMetaCard`** · menu: **`TelemetryMetaSettingsMenu`** · config keys in **`bitstreamConfig.store`**.

| Setting | Values | Role |
|---------|--------|------|
| **`telemetryMetaDisplayMode`** | `counter` · `hz` · `both` | What each sensor row shows |
| **`telemetryMetaRateSource`** | `device` · `host` · `counter` · `smoothed` | Which smoothed Hz track to use when rate is visible |

**Show modes**

- **Sample counter** — latest EVT_SENSOR payload `uint32` counter (per sensor).
- **Stream rate (Hz)** — EMA-smoothed rate from the selected source below.
- **Counter and rate** — e.g. `9138 · 50.00 Hz` (full width; `valueTruncate={false}` on `TRNParameter`).

**Rate sources** (computed in **`useBitstreamSession`** → **`telemetryStreamRate.ts`** → **`bitstreamLive.store`** `streamHz*ByHint`):

| Source | Formula (concept) |
|--------|-------------------|
| **Device (tMs)** | `1000 / ΔtMs` between consecutive publishes |
| **Host receive** | `1000 / Δhost` between ingested samples |
| **Counter slope** | `(Δcounter × 1000) / Δhost` when counter advances |
| **Smoothed** | Rolling mean of recent host gaps, then EMA |

Menu rows show **inline subtitles** (not icon tooltips). Copy: **`constants/telemetryMetaHints.ts`** (`TELEMETRY_META_MENU_DESC_*`).

## LastUpdateBadge Δt

**Settings → Telemetry → Δt source:** `device` · `host` · `both` (`telemetryUpdateDeltaSource`).

| Source | Badge uses |
|--------|------------|
| **Device** | BS2 payload **`tMs`** inter-arrival when available; else wall age since `lastAtMs` |
| **Host** | Wall-clock gap between consecutive ingested samples |
| **Both** | Two fixed-width slots: device + host |

Formatting: **`telemetryDeltaDisplay.ts`**

- **&lt; 1000 ms:** integer + `Δms` (fixed 10-char slot, space-padded), e.g. `   997 Δms`
- **≥ 1000 ms:** 2 decimals + `Δs`, e.g. `   1.01 Δs`

Device **`tMs`** on samples: **`sensor-decoder`** → **`bs2-sample-to-live-v2`** → **`deviceTMsInterArrival.ts`**.

UART ingest: **`bitstreamTelemetryTransport.ts`** — mock samples do not fill UART mode when COM is closed.

## Collapsible deck cards

**`TRNInteractiveCard`** (collapsible telemetry deck cards):

- Section padding: **`pt-1`** expanded and collapsed; **`pb-2`** expanded, **`pb-1`** collapsed.
- Header: **`py-0`**, **`mb-0`** when collapsed (via **`twMerge`** on **`TRNCardHeader`**).
- Avoid passing **`p-2`** on card `className` when `collapsible` — it overrides section padding.

## Tests

- `tests/bitstream-app/telemetry-delta-display.test.ts`
- `tests/bitstream-app/telemetry-stream-rate.test.ts`
- `tests/bitstream-app/telemetry-meta-display.test.ts`
- `tests/bitstream-app/device-tms-inter-arrival.test.ts`
- `tests/bitstream-app/bitstream-telemetry-transport.test.ts`
