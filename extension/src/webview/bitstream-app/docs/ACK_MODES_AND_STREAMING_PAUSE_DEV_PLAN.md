# Development plan: ACK modes + firmware streaming pause (Option C)

**Last updated:** 8 May 2026

This plan covers implementation work in **two codebases**:

- **Firmware (TESAIoT / CM55)**: `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Firmware\proj_cm55\src\bitstream`
- **Host (t3d-extension)**: bridge + Bitstream webview + MCP tools

The feature set:

1. **Command acknowledgement confirmation modes** (Auto / Reliable / Fast)
2. **Firmware-native streaming pause/resume** control command (Option C) + **Quick Command** UX

Related specs / docs:

- Protocol bytes / IDs: `src/bitstream/docs/FRAME_PROTOCOL_SPECIFICATION.md` (§6.22–§6.25)
- Confirmation modes: `src/webview/bitstream-app/docs/COMMAND_ACK_CONFIRMATION_MODES.md`
- Pause quick command: `src/webview/bitstream-app/docs/STREAMING_PAUSE_QUICK_COMMAND.md`
- Command vs ACK routing: `src/webview/bitstream-app/docs/BITSTREAM_SERIAL_AND_BROKER_DATA_FLOW.md`

---

## Tracking checklist (copy into PR descriptions)

- [ ] Phase 0: End-to-end ACK latency instrumentation (firmware + host optional logs)
- [ ] Phase 1 (firmware): Add STREAM_PAUSE/RESUME req/ack IDs (`bitstream_protocol.h`)
- [ ] Phase 1 (firmware): Implement STREAM_PAUSE/RESUME handling + ACK emit (`bitstream_protocol_handle_message`)
- [ ] Phase 1 (firmware): Implement scope-based pause gating (sensors/diag) with deadline + auto-resume
- [ ] Phase 2 (host): Add STREAM_PAUSE/RESUME command definitions + ack decoders (`src/bitstream`)
- [ ] Phase 2 (host): Add `HostSession` helpers `sendStreamPause` / `sendStreamResume` (ACK-confirmed)
- [ ] Phase 2 (host): Add MCP support (`stream.pause` / `stream.resume` or extend `bitstream_run_command`)
- [ ] Phase 3 (webview): Add Quick Commands (pause 250/500/1000ms + resume)
- [ ] Phase 3 (webview): Add persisted `commandConfirmationMode` setting (auto/reliable/fast)
- [ ] Phase 3 (webview): Implement ACK policy routing per mode
- [ ] Phase 4: Optional multi-client banner / broker note when streaming paused by another client
- [ ] QA: Verify ACK latency improvement under heavy streaming + validate multi-client behavior

---

## Success criteria (definition of done)

### Functional

- Dashboard exposes a single selector: **Auto (recommended)** / **Reliable** / **Fast**.
- Firmware supports:
  - `STREAM_PAUSE_REQ (0x0E)` → `STREAM_PAUSE_ACK (0x8C)`
  - `STREAM_RESUME_REQ (0x0F)` → `STREAM_RESUME_ACK (0x8D)`
- Quick Command can pause **Sensors + Diagnostics** for 250/500/1000 ms and resume immediately.

### UX / performance

- In **Reliable** mode, typical control commands do not “pending” longer than ~1s under normal streaming loads.
- In worst-case heavy streaming, pause command materially reduces ACK latency for commands issued during the pause window.

### Multi-client safety

- If multiple dashboards are connected, pause/resume affects the device stream (all clients) but does not break session state.

---

## Phase 0 — Alignment and instrumentation (recommended first)

### Firmware

- Add lightweight timestamps / counters around:
  - CONTROL RX handled
  - ACK frame queued/sent
  - sensor/diag publisher suppressed due to pause

### Host

- Add optional tracing (dev-only) to measure:
  - UI action start
  - transport write start/complete
  - ACK frame observed + matched (sequence/channel)

**Exit gate:** we can capture an end-to-end timeline for at least HELLO/PING/CAPS/STATUS and one sensor cfg set/get under load.

---

## Phase 1 — Firmware-native pause/resume (Option C)

### Firmware (TESAIoT / CM55)

**Work items**

- **Protocol IDs**: add defines in `bitstream_protocol.h`
  - `BITSTREAM_MSG_STREAM_PAUSE_REQ (0x0E)`
  - `BITSTREAM_MSG_STREAM_RESUME_REQ (0x0F)`
  - `BITSTREAM_MSG_STREAM_PAUSE_ACK (0x8C)`
  - `BITSTREAM_MSG_STREAM_RESUME_ACK (0x8D)`
- **CONTROL handler** (`bitstream_protocol_handle_message` in `protocol/src/bitstream_protocol.c`)
  - Validate payload lengths (pause: 6 bytes; resume: 4 bytes)
  - Clamp `durationMs` to `[1, 2000]` (or product max)
  - Apply `scopeMask` to supported scopes (at minimum: sensors + diag)
  - Fill ACK payloads as specified (status + corrId + applied mask + applied duration)
  - Send ACK immediately (no heavy work before TX)
- **Gating logic**
  - Maintain `pause_deadline_ms` (or `pause_deadline_tick`) per scope
  - Gate sensor publisher and diagnostics publisher with `pause_active(scope)`
  - Auto-resume after deadline
  - `STREAM_RESUME_REQ` clears the deadline for selected scopes

**Acceptance tests**

- Under 10–20ms sensor publish:
  - Pause ACK returns quickly and streaming stops/throttles for the duration
  - Streaming resumes afterwards without a full reconnect

### Host (optional in Phase 1)

- No host changes required to validate firmware if you test via an existing CLI/MCP path that can send raw control frames.

**Exit gate:** firmware pause/resume is stable and does not regress existing control commands.

---

## Phase 2 — Host protocol bindings (library + MCP + probes)

### `src/bitstream` (host TypeScript)

**Work items**

- Add command definitions in `src/bitstream/commands/sensor-commands.ts` (or a new control commands file if preferred):
  - `STREAM_PAUSE_REQ`
  - `STREAM_RESUME_REQ`
- Add `HostSession` helpers in `src/bitstream/session/host-session.ts`
  - `sendStreamPause(requestId, scopeMask, durationMs)` → decode `STREAM_PAUSE_ACK`
  - `sendStreamResume(requestId, scopeMask)` → decode `STREAM_RESUME_ACK`
  - Optional `*NoAck` variants only if needed; recommended to keep these **ACK-confirmed** (they exist to improve ACK behavior).
- Add ack decoders in `src/bitstream/commands/ack-decoders.ts` (or a new file) with strict length checks.
- Extend `FRAME_PROTOCOL_SPECIFICATION.md` is already done; keep parity when firmware changes.

### MCP

- Add MCP tool(s) or extend `bitstream_run_command` normalization so agents can call:
  - `stream.pause`
  - `stream.resume`

**Exit gate:** host can issue pause/resume and decode ACKs correctly via CLI/MCP.

---

## Phase 3 — Webview UI: Quick Command + mode selector

### UI: “Pause streaming” Quick Command

**Work items**

- Add commands to the Quick Action system (IDs TBD):
  - `bitstream.streaming.pause.250ms`
  - `bitstream.streaming.pause.500ms`
  - `bitstream.streaming.pause.1000ms`
  - `bitstream.streaming.resume`
- Implementation should:
  - Ensure session is connected (`requireConnectedSession`)
  - Call `sendStreamPause` / `sendStreamResume`
  - Provide minimal feedback (toast/log line) on success/failure

### UI: ACK confirmation modes (Auto / Reliable / Fast)

**Work items**

- Add a persisted setting to `bitstreamConfig.store.ts` (localStorage + host mirror if needed):
  - `commandConfirmationMode: "auto" | "reliable" | "fast"`
- Implement policy routing:
  - Auto: `*.get` and boot-critical commands are ACK-confirmed; high-frequency sets are fire-and-forget.
  - Reliable: prefer ACK-confirmed for supported commands.
  - Fast: prefer fire-and-forget.
- Ensure the UI clearly indicates the current mode and warns for Fast.

**Exit gate:** UI exposes mode selector and pause quick commands; behavior is stable across reload.

---

## Phase 4 — Latency tuning and multi-client UX

### Firmware tuning

- Confirm pause window + gating actually reduces ACK latency.
- Consider converting existing coarse pause (`BITSTREAM_CTRL_STREAM_PAUSE_TICKS`) into (or layering with) the new pause mechanism.

### Host/webview tuning

- If Reliable mode still sees >1s pending:
  - Auto-trigger a short pause before critical ACK-confirmed transactions (optional; gated by UX settings).
  - Reduce slider spam (debounce/coalesce) so fewer CONTROL transactions are in flight.

### Multi-client

- Optional: publish a broker JSON note (non-firmware) so other clients can display “Streaming paused by another instance”.

---

## Risks and mitigations

- **Starvation of streaming**: cap pause duration, do not allow unbounded pauses.
- **Confusing device state**: pause must not mutate persistent `sensor.cfg.*`.
- **Unsupported firmware**: host should detect missing support (CAPS bit recommended) and degrade gracefully.

---

## Resolved design decisions

- **CAPS bit:** **Yes** — firmware advertises a capability flag for streaming pause/resume.
- **Scope semantics:** pause **publish only** (do not pause internal sampling / hardware reads).
- **Max duration:** allow up to **2000ms** (advanced), while keeping common quick-command presets at ≤ 1000ms.

