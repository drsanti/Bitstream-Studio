# Agent handoff — Bitstream Studio

**Purpose:** Onboarding for Cursor AI on **Bitstream-Studio**. Read this first.

**Last updated:** 2026-05-29 (Phase 0 bootstrap)  
**Repository:** https://github.com/drsanti/Bitstream-Studio  
**Migration source:** `ternion-t3d` @ **`BS2`** (legacy; Digital Twin stays there)

---

## 1. Clone and setup

```bash
git clone https://github.com/drsanti/Bitstream-Studio.git
cd Bitstream-Studio/extension
npm install
npm run dev:bitstream2-loopback
```

Dev URLs:

- http://localhost:5173/?app=bitstream — Sensor Telemetry
- http://localhost:5173/?app=sensor-studio — Sensor Studio

Full runbook: **`extension/HOW_TO_RUN.md`**.

---

## 2. Repository layout

| Path | Role |
|------|------|
| **`extension/`** | VS Code extension + webview + `src/bitstream2/` |
| **`extension/docs/BITSTREAM_T3D_DECOUPLING_PLAN.md`** | T3D removal phases (active roadmap) |
| **`extension/docs/DEVELOPMENT_TRACKER.md`** | Backlog |

**External (not in tree):**

- **bitstream-simulator** — separate VS Code extension repo
- **TESAIoT_Firmware / TESAIoT_Library** — MCU BS2 truth (`CM55/modules/bitstream`)

---

## 3. Product scope (v1 decisions)

- **Ship:** Sensor Telemetry, Sensor Studio, Asset Manager, Model Catalog
- **Defer:** Model Loader dashboard, AI Bridge, bs2-monitor standalone
- **UI decoupling:** TRN migration (Phase 3)
- **Extension id:** `bitstream-studio` (display **Bitstream Studio**)
- **Remove `@ternion/t3d`:** Phase 4

---

## 4. Document index

| Priority | File |
|----------|------|
| 1 | This file |
| 2 | `extension/docs/BITSTREAM_T3D_DECOUPLING_PLAN.md` |
| 3 | `extension/HOW_TO_RUN.md` |
| 4 | `extension/docs/DEVELOPMENT_TRACKER.md` |
| 5 | `D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Firmware\AGENT_HANDOFF.md` |
| 6 | `extension/src/bitstream2/docs/SENSOR_CFG_V2.md` |

---

## 5. Session log

| Date | Summary |
|------|---------|
| 2026-05-29 | **Phase 0 bootstrap:** new repo; `extension/` from `ternion-t3d` BS2; rebrand `bitstream-studio`; `@ternion/t3d@0.0.3` npm (no `T3D/`); root `.cursor/rules`; sim external. **Note:** `npm install` blocked by disk space (ENOSPC) — free space then `cd extension && npm install && npm run compile`. |
