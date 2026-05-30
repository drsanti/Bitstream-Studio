# Project 4 — Development tracker

Sandbox sub-project under `src/webview/project4`. **All new Project 4–specific files** (components, hooks, assets, scripts, etc.) **must be created only inside this folder** — organized into subfolders as needed. **Imports from elsewhere** (`@ternion/t3d`, shared libs) are fine; **do not add twin-owned modules outside `project4/`**. See [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Development rules.

## How to maintain this file

- Update when **status** changes, **requirements** are added or clarified, work is **completed**, or **plans** shift.
- Use **ISO dates** (`YYYY-MM-DD`) on new bullets.
- Keep sections in sync: done items under **What we have done**; open work under **What to do next**, **Milestone 1 — checklist**, and **Backlog**.

### Whenever development moves forward (mandatory habit)

Anyone working on Project 4 — including **AI-assisted sessions** — should **edit this tracker in the same pass** as code or plan changes, not “later.”

| Trigger | Update these sections |
| ------- | ---------------------- |
| **User asks for a new feature or behavior** | **User requirements** (new dated row); **Milestone 1** / **Backlog** / **What to do next**; adjust **Current status** if scope shifts. |
| **User changes priorities or plan** | **What to do next**, **Milestone 1** / **Backlog**, **Current status**; trim or reprioritize so the doc matches reality. |
| **A slice of work is completed** | **What we have done** (dated bullet); check off **Milestone 1** / **Backlog** items; refresh **Current status**; trim stale **What to do next** rows when milestones advance. |
| **Spec / protocol / UX design changes** | Update [`PROJECT_INFO.md`](./PROJECT_INFO.md) in the relevant section (API, settings, overlay, GLB names, etc.) and add a short **What we have done** line pointing to what changed. |

**Skip** tiny edits (one typo with no behavior impact). **Do not skip** user-visible features, API changes, or completed milestones.

---

## Current status

- **Phase:** **M1**–**M3** shipped as above; **M4 — Extension ship (partial):** host command **`openProject4Twin`**, **`TERNION_WEBVIEW_APP`** preload + **`main.tsx`** gate (**`MyApp`** vs **`Project4`**); **`npm run compile`** clean. **Next QA gate:** **`npm run package`** + installed **`.vsix`** smoke (**[`PROJECT_INFO.md`](./PROJECT_INFO.md)** § **Distribution**, monorepo VSIX checklist). In parallel: **M2** hardware sanity (wheels + scanner **`a`**) when a board is available; optional **`Project4ViewportShell`** layout grid variants remain.
- **Active milestone:** **`docs/DEVELOPMENT_TRACKER.md` — In progress** lists **M4 packaging QA**; **M2** hardware checklist stays open until verified on MCU.
- **Environment:** **`main.tsx`** resolves entry via **`ternion-webview-entry.ts`** — VS Code **`Open 3D World`** → **`MyApp`**; **`Open Project 4 — Robot Twin`** → **`Project4`**; Vite dev defaults **`Project4`**, **`?app=digitalTwin`** for **`MyApp`**.

---

## User requirements

| Date       | Requirement                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| 2026-05-10 | Prove concepts in an isolated sub-project; keep all artifacts under `project4`. |
| 2026-05-10 | **Folder rules:** new Project 4 files only under `src/webview/project4/`; reuse external code via imports; no twin-specific new files elsewhere (`PROJECT_INFO.md` § Development rules). |
| 2026-05-10 | Use this document for status, requirements, completed work, next steps, and to-dos; keep it updated as development evolves. |
| 2026-05-10 | Front-end app on the LAN; microcontroller HTTP server at `http://192.168.4.1/` with `/data` (JSON), `/move?dir=…`, `/setSpeed` (`val` 0–255). See [`PROJECT_INFO.md`](./PROJECT_INFO.md). |
| 2026-05-10 | Robot platform: four-wheel robot; dual-servo ultrasonic scanner panning left/right (radar-style); documented in [`PROJECT_INFO.md`](./PROJECT_INFO.md). |
| 2026-05-10 | **Digital twin:** primary UI is **3D**; robot from **Blender GLB**; microcontroller telemetry **mapped** to motors and other scene elements (see [`PROJECT_INFO.md`](./PROJECT_INFO.md)). |
| 2026-05-10 | **GLB rig:** `Body`; `Ultrasonic_F` / `Ultrasonic_R` (pan about **Y**); `Wheel_FL`/`FR`/`RL`/`RR` (roll about **X**); `Ground`; track **0.26 m**, wheelbase **0.23 m** (confirm `0.0.23` → **0.23 m**). See [`PROJECT_INFO.md`](./PROJECT_INFO.md). |
| 2026-05-10 | **Settings:** Configurable **MCU HTTP** (base URL, paths, query keys, poll interval, timeout) + **robot geometry** (track, wheelbase, wheel radius) + optional calibration/HUD fields; **persist** (`localStorage`), **no hardcoded** literals in feature code — see [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Application settings. |
| 2026-05-10 | **Overlay UI:** Full-viewport **HUD** over the 3D canvas — telemetry readouts, **connection/stale** indicators, **drive controls** (`move` tokens), **`setSpeed`** control, settings entry; pointer-events pattern for orbit passthrough — see [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Overlay UI & HUD. |
| 2026-05-10 | **Process:** On every feature request, plan change, or completed development slice, **update [`DEV_TRACKER.md`](./DEV_TRACKER.md)** (and [`PROJECT_INFO.md`](./PROJECT_INFO.md) when the spec changes) in the **same session** — see **How to maintain** § Whenever development moves forward. |
| 2026-05-10 | **Distribution:** Twin ships inside **TERNION Digital Twin** VS Code extension; **published** for users to install (marketplace or `.vsix`); follow VSIX/webview/asset rules — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Distribution (VS Code extension). |
| 2026-05-11 | **Robot GLB:** **`robot-4th-project.glb`** — public **`ternion-3d-assets-free`** on GitHub; **repo copy** **`src/assets/models/robot-4th-project/robot-4th-project.glb`**; Vite dev **`/__extension_src_assets/models/robot-4th-project/robot-4th-project.glb`**; webview resolve via **`LOCAL_ASSETS_BASE_URI`**; **`analyze-glb`** defaults to **`src/assets`** path — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Canonical robot model. |
| 2026-05-11 | **AI / MCP:** Operators command/query the robot via **natural language**; **Anthropic Claude** uses **MCP tools** grounded in **`/data`** semantics + **`move`** / **`setSpeed`**; integrate with extension **AI bridge** patterns — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § AI / MCP integration (Claude). |
| 2026-05-11 | **Anthropic API key:** **`Project4SettingsPanel`** must include **Assistant (Claude)** section — masked API key, Save/Clear — reuse **`getStoredAnthropicApiKey`** / **`setStoredAnthropicApiKey`** (`ternion.sensorStudio.anthropicApiKey`) per [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Application settings. |
| 2026-05-11 | **Guidelines:** Implement Project 4 using **`src/webview/bitstream-app`** (and **`src/webview/ai-bridge`**, **`src/ai/bridge`**) as **reference patterns** for panels, persistence, AI/MCP — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Reference implementations; **do not** add twin-owned sources outside `project4/`. **Robot I/O:** MCU HTTP only — **not** Bitstream serial / **`HostSession`**. |
| 2026-05-11 | **UI:** Prefer shared **`TRN*`** components under **`src/webview/ui/TRN/`** for HUD, settings, assistant surfaces — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Reference implementations. |
| 2026-05-11 | **Dev without MCU:** Local **mock HTTP server** mirrors **`/data`** / **`/move`** / **`setSpeed`** with CORS — **`npm run project4:mock-mcu`**; documented in [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Mock MCU server (development). |
| 2026-05-11 | **UI tuning — fullscreen + draggable HUD:** **3D scene fills the webview** (**`Project4`** **`fixed inset-0`**); **`Project4McuTelemetryCard`** is an **overlay** (not a sidebar column); **all HUD tiles** use **`Project4DraggableOverlayPanel`** (grip header drag, clamped inside shell). Spec: [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Overlay UI & HUD — *Layout model* / *Regions*. |
| 2026-05-11 | **Hardware setup dialog:** **`TRNWindow`** + **`components/hardware/Project4HardwareSetupPanel.tsx`** — **robot geometry** (track / wheelbase / wheel radius), **scanner min–max (deg)**, **reverse safety HUD (cm)**; toolbar **wrench** entry; main Settings stays **Connection + Assistant + Advanced**. |
| 2026-05-11 | **Physics (future):** Add a **physics engine** step; use a **separate Physics setup** window for solver/collider **material** and engine knobs. **Hardware setup** remains authoritative for **left–right (track)** and **front–rear (wheelbase)** spacing plus **wheel radius** — required for **wheel colliders**, chassis **compound** collision, and offsets from wheels to other parts vs GLB mesh. |
| 2026-05-11 | **3D scene tuning:** Twin viewport needs a **background environment** (HDR / **`Environment`** preset) and **IBL-driven reflections** on robot materials (**`scene.environment`**). Clarify whether **“HID”** means **IBL** or a **named GLB node** — see **`PROJECT_INFO.md`** § *3D scene environment (tuning)*; implementation backlog. |

---

## What we have done

- **2026-05-10:** Defined tracker structure and maintenance rules; documented scope (all Project 4 files under `src/webview/project4`).
- **2026-05-10:** Confirmed minimal shell component `Project4.tsx` and webview entry wiring to `Project4` in `main.tsx`.
- **2026-05-10:** Added and populated [`PROJECT_INFO.md`](./PROJECT_INFO.md) (MCU base URL, `/data` JSON fields, `/move` directions, `/setSpeed`, CORS / mixed-content notes).
- **2026-05-10:** Documented robot hardware in [`PROJECT_INFO.md`](./PROJECT_INFO.md) (four wheels; two servos for ultrasonic scanner radar sweep; clarified `a` as scanner bearing).
- **2026-05-10:** Documented **digital twin** architecture in [`PROJECT_INFO.md`](./PROJECT_INFO.md) (3D-first app, Blender GLB pipeline, telemetry→scene mapping table and mapping-layer guidance).
- **2026-05-10:** Documented **robot GLB** node names, rotation axes, track (**0.26 m**), wheelbase (**0.23 m**), and updated telemetry→scene table in [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-10:** Added **`Ground`** and a **canonical name list** for runtime `Object3D` lookup in [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-10:** Corrected GLB wheel object prefix from `Wheek_*` to **`Wheel_*`** in [`PROJECT_INFO.md`](./PROJECT_INFO.md) and this tracker.
- **2026-05-10:** Added offline GLB inspector [`scripts/analyze-glb.ts`](./scripts/analyze-glb.ts); npm script `project4:analyze-glb`. (Default GLB path updated **2026-05-11** — see below.)
- **2026-05-10:** Documented **Development rules (folder boundaries)** in [`PROJECT_INFO.md`](./PROJECT_INFO.md) — organize under `project4/` only; import reuse allowed; thin `main.tsx` mount only.
- **2026-05-10:** Designed **Application settings** (MCU connection, robot geometry, calibration/HUD, optional model URL), persistence key, validation rules, panel grouping, and suggested `project4/settings/` + `components/` layout in [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-10:** Designed **Overlay UI & HUD** (viewport shell, regions table, telemetry indicators, drive deck + keyboard policy, connection trust cues, suggested `components/overlay/` modules) in [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-10:** Documented **mandatory tracker updates** when features are requested, plans change, or work completes (**How to maintain** § Whenever development moves forward).
- **2026-05-10:** Documented **VS Code extension / marketplace distribution** requirements (webview gates, packaged `@ternion/t3d`, `.vscodeignore`, large GLB strategy, host command entry) in [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Distribution.
- **2026-05-11:** Canonical model **`robot-4th-project.glb`** (GitHub **`ternion-3d-assets-free`**); **repo copy** **`src/assets/models/robot-4th-project/`**; Vite **`/__extension_src_assets/models/...`**; **`robotModelUrl`** + **`analyze-glb`** defaults; **`.vscodeignore`** packaging note. Former name **`car-v1.glb`** retired — [`PROJECT_INFO.md`](./PROJECT_INFO.md), [`scripts/analyze-glb.ts`](./scripts/analyze-glb.ts).
- **2026-05-11:** Added **`§ AI / MCP integration (Claude)`** — NL operation, sensor-grounded tool descriptions, **`move`**/**`setSpeed`** via MCP, reuse **`src/ai/bridge/`** — [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-11:** Specified **Anthropic API key** in **Application settings** — **`Project4SettingsPanel`** § Assistant; shared **`ai-bridge-webview-config`** storage (no duplicate JSON blob field) — [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-11:** Added **§ Reference implementations** — **`bitstream-app`**, **`ai-bridge`**, **`sensor-studio`**, **`src/ai/bridge`** as parent-folder guidelines — [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-11:** Documented **`src/webview/ui/TRN/`** (**`TRN*`** shared UI) as primary component library for Project 4 overlays and panels — [`PROJECT_INFO.md`](./PROJECT_INFO.md).
- **2026-05-11:** Refined **implementation plan** — added **`PROJECT_INFO.md`** § **Implementation roadmap (phased)** (M1–M5); retargeted this tracker for **Milestone 1 — Foundation** first.
- **2026-05-11:** **M1 implementation (code):** Zustand **`settings/`** + **`ternion.project4.settings.v1`** persist; **`lib/mcu-http.ts`** (**`/data`**, **`/move`**, **`setSpeed`**); **`useProject4Telemetry`** (idle / live / stale / error); **`Project4SettingsPanel`** (**Connection**, **Robot geometry**, **Calibration**, **Assistant** via **`AnthropicApiKeySettingsPanel`**, **Advanced** accordion); **`Project4McuTelemetryCard`** + **`TRNWindow`** settings entry from **`Project4.tsx`**.
- **2026-05-11:** **M2 initial twin:** **`components/twin/Project4TwinViewport.tsx`** (R3F + drei **`useGLTF`**, **`OrbitControls`**); **`lib/resolve-robot-model-url.ts`**, **`lib/project4-rig.ts`**; wheel **`v*`** roll + scanner **`a`** yaw; telemetry lifted to **`Project4.tsx`** (single **`useProject4Telemetry`**); **`PROJECT_INFO.md`** § **Milestone 2 definition of done** + folder layout (**`components/twin/`**).
- **2026-05-11:** **Mock MCU:** **`scripts/mock-mcu-server.ts`** + **`npm run project4:mock-mcu`** — LAN-free development; see **`PROJECT_INFO.md`** § Mock MCU server (development).
- **2026-05-11:** **Connection presets (mock / real / custom):** **`components/settings/Project4ConnectionPresetCards.tsx`**, **`lib/mcu-connection-presets.ts`**, persisted **`mcuConnectionPreset`** derived in **`normalizeProject4Settings`**; **`PROJECT_INFO.md`** § Application settings + Mock MCU server notes updated.
- **2026-05-10:** **MCU telemetry source toolbar toggle:** **`components/overlay/Project4McuTelemetrySourceToggle.tsx`** — top-right **`TRNIconButton`** cycles **`mcuBaseUrl`** between mock and default real MCU presets; wired in **`Project4.tsx`** — **`PROJECT_INFO.md`** § Overlay *Layout model*, *Regions*, *Implementation modules*, *Implementation layout*.
- **2026-05-11:** **M3 overlay (initial):** **`components/overlay/`** — **`Project4ViewportShell`**, **`Project4HudRoot`**, **`ConnectionIndicator`**, **`TelemetryStrip`**, **`DriveControlDeck`**, **`SpeedControl`**; **`hooks/useProject4McuCommands.ts`**, **`hooks/useProject4ViewportDriveKeyboard.ts`**; **`Project4.tsx`** mounts shell over twin — **`PROJECT_INFO.md`** § Overlay implementation modules updated.
- **2026-05-11:** **M3 UI tuning:** **`Project4DraggableOverlayPanel.tsx`** — draggable HUD tiles; **`Project4.tsx`** fullscreen root; **`Project4TwinViewport`** **`h-full`** fill; **`Project4McuTelemetryCard`** moved into **`Project4HudRoot`** overlay layer — **`PROJECT_INFO.md`** § Overlay *Layout model* / *Regions*; **User requirements** row (fullscreen + draggable).
- **2026-05-11:** **Hardware setup modal:** **`Project4HardwareSetupPanel.tsx`** under **`components/hardware/`**; wrench launcher in **`Project4.tsx`**; geometry + scanner/safety fields removed from **`Project4SettingsPanel`** — **`PROJECT_INFO.md`** § Application settings UX grouping.
- **2026-05-11:** **M3 HUD polish:** **`TelemetryStrip`** — horizontal **`df`/`db`** bar meters (max **`PROJECT4_DISTANCE_BAR_MAX_CM`**), rear proximity tint vs **`reverseSafetyStopCmDisplay`**, forward near-warning band; **IMU** **`ax`/`ay`/`az`** behind **`<details>`** (collapsed by default); telemetry tile width **`w-56`** — **`PROJECT_INFO.md`** § Overlay implementation modules.
- **2026-05-11:** **Twin cubemap environment:** Persisted **`twinCubemapEnvironmentId`**; **`Project4TwinSceneEnvironment`** + **`buildProject4TwinCubemapFaceUrls`** (dev **`/__extension_src_assets/`**, packaged **`assets/textures/cubemap`**, GitHub raw fallback); top **`TRNSelect`** (“Env”) on **`Project4.tsx`**; **`vite`** copies **`src/assets/textures/cubemap/**/*`** — **`PROJECT_INFO.md`** § *3D scene environment (tuning)*.
- **2026-05-10:** **Twin shadows:** **`lib/project4-twin-robot-shadow-setup.ts`** — **`castShadow`/`receiveShadow`** on GLB meshes; **`Ground`** Basic→Standard upgrade; directional shadow tuning in **`Project4TwinDynamicLights`**; graphics defaults shadows + key directional **`castShadow`** — **`PROJECT_INFO.md`** § *Shadows (twin)*.
- **2026-05-10:** **`TRNSelect`** menus **`createPortal`** to **`document.body`** — dropdowns stack above **`TRNSettingRow`** **`backdrop-blur`** (**`src/webview/ui/TRN/TRNSelect.tsx`**).
- **2026-05-10:** **Graphics setup (twin):** Persisted **`ternion.project4.graphics.v1`** (`settings/project4-graphics*.ts`); **`Project4TwinGraphicsRuntime`** (tone mapping / exposure / output color space / shadow-map gate); **`Project4TwinDynamicLights`** + optional **`@react-three/drei`** **`useHelper`** gizmos; **`scene.environmentIntensity`** driven from graphics store (defaults align with **`PROJECT4_TWIN_ENVIRONMENT_INTENSITY`**); **`Project4GraphicsSetupPanel`** + **`Project4.tsx`** palette toolbar **`TRNWindow`** — **`PROJECT_INFO.md`** § persistence / Graphics setup row / twin modules table.
- **2026-05-11:** **Twin wheel drive:** **`parseProject4TelemetryJson`** coerces **numeric strings** for **`v*`** / IMU / distances (firmware may stringify JSON numbers); wheel motion uses **`rotateOnAxis`** around local **X** for stable rolls when pivots carry odd exported Euler (e.g. **`Wheel_FL`** π flips). **`analyze-glb`** on **`robot-4th-project.glb`** — contract names present; warn on ~**265 MB** / ultra-heavy **`Body_2`** mesh for realtime twin FPS.
- **2026-05-10:** **Persisted HUD layout:** **`lib/project4-hud-layout.ts`** (**`ternion.project4.hudLayout.v1`**, panels **`connection`** | **`telemetry`** | **`motion`** | **`mcuCard`**); **`Project4DraggableOverlayPanel`** **`hudPersistId`** + **`ResizeObserver`** re-clamp; save **after drag** only — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Overlay UI & persistence.
- **2026-05-10:** **M4 host routing:** Command **`ternion-digital-twin.openProject4Twin`**; **`TernionDigitalTwin`** injects **`window.TERNION_WEBVIEW_APP`** (**`digitalTwin`** | **`project4`**); **`main.tsx`** **`resolveTernionWebviewEntry()`** — **`package.json`** contributes command; [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Distribution — *Host integration*.
- **2026-05-10:** **Digital Twin Copilot — operator help:** **`CircleHelp`** in **`TRNWindow`** **`headerActions`** (**`stopPropagation`** on **`pointerdown`** so header drag does not steal clicks) opens modal **`Project4DigitalTwinCopilotHelpWindow`** (**`TRNMarkdownRenderer`** + **`digitalTwinCopilotHelpMarkdown.ts`**) — Read vs Control example prompts, robot hardware summary, architecture (MCU HTTP / AI bridge / **`project4_*`** tools; not Bitstream serial); **`modalsCaptureKeyboard`** includes help-open — **`Project4.tsx`**, **`components/assistant/`**.

---

## What to do next

| Order | Milestone | Summary |
| ----- | --------- | ------- |
| **Now** | **M4 — VSIX / packaging** | **`npm run package`** → install **`.vsix`** → **`openProject4Twin`** smoke vs dev webview; **`robotModelUrl`** + packaged **`LOCAL_ASSETS_BASE_URI`** / **`globalStorage`** paths vs **`.vscodeignore`** — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Distribution (aligned with **`docs/DEVELOPMENT_TRACKER.md`** **In progress**). |
| Next | **M2 — verify + refine** | Confirm wheel spin sign/speed and scanner **`a`** vs physical robot; optional **`df`/`db`** / IMU in scene or HUD. |
| Done | **M3 — polish + parity** | **`df`/`db`** meters + collapsible IMU + **persisted HUD layout** **shipped**; optional **`Project4ViewportShell`** layout grid / density tweaks remain — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § Overlay UI & HUD. |
| Done | **M4 — Host routing** | **`openProject4Twin`**, **`TERNION_WEBVIEW_APP`**, **`main.tsx`** gate (**`compile`** clean). |
| Then | **M5 — Claude + MCP** | Tools + bridge — [`PROJECT_INFO.md`](./PROJECT_INFO.md) § AI / MCP integration (Claude). |

After each milestone closes on hardware (where relevant), update **What we have done**, **Current status**, and checkboxes below.

---

## Milestone 1 — checklist (foundation)

- [x] Canonical **`robot-4th-project.glb`** documented + repo **`src/assets/...`** + **`npm run project4:analyze-glb`** default.
- [x] **`settings/`** — defaults (**[`PROJECT_INFO.md`](./PROJECT_INFO.md)** § Application settings), **`schemaVersion`**, persist **`ternion.project4.settings.v1`**, **`useProject4SettingsStore`** / **`useProject4Settings`** (Zustand).
- [x] **`lib/mcu-http.ts`** — build URLs from settings only; **`GET /data`**, **`GET /move`**, **`setSpeed`** (query **`val`** when **`setSpeedUseQuery`**); timeouts from settings.
- [x] **`hooks/useProject4Telemetry.ts`** — poll **`telemetryPollIntervalMs`**; typed **`/data`** parse; **idle / live / stale / error** state.
- [x] **`Project4SettingsPanel`** — **Connection** (preset cards + manual **`mcuBaseUrl`** row) + **Assistant** + **Advanced**; **hardware** fields in **`Project4HardwareSetupPanel`** (wrench **`TRNWindow`**); settings **`TRNWindow`** from **`Project4.tsx`** (**[`PROJECT_INFO.md`](./PROJECT_INFO.md)** § Reference implementations).
- [x] **Assistant (M1):** **`AnthropicApiKeySettingsPanel`** embedded (**`ai-bridge-webview-config`**).
- [x] **Minimal live UI** — **`Project4McuTelemetryCard`** (**`TRNInteractiveCard`** + **`TRNHighlightedJsonBlock`**) + settings launcher.
- [ ] Smoke-test against MCU **`192.168.4.1`** (or user **`mcuBaseUrl`**); verify **`setSpeed`** query encoding if exercised.

---

## Milestone 2 — checklist (3D twin)

- [x] **`robotModelUrl`** resolve (**`${LOCAL_ASSETS_BASE_URI}`** expansion + absolute **`http(s)`**) — **`lib/resolve-robot-model-url.ts`**.
- [x] R3F **`Canvas`** + **`useGLTF`** load — **`components/twin/Project4TwinViewport.tsx`**.
- [x] Rig resolve **`Wheel_*`**, **`Ultrasonic_*`**, **`Body`**, **`Ground`** — **`lib/project4-rig.ts`**.
- [x] **`vFL`–`vRR`** → wheel **rotation.x** using **`wheelRadiusM`**; **`a`** → **`Ultrasonic_*`** **rotation.y** (degrees → radians).
- [ ] Hardware sanity (spin direction, scanner sweep vs **`a`** reference **`45`…`135`°**); tweak signs/offsets if needed.
- [ ] Optional **`df`/`db`** HUD cues in scene; optional **`Body`** tilt from IMU (**`ax`,`ay`,`az`**).

---

## Milestone 3 — checklist (overlay HUD)

- [x] **`Project4ViewportShell`** stacks **`Project4TwinViewport`** + HUD (**`pointer-events`** pattern).
- [x] **`ConnectionIndicator`** — status, truncated base URL, last sample / error hint.
- [x] **`TelemetryStrip`** — **`v*`** grid, **`a`** + scanner range, **`df`/`db`**.
- [x] **`DriveControlDeck`** + **`SpeedControl`** — MCU **`sendProject4Move`** / **`sendProject4SetSpeed`** via **`useProject4McuCommands`**.
- [x] **Keyboard** — **`useProject4ViewportDriveKeyboard`** when settings modal closed.
- [x] **Fullscreen twin** — **`Project4`** **`fixed inset-0`**; canvas **`h-full w-full`** under **`Project4ViewportShell`**.
- [x] **Draggable HUD tiles** — **`Project4DraggableOverlayPanel`** for connection, telemetry strip, motion/speed, **`Project4McuTelemetryCard`** (grip-only drag; clamp in shell).
- [x] **Polish:** **`df`/`db`** horizontal meters; IMU **`ax`/`ay`/`az`** row (**`<details>`**, collapsed by default per spec).
- [x] **Persisted HUD positions** — **`ternion.project4.hudLayout.v1`** (**`lib/project4-hud-layout.ts`**); **`hudPersistId`** on draggable tiles; re-clamp on viewport resize.
- [ ] **Optional:** **`Project4ViewportShell`** layout grid variants (bottom rail density).

---

## Milestone 4 — checklist (extension ship)

- [x] Host command **`ternion-digital-twin.openProject4Twin`** — mounts **`Project4`** (**`webviewApp`**: **`project4`**).
- [x] **`ternion-digital-twin.open3DWorld`** — default **`digitalTwin`** → **`MyApp`** (production primary panel).
- [x] Inline preload sets **`window.TERNION_WEBVIEW_APP`** next to **`WEBVIEW_READY`** (**`src/panels/TernionDigitalTwin.ts`**).
- [x] **`main.tsx`** uses **`resolveTernionWebviewEntry()`** (**`src/webview/ternion-webview-entry.ts`**); Vite dev default **`project4`**, **`?app=digitalTwin`** for **`MyApp`**.
- [ ] **`npm run package`** + install **`.vsix`** smoke (parity vs dev webview).
- [ ] **`robotModelUrl`** / **`.vscodeignore`** alignment per release ([`PROJECT_INFO.md`](./PROJECT_INFO.md) § *Large assets*).

---

## Backlog (M3–M5)

- [ ] **M3 (remainder):** HUD / **`Project4ViewportShell`** layout tuning (optional grid variants); optional **Reset HUD layout** control (clear **`ternion.project4.hudLayout.v1`**).
- [ ] **M4:** **`npm run package`** + **`.vsix`** install smoke (operator checklist).
- [ ] **M4:** **`robotModelUrl`** / packaging aligned with **`.vscodeignore`** release notes.
- [x] **M5 (partial — bridge + Assistant UX):** Node **`project4_*`** MCP tools + **`project4McuHttp`** on **`ai/request`**; **`Project4AssistantPanel`** (**`components/assistant/`**) + **`submitPrompt`** wiring + **`ternion.project4.enableMcpTools`** — canonical plan **`docs/LLM_MCP_DEVELOPMENT_PLAN.md`**.
- [ ] **M5 (remainder):** VSIX smoke, operator quickstart, optional system-prompt tuning for robot-only sessions when MCP is on.
- [ ] **M5 / UX:** User-facing quickstart (install → command → MCU URL → Anthropic key) near marketplace readiness.
- [ ] **Future — physics:** Canonical plan **`docs/PHYSICS_IMPLEMENTATION.md`** — **Jolt** (reuse extension WASM path); **`Project4PhysicsSetupPanel`** (or equivalent) in **`TRNWindow`** for friction, restitution, debug draw; **wire persisted geometry** (**`trackWidthM`**, **`wheelbaseM`**, **`wheelRadiusM`**) into **procedural colliders**; twin motion modes (**mock simulation** vs **telemetry + env physics**).
- [x] **Twin scene environment (v1):** JPEG cubemap **`scene.background`** + **`scene.environment`**, picker + **`ternion.project4.graphics.v1`** intensity — shipped (**[`PROJECT_INFO.md`](./PROJECT_INFO.md)** § *3D scene environment*).
- [ ] **Twin scene environment (optional later):** **`@react-three/drei`** **`Environment`** HDR preset or **`RGBELoader`** path; persisted **preset / URL** when stable — backlog beyond cubemap **v1**.

---

## Notes / parking lot

- Repo-wide VSIX checklist: **`.cursor/rules/rules.mdc`** (monorepo) / extension packaging notes in `docs/DEVELOPMENT_TRACKER.md`.
- **No hardware:** **`npm run dev:with-mock-mcu`** (mock + full dev) or run **`npm run project4:mock-mcu`** in a second terminal with **`npm run dev`**. In Settings → Connection, use **Mock HTTP server** (same URL) or **`http://127.0.0.1:8787`** manually.
