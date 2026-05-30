# Bitstream vNext — BS framed protocol (SPEC)

This spec is mirrored from the extension docs:

- `t3d-extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`

The canonical copy should live here once vNext replaces legacy bitstream:

- framing: `BS ` + `LEN(u16 LE)` + `TYPE(u8)` + `PAYLOAD` + `CRC16(u16 LE)` + `\r\n`
- CRC: CRC-16/CCITT-FALSE over `LEN + TYPE + PAYLOAD`
- types: HELLO / REQ / RES / EVT_SENSOR / EVT_STATUS / EVT_DIAG

See the canonical file above for the full text until we fully migrate.

**Sensor configuration (v2 / v2.1):** [`SENSOR_CFG_V2.md`](./SENSOR_CFG_V2.md) — publish modes, simulator sine synth (§9.1), webview sampling UI (§10), **cfg access under load (§10.1)**.

**Host UART link (refresh, sim↔UART, hotplug):** [`HOST_UART_LINK.md`](./HOST_UART_LINK.md) — companion to canonical spec **§13** (browser refresh COM reuse, replug poll, HELLO/PING bring-up).
