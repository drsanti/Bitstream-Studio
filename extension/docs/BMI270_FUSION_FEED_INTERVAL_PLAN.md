# Plan: Configurable BMI270 fusion feed interval

This document plans **Phase D**: expose the CM55→CM33 BSX **fusion feed period** (today tied to `BITSTREAM_PROTOCOL_PROCESS_TICK_MS` / one call per `bitstream_protocol_process`) as a **user- and machine-settable** parameter via protocol, GUI, CLI, and MCP.

## Goals

- Users choose a **requested** fusion-feed interval (e.g. 10, 20, 50 ms — subject to clamping).
- Firmware applies a **clamped** interval and reports **applied** value in the ACK (same pattern as `sampling_interval_ms`).
- Host, MCP, and LLM-driven flows use the **same command** as the UI.

## Constraints (product rules)

| Topic | Rule |
|-------|------|
| **Effective minimum** | ≥ **`BITSTREAM_PROTOCOL_PROCESS_TICK_MS`** (typically **10 ms** on CM55) while fusion feed runs inside `bitstream_protocol_process()` without a separate timer/task. Values below the process period cannot be honored unless architecture changes (see below). |
| **Effective maximum** | **`BITSTREAM_BMI270_FUSION_FEED_INTERVAL_MAX_MS`** — currently **100 ms** in CM55 firmware (`bitstream_protocol.c`). Host UI and `clampBmi270FusionFeedIntervalMs` match **10–100 ms**. |
| **Hardware** | Interval cannot be shorter than **IMU ODR + I²C + IPC** budget; firmware **clamp** must document floor (measured or conservative). |
| **Independence** | Fusion-feed interval is **separate** from **publish sampling interval** (`sampling_interval_ms`). |
| **Modes** | Setting applies only when BMI270 stream mode is **Fusion** or **Hybrid** and sensor **enabled**; raw mode may ignore or reject SET with documented status. |

## Protocol design (recommended)

**Prefer a new command pair** (avoid extending `SENSOR_CFG_SET` payload length for backward compatibility with older firmware):

| Item | Proposal |
|------|------------|
| Names | `BMI270_FUSION_FEED_SET_REQ` / `BMI270_FUSION_FEED_GET_REQ` |
| Channel | Same control channel as other BMI270 commands (`0x03`) |
| Command IDs | Allocate next free IDs in firmware + host (e.g. `0x0A` / `0x0B` — **confirm unused** in `bitstream_protocol.c` and host registry). |
| SET payload | e.g. `uint16_t fusion_feed_interval_ms` (little-endian), reserved byte optional |
| SET ACK | `status`, `uint16_t applied_fusion_feed_interval_ms` |
| GET REQ | empty or single reserved byte |
| GET ACK | `status`, `uint16_t applied_fusion_feed_interval_ms` |

Optionally extend **CAPS** or handshake flags so hosts know the device supports this command before showing UI.

**Firmware:** Validate range **`[BITSTREAM_BMI270_FUSION_FEED_INTERVAL_MIN_MS, BITSTREAM_BMI270_FUSION_FEED_INTERVAL_MAX_MS]`** (CM55: **10–100 ms**), store in static runtime config, reset default on protocol init or preserve with NVM only if you explicitly add persistence later.

## Firmware behavior

1. Replace implicit “feed every process call” with **time-based gating** inside `bitstream_protocol_bmi270_fusion_high_rate_feed()`:
   - Record `last_feed_tick_ms` or FreeRTOS tick from last successful feed.
   - Run read + IPC push only when `now - last >= applied_interval_ms` (and Fusion/Hybrid + enabled).
2. If requested interval **\< process tick period**, **clamp up** to process tick (or document **unsupported** status in ACK).
3. Optional later: **Option B** — dedicated timer/task for intervals **\< process tick** (higher complexity).

## Host (`t3d-extension` / `@ternion` bitstream package)

| Step | Work |
|------|------|
| 1 | Add command constants + encode/decode + ACK types in `src/bitstream/commands/` and `ack-decoders.ts`. |
| 2 | Extend `HostSession` with `setBmi270FusionFeedIntervalMs` / `get…` (mirror BMI270 mode helpers). |
| 3 | Bridge topic / broker fan-out if other transports subscribe (follow `SENSOR_CFG_UPDATED` pattern if you broadcast applied config). |
| 4 | Webview: new card or row under BMI270 — presets + slider, show **Applied** from ACK. |
| 5 | **MCP**: new tool `bitstream_bmi270_fusion_feed_set` / `…_get` calling session APIs (see `register-tools.ts`). |
| 6 | **CLI**: if you have a scripted CLI for sensor commands, add matching subcommands. |

## Testing matrix

| Case | Expect |
|------|--------|
| SET 20 ms, process tick 10 ms | Feed ~every 20 ms (every 2nd process calls). |
| SET 5 ms, process tick 10 ms | Applied ≥10 ms (clamp); ACK shows applied. |
| SET 500 ms, max 100 ms | Applied **100 ms** (clamp); ACK shows **100**. |
| Fusion off / Raw | SET rejected or no-op; GET returns default or last. |
| Publish 100 ms + feed 10 ms | Wire rate unchanged; fusion state fresher internally. |

## Rollout phases

1. **Protocol + firmware only** — validate with serial/logger or temporary debug frame.
2. **Host decode + MCP** — automation and CI smoke (`mcp-e2e-smoke` pattern).
3. **GUI** — presets and applied-value display.
4. **Docs** — update `BMI270_FUSION_DECOUPLING.md` to reference configurable interval and link here.

## References

- `docs/BMI270_FUSION_DECOUPLING.md` — Phase A decouple implementation.
- `src/bitstream/commands/sensor-commands.ts` — existing command IDs.
- `TESAIoT_Firmware/proj_cm55/src/bitstream/protocol/src/bitstream_protocol.c` — fusion feed hook.
