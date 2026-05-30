# Agent handoff — Bitstream Studio

**Purpose:** Onboarding for Cursor AI on **Bitstream-Studio**. Read this first.

**Last updated:** 2026-05-30 (Phase 3–4 pushed to `main`; post-decoupling verify)  
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
- **UI decoupling:** Done (Phase 3 — `ui/catalog/`)
- **Extension id:** `bitstream-studio` (display **Bitstream Studio**)
- **Remove `@ternion/t3d`:** Done (Phase 4); Vite no longer resolves T3D package

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
| 2026-05-29 | **Phase 0 bootstrap:** new repo; `extension/` from `ternion-t3d` BS2; rebrand `bitstream-studio`; `@ternion/t3d@0.0.3` npm (no `T3D/`); root `.cursor/rules`; sim external |
| 2026-05-30 | **Phase 1 isolation:** `main.tsx` → `BitstreamApp` only; removed MyApp/WebviewRoot/launcher/project4/quick-scene; trimmed VS Code commands; `sync-t3d-css` npm fallback |
| 2026-05-30 | **Phase 2 thin bridge:** `extension-bridge/getVsCodeApi`; local quick-action store; `engine-environment/cubemapPresets`; zero `@ternion/t3d/vscode-webview` imports |
| 2026-05-30 | **Phase 3–4:** `extension/src/webview/ui/catalog/` (LabeledSlider, SortableCardList, CollapsiblePanelCard, …); removed `@ternion/t3d` from `package.json`; `npm run compile` OK |
| 2026-05-30 | **Vite + VSIX:** stripped T3D resolver/alias/COI plugins from `vite.config.ts`; dev default `/?app=bitstream`; `npm run package` → `bitstream-studio-0.1.0.vsix` (66.5 MB); install smoke pending |
| 2026-05-30 | **Cleanup:** removed `ensure-t3d-linked-build-fresh.js` / `sync-t3d-css.js`; fixed `npm run dev` → `dev:all`; updated HOW_TO_RUN + decoupling plan current state |
| 2026-05-30 | **Ship:** `3441cb5` pushed to `origin/main`; CLI VSIX install OK; `bitstream2:mock-probe` + `sim-scenario --offline boot` OK |
| 2026-05-30 | **Removed `bitstream-lab/`** — dead transport workbench module; use CLI probes + Sensor Telemetry for debug |

---

## 6. What's next (after T3D decoupling)

| Priority | Work | Notes |
|----------|------|--------|
| 1 | **VSIX UI smoke** | Reload window → **Open Sensor Telemetry** / **Open Sensor Studio**; Model Catalog preview |
| 2 | **Dual-runtime** | `npm run dev:bitstream2-loopback` + external **bitstream-simulator**; UART `bitstream2:uart-probe` when COM available |
| 3 | **MCU soak** | 5–10 min EVT without `--` flicker — `DEVELOPMENT_TRACKER.md` BS2 post-HELLO row |
