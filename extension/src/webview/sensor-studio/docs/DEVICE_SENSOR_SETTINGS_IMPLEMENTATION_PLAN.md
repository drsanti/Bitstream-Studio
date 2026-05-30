# Device sensor settings vs Node Inspector — implementation plan

- **Date**: 2026-05-06
- **Objective**: Define and track a phased implementation plan that (1) separates **firmware-facing sensor controls** into a dedicated **Device Sensor Settings** surface with explicit **global/shared** copy, and (2) keeps the **Node Inspector** focused on **node-local flow editing** only.

This document tracks the agreed product split and phased implementation for **Sensor Studio** (`?app=sensor-studio`). It complements existing Bitstream docs:

- `bitstream-app/docs/CONTROL_PANEL_MULTI_INSTANCE_SYNC.md`
- `bitstream-app/docs/BITSTREAM_SENSOR_DATA_FLOW_AND_STATE.md`
- `bitstream-app/docs/FIRMWARE_MULTI_CLIENT_AND_MCP_ARCHITECTURE.md`

## Product boundaries

| Area | Behavior |
|------|----------|
| **Device sensor settings** | Controls that persist to firmware (enable/disable, sampling interval, publish mode, delta thresholds, BMI270-specific mode/fusion commands where applicable). **Affects every client** connected to the same hardware. Presented in a **dedicated Settings** surface with explicit copy that changes are **global / shared**. |
| **Node Inspector** | **Per-user flow editing only**: labels, node `defaultConfig`, `sourceKey` (allowlisted), JSON editor, and other **graph-local** concerns. **No** firmware-facing edit controls here (optional **read-only** device summary + link only). |

**Flow documents** remain **not** synced across users; **device-backed configuration** is **authoritative from hardware** and must converge in `useBitstreamDeviceSensorConfigStore` via the existing command and broker paths.

## Runtime context (current codebase)

- Sensor Studio mounts **inside** `BitstreamAppWrapper` when using `BitstreamAppMain` with `?app=sensor-studio` (`BitstreamAppMain.tsx`).
- **AI assistant (Sensor Studio flow):** The **`SensorStudioAssistantPanel`** chat UI is also mounted from **`BitstreamAppWrapper`** via **`SensorStudioAssistantShell`** (same Bitstream session context). Open it from the **Digital Twin** header (**Assistant** next to Connect / Disconnect) or the **hamburger (☰) → Sensor Studio Assistant** entry — not from the Sensor Studio **`StudioToolbar`** row.
- Therefore Sensor Studio **can** use the same **`useBitstreamAppControl()`** APIs as `BitstreamSensorWorkspaceView`, including **`setSensorConfig`**, **`sensor.cfg.get` / `sensor.cfg.set`** flow and **`sensorConfigAck`**.
- Reads should use **`useBitstreamDeviceSensorConfigStore`** for per-`sourceId` rows (verified cfg merge path already documented elsewhere).

---

## Phase 0 — Contracts and mapping helpers

**Status:** Implemented (2026-05-06)

1. **Define “firmware-facing”** consistently with implemented commands (`sensor.cfg.*`, and BMI270 extras exposed on `useBitstreamAppControl` / `BitstreamAppWrapper`).
2. **Add a small mapping module** under `sensor-studio/` (suggested name: `core/device/resolve-studio-node-source-id.ts` or similar):
   - Map fixed-input node types (e.g. `dps368-input`) → `sourceId` via `bitstream-app/constants/sensorSourceIds.ts`.
   - Map generic `sensor-input` → hint/prefix from `sourceKey` (allowlisted options already validated in catalog / Inspector).
3. **Settings UI state** at layout level: e.g. `settingsOpen`, `initialSourceId` (for deep link from Inspector).

**Exit criteria:** Single helper used anywhere the UI needs “which `sourceId` does this node relate to?”

---

## Phase 1 — Device Sensor Settings window

**Status:** Implemented (2026-05-06)

### UX

- **Surface:** Modal or slide-over from `StudioLayout.tsx` / `SensorStudioMain.tsx` (Tailwind + lucide, match existing Sensor Studio chrome).
- **Header:** Title + short **disclaimer**: settings apply to **all users / all clients** on this device.
- **Navigation:** Tabs or accordion **per `sourceId`** (SHT40, DPS368, BMM350, BMI270).

### Data and commands

- **Read:** Subscribe to `useBitstreamDeviceSensorConfigStore` per row; show `updatedAtMs` where useful.
- **Disconnected / no session:** Disable Apply; show guidance (mirrors workspace patterns).
- **Write:** Call **`useBitstreamAppControl().setSensorConfig(sourceId, patch)`** only — **no new transport layer**.

### BMI270

- If mode or fusion timing is **not** fully covered by generic `sensor.cfg` rows alone, BMI270 tab should call the **same helpers** already used in `BitstreamSensorWorkspaceView` / `BMI270ControlPanel` / wrapper (avoid inventing parallel protocol).

### Code reuse strategy (choose during implementation)

- **Option A (faster):** Duplicate the minimal form logic from `BitstreamSensorWorkspaceView` for the first shipped Settings panel; refactor later.
- **Option B (cleaner):** Extract shared presentational/control components under `bitstream-app/components/...` and import from both Workspace and Sensor Studio.

**Exit criteria:** User can change global sensor parameters from Sensor Studio Settings; store and other clients converge per existing multi-instance sync behavior.

### Toolbar entry

- Add a **“Device sensors…”** (or equivalent) control on `StudioToolbar.tsx`.

---

## Phase 2 — Inspector: node-local only + deep link

**Status:** Implemented (2026-05-06)

In `NodeInspector.tsx`, for nodes with a resolvable `sourceId`:

1. **Read-only strip:** Show key fields from `useBitstreamDeviceSensorConfigStore` (enabled, sampling, publish mode, etc.) — **no inputs** that write to firmware.
2. **Button:** **“Open device sensor settings…”** opens Phase 1 modal and focuses the matching `sourceId` tab/section.

Nodes with no device stream (pure graph nodes): omit this block.

**Exit criteria:** No firmware writes from Inspector; context switch to Settings is one click.

---

## Phase 3 — Flow tick / health (optional follow-up)

**Status:** Implemented (2026-05-06) — heuristic cadence thresholds (wire-gap diagnostics intentionally deferred unless needed)

- Replace or augment fixed STALE/LIVE thresholds in `flow-editor.store.ts` (`computeSensorHealthStatus`) using **expected cadence** derived from device config (`samplingIntervalMs`, `minPublishIntervalMs`, `publishMode` semantics) and optionally live gap diagnostics (e.g. BMI270 wire metrics) where already available.
- **Fallback** when `bySourceId` has no row: avoid aggressive STALE (document chosen default).

**Chosen defaults when no verified row exists:**
- LIVE max age ≤ **2000 ms**
- STALE max age ≤ **9000 ms**

**Exit criteria:** Health status reflects real device timing when cfg is known.

---

## Phase 4 — Hardening and tests

**Status:** Implemented (2026-05-06)

1. **Guard** transport shell availability via **`useBitstreamTransportActionsOptional()`** (`bitstream-app/context/bitstreamTransportActions.context.tsx`). When null, **`DeviceSensorSettingsWindow`** shows an explanatory empty state and **does not render** firmware control tabs (avoids throwing hooks + avoids misleading “Apply” UI).
2. **Manual QA (recommended):**
   - Open Sensor Studio via **`?app=sensor-studio`** under Bitstream; connect transport; open **Device sensors…**; apply a change; verify **`useBitstreamDeviceSensorConfigStore`** updates and other instances converge per broker docs.
   - Disconnect transport; verify Apply paths fail gracefully / controls reflect disconnected guidance.
   - *(Negative)* If Sensor Studio is ever mounted without **`BitstreamTransportActionsProvider`**, verify the **shell unavailable** panel appears instead of crashing.
3. **Automated tests:** `tests/sensor-studio/resolve-studio-node-source-id.test.ts`, plus existing Sensor Studio unit tests.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Duplicate forms drift vs Bitstream workspace | Prefer Option B extract, or schedule refactor after Option A |
| BMI270 spreads across multiple commands | Dedicated sub-section in Settings; reuse wrapper APIs |
| User opens Sensor Studio without transport | Disabled Apply + clear copy; read-only rows if last-known store populated |

---

## Implementation checklist (for PRs)

- [x] Phase 0: mapping helper + types
- [x] Phase 1: Settings modal + toolbar entry + `setSensorConfig` wiring + BMI270 completeness review
- [x] Phase 2: Inspector read-only strip + open Settings with `initialSourceId`
- [x] Phase 3: dynamic health thresholds (optional)
- [x] Phase 4: guards + tests + manual QA notes

---

## Revision log

| Date | Note |
|------|------|
| 2026-05-06 | Initial plan from design discussion (Settings vs Inspector, multi-client device truth). |
| 2026-05-06 | Phase 0–3 implementation: device settings window, Inspector deep link, dynamic sensor health thresholds from `useBitstreamDeviceSensorConfigStore`. |
| 2026-05-06 | Phase 4: optional transport-actions hook + Device Sensor Settings empty state; `resolve-studio-node-source-id` unit tests; manual QA checklist in this doc. |
