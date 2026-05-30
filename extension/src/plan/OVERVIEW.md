# MCU CLI UI — Overview

## What

**MCU CLI UI** is a webview UI that lets users run CM33 microcontroller CLI commands over serial: connect to the broker, list and open a port, send command lines (e.g. `help`, `wifi scan`), and see responses in a stream — without typing in a raw terminal.

## Why

- Avoid raw terminal typing and memorizing command names.
- Expose every command via clear actions, subcommand pickers, and parameter forms.
- Single place to interact with the MCU from the TERNION Digital Twin extension.

## How (high level)

- **Transport**: Same as today — WebSocket → Serial Port bridge → `T3DSerialPort` → MCU. No bridge protocol changes for MVP.
- **CLI**: UI builds a command line (e.g. `wifi scan`), sends it with `write(cmd + '\n')` over the existing serial bridge. MCU replies on the same serial stream; UI uses **line mode** so each response line is one chunk, shown in an output area.

## References

- [GOAL.md](GOAL.md) — MVP scope, categories, design direction.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Tech stack, file structure, data flow.
- [JOURNAL.md](JOURNAL.md) — Phases and progress.
- [cli-command-list.md](cli-command-list.md) — Full command list and UI hints.

## Out of scope (this doc)

Binary protocols, automation/scripting, multi-MCU support.
