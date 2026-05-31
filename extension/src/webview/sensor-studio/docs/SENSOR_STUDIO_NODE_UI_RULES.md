# Sensor Studio node UI rules

Short conventions for **flow node cards** and the **Node Inspector**, aligned with Model Preview TRN patterns and the **node-animator** reference repo (`D:\CODE\2026\node-animator`).

---

## Inspector shell

| Element            | Rule                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Pane title**     | **Node Inspector** + **`SlidersHorizontal`** prefix (matches workbench Inspector tab) |
| **Subtitle**       | None — context lives in tabs + **`InspectorContextBar`** |
| **Tabs**           | Horizontal **Details / Live / Node** (+ **Device** when the node maps to a firmware `sourceId`) — do not collapse into a single scroll panel |
| **Identity strip** | Catalog **Lucide icon** (`InspectorCategoryIcon`) tinted by category; pulses when stream is live / sim / stale; meta row lists category + `nodeId` |

---

## Canvas body vs inspector

| On the flow node card                                           | In the inspector only                                  |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| Quick controls, live readouts, mini previews (gauge, scope, 3D) | Full ranges, toggles, help, wiring notes               |
| Port labels and socket colors                                   | Typed settings sections + JSON (Advanced)              |
| No long explanatory paragraphs                                  | Section hints via **`TRNHintTooltip`** on header icons |

**Wire wins:** when an input pin is connected, the wired value overrides the unwired default on the card; document this in the inspector hint for modulated nodes (Environment, Number constant, etc.).

### Live multi-pin sensor nodes (BMI270, BMM350, DPS368, SHT40)

| Zone                   | Role                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Output socket rows** | Compact live preview **right-aligned** toward the port label; port name; handle on the **node border**                                        |
| **Node body**          | No `ReadingPanel` on the card                                                                                                                 |
| **Inspector → Live**   | Reuses Telemetry Data deck cards via **`InspectorSensorDeckReadings`** (`Bmi270RawDataViews`, `*DataViewer`) — same gauges, units, Δms badges |

Registry: **`isStudioAlignedOutputSocketColumnsNodeId`** (subgrid), **`isStudioSensorSocketPreviewNodeId`** (no card body panel). Socket UI: **`socketLivePreviewForOutputHandle`**.

**Catalog:** BMI270/BMM350 — **`Temp (°C)`** last. DPS368/SHT40 — **`Temp (°C)`** last.

### Single-output sensor tap nodes (BMI270 / DPS368 / SHT40 / BMM350 taps)

| Zone                      | Role                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **One output socket row** | Live preview on the row (`leadingPreview`); catalog port label; border handle                                     |
| **Node body**             | No `ReadingPanel`                                                                                                 |
| **Inspector → Live**      | Compact **`SensorTapInspectorReadings`** in **`LiveSensorInspectorReadings`**; hide redundant wire/primary blocks |

Registry: **`isStudioSensorTapNodeId`**. Previews read **`liveQuaternionWire`**, **`liveVector3Wire`**, or **`liveValue`** via **`socketLivePreviewForOutputHandle`**.

---

## Node Inspector shell

| Zone                  | Component                                               | Notes                                                                                |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Outer pane**        | `NodeInspector`                                         | Neutral zinc border/background — no emerald gradient wash                            |
| **Tab bar**           | `TRNTabs` + **`trn-inspector-tab-bar`** (shared with Telemetry deck) | Live / Telemetry Data active: emerald; others: zinc                              |
| **Context**           | **`InspectorContextBar`**                               | Category dot, title, mono `nodeId`, clock, single stream status (no duplicate chips) |
| **Details sections**  | **`TRNInteractiveCard`** + **`TRNSortableContainer`** (telemetry deck parity) | **Specifications** · **Ports** — drag reorder + collapse; **Specifications** uses **`sensor-inspector-about-content`** (datasheet ranges/accuracy) for hardware nodes |
| **Settings — node (flow-local)** | **`NodeInspectorNodeTab`** — Identity, Canvas, typed registry, rotation 3D, Advanced JSON | Stacked **`InspectorFieldStack`** fields (~340px rail); **`InspectorSection`** for Identity / Canvas / Advanced; filter via search |
| **Settings — device (shared)** | **`NodeInspectorDeviceTab`** + **`InspectorSensorCfgSection`** | Conditional **Device** tab only when `resolveStudioNodeSourceId` returns a id; same editable deck as Telemetry **Sensor Config**; amber shared-scope banner |
| **Live sections**     | **`InspectorSensorDeckReadings`**                       | Deck `TRNInteractiveCard` viewers; **`useInspectorLiveDeckSamples`**                 |
| **Settings sections** | **`InspectorSettingsSectionFrame`** / registry under **`NodeInspectorNodeTab`** | **`InspectorPropertyRow`** → **`InspectorFieldStack`** (label above control); glass `TRNCard` for collapsible typed forms |

### Node tab field layout (Inspector → Node)

| Block | Components | Rule |
| ----- | ---------- | ---- |
| **Identity** | **`InspectorSection`** | Full-width label input with inline **Tag** icon; no left “Node label” column |
| **Canvas** | **`InspectorSection`** + **`InspectorCompactToggleRow`** | Slim toggle + short hint; not a heavy **`TRNInlineToggleRow`** card |
| **Catalog sections** | **`InspectorPropertyRow`** / **`InspectorFieldStack`** | Uppercase 10px label stacked above full-width control |
| **Advanced** | **`InspectorSection`** + **`TRNAccordion`** | Default config JSON unchanged |


Live tab content order: **Live readings** → **Diagnostics** (if errors) → **History** / wire dumps (collapsed by default).

---

## Output socket row layout

Canonical pattern for **all** flow nodes with output handles. Live sensor nodes use the **aligned subgrid** variant; other nodes use the same spacing and handle rules on flex rows.

### Column layout (live sensor / aligned)

Parent **`FlowNodeSocketRegion`** with **`alignedOutputColumns`**:

```text
[ minmax(0,1fr) live preview ] [ max-content label ] [ 0px handle anchor ]
```

- **Subgrid** — every row shares the label column width (widest port name wins).
- **Region padding** — **`pl-2 pr-0`** so the handle anchor sits on the card’s **right border** (no right inset).
- **Grid gap** — **`gap-x-0`** between tracks; do **not** add column gap before the handle column (it would inset plugs from the border).

### Label spacing

| Side  | Class      | Purpose                                 |
| ----- | ---------- | --------------------------------------- |
| Left  | **`pl-2`** | Gap between live values and port name   |
| Right | **`pr-3`** | Gap between port name and socket handle |

Apply on the label cell in **`FlowNodeSocketRow`** (aligned and flex rows with **`leadingPreview`**).

### Live value cells (no jitter)

Use fixed-width **Inter** cells (`font-sans` + **`tabular-nums`**) so digits do not shift on tick — see **Typography** below. Helpers: **`SOCKET_LIVE_VALUE_TYPOGRAPHY`**, **`readings/socket-live-value-cell.ts`**, **`SocketLivePreview`**, **`QuaternionScalarsGrid`** (`socketFixedCell` when **`compact`**).

| Data                         | Digits | Width                | Constant / prop                                                                |
| ---------------------------- | ------ | -------------------- | ------------------------------------------------------------------------------ |
| Euler, quaternion components | 3      | **`6ch`** (`+1.000`) | **`SOCKET_LIVE_CELL_SIGNED3_UNIT`**, **`ReadingAxisNumber` `socketFixedCell`** |
| Accel, gyro                  | 2      | **`6ch`** (`+99.99`) | **`SOCKET_LIVE_CELL_SIGNED2`**                                                 |
| Temperature (scalar)         | 2      | auto                 | No fixed cell — single value only                                              |

### Socket handles (border-centered, on top)

Follow **node-animator** `socketGridLayout` / `SocketHandle` — zero-width anchor column, React Flow transform centers the plug on the border.

| Rule          | Implementation                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Handle column | **`w-0`** in **`FlowNodeSocketRow`** — no reserved width                                                                        |
| Card shell    | **`FlowNodeShell`** **`overflow-visible`** — outer half of handle not clipped                                                   |
| Socket region | **`overflow-visible`**, **`pr-0`** on output side                                                                               |
| Position      | RF default **`right: 0`** / **`left: 0`** + **`translate(±50%, -50%)`** — see **`flow-node-handles.css`**                       |
| Stacking      | **`z-index: 20`** on **`.react-flow__node-studio .react-flow__handle`** and **`!z-20`** on handle class in **`StudioNodeCard`** |
| Accent        | **`flowNodeHandleStyle(side, portAccent)`** — border color only; do not override transform or inset                             |

**Do not** use a wide handle column (`w-5`) or negative **`right`** offsets that fight RF centering.

### Key files

| File                                      | Role                                          |
| ----------------------------------------- | --------------------------------------------- |
| **`flow-node/FlowNodeSocketRow.tsx`**     | Row layout, label padding, subgrid rows       |
| **`flow-node/FlowNodeSocketRegion.tsx`**  | Grid tracks, region padding                   |
| **`flow-node/flow-node-handles.css`**     | Border-centered handle transform + z-index    |
| **`flow-node/flow-node-handle-style.ts`** | Port accent inline style                      |
| **`flow-node/SocketLivePreview.tsx`**     | Compact vec3 / quat / scalar preview          |
| **`flow-node/readings/live-reading-colors.ts`** | Scalar semantic tint + live/idle stream tone |
| **`StudioNodeCard.tsx`**                  | Wires handles, previews, **`handleDotClass`** |

---

## Typed settings sections

1. Register in **`node-inspector-settings-registry.tsx`** (`nodeId` → section component).
2. Prefer **`InspectorCollapsibleSection`** (`TRNCard` soft glass, collapsible).
3. Numeric fields: **`InspectorNumericScrubRow`** + **`TRNScrubNumberInput`** (`pointerScrubEnabled={false}` in inspector).
4. Booleans: **`TRNInlineToggleRow`**.
5. Long copy: **`TRNHintTooltip`** on section icons — not inline walls of text.

**Reference implementation:** **`MapRangeSettingsSection.tsx`** (map-range + clamp toggle + grouped range inputs).

Legacy **`InspectorSettingsSectionFrame`** remains for sections not yet migrated.

---

## Typography

Default UI font is **Inter** (bundled via **`@fontsource-variable/inter`**, Tailwind **`font-sans`** in **`tailwind.config.mjs`**, **`app.css`** on `body`).

| Element | Classes / token | Size |
| ------- | ----------------- | ---- |
| **Node card title** (`FlowNodeHeader` primary) | **`text-[13px] font-semibold leading-tight text-zinc-100`** | 13px |
| **Node header badges** (LIVE, family tag, Invalid) | **`FLOW_NODE_HEADER_BADGE_CLASS`** — `text-[8px] font-semibold uppercase tracking-wide leading-none` | 8px |
| **Node header subtitle** (linked model, etc.) | **`text-[11px] uppercase tracking-wide text-zinc-400`** | 11px |
| **Socket port label** | **`text-[11px] leading-tight text-zinc-300`** (+ muted span **`text-zinc-400`**) | 11px |
| **Socket live preview** | **`SOCKET_LIVE_VALUE_TYPOGRAPHY`** — `font-sans text-[11px] leading-tight tabular-nums` | 11px |
| **Socket live preview tint** | Semantic scalar colors via **`getLiveScalarReadingColorClass`** — see **Live reading semantic colors** | — |
| **Inspector `nodeId`, wire dumps** | **`font-mono`** | context-specific |

**Do not** use **`font-mono`** on socket-row live previews — match port labels (Inter). Use **`font-mono`** only for ids, JSON, and diagnostic monospace blocks.

**New nodes:** reuse the title row classes in **`StudioNodeCard`** (`primary` slot); do not introduce alternate title sizes without updating this table.

---

## Live reading semantic colors

One module drives **scalar** tint on flow socket rows, node-library live previews, and (when wired) inspector matrices. **Do not** hardcode `text-zinc-100` / `text-orange-400` on live sensor values in new UI.

### Source of truth

| Module | Role |
| ------ | ---- |
| **`flow-node/readings/live-reading-colors.ts`** | **`resolveLiveScalarReadingKind`**, **`getLiveScalarReadingColorClass`**, **`resolveLiveReadingStreamTone`** |
| **`flow-node/readings/param-axis-classes.ts`** | Vector / quaternion component tints (x/y/z/w) — unchanged |
| **`node-palette/palette-scalar-reading-styles.ts`** | Re-exports scalar helpers for library rows (same tints) |

Keep **`ReadingNumber`** presentational (formatting only). Pass tint via **`className`** from the color helpers — do not embed semantics inside **`ReadingNumber`**.

### Scalar tint map (live stream)

| Kind | Tailwind class | Resolved from |
| ---- | -------------- | ------------- |
| **Temperature** | **`text-orange-400/95`** | handle **`temp`** / **`temperature`**; tap **`…-tap-temp`**; unit **`°C`**; label contains **`temp`** |
| **Humidity** | **`text-cyan-400/95`** | handle **`humidity`** / **`rh`**; tap **`…-tap-humidity`**; unit **`%RH`**; label contains **`humid`** |
| **Pressure** | **`text-purple-400/95`** | handle **`pressure`** / **`pr`**; tap **`…-tap-pressure`**; unit **`hPa`**; label contains **`pressure`** |
| **Neutral** | **`text-zinc-100`** | Generic scalars (math, constants, unclassified) |
| **Idle stream** | **`text-zinc-500`** | When **`resolveLiveReadingStreamTone`** returns **`idle`** (no recent valid sample / stream off) |

Resolution order: **`handleId`** → catalog **`nodeId`** (tap nodes use handle **`out`**) → **unit** / **label**.

### Vector / quaternion sockets

| Data | Component | Tint |
| ---- | --------- | ---- |
| **vector3** (accel, gyro, magnetic, euler) | **`ReadingAxisNumber`** + **`socketFixedCell`** | **`readingParamAxisValueClass`** — x red, y emerald, z sky |
| **quaternion** | **`QuaternionScalarsGrid`** | Same axis map (w pink) |

No scalar color helper on vec3/quat rows — axis colors are separate by design.

### Wiring on flow nodes

| Path | Rule |
| ---- | ---- |
| **Output socket preview** | **`socketLivePreviewForOutputHandle`** → **`SocketLivePreview`** — pass **`nodeId`**, **`handleId`**, port **label**, **`streamMode`** from node data |
| **New scalar port** | Use a resolvable **`handleId`** (`temp`, `humidity`, `pressure`) or a tap **`nodeId`** suffix; set catalog **label** with unit text when handle id is generic |
| **Library preview** | **`getPaletteScalarReadingColorClass(streamMode, { unit, label, handleId, nodeId })`** on **`ReadingNumber`** |
| **Inspector matrix** | Prefer **`getLiveScalarReadingColorClass`** on value cells (aligned readings still migrating) |

**Do not** duplicate tint tables in palette or card code — extend **`live-reading-colors.ts`** when adding a new semantic scalar family.

---

## Flow node cards

- Shared chrome: **`FlowNodeShell`**, **`FlowNodeHeader`**, **`FlowNodeBody`**, socket rows under `nodes/flow-node/`.
- **Category accent** tints the **header** only — port/wire colors come from **`portType`**, not category.
- Avoid growing **`StudioNodeCard.tsx`** with one-off shells; extract panels under `nodes/<kind>/`.
- **Output sockets:** use **Output socket row layout** (above) — especially **`w-0`** handle column, **`overflow-visible`** shell, label **`pl-2 pr-3`**.

---

## Controls

| Control                                     | Use                                      |
| ------------------------------------------- | ---------------------------------------- |
| **`TRNScrubNumberInput`**                   | Inspector numerics, optional card scrubs |
| **`TRNSelect`** / **`TRNSegmentedControl`** | Enums and modes                          |
| **`TRNChipButtonGroup`**                    | Small mutually exclusive options; **`columns={4}`** for Hz rate presets (`SensorHzRateField`) — equal-width chips, wrap to next row (no horizontal scroll) |
| Native `<select>`                           | Avoid in new UI                          |
| Native `<input type="checkbox">`            | Avoid — use **`TRNInlineToggleRow`**     |

---

## Adding a new catalog node

1. **`node-catalog.config.ts`** — `defaultConfig`, ports, **`category`** (`sensor` for hardware BMI270/DPS368/SHT40/BMM350 + taps; `input` only for legacy **`sensor-input`**), port **order** and **labels** (e.g. **`Temp (°C)`** last on BMI270).
2. **Typography** — follow **Typography** (Inter; node title **`text-[13px]`**, socket labels/previews **`11px`**).
3. **Live reading colors** — follow **Live reading semantic colors**; socket previews must use **`socketLivePreviewForOutputHandle`** (or **`getLiveScalarReadingColorClass`** / **`ReadingAxisNumber`** for custom readouts).
4. Simulation — **`flow-editor.store.ts`** tick / pin evaluation.
5. Optional **Settings** section + registry entry.
6. Optional on-card panel — only if operators need at-a-glance control.
7. Update **`node-inspector-settings-search.ts`** keywords when the section should appear in Settings filter.

### Live multi-pin input node (BMI270 / BMM350 / DPS368 / SHT40)

When adding a multi-output sensor source:

1. Add id to **`STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_IDS`** and **`isStudioAlignedOutputSocketColumnsNodeId`**.
2. **`outputPorts`** — display order; put **`Temp (°C)`** last when present.
3. **`StudioNodeCard`** — **`isStudioAlignedOutputSocketColumnsNodeId`** enables subgrid; wire **`socketLivePreviewForOutputHandle`**.
4. **Do not** add a card **`ReadingPanel`**.
5. **Inspector → Live** — extend **`LiveSensorInspectorReadings`** (multi-output: aligned matrix; taps: **`SensorTapInspectorReadings`**). Register via **`isStudioLiveInspectorReadingsNodeId`**.
6. **Socket rows** — follow **Output socket row layout** (subgrid, fixed-width cells, border handles, label padding).
7. **Semantic colors** — scalar ports use stable **`handleId`** names (`temp`, `humidity`, `pressure`) so **`SocketLivePreview`** picks up tints automatically; library rows pass the same hints.
8. On hydrate/import, **`refreshCatalogOutputHandles`** syncs port defs and **`data.category`** from catalog (migrates old graphs that stored hardware under **`input`**).

### Single-output sensor tap node

1. Register in **`BMI270_TAP_NODE_IDS`** or **`ENVIRONMENT_SENSOR_TAP_NODE_IDS`** (**`isStudioSensorTapNodeId`**).
2. Single **`out`** port in catalog with correct **`portType`**.
3. Simulation must populate **`liveQuaternionWire`**, **`liveVector3Wire`**, or **`liveValue`** (existing tap tick paths).
4. **Catalog `nodeId`** must follow **`…-tap-temp`**, **`…-tap-humidity`**, or **`…-tap-pressure`** (or extend **`live-reading-colors.ts`**) so scalar taps tint correctly with handle **`out`**.
5. **No card body panel** — preview on the socket row only.

### Plotter (multi-channel trend chart)

Renamed from **Oscilloscope** — avoids implying lab scope sample rate / trigger semantics.

| Item | Rule |
| ---- | ---- |
| **Catalog id** | **`plotter`** (legacy **`oscilloscope`** migrates on hydrate/import) |
| **Config** | **`historyLength`** = points retained per channel (**not Hz**); legacy **`sampleCount`** accepted on import |
| **Runtime data** | **`livePlotHistory`** — one append per **`tickSimulation`** when upstream pins update |
| **Acquisition** | Event-driven with the graph (typically one point per telemetry frame); no plotter-local Hz clock in v0.1 |
| **X axis** | Sample index (not wall-clock ms/div) until a future **Oscilloscope** instrument node |
| **Key files** | **`nodes/plotter/plotter-config.ts`**, **`PlotterCanvas.tsx`**, **`PlotterInspectorSection.tsx`** |

Future **Oscilloscope** node (backlog): independent acquisition rate, ms/div timebase, trigger — do not overload Plotter.

### Resizable panel nodes (plotter, model-viewer, …)

- Set explicit **`data.ui.minWidth` / `minHeight`** in **`attachConfigErrors`** when the default body needs a floor.
- **Canvas resize:** TRNWindow-style edge/corner drag via **`FlowNodeEdgeResize`** when **`data.ui.resizable === true`** and the node is selected. Operator enables per node on Inspector → **Node → Allow resize on canvas**. Default **off**; **plotter** and **model-viewer** default **on** at create/hydrate.
- **Wrap-content** nodes (live sensor cards): height **`auto`** via **`utilityBodyFitsContent`**; vertical resize sets an explicit flow height.

## Flow graph execution (dataflow)

| Layer | Behavior |
| ----- | -------- |
| **Trigger** | **`tickSimulation()`** runs when telemetry decodes (**`sampleCount`** ↑), BMI270 wire taps update, or graph edits flush pins — **not** a fixed Hz loop |
| **Evaluation** | Pull dataflow: sources → transforms → sinks; **`readIncoming`** on wired pins |
| **Plotter** | Appends one point per channel per tick; rate follows upstream publish / tick rate |
| **Stale UI** | 250 ms poll refreshes health badges only when samples stop — does not drive plotter acquisition |

Device **`publishMode`** (periodic / on_change / hybrid) controls **how often UART events arrive**, not the flow engine type.

**Future (planned, not started):** Keyboard/mouse events, per-frame 3D/animation, and material graphs require **additional domains** — see **[`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md)** and tracker *Flow domains* epic.

---

## Related docs

- **`FLOW_DOMAINS.md`** — multi-evaluator roadmap (telemetry, scene, events, material)
- **`extension/docs/DEVELOPMENT_TRACKER.md`** — backlog and shipped work
- **`NODE_CREATION_RULES.md`** (node-animator) — socket grid and manifest patterns (reference only)
- **`trn-component-first.mdc`** — TRN-first webview UI
