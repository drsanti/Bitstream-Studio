# Agent handoff — Bitstream Studio

**Purpose:** Onboarding for Cursor AI and humans. **Read this file first** when opening the repo on any machine.

**Last updated:** 2026-06-03 (Wi-Fi BS2 UART milestone)  
**Repository:** https://github.com/drsanti/Bitstream-Studio  
**Extension version:** `0.1.0` (`extension/package.json`)  
**Migration source:** `ternion-t3d` @ **`BS2`** (Digital Twin stays there; do not merge back)

---

## 0. Continue on another machine (checklist)

1. **Clone / pull** `Bitstream-Studio` and ensure **`extension/`** is the npm root.
2. **Read this file** → **`extension/docs/DEVELOPMENT_TRACKER.md`** (current focus) → **`extension/HOW_TO_RUN.md`**.
3. **Install deps:** `cd extension && npm install`
4. **Dev stack (two terminals):**
   - Terminal 1: `npm run start:bridge`
   - Terminal 2: `npm run dev:webview`
5. **After bridge or host changes:** restart **`start:bridge`**. After webview-only edits, Vite HMR is enough.
6. **VSIX:** `npm run compile && npm run package` → install `bitstream-studio-0.1.0.vsix` → reload window.
7. **Tests:** `npm run test:bitstream2` (50 tests; `--test-force-exit` in script).
8. **External repos** (not in tree): **bitstream-simulator** (Simulator mode), **TESAIoT_Firmware** (MCU BS2 truth).

**Landing (dev):** `http://localhost:5173/` — workspace + simulation picker; 2D/3D/blend backdrop; flat HTML cards (see `extension/src/webview/landing/README.md`). **Ctrl+/** → **Open workspace landing** (dev + VSIX).

**WebGL transitions:** Landing backdrop and sim viewports each use R3F `Canvas`. Route changes go through **`shared/webgl/`** (`useWebGLSurfaceReady`) — read that README before re-adding `lazy()` on 3D routes.

---

## 1. Clone and setup

```bash
git clone https://github.com/drsanti/Bitstream-Studio.git
cd Bitstream-Studio/extension
npm install

# Terminal 1
npm run start:bridge

# Terminal 2
npm run dev:webview
```

Dev URL:

- http://localhost:5173/ — toolbar tabs: **Sensor Telemetry** | **Sensor Studio** (no `?app=` routing; last tab in `localStorage`)

VS Code: **Bitstream Studio: Open Bitstream Studio** (status bar) restores last tab; tab-specific commands override on first open.

Full runbook: **`extension/HOW_TO_RUN.md`**.

---

## 2. Repository layout

| Path | Role |
|------|------|
| **`extension/`** | VS Code extension + webview + `src/bitstream2/` |
| **`extension/docs/DEVELOPMENT_TRACKER.md`** | Backlog, VSIX gates, recently completed |
| **`extension/src/webview/landing/README.md`** | Landing backdrop, cards, routing |
| **`extension/src/webview/simulations/README.md`** | Digital Twin hub + sim apps |
| **`extension/src/webview/shared/webgl/README.md`** | WebGL Canvas transition gate + Vite chunks |
| **`extension/docs/APPLICATION_MIGRATION_PLAN.md`** | E84 / ABB / vehicle sim port from `ternion-t3d` (R3F, phased) |
| **`extension/docs/README.md`** | Docs index (BS2, bridge, assets, Sensor Studio) |
| **`extension/docs/ASSETS_ONLINE_REPO.md`** | GitHub free pack — **`main/assets`** base URL, sync, publish (read before any online asset work) |
| **`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`** | Bitstream vs Simulator exclusivity (A+B) |
| **`AGENT_HANDOFF.md`** | This file |

**External (not in tree):**

| Component | Path / note |
|-----------|-------------|
| **bitstream-simulator** | Separate VS Code extension repo (under `ternion-t3d/bitstream-simulator/` on this machine) |
| **TESAIoT firmware BS2** | `TESAIoT_Library/CM55/modules/bitstream` |
| **`@ternion/t3d`** | **Removed** from Bitstream Studio (Phase 4 complete) |

---

## 3. Product scope (v1)

| Ship | Defer |
|------|-------|
| Sensor Telemetry, Sensor Studio, Asset Manager, Model Catalog | Model Loader dashboard, AI Bridge, bs2-monitor standalone |
| BS2 simulator via external extension | In-bridge `BsFirmwareSimulator` / `BITSTREAM2_DEV_LOOPBACK` |
| Rapier deps reserved for future Sensor Studio physics | Jolt Physics (removed 2026-05-30) |

- **Extension id:** `bitstream-studio` (display **Bitstream Studio**)
- **Entry:** `main.tsx` → **`BitstreamWebviewRoot`** (landing / sim hub / `BitstreamApp` shell)

---

## 4. Current milestone — v0.1.0 ship gate

| Gate | Status (2026-05-30) |
|------|---------------------|
| T3D decoupling | **Done** |
| Jolt removed; VSIX ~**40.48 MB** (was 66.5 MB) | **Done** |
| `npm run compile` / `test:bitstream2` (50/50) | **Done** |
| Dev: `start:bridge` + `dev:webview` | **User verified** |
| VSIX install + panels (A in HOW_TO_RUN) | **User verified** |
| Simulator dual-runtime (B) | **User verified** |
| Telemetry mode exclusivity (A+B) | **User verified** |
| UART `bitstream2:uart-probe` + MCU soak | **When hardware available** |
| Version bump + `changelog.md` | **User request only** (not done) |

---

## 5. Document index

| Priority | File |
|----------|------|
| 1 | **`AGENT_HANDOFF.md`** (this file) |
| 2 | **`extension/docs/DEVELOPMENT_TRACKER.md`** |
| 3 | **`extension/HOW_TO_RUN.md`** (dev, VSIX smoke, CLI probes) |
| 4 | **`extension/src/webview/landing/README.md`** |
| 5 | **`extension/src/webview/simulations/README.md`** |
| 6 | **`extension/src/webview/shared/webgl/README.md`** |
| 7 | **`extension/docs/BS2_PROTOCOL_INDEX.md`** |
| 8 | **`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`** |
| 9 | **`extension/docs/BITSTREAM_TELEMETRY_OPERATIONS.md`** |
| 10 | **`TESAIoT_Firmware/AGENT_HANDOFF.md`** (MCU BS2) |
| 11 | **`extension/src/bitstream2/docs/SENSOR_CFG_V2.md`** |
| 12 | **`extension/src/webview/sensor-studio/docs/NODE_ANIMATOR_PARITY.md`** (flow editor UX parity) |
| 13 | **`extension/src/webview/sensor-studio/docs/FLOW_DOMAINS.md`** (telemetry vs scene tick domains) |

---

## 6. Key implementation map (2026-05-30)

### Telemetry mode (Bitstream ↔ Simulator)

| Layer | Path |
|-------|------|
| Lifecycle orchestrator | `extension/src/webview/bitstream-app/bridge/telemetryModeLifecycle.ts` |
| Route publish | `extension/src/webview/bitstream-app/bridge/publishTelemetryRoute.ts` |
| Sim idle/run | `extension/src/webview/bitstream-app/bridge/publishDevSimStreamingControl.ts` |
| Toolbar store | `extension/src/webview/bitstream-app/state/bitstreamTelemetrySource.store.ts` |
| Ingest gates | `extension/src/webview/bitstream-app/utils/bitstreamTelemetryTransport.ts` |
| WS bridge hook | `extension/src/webview/bitstream-app/hooks/useBitstream2TelemetryBridge.ts` |
| Serial bridge | `extension/src/serialport-bridge/SerialPortWebSocketBridge.ts` |
| Protocol | `extension/src/bitstream2/bridge/protocol.ts` (`TELEMETRY_ROUTE`, `origin` on samples) |

### Landing + Digital Twin simulations

| Layer | Path |
|-------|------|
| Webview root / routing | `extension/src/webview/landing/BitstreamWebviewRoot.tsx` |
| Landing UI | `extension/src/webview/landing/BitstreamLanding.tsx` |
| 3D backdrop (eager R3F) | `extension/src/webview/landing/BitstreamLandingBackground3D.tsx` |
| Sim hub | `extension/src/webview/simulations/SimulationHub.tsx` → `SimulationHost.tsx` |
| Sim catalog + `import()` | `extension/src/webview/simulations/catalog/simulationCatalog.ts` |
| Shared sim Canvas | `extension/src/webview/simulations/shared/canvas/SimulationCanvas.tsx` |
| WebGL route gap | `extension/src/webview/shared/webgl/` |
| Vite vendor chunks | `extension/vite.config.ts` → `manualChunks` (`vendor-react`, `vendor-r3f`) |
| Quick command landing | `extension/src/webview/landing/useBitstreamLandingQuickCommands.ts` |

**Do not:** `lazy()`-load `SimulationHost` or `BitstreamLandingBackground3D` without shared React chunks (React **#321**). **Do not** mount landing + sim Canvases in one commit without `useWebGLSurfaceReady`.

### Sensor Studio flow editor (node-animator parity)

| Layer | Path |
|-------|------|
| Parity plan + shortcuts | `extension/src/webview/sensor-studio/docs/NODE_ANIMATOR_PARITY.md` |
| Add-node menu (Shift+A) | `extension/src/webview/sensor-studio/features/editor/components/FlowAddNodeMenu.tsx` |
| Canvas + layout **R** shortcut | `extension/src/webview/sensor-studio/features/editor/components/FlowCanvas.tsx` |
| Layout spawn hook | `extension/src/webview/sensor-studio/features/editor/keyboard/use-flow-canvas-layout-shortcuts.ts` |
| Layout RF types | `extension/src/webview/sensor-studio/features/editor/layout-nodes/` |
| Store (connect, spawn, sim) | `extension/src/webview/sensor-studio/features/editor/store/flow-editor.store.ts` |
| Unit tests | `extension/tests/sensor-studio/layout-flow-nodes.test.ts` |

**Note:** **R** uses `reactFlowRef` from `onInit` — do not call `useReactFlow()` in hooks mounted outside `<ReactFlow>` (React Flow error #001).

### Build / test

| Item | Path / command |
|------|----------------|
| VSIX package | `npm run package` → `extension/bitstream-studio-0.1.0.vsix` |
| Unit tests | `npm run test:bitstream2` (`--test-force-exit` in `package.json`) |
| VSIX smoke checklist | `extension/HOW_TO_RUN.md` § VSIX smoke checklist |

---

## 7. Session log

| Date | Summary |
|------|---------|
| 2026-06-03 | **Wi-Fi BS2 UART:** `domains/wifi/*`, `useBitstreamWifiController` / `useBitstreamWifiEvtBridge`, Device Wi-Fi TRN window; removed legacy `src/bitstream/wifi/*`; spec `WIFI_BS2.md` + `BITSTREAM_BS_FRAMED_PROTOCOL_SPEC` §10; MCU soak OK |
| 2026-06-02 | **Flow edge UX + node chrome:** Phases A–D prefs/inspector/parallel/bundle/bus/reconnect; header icons + layout; Environment chevron removed; toolbar **`<1 fps`** + fresh-pipeline tint |
| 2026-06-02 | **Workbench layout modals + Stage catalog:** Save/Manage layouts centered TRN modals (`WORKBENCH_LAYOUT_DIALOGS.md`); model picker badges/icons; snapshot **`studioAssetId`** sync; viewport keep-until-loaded + rig-policy template swap; **`TRNSelect`** `rightSlot` / no row checkmark |
| 2026-06-02 | **GLB Animation Lab UX:** Inspector tab rename + truncate; tag **Filter** menu; env cubemap background in lab; parallel-all + loop auto-play; **`tests/bitstream-app/animation-lab-twin-tag-filter.test.ts`** |
| 2026-06-02 | **Startup checklist v3:** First-run sequential tour when all green; recheck + presentation fixes; tests under **`tests/startup-checklist/`** |
| 2026-06-01 | **Shell toolbar — control deck + metrics:** `ShellControlDeck`; wire RX (BS2 JSON window) + decode FPS chips; header menu slot; Studio canvas menu-only; `formatWallClockAgeAgo`; `RuntimeServicesHealthPanel` `input.ext` fix |
| 2026-06-01 | **Sensor Studio — Environment/Camera socket badges:** wired **`env`**/**`cam`** inputs + **Environment**/**Camera / View** outputs show compact tinted badges (preset name or FOV) |
| 2026-06-01 | **Sensor Studio — Studio Model socket labels:** **Studio Model** `out` and wired **Model** inputs show catalog-friendly names via **`modelSelectEmitDisplayName`** (not raw URLs); **`model-select-emit-display-name.test.ts`** |
| 2026-05-31 | **Sensor Studio — node-animator parity Phases 1–3:** Shift+A add menu; keyboard registry + recent nodes + palette layout; layout RF nodes (reroute/frame/note/split), **R** shortcut via `reactFlowRef`, Layout inspector + tests; docs **`NODE_ANIMATOR_PARITY.md`**, tracker |
| 2026-05-31 | **BMI270 Output profile + temperature:** Output profile card (presets + coordinated Apply); Operation **Both** label; Custom advanced channels; host EVT merge/finalize + Telemetry channels restore; firmware default mask 0x07; unit tests |
| 2026-05-29 | **Phase 0 bootstrap:** new repo from `ternion-t3d` BS2; rebrand `bitstream-studio`; external sim |
| 2026-05-30 | **Phases 1–4:** isolate BitstreamApp; extension-bridge; `ui/catalog/`; remove `@ternion/t3d`; Vite/VSIX |
| 2026-05-30 | **Removed Jolt Physics** — WASM, Vite plugins, host COI; Rapier kept for future |
| 2026-05-30 | **Product-ready cleanup** — README, HOW_TO_RUN VSIX checklist, removed `cannon-es` + demo UI |
| 2026-05-30 | **`test:bitstream2`** — added `--test-force-exit` (simulator timer hang fix) |
| 2026-05-30 | **Telemetry mode A+B** — lifecycle + `bitstream2/telemetry/route` + bridge `origin` tags |
| 2026-05-30 | **VSIX smoke passed** — user `npm run package`, install, panels + mode switch verified |
| 2026-05-30 | **Handoff docs pass** — `TELEMETRY_MODE_LIFECYCLE.md`; expanded AGENT_HANDOFF; cross-links in HOW_TO_RUN, README, sensor flow, cursor rules |
| 2026-05-30 | **Landing + sim hub** — `webview/landing/` (2D/3D backdrop, sim cards), `webview/simulations/` (E84, vehicle physics Jolt); nav circular-import fix |
| 2026-05-30 | **CSS3D landing cards** — Phase 2 started (`landing/css3d/`) |
| 2026-05-30 | **Cursor rules + skills** — `bs2-protocol-change`, simulator path, four project skills; rules deduped for Bitstream Studio (no t3d-extension paths) |
| 2026-05-30 | **URL routing removed (A+C)** — no `?app=`; toolbar + `localStorage`; `bitstream-studio.open` unified VS Code entry; tab shortcut commands kept |
| 2026-05-30 | **Simulator orchestration** — host `bitstreamSimulator.start/stop` commands; Connect auto-starts external sim; toolbar **Start simulator** button; `loopbackAvailable` no longer optimistic on Source switch |
| 2026-05-30 | **`extension/docs` cleanup** — removed TESAIoT firmware/MQTT/credential copies; added `docs/README.md` index |
| 2026-05-30 | **Removed `BITSTREAM_T3D_DECOUPLING_PLAN.md`** — migration complete; history in session log + `docs/README.md` |
| 2026-05-30 | **Landing polish** — flat HTML cards (clickable over WebGL); blend layer order; icon hover (`LandingCardIcon`); floating shape sin/cos orbit; more flow bubbles |
| 2026-05-30 | **React #321 + WebGL fixes** — removed lazy 3D/sim host; `vite` `manualChunks` (`vendor-react`, `vendor-r3f`); `"use no memo"` on R3F files; `shared/webgl/` route transition gate; docs updated |

---

## 8. What's next

| Priority | Work | Notes |
|----------|------|--------|
| 1 | **Verify landing ↔ sim on VSIX** | Click E84 / ABB / Vehicle from landing; Ctrl+/ back to landing |
| 2 | **UART + MCU** | `npm run bitstream2:uart-probe -- --path COMx --baud 921600` when board connected |
| 3 | **MCU soak** | 5–10 min EVT — see DEVELOPMENT_TRACKER BS2 post-HELLO row |
| 4 | **Cleanup** | Remove unused `landing/css3d/` reparenting code (optional) |
| 5 | **Release cut** | Bump version + `changelog.md` when ready for **v0.1.x** tag |
| 6 | **Backlog** | Restore BS2 `SENSOR_CFG_SET` from webview Apply; strip AI-bridge Project4 stubs |

---

## 9. Rules and skills for agents (this repo)

### Cursor rules (`.cursor/rules/`)

| Rule | Purpose |
|------|---------|
| **`bitstream-studio-handoff.mdc`** | Read order on new session |
| **`bs2-protocol-change.mdc`** | Spec → code → tests → firmware → sim |
| **`bitstream-dual-runtime.mdc`** | Bitstream vs Simulator exclusivity |
| **`bitstream-simulator-app-path.mdc`** | External sim VSIX |
| **`tesaiot-firmware-bitstream-paths.mdc`** | MCU firmware paths |
| **`bitstream-studio-rules.mdc`** | Repo layout, VSIX, no T3D |

Mirror copies under **`extension/.cursor/rules/`** where present.

### Project skills (`.cursor/skills/`)

| Skill | When |
|-------|------|
| **`bs2-protocol-change`** | Wire / SENSOR_CFG / broker topic changes |
| **`bitstream-studio-dev`** | compile, bridge, dev:webview, package |
| **`bs2-uart-bringup`** | Real COM, uart-probe, MCU |
| **`bitstream-simulator-app`** | External sim VSIX |

### Other

- Chat: **English and/or Thai** only.
- Do **not** edit `changelog.md` unless the user asks.
- TESAIoT firmware `*.c` / `*.h` edits: `make program` (different repo).
- Restart **bridge** after `SerialPortWebSocketBridge.ts` or bridge-side `bitstream2/` changes.
