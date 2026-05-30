# Journal

## Progress

### Phase 1 — Documentation (current)

- [x] OVERVIEW.md completed
- [x] GOAL.md completed (MVP, categories, design direction)
- [x] ARCHITECTURE.md completed (tech stack, file structure, data flow)
- [x] JOURNAL.md updated with phases

### Phase 2 — Implementation (future)

- [x] CLI command metadata module (from cli-command-list)
- [x] Connection block (reuse or adapt SerialPortTester connection UX)
- [x] Output panel (stream in line mode, clear, optional text/hex toggle)
- [x] Command list / subcommand picker (Info, System, Network, WiFi, UDP, IPC, LED, Destructive)
- [x] Parameter forms (echo, time set, ping, wifi connect, udp send, ipc send)
- [x] Destructive actions (reset/reboot) with confirmation dialog
- [x] Integration (new tab or Raw/CLI toggle in Serial tab)
- [x] Persistence (port, baud, recent commands if desired)

### Phase 3 — Polish (future)

- [x] Error handling and “Sending…” state
- [ ] Accessibility and keyboard
- [x] Changelog and any docs updates

## 2026-05-01 — Doc sync (Bitstream + TRN)

- **`src/bitstream`**: README cross-links to webview Bitstream app; `docs/README` and **`BITSTREAM_USER_MANUAL`** updated (§15.4 Port Admin auto-refresh).
- **`src/webview/ui/TRN`**: New **`TRNSectionContainer.md`**; **`TRNWindow.md`** documents `heightMode` / `autoHeightMaxViewportFraction`, footer `(auto)` metrics, and auto-height behavior; **`docs/README`** index and reading order adjusted.
- **Repo root `README.md`**: Documentation section links Bitstream library, Bitstream webview app, and TRN UI docs.

## Decisions

- **Line mode**: Use serial **line mode** for CLI so each MCU response line is one chunk; simplifies parsing and display.
- **Command format**: Commands sent as a single line: `command [subcommand] [args...]\n`.
- **No bridge changes**: MVP uses only existing WebSocket topics (list, open, close, write, data, status); no new protocol.
