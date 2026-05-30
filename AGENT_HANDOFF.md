# Agent handoff — Bitstream Studio

**Purpose:** Onboarding for Cursor AI and humans. **Read this file first** when opening the repo on any machine.

**Last updated:** 2026-05-30 (v0.1.0 VSIX smoke passed; telemetry mode A+B; product-ready cleanup)  
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

**Uncommitted work:** Run `git status` in repo root — this session may have doc + code changes not yet pushed.

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
| **`extension/docs/BITSTREAM_T3D_DECOUPLING_PLAN.md`** | T3D removal ( **complete** ) |
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
- **Entry:** `main.tsx` → `BitstreamApp` only (no Digital Twin / Project4 / quick-scene)

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
| 4 | **`extension/docs/BS2_PROTOCOL_INDEX.md`** |
| 5 | **`extension/docs/TELEMETRY_MODE_LIFECYCLE.md`** |
| 6 | **`extension/docs/BITSTREAM_T3D_DECOUPLING_PLAN.md`** (historical + complete) |
| 7 | **`extension/docs/BITSTREAM_TELEMETRY_OPERATIONS.md`** |
| 8 | **`TESAIoT_Firmware/AGENT_HANDOFF.md`** (MCU BS2 — firmware wire in **`TESAIoT_Library/CM55/modules/bitstream`**) |
| 9 | **`extension/src/bitstream2/docs/SENSOR_CFG_V2.md`** |

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
| 2026-05-29 | **Phase 0 bootstrap:** new repo from `ternion-t3d` BS2; rebrand `bitstream-studio`; external sim |
| 2026-05-30 | **Phases 1–4:** isolate BitstreamApp; extension-bridge; `ui/catalog/`; remove `@ternion/t3d`; Vite/VSIX |
| 2026-05-30 | **Removed Jolt Physics** — WASM, Vite plugins, host COI; Rapier kept for future |
| 2026-05-30 | **Product-ready cleanup** — README, HOW_TO_RUN VSIX checklist, removed `cannon-es` + demo UI |
| 2026-05-30 | **`test:bitstream2`** — added `--test-force-exit` (simulator timer hang fix) |
| 2026-05-30 | **Telemetry mode A+B** — lifecycle + `bitstream2/telemetry/route` + bridge `origin` tags |
| 2026-05-30 | **VSIX smoke passed** — user `npm run package`, install, panels + mode switch verified |
| 2026-05-30 | **Handoff docs pass** — `TELEMETRY_MODE_LIFECYCLE.md`; expanded AGENT_HANDOFF; cross-links in HOW_TO_RUN, README, sensor flow, cursor rules |
| 2026-05-30 | **Cursor rules + skills** — `bs2-protocol-change`, simulator path, four project skills; rules deduped for Bitstream Studio (no t3d-extension paths) |
| 2026-05-30 | **URL routing removed (A+C)** — no `?app=`; toolbar + `localStorage`; `bitstream-studio.open` unified VS Code entry; tab shortcut commands kept |

---

## 8. What's next

| Priority | Work | Notes |
|----------|------|--------|
| 1 | **Commit / push** | Ensure doc + code from this session are on `origin/main` |
| 2 | **UART + MCU** | `npm run bitstream2:uart-probe -- --path COMx --baud 921600` when board connected |
| 3 | **MCU soak** | 5–10 min EVT — see DEVELOPMENT_TRACKER BS2 post-HELLO row |
| 4 | **Release cut** | Bump version + `changelog.md` when ready for **v0.1.x** tag |
| 5 | **Backlog** | Restore BS2 `SENSOR_CFG_SET` from webview Apply; strip AI-bridge Project4 stubs |

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
