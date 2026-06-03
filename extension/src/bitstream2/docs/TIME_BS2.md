# BS2 wall clock (TIME_SET / TIME_GET / TIME_SYNC)

**Date:** 2026-06-03

Normative firmware detail: `TESAIoT_Library/CM55/modules/bitstream/docs/TIME_BS2_RTC.md`.

## Commands (`cmdId`)

| cmdId | Name | REQ body | RES body |
|-------|------|----------|----------|
| `0x18` | `TIME_SET` | `unix_sec u32` LE, `tz_offset_min i16` LE | `status u8`, `error u8` |
| `0x19` | `TIME_GET` | empty | `ipc_rtc_status_t` (16 bytes) |
| `0x1A` | `TIME_SYNC` | empty (Phase 2 NTP) | `status u8`, `error u8` |

**HELLO cap:** `BS2_CAPS_TIME` (`0x0080`, bit 7).

## Host code

| Path | Role |
|------|------|
| `src/bitstream2/domains/time/commands.ts` | cmdId + flag constants |
| `src/bitstream2/domains/time/encode-req.ts` | TIME_SET encoder |
| `src/bitstream2/domains/time/decode-res.ts` | TIME_GET / op result decoders |
| `src/webview/bitstream-app/control/useBitstreamRtcController.ts` | REQ helpers |
| `src/webview/bitstream-app/state/bitstreamRtc.store.ts` | UI state |

## Policy

- **TIME_SET:** allowed when BS2 link is up (no Wi‑Fi required).
- **TIME_SYNC:** firmware returns `error=6` (`NTP_NOT_IMPL`) until CM33 lwIP SNTP (Phase 2).
- Display device clock when `flags & VALID`; poll with **TIME_GET** after connect or after **TIME_SET**.
