# Streaming pause quick command (firmware-native)

**Last updated:** 8 May 2026

This document defines the **Option C** approach for improving ACK reliability and UX: a **firmware-native streaming pause/resume control command**, exposed to users as a **Quick Command** in the Bitstream dashboard.

The goal is to keep “ACK-confirmed” interactions responsive (target: **< 1 second**) by temporarily quieting high-rate publishers (sensors, diagnostics) on the **same UART**. The protocol supports a maximum pause of **2 seconds** for advanced use.

Related:

- Protocol bytes / IDs: `src/bitstream/docs/FRAME_PROTOCOL_SPECIFICATION.md` (§6.22–§6.25)
- Command vs ACK routing: `src/webview/bitstream-app/docs/BITSTREAM_SERIAL_AND_BROKER_DATA_FLOW.md`
- ACK confirmation modes: `src/webview/bitstream-app/docs/COMMAND_ACK_CONFIRMATION_MODES.md`

---

## User-facing behavior

### Quick Commands

- **Pause streaming (250 ms)**
- **Pause streaming (500 ms)**
- **Pause streaming (1 s)**
- **Resume streaming**

### Scope presets

Default scope should be **Sensors + Diagnostics**.

Wi‑Fi events should not be paused by default (they are already lower volume, and pausing them can hide “connect failed” state changes).

---

## Protocol design (firmware-native)

The firmware implements two CONTROL commands:

- **`STREAM_PAUSE_REQ` (`0x0E`)** → **`STREAM_PAUSE_ACK` (`0x8C`)**
- **`STREAM_RESUME_REQ` (`0x0F`)** → **`STREAM_RESUME_ACK` (`0x8D`)**

Payload layouts are specified in `FRAME_PROTOCOL_SPECIFICATION.md` (§6.22–§6.25).

### Semantics

- Pause is **temporary**: firmware stops (or strongly throttles) the selected stream publishers for `durationMs`, then automatically resumes.
- Resume is **immediate**: clears any active pause timer for the selected scopes.
- Pause must not change persistent config (`sensor.cfg.*`) and must not require a “restore config” transaction.

---

## Firmware implementation notes (TESAIoT / CM55)

Recommended approach:

- Maintain an in-memory **pause deadline** per scope (sensor/diag/wifi), in “protocol ticks” or ms.
- Gate high-rate publishers in the protocol process loop:
  - **Sensor publisher** checks `pause_active(sensor)` → skip publish
  - **Diag stream publisher** checks `pause_active(diag)` → skip periodic frames
- CONTROL handler should:
  - Validate length and clamp `durationMs` to `[1, 2000]` (or product limit)
  - Apply `scopeMask` to supported scopes
  - Emit ACK immediately (do not do expensive work before ACK)

This complements the existing “pause streaming briefly after CONTROL RX” idea (`BITSTREAM_CTRL_STREAM_PAUSE_TICKS`) but makes it user-triggered and deterministic.

---

## Webview implementation notes

### When to use it

- Before running a burst of ACK-confirmed operations in **Reliable** mode.
- When the user chooses “Pause streaming” explicitly.

### Multi-client considerations

Because pause affects the physical device stream, it impacts **all connected dashboards**.

Recommended initial policy:

- The quick command sends the firmware pause/resume command.
- The dashboard also publishes a broker JSON “stream pause applied” note for other clients (optional, phase 2) so their UI can show “streaming paused by another client”.

---

## Test plan

- Under heavy sensor publish (10–20 ms), verify:
  - Pause command ACK returns quickly.
  - Control commands executed during pause have reduced ACK latency.
  - Sensor frames stop (or reduce) during the pause window and resume afterward.
- With two dashboards connected:
  - Pause from instance A; instance B observes reduced incoming sensor frames and does not mis-report “device dead”.

