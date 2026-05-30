# Bitstream Studio

VS Code extension for **Sensor Telemetry** and **Sensor Studio** (BS2 Bitstream protocol).

- **Repository:** https://github.com/drsanti/Bitstream-Studio
- **Onboarding (read first):** [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md)
- **Docs index:** [`extension/docs/README.md`](extension/docs/README.md)
- **Backlog:** [`extension/docs/DEVELOPMENT_TRACKER.md`](extension/docs/DEVELOPMENT_TRACKER.md)
- **Runbook:** [`extension/HOW_TO_RUN.md`](extension/HOW_TO_RUN.md)
- **Telemetry modes:** [`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`](extension/docs/TELEMETRY_MODE_LIFECYCLE.md)

**Version:** `0.1.0` — VSIX smoke passed **2026-05-30** (see handoff §4).

## Layout

```text
Bitstream-Studio/
  extension/     # VS Code extension (npm project root)
  .cursor/       # Agent rules + skills (see .cursor/skills/README.md)
```

**Not in this repo:** `T3D/` (legacy engine), `bitstream-simulator/` (separate VS Code extension).

## Quick start

```bash
cd extension
npm install

# Terminal 1
npm run start:bridge

# Terminal 2
npm run dev:webview
```

See **`HOW_TO_RUN.md`** for Simulator mode and full stack (`npm start`).

Browser:

Dev URL: **http://localhost:5173/** — toolbar tabs switch Sensor Telemetry / Sensor Studio (persisted in `localStorage`).

| VS Code | Behavior |
|---------|----------|
| **Open Bitstream Studio** (`bitstream-studio.open`) | Last tab |
| **… (Sensor Telemetry tab)** | Telemetry workspace |
| **… (Sensor Studio tab)** | Studio workspace |

## External dependencies

| Component | Location |
|-----------|----------|
| **TESAIoT firmware / library** | `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\` (add to Cursor multi-root as needed) |
| **bitstream-simulator** | Separate repo — install VS Code extension for Simulator mode |
| **`@ternion/t3d`** | Removed (Phase 4 decoupling complete) |

## Legacy source

Bootstrapped from **`ternion-t3d`** branch **`BS2`**. Digital Twin remains on **`ternion-t3d`**.
