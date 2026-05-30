# Bitstream Studio

VS Code extension for **Sensor Telemetry** and **Sensor Studio** (BS2 Bitstream protocol).

- **Repository:** https://github.com/drsanti/Bitstream-Studio
- **Migration plan:** `extension/docs/BITSTREAM_T3D_DECOUPLING_PLAN.md`
- **Onboarding:** `AGENT_HANDOFF.md`

## Layout

```text
Bitstream-Studio/
  extension/     # VS Code extension (npm project root)
  .cursor/       # Cursor agent rules
```

**Not in this repo:** `T3D/` (legacy engine), `bitstream-simulator/` (separate VS Code extension).

## Quick start

```bash
cd extension
npm install
npm run dev:bitstream2-loopback   # bridge + Vite; see HOW_TO_RUN.md
```

Browser:

- Sensor Telemetry: http://localhost:5173/?app=bitstream
- Sensor Studio: http://localhost:5173/?app=sensor-studio

## External dependencies

| Component | Location |
|-----------|----------|
| **TESAIoT firmware / library** | `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\` (add to Cursor multi-root as needed) |
| **bitstream-simulator** | Separate repo — install VS Code extension for Simulator mode |
| **`@ternion/t3d`** | Temporary npm dep — removed in Phase 4 of decoupling plan |

## Legacy source

Bootstrapped from **`ternion-t3d`** branch **`BS2`**. Digital Twin remains on **`ternion-t3d`**.
