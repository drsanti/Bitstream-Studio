---
name: bs2-protocol-change
description: >-
  Change BS2 wire protocol or broker topics in Bitstream Studio. Use when
  adding message types, SENSOR_CFG fields, EVT_SENSOR layout, bitstream2/*
  topics, golden fixtures, or syncing firmware/simulator with host spec.
---

# BS2 protocol change (Bitstream Studio)

## When to use

- User asks to **extend BS2**, **change wire format**, **SENSOR_CFG**, **EVT_SENSOR**, or **bitstream2 broker** topics.
- After reading **`extension/docs/BS2_PROTOCOL_INDEX.md`**.

Rule: **`.cursor/rules/bs2-protocol-change.mdc`**

## Workflow (order matters)

### 1. Spec

| Scope | File |
|-------|------|
| Wire (UART) | `extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` |
| Sensor cfg | `extension/src/bitstream2/docs/SENSOR_CFG_V2.md` |
| Host COM | `extension/src/bitstream2/docs/HOST_UART_LINK.md` |
| Route / JSON only | `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` |

### 2. Code (`extension/src/bitstream2/`)

- `framing/` — prefix, LEN, CRC, CRLF
- `protocol/` + `domains/` — encode/decode
- `runtime/uart-decode.ts` — bytes → broker payloads
- `bridge/protocol.ts` — WS topic constants and TypeScript types
- `serialport-bridge/SerialPortWebSocketBridge.ts` — if bridge behavior changes → **restart bridge**

Webview-only broker consumers: `src/webview/bitstream-app/`

### 3. Verify

```bash
cd extension
npm run test:bitstream2
```

| If… | Then… |
|-----|--------|
| Wire bytes changed | `npm run bitstream2:golden:gen`; commit `tests/fixtures/bitstream2-golden/` |
| MCU available | `npm run bitstream2:uart-probe -- --path COMx --baud 921600` |
| Simulator parity | Update **`bitstream-simulator`** repo; test toolbar **Simulator** mode |

### 4. Firmware

`TESAIoT_Library/CM55/modules/bitstream` — mirror wire changes; update `BS_WIRE.md` for sensor-specific EVT notes.

### 5. Log

- `extension/docs/DEVELOPMENT_TRACKER.md` — **Recently completed**
- `AGENT_HANDOFF.md` §7 — substantial sessions

## Canonical vs legacy

| Use | Do not use for BS2 |
|-----|---------------------|
| `extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` | `ternion-t3d/t3d-extension/docs/…` |
| `extension/src/bitstream2/` | Legacy `src/bitstream/` v1 (`0xAA55`) except historical reference |
