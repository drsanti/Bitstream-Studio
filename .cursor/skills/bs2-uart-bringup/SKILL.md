---
name: bs2-uart-bringup
description: >-
  Validates BS2 on real PSoC Edge MCU over UART from Bitstream Studio. Use for
  bitstream2:uart-probe, COM bring-up, HELLO/PING/SENSOR_CFG/EVT_SENSOR on
  hardware, or post-firmware BS2 changes.
---

# BS2 UART bring-up (Bitstream Studio + MCU)

## When to use

- Verify **BS2 on hardware** (not Simulator toolbar mode).
- After firmware changes under **`TESAIoT_Library/CM55/modules/bitstream`**.
- Read **`TESAIoT_Firmware/AGENT_HANDOFF.md`** for MCU-specific status.

## Host setup

From **`Bitstream-Studio/extension/`**:

```bash
# Terminal 1 — do NOT set BITSTREAM2_DEV_LOOPBACK
npm run start:bridge

# Terminal 2 — optional UI soak
npm run dev:webview
```

UI: `http://localhost:5173/?app=bitstream` — toolbar **Bitstream**, open COM **921600**.

## CLI probe

```bash
cd extension
npm run bitstream2:uart-probe -- --path COM3 --baud 921600
npm run bitstream2:uart-probe -- --skip-open --soak-ms 300000
```

**Script:** `extension/src/bitstream2/dev/run-uart-probe.ts`

| Flag | Meaning |
|------|---------|
| `--path` / `--baud` | COM and rate (default 921600) |
| `--skip-open` | UI already holds COM |
| `--soak-ms` | Telemetry soak (default 90000) |
| `--skip-set` | Skip SENSOR_CFG_SET test |

**Pass:** `PROBE PASSED` at end.

## Rate / payload check

```bash
npm run bitstream2:uart-sensor-rate-check -- --path COM3 --hz=50 --bmi270-mode=hybrid
```

**Script:** `extension/src/bitstream2/dev/run-uart-sensor-rate-check.ts`

## Firmware truth

| Item | Path |
|------|------|
| BS2 module | `TESAIoT_Library/CM55/modules/bitstream` |
| Wire notes | `BS_WIRE.md` under that module |
| Build firmware | `make build` / `make program` from **`TESAIoT_Firmware`** |

## Spec (host)

`extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` — keep aligned with firmware when changing wire behavior.

After protocol edits: follow skill **`bs2-protocol-change`**.
