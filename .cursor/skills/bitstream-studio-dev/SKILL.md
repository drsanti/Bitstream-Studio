---
name: bitstream-studio-dev
description: >-
  Build, run, test, and package Bitstream Studio extension. Use for npm run
  compile, dev:webview, start:bridge, test:bitstream2, package VSIX, or
  HOW_TO_RUN workflows.
---

# Bitstream Studio — dev and build

## Repo layout

```text
Bitstream-Studio/
  AGENT_HANDOFF.md          # Read first on new machine
  extension/                # npm project root — all commands run here
  .cursor/rules/            # Agent policy
  .cursor/skills/           # Project skills
```

**Not in repo:** `T3D/`, `@ternion/t3d`, `bitstream-simulator/` (separate VSIX).

## Daily dev (two terminals)

```bash
cd extension
npm install

# Terminal 1 — restart after bridge / bitstream2 bridge edits
npm run start:bridge

# Terminal 2 — Vite HMR for webview
npm run dev:webview
```

URLs:

- Dev: `http://localhost:5173/` — toolbar tabs (Sensor Telemetry / Sensor Studio); last tab in `localStorage`
- VS Code: `Bitstream Studio: Open Bitstream Studio` (last tab); tab shortcut commands available

Full runbook: **`extension/HOW_TO_RUN.md`**

## When to compile vs HMR

| Change | Action |
|--------|--------|
| `src/webview/**` only | Vite HMR — no full compile |
| `src/serialport-bridge/**`, `src/bitstream2/**` bridge path | Restart **`start:bridge`** |
| `src/extension.ts`, host entry | `npm run compile` |
| Before VSIX | `npm run compile` then `npm run package` |

## Tests and probes

```bash
cd extension
npm run test:bitstream2          # 50 tests; --test-force-exit in script
npm run bitstream2:mock-probe    # in-process smoke
npm run bitstream2:uart-probe -- --path COM3 --baud 921600
```

## VSIX

```bash
cd extension
npm run compile
npm run package
code --install-extension bitstream-studio-*.vsix
```

Smoke checklist: **`extension/HOW_TO_RUN.md`** § VSIX smoke checklist.

## Telemetry modes

- **Bitstream** (`uart`) — real COM @ 921600
- **Simulator** — external **bitstream-simulator** VSIX + bridge

Mutually exclusive — **`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`**

## Related skills

- **`bs2-protocol-change`** — wire / spec changes
- **`bs2-uart-bringup`** — real MCU validation
- **`bitstream-simulator-app`** — external sim VSIX
