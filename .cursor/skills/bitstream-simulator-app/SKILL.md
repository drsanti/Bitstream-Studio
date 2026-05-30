---
name: bitstream-simulator-app
description: >-
  Standalone BS2 virtual MCU VSIX. Use when the user says simulator,
  bitstream-simulator, external sim, virtual MCU, sim/status, or Simulator
  telemetry mode in Bitstream Studio.
---

# Bitstream Simulator (external VSIX)

## Path

**`D:\CODE\2026\ternion-t3d\bitstream-simulator`** (separate repo; not in Bitstream-Studio)

## Architecture

```text
Bitstream Studio webview ──WS──► bridge (extension) ◄──WS── bitstream-simulator
                                      │
                                 inject-rx → evt/sensor
                                 host-tx ← sim
```

## Bitstream Studio side

| Area | Path |
|------|------|
| Bridge | `extension/src/serialport-bridge/SerialPortWebSocketBridge.ts` |
| Route / ingest | `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` |
| Broker types | `extension/src/bitstream2/bridge/protocol.ts` |

## Dev workflow

```bash
# Terminal 1 — extension/
npm run start:bridge

# Terminal 2
npm run dev:webview
```

1. Run **Bitstream Simulator** VSIX → **Streaming**
2. Webview toolbar → **Simulator** → **Link**
3. COM must be **closed** for sim ingest (A+B lifecycle)

Build sim extension: `npm run compile` in `bitstream-simulator/`.

## Do not

- Re-add in-bridge `BsFirmwareSimulator` or `BITSTREAM2_DEV_LOOPBACK=1`
- Confuse with `extension/src/webview/bitstream2-simulator/` (legacy dev dashboard URL `?app=bitstream2-sim`)

## Wire parity

Simulator must track **`extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`**. After wire changes, update sim firmware mock and run **`npm run test:bitstream2`** in Bitstream Studio.

Rule: **`.cursor/rules/bitstream-simulator-app-path.mdc`**
