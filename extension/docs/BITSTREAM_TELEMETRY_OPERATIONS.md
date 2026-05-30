# Bitstream telemetry link — operations

**Audience:** operators and support  
**Related:** [`BITSTREAM_TELEMETRY_STALE_PIPELINE.md`](./BITSTREAM_TELEMETRY_STALE_PIPELINE.md) (symptoms, layers, firmware notes)

## Where to look

- **Hamburger → Telemetry link diagnostics** — transport snapshot, **BRx**, **WS RX**, per-sensor decode freshness, **0x01 decode reject** counter, **Reconnect telemetry**, and wedge guidance.
- **Telemetry performance** (settings) — UI cadence plus automation toggles below.
- **Toolbar → Telemetry data source** — **Bitstream** vs **Simulator** (see **`HOW_TO_RUN.md`**, **`TELEMETRY_MODE_LIFECYCLE.md`**). Only one stream at a time: bridge publishes **`bitstream2/telemetry/route`**; samples carry optional **`origin`** (`uart` | `sim`). Webview gates: `shouldIngestTelemetryForRoute` + `shouldAcceptBs2SampleOrigin` in `bitstream-app/utils/bitstreamTelemetryTransport.ts`.

## Mode switch (operator)

1. **Bitstream → Simulator:** UI clears live samples; bridge closes COM if open; external sim receives **`run`** when route is simulator.
2. **Simulator → Bitstream:** sim **`idle`**; open COM from toolbar or Port Admin; samples appear only after COM open + BS2 HELLO/handshake.
3. **Mixed data symptom:** restart bridge, confirm toolbar mode, check Activity Log for route publish. See **`TELEMETRY_MODE_LIFECYCLE.md`** § Verify mode switch.

## Settings (persisted)

| Setting | Default | Effect |
|---------|---------|--------|
| **Auto-recover stale sensor decode** | On | Polls every **200 ms**. Triggers when decode age exceeds **`samplingIntervalMs × multiplier`** (2–4, default **2**) **or** worst enabled **Δ ≥ 3 s**. Resets **HostSession deframer** first, then **Reconnect telemetry** if no new sample. Sustain ~**0.5×** threshold (**200 ms** when Δ ≥ 3 s). Cooldown **12 s** / **3 s** (Δ ≥ 5 s) / **2 s** (Δ ≥ 1 min, **ignores hourly cap**). **45 s** action timeout. Rose **Δ** chip in Sensor Studio: **click** to reconnect. Max **6/hour** except critical Δ. |
| **Stale decode threshold multiplier** | 2 | Per-sensor: age > interval × multiplier (matches **LastUpdateBadge** expected interval from device config). |
| **Log wedge episodes** | Off | On the **first** transition into the wedge predicate, appends **one** line to **System logs** via `formatTelemetryWedgeDiagnosticsSnapshot` (decode age, smoothed BRx, reject count, sample count — **no COM path**). |

## Interpreting automation

- **Auto-reconnect** only resets **this tab’s** Bitstream **`HostSession`**. It is appropriate when the UI matches a **local** client wedge (decode stale while BRx still moves).
- If **several browsers or tabs stall at the same wall time**, treat that as a **shared upstream** signal (MCU, UART reader, bridge, broker fan-out). See **§ multi-browser** in the stale-pipeline doc; do not assume a single-tab session fix alone.

## Manual recovery

1. Open **Telemetry link diagnostics** and confirm **Serial open**, **BRx**, and decode **Δ**.
2. Try **Reconnect telemetry** before a full webview reload.
3. If rejects climb or decode never recovers, use the stale-pipeline doc and firmware/version alignment checks.
