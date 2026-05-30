# Goal (MVP)

## UI Stack

- **React** for the MCU CLI UI (same as the rest of the webview).
- **Tailwind CSS** for styling; keep utility-first and consistent with existing panels.
- **Other UI libraries in package.json** may be used: e.g. Radix UI primitives (Select, Tabs, Switch, Tooltip, ScrollArea, etc.), lucide-react for icons, react-toastify for toasts, and styling helpers (clsx, tailwind-merge, class-variance-authority). Prefer existing dependencies over adding new ones.
- **Reusable components** are preferred: build small, generic pieces (buttons, inputs, cards, sections) under `webview/ui/`, then compose them in MCU CLI–specific components. Reuse existing [Card](../webview/ui/components/Card.tsx) and add new primitives as needed so the CLI panel stays maintainable and other panels can share the same building blocks.

## Core Features

- **Connection block**
  - Connect to WebSocket broker → List ports → Select port + baud rate → Open / Close.
  - Reuse existing `useSerialPortOverWs` flow (same as SerialPortTester).

- **CLI surface**
  - One place to run any of the 24 CM33 CLI commands: a Command area (dropdown or sidebar) mapping to [cli-command-list.md](cli-command-list.md), plus an **output/stream** area showing MCU responses (line-based).
  - Commands sent as `command [subcommand] [args...]\n`; responses appear in the stream.

- **Command groups** (from cli-command-list)
  - **Info / single action**: help, version, clear, uptime, heap, date, sysinfo, log, tasks, mac, ip, gateway, netmask, stacks — one button or menu item each; on click send `command\n` and show output.
  - **Subcommand picker**: time (now / full / date / clock / set / sync / ntp), buttons (status), led (on / off / toggle), wifi (scan / connect / disconnect / status / list / info), udp (start / stop / send / status), ipc (ping / send / status / recv). UI: choose command + subcommand, then show parameter inputs if any.
  - **With parameters**: echo (optional text), time set (6 numbers: hour, min, sec, day, month, year), ping (IPv4 required, timeout_ms optional), wifi connect (SSID required, password optional), udp send / ipc send (message text required).
  - **Destructive**: reset, reboot — show a confirmation dialog before sending.

- **Persistence**
  - Remember last port, baud rate, and optionally last used commands (localStorage), following the project [save-load-init pattern](../../../.cursor/rules/save-load-init-pattern.mdc).

## Categories

Default categories for organizing commands:

- **Info** — help, version, clear, uptime, heap, date, sysinfo, log, tasks, stacks
- **System / Time** — time (with subcommands)
- **Network** — mac, ip, gateway, netmask, ping
- **WiFi** — wifi (scan, connect, disconnect, status, list, info)
- **UDP** — udp (start, stop, send, status)
- **IPC** — ipc (ping, send, status, recv)
- **LED / Buttons** — led (on, off, toggle), buttons (status)
- **Destructive** — reset, reboot

Optional: “Favorites” or “Recent” for quick access.

## Design Direction

- **Clean**: Clear sections for Connection, Command choice, Parameters (when needed), Output. No clutter.
- **User-friendly**: Labels and short descriptions from cli-command-list; disable actions when not connected or port not open; show running state (e.g. “Sending…”); surface success/error in output or toast.
- **Consistency**: Reuse existing [Card](../webview/ui/components/Card.tsx), Tailwind, lucide-react; use Radix or other UI libs already in package.json where they fit (e.g. Select, Tabs, dialogs). New components under `webview/ui/` per [ui.rules.mdc](../../../.cursor/rules/ui.rules.mdc). Prefer reusable components over one-off markup.
- **Accessibility**: Keyboard (Enter to send where applicable), sensible focus order, clear button and link labels.

## Non-goals (MVP)

- Command history replay or scripting.
- Bridge protocol changes (use existing list/open/close/write/data/status only).
- Binary CLI protocols or multi-MCU sessions.
