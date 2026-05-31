# Sensor Studio node UI rules

Short conventions for **flow node cards** and the **Node Inspector**, aligned with Model Preview TRN patterns and the **node-animator** reference repo (`D:\CODE\2026\node-animator`).

---

## Inspector shell

| Element            | Rule                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Pane title**     | **Node Inspector**                                                                                        |
| **Subtitle**       | _Selection, live values, and typed settings_                                                              |
| **Tabs**           | Horizontal **Details / Live / Settings** tab bar on top — do not collapse into a single scroll panel      |
| **Identity strip** | Catalog **type** badge + **category** badge (accent); user **label** below; instance id in a hint tooltip |

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
| **Settings — shared device** | **`InspectorSensorCfgSection`** + **`SensorCfgDeck`** on **Settings** tab | Same editable cards as Telemetry **Sensor Config**; draft-until-Apply via **`useSensorCfgPanelHost`** + **`useBitstreamDeviceSensorConfigStore`** sync |
| **Live sections**     | **`InspectorSensorDeckReadings`**                       | Deck `TRNInteractiveCard` viewers; **`useInspectorLiveDeckSamples`**                 |
| **Settings sections** | **`InspectorCollapsibleSection`**                       | Glass `TRNCard` for typed forms                                                      |

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
| **Inspector `nodeId`, wire dumps** | **`font-mono`** | context-specific |

**Do not** use **`font-mono`** on socket-row live previews — match port labels (Inter). Use **`font-mono`** only for ids, JSON, and diagnostic monospace blocks.

**New nodes:** reuse the title row classes in **`StudioNodeCard`** (`primary` slot); do not introduce alternate title sizes without updating this table.

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
3. Simulation — **`flow-editor.store.ts`** tick / pin evaluation.
4. Optional **Settings** section + registry entry.
5. Optional on-card panel — only if operators need at-a-glance control.
6. Update **`node-inspector-settings-search.ts`** keywords when the section should appear in Settings filter.

### Live multi-pin input node (BMI270 / BMM350 / DPS368 / SHT40)

When adding a multi-output sensor source:

1. Add id to **`STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_IDS`** and **`isStudioAlignedOutputSocketColumnsNodeId`**.
2. **`outputPorts`** — display order; put **`Temp (°C)`** last when present.
3. **`StudioNodeCard`** — **`isStudioAlignedOutputSocketColumnsNodeId`** enables subgrid; wire **`socketLivePreviewForOutputHandle`**.
4. **Do not** add a card **`ReadingPanel`**.
5. **Inspector → Live** — extend **`LiveSensorInspectorReadings`** (multi-output: aligned matrix; taps: **`SensorTapInspectorReadings`**). Register via **`isStudioLiveInspectorReadingsNodeId`**.
6. **Socket rows** — follow **Output socket row layout** (subgrid, fixed-width cells, border handles, label padding).
7. On hydrate/import, **`refreshCatalogOutputHandles`** syncs port defs and **`data.category`** from catalog (migrates old graphs that stored hardware under **`input`**).

### Single-output sensor tap node

1. Register in **`BMI270_TAP_NODE_IDS`** or **`ENVIRONMENT_SENSOR_TAP_NODE_IDS`** (**`isStudioSensorTapNodeId`**).
2. Single **`out`** port in catalog with correct **`portType`**.
3. Simulation must populate **`liveQuaternionWire`**, **`liveVector3Wire`**, or **`liveValue`** (existing tap tick paths).
4. **No card body panel** — preview on the socket row only.

### Resizable panel nodes (oscilloscope, model-viewer, …)

- Set explicit **`data.ui.minWidth` / `minHeight`** in **`attachConfigErrors`** when the default body needs a floor.
- **Wrap-content** nodes (live sensor cards): height **`auto`** via **`utilityBodyFitsContent`**; resize mins from content measurement is backlog — do not shrink below natural socket layout.

---

## Related docs

- **`extension/docs/DEVELOPMENT_TRACKER.md`** — backlog and shipped work
- **`NODE_CREATION_RULES.md`** (node-animator) — socket grid and manifest patterns (reference only)
- **`trn-component-first.mdc`** — TRN-first webview UI
