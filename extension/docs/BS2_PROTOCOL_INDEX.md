# BS2 protocol documentation index

**Repository:** Bitstream-Studio  
**Last updated:** 2026-05-30  
**Purpose:** Single map for wire spec, host broker topics, implementation, and firmware alignment.

Develop **BS2 host-side** protocol (TypeScript, bridge, webview, tests, markdown specs) in **this repo**. Firmware encoders/decoders live in **TESAIoT_Library** (see §Firmware below).

---

## Canonical documents (edit here)

| Priority | Document | Scope |
|----------|----------|--------|
| 1 | **[`BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`](./BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md)** | **Wire format** — `BS` framing, HELLO, REQ/RES, EVT_SENSOR, EVT_STATUS, EVT_DIAG, §13 host UART lifecycle |
| 2 | **[`../src/bitstream2/docs/SENSOR_CFG_V2.md`](../src/bitstream2/docs/SENSOR_CFG_V2.md)** | **SENSOR_CFG** body v2 / v2.1 — caps bits, publish modes, mask, `publishIntervalMs` |
| 3 | **[`../src/bitstream2/docs/HOST_UART_LINK.md`](../src/bitstream2/docs/HOST_UART_LINK.md)** | Host COM refresh, hotplug, Simulator↔Bitstream routing (companion to spec §13) |
| 4 | **[`TELEMETRY_MODE_LIFECYCLE.md`](./TELEMETRY_MODE_LIFECYCLE.md)** | **Host broker only** — `bitstream2/telemetry/route`, `origin` on JSON samples (not UART bytes) |
| 5 | **[`../src/bitstream2/dev/UART_TEST_COMMANDS.md`](../src/bitstream2/dev/UART_TEST_COMMANDS.md)** | CLI probe steps (`bitstream2:uart-probe`, matrix harness) |

**Stub index (points to #1):** [`../src/bitstream2/docs/SPEC.md`](../src/bitstream2/docs/SPEC.md)

---

## Implementation (source of truth in code)

| Layer | Path |
|-------|------|
| Framing / CRC | `extension/src/bitstream2/framing/` |
| Message types / encode-decode | `extension/src/bitstream2/protocol/` |
| Sensor payloads | `extension/src/bitstream2/domains/` |
| UART → JSON | `extension/src/bitstream2/runtime/uart-decode.ts` |
| WS broker types | `extension/src/bitstream2/bridge/protocol.ts` |
| Bridge UART I/O | `extension/src/serialport-bridge/SerialPortWebSocketBridge.ts` |
| CLI / probes | `extension/src/bitstream2/dev/` |
| Unit tests | `extension/tests/bitstream2/` |
| Golden wire fixtures | `extension/tests/fixtures/bitstream2-golden/` |

Run tests after protocol changes:

```bash
cd extension
npm run test:bitstream2
```

Regenerate golden captures when wire bytes change:

```bash
npm run bitstream2:golden:gen
```

---

## Related (not UART wire)

| Document | Notes |
|----------|--------|
| [`BITSTREAM_TELEMETRY_OPERATIONS.md`](./BITSTREAM_TELEMETRY_OPERATIONS.md) | Operator diagnostics, stale pipeline |
| [`BITSTREAM_TELEMETRY_STALE_PIPELINE.md`](./BITSTREAM_TELEMETRY_STALE_PIPELINE.md) | Decode stall troubleshooting |
| `extension/src/bitstream/docs/FRAME_PROTOCOL_SPECIFICATION.md` | **Legacy v1** (`0xAA55` magic) — historical only |

---

## Firmware alignment (separate repo)

MCU implementation and sensor-specific wire notes:

| Location | Role |
|----------|------|
| `TESAIoT_Library/CM55/modules/bitstream` | Firmware BS2 module (encoders, publish, ports) |
| `TESAIoT_Library/.../BS_WIRE.md` (under bitstream module) | Per-sensor EVT layout, rates, firmware-only details |

When changing **on-wire** layout or command IDs:

1. Update **`BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`** (this repo).
2. Update TypeScript in **`extension/src/bitstream2/`** + tests + golden fixtures.
3. Port the same logical change to **TESAIoT_Library** firmware.
4. Sync **bitstream-simulator** (external VSIX) so Simulator mode matches.

---

## Workflow for new BS2 features

1. **Spec first** — extend `BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` (or `SENSOR_CFG_V2.md` for cfg-only).
2. **Types + codec** — `protocol/`, `domains/`, `bridge/protocol.ts` if broker JSON changes.
3. **Tests** — unit tests + optional golden gen; `bitstream2:uart-probe` when MCU available.
4. **Tracker** — note in `DEVELOPMENT_TRACKER.md` when shipped.

Do **not** treat `ternion-t3d/t3d-extension/docs/` as canonical anymore — it is the migration source only.

---

## Cursor agent integration

| Artifact | Path |
|----------|------|
| Protocol change rule | **`.cursor/rules/bs2-protocol-change.mdc`** |
| Protocol change skill | **`.cursor/skills/bs2-protocol-change/SKILL.md`** |
| Dev / build skill | **`.cursor/skills/bitstream-studio-dev/SKILL.md`** |
| UART bring-up skill | **`.cursor/skills/bs2-uart-bringup/SKILL.md`** |
| External sim skill | **`.cursor/skills/bitstream-simulator-app/SKILL.md`** |
| Handoff rule | **`.cursor/rules/bitstream-studio-handoff.mdc`** |
