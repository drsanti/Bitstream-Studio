# Bitstream vNext (`bitstream2`)

Self-contained implementation of the **BS-framed** UART protocol (Bitstream vNext).

**How to run (simulator, UI, CLI):** see [`HOW_TO_RUN.md`](../../HOW_TO_RUN.md) in this package.

## Design

- **Transport-agnostic** core (`framing/`, `protocol/`, `domains/`, `runtime/`).
- **Serial bridge** owns UART IO, decodes frames, publishes structured JSON on `bitstream2/*` topics.
- **Webview** consumes JSON only (no raw UART parsing).

Full wire spec: `t3d-extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` (pointer in `docs/SPEC.md`).

**Sensor config v2 (draft):** [`src/bitstream2/docs/SENSOR_CFG_V2.md`](./docs/SENSOR_CFG_V2.md) — publish modes, delta, v2.1 `publishIntervalMs`, host simulator sine synth (§9.1), webview **Sampling frequency** UI.

## Host-only validation (no MCU)

```bash
cd t3d-extension
npm run test:bitstream2
npm run bitstream2:mock-probe
```

`BsFirmwareSimulator` (`device/firmware-simulator.ts`) answers PING, config commands, streams `EVT_SENSOR` with **sine-wave** synthetic payloads (`device/sensor-synth.ts`, `SIM_SINE_HZ ≈ 0.2`), and publishes state on `bitstream2/dev/sim/state` when loopback is on. Respects publish gating (`publish-gate.ts`). (`BsMockFirmware` is an alias.)

When the webview toolbar is **UART** (with loopback enabled), `bitstream2/dev/sim/control` **`idle`** pauses mock stream timers; **Simulator** sends **`run`**.

### WS dev simulator (`BITSTREAM2_DEV_LOOPBACK=1`)

Bridge treats WS traffic like UART when loopback is on:

| Topic | Direction | Use |
|--------|-----------|-----|
| `serialport/write` | Host → “MCU” | BS REQ bytes; mock firmware replies with RES |
| `bitstream2/dev/inject-rx` | Device → host | Inject HELLO / EVT_SENSOR without TX |

```bash
# Terminal A
BITSTREAM2_DEV_LOOPBACK=1 npm run start:bridge

# Terminal B — inject HELLO + sample, or PING via write
npm run bitstream2:dev-inject -- --hello --sample
npm run bitstream2:dev-inject -- --ping-req

# Scenarios (offline, no bridge)
npm run bitstream2:sim-scenario -- --offline boot
npm run bitstream2:sim-scenario -- --offline full_board

# Scenarios (WS; bridge with loopback)
npm run bitstream2:sim-scenario -- --ws full_board

# Regenerate golden wire fixtures
npm run bitstream2:golden:gen

# Or one command (bridge + Vite) if cross-env is available:
npm run dev:bitstream2-loopback
```

In Vite dev, open **Sensor Studio** (`?app=bitstream`) for the **Bitstream2 Simulator UI** (`webview/bitstream2-simulator/`).

## Production checklist

| Layer | Responsibility |
|--------|----------------|
| `framing/` | Prefix scan, LEN cap, CRC-16/CCITT-FALSE, CRLF |
| `runtime/uart-decode.ts` | UART bytes → hello/sensor broker payloads |
| `runtime/session.ts` | REQ/RES correlation over UART |
| `serialport-bridge/` | WS broker + `bitstream2/*` publish |
| `device/` | Host firmware simulator (REQ/RES, streaming, `sensor-synth.ts`) |
| `webview/bitstream2-simulator/` | Simulator dashboard UI |

Start bridge: **TERNION → Start Serial Bridge**, open webview **Sensor Studio** entry (`bitstream`).
