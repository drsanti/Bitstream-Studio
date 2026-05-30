# Bitstream vNext — BS framed protocol (SPEC)

**Canonical wire specification (full text):**

- [`extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`](../../../docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md)

Edit that file when changing BS2 on-wire behavior. This stub stays next to the `bitstream2` module for discoverability.

## Summary

- Framing: `BS ` + `LEN(u16 LE)` + `TYPE(u8)` + `PAYLOAD` + `CRC16(u16 LE)` + `\r\n`
- CRC: CRC-16/CCITT-FALSE over `LEN + TYPE + PAYLOAD`
- Types: HELLO / REQ / RES / EVT_SENSOR / EVT_STATUS / EVT_DIAG

## Companion docs

| Doc | Topic |
|-----|--------|
| [`SENSOR_CFG_V2.md`](./SENSOR_CFG_V2.md) | Sensor configuration body v2 / v2.1 |
| [`HOST_UART_LINK.md`](./HOST_UART_LINK.md) | Host COM lifecycle (spec §13) |
| [`../../../docs/BS2_PROTOCOL_INDEX.md`](../../../docs/BS2_PROTOCOL_INDEX.md) | Full doc + code map |
| [`../../../docs/TELEMETRY_MODE_LIFECYCLE.md`](../../../docs/TELEMETRY_MODE_LIFECYCLE.md) | Host broker route / `origin` (not UART) |
