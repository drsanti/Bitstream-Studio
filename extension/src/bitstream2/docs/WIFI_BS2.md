# Wi-Fi on BS2 wire (host implementation guide)

**Status:** Implemented on UART (Bitstream Studio + CM55, verified 2026-06-03)  
**Firmware mirror:** `TESAIoT_Library/CM55/modules/bitstream/docs/WIFI_BS2_ASYNC_PROTOCOL.md`  
**Frame envelope:** `extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`

Legacy `0xAA55` Wi-Fi channel `0x06` (`src/bitstream/wifi/`, `HostSession`) is **deprecated** on BS2 UART paths.

---

## Message types

| BS `TYPE` | Use for Wi-Fi |
|-----------|----------------|
| `0x02` `REQ` | Commands `0x20`–`0x26` |
| `0x03` `RES` | Immediate accept/reject |
| `0x05` `EVT_STATUS` | Async link / scan rows / scan done / policy |

Use existing `encodeBsEnvelope` / framer — same as `SENSOR_CFG` and `EVT_SENSOR`.

---

## Commands (`cmdId`)

| cmdId | Name | `REQ` body |
|------:|------|------------|
| `0x20` | `WIFI_CONNECT` | `security u32` + `ssid[33]` + `password[65]` |
| `0x21` | `WIFI_DISCONNECT` | empty |
| `0x22` | `WIFI_SCAN_ALL` | empty |
| `0x23` | `WIFI_SCAN_SSID` | `ssidLen u8` + `ssid` |
| `0x24` | `WIFI_STATUS_GET` | empty → 38 B in `RES` |
| `0x25` | `WIFI_POLICY_GET` | empty → `flags` in `RES` |
| `0x26` | `WIFI_POLICY_SET` | `flags u8` |

Correlation: **`reqId`** in `REQ`/`RES`/`EVT_STATUS` — no separate `corr_id`.

---

## `EVT_STATUS` kinds

| kind | Size | When |
|------|------|------|
| `0x01` `WIFI_LINK` | 41 | Connect progress, errors, unsolicited RSSI (`reqId=0`) |
| `0x02` `WIFI_SCAN_ROW` | 53 | **One AP** per frame during scan |
| `0x03` `WIFI_SCAN_DONE` | 7 | Scan finished |
| `0x04` `WIFI_POLICY` | 4 | Policy change notification |

Decode after validating envelope CRC; dispatch on `payload[2]` (`kind`) after reading `reqId` at `payload[0..1]`.

---

## Host modules (Phase 2 — done)

| Path | Role |
|------|------|
| `src/bitstream2/domains/wifi/commands.ts` | `cmdId` / kind constants |
| `src/bitstream2/domains/wifi/encode-req.ts` | Connect / scan SSID bodies |
| `src/bitstream2/domains/wifi/decode-evt-status.ts` | Kind dispatch |
| `src/webview/bitstream-app/control/useBitstreamWifiController.ts` | `bitstream2/req` for `0x20`–`0x26` |
| `src/webview/bitstream-app/control/useBitstreamWifiEvtBridge.ts` | `EVT_STATUS` → `bitstreamWifi.store` |
| `src/webview/bitstream-app/components/wifi/*` | Device Wi-Fi window (tabs, scan session) |

`BsSession` handles one pending `RES` per `reqId`. Scan/connect also track pending `reqId` until terminal `EVT_STATUS` (`useWifiScanSession`, link state in store).

---

## Scan UX

```text
sendReq(WIFI_SCAN_ALL) → await RES (queued)
on EVT_STATUS SCAN_ROW: append to list[index]
on EVT_STATUS SCAN_DONE: clear pending, show total/status
```

Do not build the AP list from `RES` alone.

---

## Testing

- Extend `device/firmware-simulator.ts` for Wi-Fi `REQ`/`EVT_STATUS`.
- Golden bytes: `tests/fixtures/bitstream2-golden/` (optional).
- UART: Bitstream Studio bridge + COM after firmware Phase 1.

---

## Legacy removed (2026-06-03)

- Framed channel `0x06` / `0xAA55` Wi-Fi — deleted from firmware and `src/bitstream/wifi/*` host decoders.
- Use `domains/wifi/`, `useBitstreamWifiController`, and `bitstream2/evt/status` only.
