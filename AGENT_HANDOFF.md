# Agent handoff — Bitstream Studio

**Purpose:** Onboarding for Cursor AI and humans. **Read this file first** when opening the repo on any machine.

**Last updated:** 2026-06-10 (Bitstream Telemetry Provider shipped + Course HTML blocks)  
**Repository:** https://github.com/drsanti/Bitstream-Studio  
**Extension version:** `0.1.0` (`extension/package.json`)  
**Migration source:** `ternion-t3d` @ **`BS2`** (Digital Twin stays there; do not merge back)

---

## 0. Continue on another machine (checklist)

1. **Clone / pull** `Bitstream-Studio` from https://github.com/drsanti/Bitstream-Studio (`git pull origin main`).
2. **Read this file** → **`extension/docs/DEVELOPMENT_TRACKER.md`** (backlog + recently completed) → **`extension/HOW_TO_RUN.md`**.
3. **Install deps:** `cd extension && npm install`
4. **Dev stack (recommended — one command):**
   ```bash
   cd extension
   npm start
   ```
   Starts **broker :9998**, **telemetry provider :9997**, Vite **:5173**, extension watch, AI bridge.  
   **Or two terminals:** `npm run start:bridge` + `npm run dev:webview`.
5. **After bridge or host changes:** restart **`start:bridge`** (provider :9997 starts inside it). Webview-only edits: Vite HMR.
6. **VSIX:** `npm run compile && npm run package` → install `bitstream-studio-0.1.0.vsix` → reload window.
7. **Tests:**
   - `npm run test:bitstream2` (includes telemetry-provider tests)
   - Course Studio: `npx tsx --test --test-force-exit tests/course-studio/*.test.ts`
8. **External repos** (not in tree): **bitstream-simulator** (Simulator toolbar mode), **TESAIoT_Firmware** (MCU BS2 truth).

**Bitstream Telemetry Provider (shipped 2026-06-10):** Portable kit for developers / AI agents: **`extension/docs/bitstream-telemetry-provider/`** — start with **`SKILL.md`** (connect live first, mock fallback, plain **Bitstream** / **Simulator** language). Public API: **`ws://127.0.0.1:9997`**. Course iframes use **`CourseTelemetryPostMessageBridge`** (`bitstream:ready` → `postMessage`). Regenerate kit: `npm run bitstream2:telemetry-catalog:gen`.

**Course Studio (current focus):** `http://localhost:5173/?workspace=course-studio` — read **`extension/src/webview/course-studio/README.md`**, then **`course-studio/docs/COURSE_OUTLINE.md`**. **HTML page blocks** + live telemetry demos on SHT40/DPS368/BMI270 **Live visualization** topics. Maintainer is **dev-only** (`import.meta.env.DEV`). Presentation v1 frozen: **`extension/src/webview/presentation/V1_FROZEN.md`**.

**Course authoring → VSIX:** Edit in dev with Maintainer on → top-bar **Save** writes `content/*.page.v1.json` + `tesaiot-embedded.course.v1.json` (diagram/scene/markdown use per-pane Save). **Commit** those JSON/md files → **`npm run compile && npm run package`**. Installed VSIX is read-only (no Save APIs). Unsaved work survives browser refresh via **localStorage session draft** only until Save + commit.

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
| **`extension/docs/WEBVIEW_DEV_PERFORMANCE.md`** | Vite dev load time, lazy Sensor Studio panes/panels, HMR vs refresh |
| **`extension/src/webview/landing/README.md`** | Landing backdrop, cards, routing |
| **`extension/src/webview/simulations/README.md`** | Digital Twin hub + sim apps |
| **`extension/src/webview/shared/webgl/README.md`** | WebGL Canvas transition gate + Vite chunks |
| **`extension/src/webview/course-studio/README.md`** | Course Studio v2 workspace (alive documents) |
| **`extension/src/webview/presentation/V1_FROZEN.md`** | Presentation v1 frozen — bugfix only |
| **`extension/docs/README.md`** | Docs index (BS2, bridge, assets, Sensor Studio) |
| **`extension/docs/ASSETS_ONLINE_REPO.md`** | GitHub free pack — **`main/assets`** base URL, sync, publish (read before any online asset work) |
| **`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`** | Bitstream vs Simulator exclusivity (A+B) |
| **`extension/docs/bitstream-telemetry-provider/`** | **Telemetry Provider kit** — AI **`SKILL.md`**, EXAMPLES, catalog JSON |
| **`extension/docs/BITSTREAM_TELEMETRY_PROVIDER.md`** | Pointer to portable kit |
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
| `npm run compile` / `test:bitstream2` (63/63) | **Done** |
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
| 8b | **`extension/docs/bitstream-telemetry-provider/SKILL.md`** — external dashboards / AI agents (WS :9997, iframe postMessage) |
| 9 | **`extension/src/webview/course-studio/README.md`** — Course Studio agent onboarding (read for v2 work) |
| 10 | **`extension/src/webview/course-studio/docs/ARCHITECTURE.md`** — layout, phases, maintainer |
| 11 | **`presentation/docs/DEVELOPMENT_PLAN.md`** — v2 roadmap §16–17 |
| 12 | **`extension/src/webview/presentation/V1_FROZEN.md`** — Presentation v1 bugfix-only |
| 13 | **`TESAIoT_Firmware/AGENT_HANDOFF.md`** (MCU BS2) |
| 14 | **`extension/src/bitstream2/docs/SENSOR_CFG_V2.md`** |
| 15 | **`extension/src/webview/sensor-studio/docs/NODE_ANIMATOR_PARITY.md`** (flow editor UX parity) |
| 16 | **`extension/src/webview/sensor-studio/docs/FLOW_DOMAINS.md`** (telemetry vs scene tick domains) |

---

## 6. Key implementation map (2026-06-10)

### Bitstream Telemetry Provider (shipped)

| Layer | Path |
|-------|------|
| Portable kit (upload to AI / devs) | `extension/docs/bitstream-telemetry-provider/` — **`SKILL.md`** first |
| TypeScript catalog (source of truth) | `extension/src/bitstream2/telemetry-provider/catalog/` |
| Public gateway (:9997) | `extension/src/bitstream2/telemetry-provider/TelemetryProviderGateway.ts` |
| VSIX / dev bridge entry | `extension/src/combined-bridge-entry.ts` (auto-starts provider; `BITSTREAM_TELEMETRY_PROVIDER_DISABLE=1` to skip) |
| Sample mapper | `extension/src/bitstream2/telemetry-provider/map-provider-sample.ts` |
| R1 commands | `extension/src/bitstream2/telemetry-provider/provider-command-handlers.ts` |
| SDK client | `extension/src/bitstream2/telemetry-provider/client/BitstreamTelemetryClient.ts` |
| Course iframe bridge | `extension/src/webview/course-studio/runtime/CourseTelemetryPostMessageBridge.tsx` |
| Bundled course examples | `extension/src/webview/course-studio/content/telemetry-examples/` (synced on catalog gen) |
| Unit tests | `extension/tests/bitstream2/telemetry-provider-*.test.ts` |
| Regenerate kit + course HTML | `npm run bitstream2:telemetry-catalog:gen` |
| Hardware smoke (contributors) | `npm run bitstream2:provider-uart-smoke -- --path=…` |

**AI agents:** connect **`ws://127.0.0.1:9997`** or iframe **`postMessage`** first; **mock fallback** if unavailable — see kit **`SKILL.md`**.

### Course Studio v2 (current focus)

| Layer | Path |
|-------|------|
| Agent onboarding | `extension/src/webview/course-studio/README.md` |
| Architecture / phases | `extension/src/webview/course-studio/docs/ARCHITECTURE.md` |
| Workspace entry | `extension/src/webview/course-studio/CourseStudioWorkspace.tsx` |
| Shell + live sync | `extension/src/webview/course-studio/layout/CourseStudioShell.tsx` |
| Page schema | `extension/src/webview/course-studio/schemas/page.v1.ts` |
| Diagram schema | `extension/src/webview/course-studio/schemas/diagram.v1.ts` |
| 2D renderer + bindings | `extension/src/webview/course-studio/runtime/diagram/` |
| Maintainer (dev only) | `extension/src/webview/course-studio/maintainer/` |
| Pilot content | `extension/src/webview/course-studio/content/` |
| 3D block scenes | `extension/src/webview/course-studio/ui/catalog/CourseDiagram3DCard.tsx` |
| Dev save APIs | `extension/vite.config.ts` → `save-page`, `save-diagram`, `save-markdown` |
| Lazy workspace load | `extension/src/webview/bitstream-app/BitstreamWorkspacePanel.tsx` |
| HTML page blocks + telemetry demos | `maintainer/html-editor/`, `CourseHtmlPageCard`, live-topic loaders in `content/load*ChapterPages.ts` |
| Unit tests | `extension/tests/course-studio/*.test.ts` |
| v2 roadmap | `presentation/docs/DEVELOPMENT_PLAN.md` §16–17 |

**Dev URL:** `http://localhost:5173/?workspace=course-studio` — Maintainer toggle + inspector (**Ctrl+\\**).  
**Live data:** reuse `presentation/` hooks via `course-studio/shared/live.ts` — do not fork BMI270 store.

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
| Unit tests | `npm run test:bitstream2`; Course Studio: `npx tsx --test --test-force-exit tests/course-studio/*.test.ts` |
| VSIX smoke checklist | `extension/HOW_TO_RUN.md` § VSIX smoke checklist |

---

## 7. Session log

| Date | Summary |
|------|---------|
| 2026-06-10 | **Bitstream Telemetry Provider (P0–P4 shipped):** catalog + gateway **:9997** (in `combined-bridge-entry` / VSIX); Course **`CourseTelemetryPostMessageBridge`**; R1 commands + SDK; EXAMPLES (gyro, humidity, pressure); kit **`docs/bitstream-telemetry-provider/`** + AI **SKILL** (WS first, mock fallback); iframe origin hardening; per-sensor **`staleAfterMs`**; Course **HTML page blocks**; live-topic embedded demos; tests |
| 2026-06-08 | **Course Studio — four-sensor book + outline authoring:** TESAIoT Embedded manifest ships **BMI270**, **BMM350**, **DPS368**, **SHT40** (four topics each); outline Add defers disk write (no Vite full reload); session draft persists outline + runtime pages; `mergeCourseOutlineWithBundled` on restore; multi-subtopic under one topic; GitHub `/blob/` image URLs resolve via raw fetch; BMI270 pages refined; **441** course-studio tests |
| 2026-06-09 | **Course Studio 3D Scene editor:** Split workbench pane (preset `diagram-3d` vs design `diagram-2d` 3D layer); gizmo + outliner + default camera + **Save view**; Quick add on blank page; auto-enable 3D layer; focus routing tests |
| 2026-06-08 | **Course Studio v2 (Phases 0, 7a–7d, 7f slice, 7g–7i):** new `course-studio/` workspace — page grid, markdown theory, `diagram.v1` + maintainer canvas (undo, z-order, curves, snap), bindings + MapOp chain, `diagram-3d` block; lazy workspace chunks + landing routing; TRN maintainer inspector; 54 unit tests; **`course-studio/README.md`** + tracker/architecture docs |
| 2026-06-10 | **Webview dev perf:** Sensor Studio lazy workbench panes + lazy flow node panels; React Compiler prod-only; `main.tsx` immediate mount + HMR root; **`docs/WEBVIEW_DEV_PERFORMANCE.md`** |
| 2026-06-08 | **TRN menu search + shell recovery:** menus with **>5 items** use **`TRNSearchableMenuShell`** / **`TRNMenuSearch`** (`TRN_MENU_SEARCH_MIN_ITEMS = 6`); hamburger scroll + search (Port Admin reachable in VSIX); UART notice → Port Admin; startup checklist bridge/WebSocket recovery; rule **`trn-menu-search.mdc`** |
| 2026-06-08 | **Sensor Studio performance:** live store sidecar + dashboard structural/live split; socket **layout key** (sine-wave fps fix); Inspector **Performance** card (flow/3D caps, live stats, overlay); **While editing canvas** policy (keep/pause/throttle); docs **`SENSOR_STUDIO_PERFORMANCE.md`** |
| 2026-06-04 | **Free pack:** VSIX **Sync/Diagnose Free Pack**; studio-aligned sync; living-upstream maintainer docs; **`TRNWindow`** overlay portaled to `document.body` (Free Loader / modals above workbench panes) |
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
| 1 | **Course Studio — VSIX smoke** | `npm run package` → verify four chapters, **HTML telemetry bars** on live topics, provider **:9997** in bridge log — **`HOW_TO_RUN.md`** § B4, C3–C4 |
| 1b | **Telemetry provider — hardware pass** | Toolbar **Bitstream** → COM; `npm run bitstream2:provider-uart-smoke`; Course iframe bars move |
| 2 | **Course Studio — content polish** | Diagram/scene assets per chapter; pack export includes course manifest; outline drag-reorder |
| 3 | **Course Studio — 7e** | Optional embed diagrams in Presentation v1 theory slides |
| 4 | **Verify landing ↔ sim on VSIX** | Click E84 / ABB / Vehicle from landing; Ctrl+/ back to landing |
| 5 | **UART + MCU** | `npm run bitstream2:uart-probe -- --path COMx --baud 921600` when board connected |
| 6 | **Release cut** | Bump version + `changelog.md` when ready for **v0.1.x** tag |
| 7 | **Backlog** | Restore BS2 `SENSOR_CFG_SET` from webview Apply; strip AI-bridge Project4 stubs |

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
| **`bitstream-telemetry-provider`** | External dashboards, Course HTML, `bitstream:sample` kit |

### Cursor rules (telemetry)

| Rule | Purpose |
|------|---------|
| **`bitstream-telemetry-provider.mdc`** | Kit path, AI workflow pointers |

### Other

- Chat: **English and/or Thai** only.
- Do **not** edit `changelog.md` unless the user asks.
- TESAIoT firmware `*.c` / `*.h` edits: `make program` (different repo).
- Restart **bridge** after `SerialPortWebSocketBridge.ts` or bridge-side `bitstream2/` changes.
