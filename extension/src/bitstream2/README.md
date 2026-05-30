# Bitstream vNext (`bitstream2`)

Self-contained implementation of the **BS-framed** UART protocol (Bitstream vNext).

**How to run (simulator, UI, CLI):** see [`HOW_TO_RUN.md`](../../HOW_TO_RUN.md) in this package.

## Design

- **Transport-agnostic** core (`framing/`, `protocol/`, `domains/`, `runtime/`).
- **Serial bridge** owns UART IO, decodes frames, publishes structured JSON on `bitstream2/*` topics.
- **Webview** consumes JSON only (no raw UART parsing).

Full wire spec: `docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` (see `docs/SPEC.md` if present).

**Sensor config v2 (draft):** [`src/bitstream2/docs/SENSOR_CFG_V2.md`](./docs/SENSOR_CFG_V2.md) — publish modes, delta, v2.1 `publishIntervalMs`, host simulator sine synth (§9.1), webview **Sampling frequency** UI.

## Host-only validation (no MCU)

```bash
cd extension
npm run test:bitstream2
npm run bitstream2:mock-probe
```

**External simulator:** Install the **bitstream-simulator** VS Code extension. Bridge auto-detects it via `bitstream2/sim/status`. In-process bridge loopback (`BITSTREAM2_DEV_LOOPBACK`) was removed.

When the webview toolbar is **Bitstream**, real COM carries BS frames. **Simulator** uses `bitstream2/dev/inject-rx` from the external extension. Mode exclusivity: **`docs/TELEMETRY_MODE_LIFECYCLE.md`**.

### Broker topics (webview ↔ bridge)

| Topic | Direction | Use |
|--------|-----------|-----|
| `bitstream2/telemetry/route` | Webview → bridge | Authoritative **`uart`** \| **`simulator`** mode |
| `bitstream2/dev/sim/control` | Webview → sim | **`idle`** / **`run`** streaming |
| `bitstream2/dev/inject-rx` | Sim → bridge | Virtual UART bytes (sim path only) |
| `bitstream2/evt/sensor` | Bridge → webview | Decoded samples; optional **`origin`**: `uart` \| `sim` |
| `bitstream2/req` / `bitstream2/res` | Webview ↔ device | BS2 commands (PING, SENSOR_CFG, …) |

Types: `src/bitstream2/bridge/protocol.ts` (`TELEMETRY_ROUTE`, `Bitstream2TelemetryRoutePayload`).

```bash
# Terminal A
npm run start:bridge

# Terminal B — CLI inject (bridge running; dev/debug)
npm run bitstream2:dev-inject -- --hello --sample
npm run bitstream2:dev-inject -- --ping-req

# Scenarios (offline, no bridge)
npm run bitstream2:sim-scenario -- --offline boot
npm run bitstream2:sim-scenario -- --offline full_board

# Scenarios (WS; bridge running)
npm run bitstream2:sim-scenario -- --ws full_board

# Regenerate golden wire fixtures
npm run bitstream2:golden:gen

# Browser dev: start:bridge (terminal 1) + dev:webview (terminal 2) — see HOW_TO_RUN.md
```

In Vite dev, open **Sensor Telemetry** (`?app=bitstream`) or the dedicated sim dashboard (`?app=bitstream2-sim`).

## Production checklist

| Layer | Responsibility |
|--------|----------------|
| `framing/` | Prefix scan, LEN cap, CRC-16/CCITT-FALSE, CRLF |
| `runtime/uart-decode.ts` | UART bytes → hello/sensor broker payloads |
| `runtime/session.ts` | REQ/RES correlation over UART |
| `serialport-bridge/` | WS broker + `bitstream2/*` publish; **`telemetry/route`** gating |
| `device/` | In-process mock for **CLI/tests** only (`sensor-synth.ts`); not the webview sim path |
| `webview/bitstream2-simulator/` | Simulator dashboard UI |

Start bridge: **Bitstream Studio: Start Serial Bridge**, open **Sensor Telemetry** or **Sensor Studio**. See **`HOW_TO_RUN.md`** and **`AGENT_HANDOFF.md`**.
