# Sensor Studio — performance (flow tick, 3D, canvas interaction)

Session preferences and runtime behavior for **flow simulation fps**, **WebGL preview caps**, **canvas interaction policy**, and **live diagnostics**. Prefs are **not** stored in flow JSON — they persist in browser `localStorage` (`ternion.sensor-studio.performance.prefs.v2`, migrates from v1).

## Where to change settings

**Inspector** (right workbench pane) → deselect all flow nodes → **View** tab → expand **Performance** card.

Shortcut: click the violet shell chip **`Sim N·3D M`** (when visible) — clears selection, focuses Flow, scrolls to **Performance**.

| Section | Controls |
| ------- | -------- |
| **Flow simulation** | Cap: Unlimited · 10 · 15 · 24 · 30 · 60 fps |
| **While editing canvas** | **Keep running** · **Pause** · **Reduce rate** (5 · 10 · 15 fps); toggles **When dragging nodes** / **When panning canvas** |
| **3D previews** | Same cap presets for Stage + in-flow Model Viewer loops |
| **Show live performance stats** | ~1×/sec readout under Flow / 3D rows |
| **Show performance overlay** | Bottom-left PERF pill on Flow and Stage viewports |

Default **While editing canvas** policy: **Pause** on both drag and pan (matches pre-2026-06-08 behavior).

## Canvas interaction tick policy

While a configured interaction is active, `readFlowInteractionTickGate()` resolves behavior before each `tickSimulation()`:

| Policy | `tickSimulation` | Effective cap |
| ------ | ---------------- | ------------- |
| **Keep running** (`inherit`) | Runs normally | Normal **Flow simulation** cap |
| **Pause** | Returns immediately (no eval) | N/A — live values freeze until release |
| **Reduce rate** (`throttle`) | Runs at reduced rate | `min(normal cap, throttle cap)` |

**Triggers** (independent toggles):

- **Node drag** — `flowNodeDragActive` from React Flow position changes
- **Canvas pan** — `flowCanvasPanActive` from viewport pan/zoom (`onMoveStart` / `onMoveEnd`)

**Not affected** by interaction policy:

- React Flow painting (node follows pointer during drag)
- Stage 3D render loop (separate **3D previews** cap; not throttled by canvas interaction in v1)
- Internal `StudioNodeCard` layout skip while `dragging` (always on)

Implementation: `core/runtime/flow-interaction-tick-gate.ts`, `persistence/sensor-studio-performance-preferences.ts`, `app/useSensorStudioFlowTickScheduler.ts`, `flow-editor.store.ts` (`tickSimulation` early exit when `gate.blocked`).

## Flow tick scheduler

`useSensorStudioFlowTickScheduler` coalesces:

- **Telemetry (A):** `sampleCount`, BMI270 wire taps → rAF `tickSimulation`
- **Scene frame (B):** continuous rAF while graph needs scene/audio/camera/material/geometry ticks and a Flow/Dashboard/Stage pane is visible

Caps apply via `shouldRunCappedFrame` + `minFrameIntervalMs`. During canvas interaction + **Reduce rate**, the gate’s `tickMaxFps` replaces the normal cap for scheduling only.

See also: [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md) § Tick subscription.

## Live telemetry sidecar (2026-06-08)

`tickSimulation` patches **`useFlowNodeLiveStore`** instead of replacing the full `nodes` array every frame. `StudioNodeCard` reads **config** from the graph store and **live scalars** from the live slice (`studio-node-live.slice.ts`).

Structural subscribers use **`flow-graph-store-revisions.ts`** so inspector/toolbar panels avoid `useFlowEditorStore(s => s.nodes)` on every tick.

## Dashboard live vs structural snapshot

- **Structural** layout/widget list: `evaluateDashboardSnapshot` on graph/layout changes (`use-dashboard-structural-snapshot.ts`, import/hydrate in `flow-editor.store.ts`).
- **Per-tick live values:** widgets read from the live store (`use-dashboard-widget-live.ts`) — not a full dashboard re-eval every `tickSimulation`.

## Socket layout vs live values (sine-wave perf fix)

Per-tick scalars (`liveValue`, `live*ByHandle`) must **not** trigger node auto-fit:

| Key | Purpose |
| --- | ------- |
| `resolveFlowNodeSocketPreviewLayoutKey` | Wiring + structured wire badges only — **layout effect deps** |
| `resolveFlowNodeSocketPreviewChromeKey` | Layout + streaming scalars — diagnostics only |

`StudioNodeCard` measures sockets on layout key changes; socket region **ResizeObserver** and `characterData` **MutationObserver** were removed to avoid remeasure storms on streaming numbers.

See [`SENSOR_STUDIO_NODE_UI_RULES.md`](./SENSOR_STUDIO_NODE_UI_RULES.md) § Socket live preview churn.

## Diagnostics

| Surface | Path |
| ------- | ---- |
| Inspector live stats | `SensorStudioPerformanceLiveStats.tsx` |
| Shell chip | `SensorStudioPerformanceShellChip.tsx` |
| Viewport overlay | `SensorStudioPerformanceViewportOverlay.tsx` |
| Telemetry rollup | `sensor-studio-performance-telemetry.ts` |

**Heavy** warnings distinguish **slow-tick** (graph eval ≥ 25 ms) vs **below-cap** (effective fps under cap while tick ms is low — usually main-thread UI refresh).

## Tests

- `tests/sensor-studio/flow-interaction-tick-gate.test.ts`
- `tests/sensor-studio/flow-node-socket-preview-chrome-key.test.ts`
- `tests/sensor-studio/sensor-studio-performance-preferences.test.ts`
- `tests/sensor-studio/flow-node-live.store.test.ts`
- `tests/sensor-studio/flow-graph-store-revisions.test.ts`

## Changelog

| Date | Change |
| ---- | ------ |
| **2026-06-08** | Canvas interaction tick policy (Inspector **While editing canvas**); prefs v2; `readFlowInteractionTickGate`. |
| **2026-06-08** | Socket layout key decoupled from per-tick scalars; dashboard structural/live split; live performance Phases 1–3. |
| **2026-06-08** | Pause `tickSimulation` during pan/drag (default policy); pan smoothness + structural store subscriptions. |
