# Sensor Studio node UI rules

Short conventions for **flow node cards** and the **Node Inspector**, aligned with Model Preview TRN patterns and the **node-animator** reference repo (`D:\CODE\2026\node-animator`).

---

## Application chrome (shell `TRNToolbar`)

Sensor Studio has **no second workspace header**. Chrome lives on **`BitstreamMainToolbar`** when `workspace === "sensor-studio"`:

| Zone | Content |
| ---- | ------- |
| **Left** (after LINK) | Brand, SOURCE, Link connect/disconnect |
| **Center** | **`BitstreamWorkspaceSwitcher`** (Telemetry · Studio) |
| **Right** | Telemetry: workspace ☰ · system indicators · shell ☰ |

**Floating footer** (`ShellLinkStatusFooter`): UART / broker / handshake / sensor-cfg / Wi‑Fi pills while link setup is incomplete (+ **Connection…**). Hidden in Studio when link is ready (wire/FPS only in the shell toolbar).

**Flow canvas top-right** (`FlowCanvasTopLeftChrome`): **Studio ☰** only (wire/FPS metrics stay in the shell toolbar). Graph breadcrumb stays top-left when inside a node group.

**Studio ☰** sections: Workspace (Devices, Assets), Flow graph (duplicate / delete / selection), Flow file (import / export JSON), Workbench layout (`WorkbenchLayoutMenuSections`).

**Not in the shell toolbar** (canvas toolbars): Fit view, Clear graph, auto-layout, socket expand/collapse — see **`FlowCanvasToolbar`** and **`NodeSelectionToolbar`**.

**Smart connect:** drag from a socket and release on empty canvas → filtered **Add Node** menu (same as Shift+A) + optional auto-wire. Modifiers: **Shift** = full menu, **Alt** = place without connect. Footer hints while dragging. Spec: **`SMART_CONNECT.md`**.

**Socket wiring:** single inputs **replace** the previous wire; drag from a wired single input **pops** the wire first (reconnect). Multi-input: **`number-average`** only. Spec: **`SOCKET_CONNECTION_POLICY.md`**.

**3D model preview transport** (`StudioSceneViewport` — Model Viewer, 3D Rotation): when the loaded model has animation clips, **Play / Pause / Stop** appear **bottom-left** on the viewport (`GlbPreviewPlaybackControls`). Manual transport runs **all clips in parallel** when no animation flow wire or inspector drive is active; **flow / bundle / event drives take over** and disable the buttons. Implementation: **`glb-preview-user-transport.ts`**.

Use **`TRNTooltip`** + **`TRNMenu*`** for menus; no native `title` on toolbar controls.

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

**Catalog sockets:** DPS368 / SHT40 / BMM350 temp ports use **`SENSOR_TEMPERATURE_PORT_LABEL`** (`Temperature (°C)`). **BMI270 hardware** temp socket uses **`PALETTE_TEMPERATURE_ROW_LABEL`** (`Temp (°C)`). Put temperature last on multi-output sensors when present.

### Node Palette live row format

Library **line-2** previews are **hardware sensor rows only** (`paletteShowsHardwareLivePreview` in **`palette-entry-meta.ts`**): primary streams, taps, and legacy **`sensor-input`** / **`quat-input`**. Utility / generator / transform / logic entries show **no live reading row** in the palette (canvas socket previews still follow evaluated pins). Sensor bundles use **`PrimaryBundleRow`** via **`kind: "primaryBundle"`** in **`palette-live-preview.ts`**. Labels and units are centralized in **`core/sensor-port-labels.ts`**.

| Pattern | Rule |
| ------- | ---- |
| **Layout** | **`[label left]`** (zinc-500, 11px, `max-w-[7.5rem]`) + **values right** — no trailing unit suffix after the number |
| **Scalars** | Unit in the label: `Temp (°C)`, `Pressure (hPa)`, `Humidity (%RH)` |
| **Vectors** | Unit in the label: `Accel (m/s²)`, `Gyro (rad/s)`, `Euler (rad)`, `Mag (µT)` — axis values only on the right |
| **Quaternion** | Label `Quaternion`; **w x y z** on the right |
| **Primary cards** | Multi-row bundle (BMI270, DPS368, SHT40, BMM350) — one row per port |
| **Tap nodes** | Single-row **`primaryBundle`** (same row component as primary cards) — do not use bare **`kind: "scalar"`** / **`vector3`** inline previews for sensor taps |

Constants: **`PALETTE_*_ROW_LABEL`** for palette; **`SENSOR_TEMPERATURE_PORT_LABEL`** for non–BMI270 canvas sockets and tap temp ports. Extend **`sensor-port-labels.ts`** when adding a new sensor family — do not hardcode labels in **`palette-live-preview.ts`**.

### Node Palette — Scene category

3D / scene wiring nodes use catalog **`category: "scene"`** (not `input` / `output`). Operator-facing copy uses **plain language** — avoid **GLB**, **Studio Model**, and file-format jargon in titles, descriptions, palette rows, inspector sections, and socket hints. Internal ids stay stable (`model-select`, `glb-material-param`, …).

| Zone | Rule |
| ---- | ---- |
| **Palette section label** | **`PALETTE_CATEGORY_LABEL.scene`** → **Scene** |
| **Subgroups** | **`PALETTE_SCENE_SUBGROUP_ORDER`**: Sources → Viewports → Stage → Materials → Animation → Scene control |
| **Subgroup map** | **`SCENE_NODE_SUBGROUP`** in **`palette-entry-meta.ts`** — assign every new scene node |
| **Layouts** | Sectioned, accordion, two-line, and classic palettes all render scene subgroups via **`palette-subgroup-layout.ts`** |
| **Library tab** | Internal tab id **`glb`**; operator label **Model** (extract / spawn from linked **Model Source**) |
| **Inspector tint** | **`InspectorCategoryIcon`** — **`Layers`** + scene accent (`#818cf8`) |

**Model Source** (`model-select`): canvas shows **model picker only** (no preview card, no linked-node list). Summary + **Focus** actions for linked nodes live in inspector **`StudioModelSettingsSection`**. Default **non-resizable** auto-fit width.

**Model tab spawn hints:** Tex / Clr / Evt side buttons use **`TRNTooltip`** (`triggerWrapper="span"`) — not native **`title`**.

### Single-output sensor tap nodes (BMI270 / DPS368 / SHT40 / BMM350 taps)

| Zone                      | Role                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **One output socket row** | Live preview on the row (`leadingPreview`); catalog port label; border handle                                     |
| **Node body**             | No `ReadingPanel`                                                                                                 |
| **Inspector → Live**      | Compact **`SensorTapInspectorReadings`** in **`LiveSensorInspectorReadings`**; hide redundant wire/primary blocks |

Registry: **`isStudioSensorTapNodeId`**. Previews read **`liveQuaternionWire`**, **`liveVector3Wire`**, or **`liveValue`** via **`socketLivePreviewForOutputHandle`**.

### Policy A — all scalar outputs (utility / dataflow)

| Rule | Detail |
| ---- | ------ |
| **Every scalar output pin** | Live preview on the socket row — **`syncSocketLivePreviewHandlesFromPinValues`** fills **`liveNumberByHandle`**, **`liveBooleanByHandle`**, **`liveStringByHandle`**, **`liveVector3ByHandle`** from evaluated pins |
| **Bundled wire types** | No scalar preview — **`environment`**, **`camera`**, **`transform`**, **`fog`**, **`studioLight`**, **`postProcessing`**, **`contactShadows`**, **`particleEmitter`**, **`event`**, **`glbAnimation`** |
| **Catalog / wire badges** | **`SocketStructuredWireBadge`** — port-type accent border, **`text-[10px]`**, **`max-w-full min-w-0 truncate`**; CSS ellipsis when the row is narrow; full label when space allows |
| **Environment / Camera** | Preset / FOV labels from **`resolveEnvironmentWireSocketLabel`** / **`resolveCameraWireSocketLabel`** |
| **Model Source (string `model` pins)** | **`modelSelectEmitDisplayName`** (catalog / asset label, not URL) on **`model-select` `out`**, **`model-viewer` `in`**, event **`model`** inputs — same badge as Environment; pass full display name (no JS pre-truncate) |
| **Boolean** | Display **`true`** / **`false`** (lowercase); **`true`** → emerald (`text-emerald-300`), **`false`** → muted zinc (`text-zinc-400`) |
| **Generic string** | Plain **`SocketLivePreview`** (zinc text, no badge) — raw pin strings only; prefer a resolver + badge when the value is a catalog pick or bundled wire |
| **Card body** | No fallback **`ReadingPanel`** for scalar-only utility nodes — socket row only |
| **Input pins** | Wired scalar inputs use **`liveInput*ByHandle`** maps + **`socketLivePreviewForInputHandle`** (`trailingPreview` on input rows) |

---

## Input socket row layout

Mirror **output** handle rules on the **left** border; label and live value form a **left cluster** (do not stretch live data to the node’s right edge).

### Label width equalization (required)

All **input socket rows** must align their **label** and **value** columns by applying a single
label width to every row:

- **Measure** the rendered width of each input socket **label** in the node
- **Take the maximum**
- **Apply** that width to all input labels in the same node

This makes every row’s value start at the same x-position (perfect vertical alignment).

**Shared implementation (do not re-invent per node):**

- `nodes/flow-node/FlowNodeSocketRegion.tsx` — `equalizeLabelWidth` (uses `ResizeObserver`, sets `--flow-socket-label-w`)
- `nodes/flow-node/FlowNodeSocketRow.tsx` — input label cell uses `width: var(--flow-socket-label-w)`

### Column layout (flex)

```text
[ 0px handle anchor ] [ pl-2 label gap-1 live preview ] …empty…
```

- **Handle anchor** — first column, **`w-0`**, flush to the card’s **left border** (`FlowNodeSocketRegion` **`pl-0`**).
- **Label + live** — one **`flex`** group with **`gap-1`** (~4px); both **`shrink-0`**; row is **`w-fit`** / **`self-start`**.
- **Live preview** — immediately after the port name, not **`flex-1 justify-end`**.

Example:

```text
●  A  +37.48
●  B
↑  ↑   ↑
│  │   └── live (11px) — omitted when unwired / no finite value
│  └────── port label
└───────── handle center on left border
```

Structured / unwired inputs show the label only (no spacer column).

**Upstream semantic tint:** wired **number** inputs copy color hints from the source pin. Walk **`studio-reroute`** / **`studio-split`**, then **`map-range`**, **`clamp`**, **`lerp`**, **`material-mix`**, **`value-normalizer`** (follow **Out → value/A** chain) to the originating sensor. Math **A** ← Map Range ← SHT40 **humidity** → cyan on Math **A**. Utility-only sources (bare Math **out**) stay neutral.

---

## Node Inspector shell

| Zone                  | Component                                               | Notes                                                                                |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Outer pane**        | `NodeInspector`                                         | Neutral zinc border/background — no emerald gradient wash                            |
| **Tab bar**           | `TRNTabs` + **`trn-inspector-tab-bar`** (shared with Telemetry deck) | Live / Telemetry Data active: emerald; others: zinc                              |
| **Context**           | **`InspectorContextBar`**                               | Category dot, title, mono `nodeId`, clock, single stream status (no duplicate chips) |
| **Details sections**  | **`TRNInteractiveCard`** + **`TRNSortableContainer`** (telemetry deck parity) | **Specifications** · **Ports** — drag reorder + collapse; **Specifications** uses **`sensor-inspector-about-content`** (datasheet ranges/accuracy) for hardware nodes |
| **Settings — node (flow-local)** | **`NodeInspectorNodeTab`** — Identity, Canvas (size + resize toggles), typed registry, rotation 3D, Advanced JSON | Stacked **`InspectorFieldStack`** fields (~340px rail); **`InspectorSection`** for Identity / Canvas / Advanced; filter via search |
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
- **Region padding** — **`pl-0 pr-0`** so handle anchors sit on the card borders; inset **`pl-2`** / **`pr-3`** on label cells only.
- **Grid gap** — **`gap-x-0`** between tracks; do **not** add column gap before the handle column (it would inset plugs from the border).

### Label spacing

| Side  | Class      | Purpose                                 |
| ----- | ---------- | --------------------------------------- |
| Left  | **`pl-2`** | Gap between live values and port name   |
| Right | **`pr-3`** | Gap between port name and socket handle |

Apply on the label cell in **`FlowNodeSocketRow`** (aligned and flex rows with **`leadingPreview`**).

### Live value cells (no jitter)

Use fixed-width **Inter** cells (`font-sans`) so digits do not shift on tick — see **Typography** below. Helpers: **`SOCKET_LIVE_VALUE_TYPOGRAPHY`**, **`readings/socket-live-value-cell.ts`**, **`SocketLivePreview`**, **`QuaternionScalarsGrid`** (`socketFixedCell` when **`compact`**).

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
2. Prefer **`InspectorCollapsibleSection`** — compact **`InspectorSection`** / **`TRNInteractiveCard`** glass, **This node** scope chip, title hint tooltip. **Do not** register info-only nodes (no form fields) — behavior belongs on the card / Details tab.
3. Multi-block sections with many fields: **`InspectorSettingsSectionFrame`** (same chrome).
4. Numeric fields: **`InspectorNumericScrubRow`** + **`TRNScrubNumberInput`** — drag on the value to scrub (Shift = finer); arrow keys and typing still work. Use `pointerScrubEnabled={false}` only when each tick must not scrub (e.g. number constant undo batching).
5. Dropdowns: **`InspectorSelectRow`** + **`TRNSelect`** (glass menu) — not native `<select>`.
6. Booleans in collapsible cards: **`InspectorCompactToggleRow`** (slim) — not **`TRNInlineToggleRow`** card chrome unless the node body uses it.
7. Long copy: **`TRNHintTooltip`** on labels — not inline walls of text.

**Reference implementation:** **`MapRangeSettingsSection.tsx`** (map-range + clamp toggle + grouped range inputs).

---

## Typography

Default UI font is **Inter** (bundled via **`@fontsource-variable/inter`**, Tailwind **`font-sans`** in **`tailwind.config.mjs`**, **`app.css`** on `body`).

| Element | Classes / token | Size |
| ------- | ----------------- | ---- |
| **Node card title** (`FlowNodeHeader` primary) | **`text-[13px] font-semibold leading-none text-zinc-100`** (`inline-block w-max max-w-full truncate`) | 13px |
| **Node header prefix icon** (`FlowNodeHeaderIcon`) | Catalog slug via **`resolveNodeCatalogIconSlug`**; category tint (`text-emerald-400/90` sensor, …); **`size-3.5`** | 14px |
| **Node header badges** (LIVE, family tag, Invalid) | **`FLOW_NODE_HEADER_BADGE_CLASS`** — `text-[8px] font-semibold uppercase tracking-wide leading-none` | 8px |
| **Socket port label** | **`text-[11px] leading-tight text-zinc-300`** (+ muted span **`text-zinc-400`**) | 11px |
| **Socket live preview** | **`SOCKET_LIVE_VALUE_TYPOGRAPHY`** — `font-sans text-[11px] leading-tight` | 11px |
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
| **number** pins **`x` / `y` / `z` / `w`** (Split Vector, Combine Vector, …) | **`ReadingAxisNumber`** on each scalar output | Same axis map as vector3 rows |

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
- **`FlowNodeHeader`** — one row, **two columns**: **col 1** (`data-flow-node-header-leading`, left) = prefix icon + title; **col 2** (`data-flow-node-header-trailing`, right) = status/mode badges. Drag handle class **`studio-node-drag-handle`** on the header root. Width probe: **`measureFlowNodeHeaderIntrinsicWidth`** sums both columns off-DOM + padding.
- **Prefix icon:** **`FlowNodeHeaderIcon`** for every catalog node (same Lucide slug as palette). Do not add per-node icon switches in **`StudioNodeCard`**.
- **No header chevrons** on **Environment** / **Camera View** — card body panels are always shown; use inspector or **Hide body** toolbar when collapsing utility panels.
- **Category accent** tints the **header** only — port/wire colors come from **`portType`**, not category.
- Avoid growing **`StudioNodeCard.tsx`** with one-off shells; extract panels under `nodes/<kind>/`.
- **Output sockets:** use **Output socket row layout** (above) — especially **`w-0`** handle column, **`overflow-visible`** shell, label **`pl-2 pr-3`**.

### Flow node resize (min width / min height)

All studio nodes default to **`ui.resizable`** from **`studioNodeDefaultResizable(nodeId)`** when unset (viewport/output nodes **on**, compact utilities **off**). **Height** auto-fits via **`syncFlowNodeHeightFit`** in **`StudioNodeCard`** when resize is off. **Width** auto-fits when the **display mode** changes (live values, unwired sockets, body visibility) via **`syncStudioNodeWidthFromContentMeasure`**. Manual edge drag requires **`ui.resizable: true`**; toggle in Inspector → **Node → Card size → Manual resize**. Turning resize **off** strips fixed dimensions and re-measures width.

| Rule | Detail |
| ---- | ------ |
| **Catalog floor** | Set per-`nodeId` in **`resolveStudioNodeMinDimensionFloor`** — baseline before live measure |
| **Live measure** | **`ResizeObserver`** on header, sockets, body — updates **`ui.contentMinWidth`** / **`contentMinHeight`**; non-resizable nodes re-sync width whenever **`fitW`** changes |
| **Display mode key** | **`resolveStudioNodeChromeLayoutKey`** — combines live values, socket expand, body visibility (used to trigger width refit, not per-mode saved width) |
| **Header width** | **`measureFlowNodeHeaderIntrinsicWidth`** — off-DOM sum of icon + untruncated title + trailing chips + padding; **`max(header, sockets, body)`** sets node width |
| **Auto width apply** | Non-resizable nodes: sync whenever **`fitW !== currentW`**; resizable nodes: grow on mode change / unset width only |
| **Header chrome churn** | **`headerChromeKey`** remeasure on label/health/invalid/family/compare/body changes; **`MutationObserver`** on **`data-flow-node-header-measure`** for badge DOM add/remove |
| **Fit width** | **Shift+W** on canvas selection — manual re-measure (undoable) |
| **Socket rows** | Inspector → **Node → Socket rows** — live values beside ports + unwired port visibility |
| **Reset to defaults** | **Shift+R** on canvas selection — restores factory display and re-fits from content (undoable) |
| **Body overflow** | **`FlowNodeBody`**, body measure wrapper, and card panels use **`min-w-0 max-w-full overflow-hidden`** — content must not paint outside the shell when narrowed |
| **TRNSelect on cards** | **`FLOW_NODE_TRN_SELECT_CLASS`** (`w-full min-w-0 max-w-full`) — **never** `min-w-40` / `min-w-48` on flow node selects |
| **Intrinsic width marker** | **`FlowNodeIntrinsicWidthMarker`** + widest option/selected labels — off-DOM probe via **`data-flow-node-intrinsic-width`** (avoids `w-full` scrollWidth feedback loops) |
| **Panel padding flag** | Root panel with **`data-flow-node-body-panel`** (e.g. `px-2.5`) — measurement adds **`FLOW_NODE_BODY_PANEL_PADDING_PX`** |
| **2-column grids** | Optional **`data-flow-node-intrinsic-extra-px`** on the panel root when two selects sit side-by-side (e.g. Audio Scope) |
| **Height** | Body **`offsetHeight`** drives min height (viewport nodes: plotter, gauges, sparkline canvas) — do not rely on inline **`min-w-*`** on chart SVGs |

**New node with dropdown / long labels:** add **`FlowNodeIntrinsicWidthMarker`**, **`FLOW_NODE_TRN_SELECT_CLASS`**, and a catalog row in **`studio-node-resize-defaults.ts`**.

### Card size (auto-fit; manual opt-in)

Width and height are derived from content measure when manual resize is off — **Inspector → Node** exposes three cards: **Socket rows**, **Body panel** (when the node has a body), and **Card size** (manual resize toggle + W/H when on). **`Shift+W`** / **`Shift+R`** when a node is selected re-measure width and reset size. Edge resize uses **`resolveStudioNodeEffectiveMinDimensions`** (catalog + live **`ui.contentMin*`** from **`StudioNodeCard`**) when **`ui.resizable: true`**.

Graph-wide socket dot fade (**Dim unwired sockets**) lives in the **Flow canvas** inspector → **Wires** tab only — not in the per-node **Socket rows** card.

Whole-graph grid, wires, and viewport defaults live in the **Flow canvas** inspector (deselect all nodes).

Homogeneous multi-select applies width/height commits to every selected node of the same catalog type.

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

1. **`node-catalog.config.ts`** — `defaultConfig`, ports, **`category`** (`sensor` for hardware BMI270/DPS368/SHT40/BMM350 + taps; **`scene`** for 3D model / viewport / stage / material / animation wiring; `input` only for legacy **`sensor-input`**), port **order** and **labels** (e.g. **`Temperature (°C)`** last on BMI270). Operator titles/descriptions: plain language (see **Node Palette — Scene category**).
2. **Typography** — follow **Typography** (Inter; node title **`text-[13px]`**, socket labels/previews **`11px`**).
3. **Socket preview kind** — pick one (see **Socket preview taxonomy** below); wire through **`socketLivePreviewForOutputHandle`** / **`socketLivePreviewForInputHandle`** — do not render ad-hoc preview spans on the card.
4. **Live reading colors** — follow **Live reading semantic colors**; socket previews must use **`socketLivePreviewForOutputHandle`** (or **`getLiveScalarReadingColorClass`** / **`ReadingAxisNumber`** for custom readouts).
5. Simulation — **`flow-editor.store.ts`** tick / pin evaluation.
6. Optional **Settings** section + registry entry.
7. Optional on-card panel — only if operators need at-a-glance control; **never** duplicate socket state in the header (title stays the catalog node name).
8. Update **`node-inspector-settings-search.ts`** keywords when the section should appear in Settings filter.

### Socket preview taxonomy (canvas)

| Kind | When | Component | Label source |
| ---- | ---- | ----------- | -------------- |
| **Live scalar** | `number` / `boolean` evaluated pins | **`SocketLivePreview`** | Pin value; semantic tint for numbers |
| **Live vector / quat** | `vector3` / `quaternion` | **`SocketLivePreview`** | Pin value; axis colors |
| **Catalog / wire badge** | Asset or bundled-wire picks (environment, camera, **Model Source**, future catalog refs) | **`SocketStructuredWireBadge`** | `resolve*WireSocketLabel` or `*EmitDisplayName` helper — **not** raw URLs on the row |
| **Generic string** | Opaque string payloads (URLs, ids) with no friendly resolver | **`SocketLivePreview`** `string` | Truncated pin value; full value in **`title`** |

**Row layout (unchanged):** port label (**`Model`**, **`Environment`**) stays on the label column; the badge/preview sits in the preview column (output: before label; input: after label). Example output row: `[badge: Cubemap — park] Environment` — same structure as `[badge: PSoC E84…] Model`.

**New catalog-backed ports:** add a small `resolve*SocketLabel` (or reuse an existing emit helper) and route in **`socket-live-preview-for-handle.tsx`**; register bundled types in **`SOCKET_PREVIEW_STRUCTURED_PORT_TYPES`** when the wire is not a scalar string.

### Live multi-pin input node (BMI270 / BMM350 / DPS368 / SHT40)

When adding a multi-output sensor source:

1. Add id to **`STUDIO_ALIGNED_OUTPUT_SOCKET_NODE_IDS`** and **`isStudioAlignedOutputSocketColumnsNodeId`**.
2. **`outputPorts`** — display order; put temperature last (`Temp (°C)` on BMI270, `Temperature (°C)` on other sensors).
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
- **Canvas resize:** TRNWindow-style edge/corner drag via **`FlowNodeEdgeResize`** when **`data.ui.resizable === true`** and the node is selected. Operator enables per node on Inspector → **Canvas → Allow resize on canvas**. Default **off** (auto content-fit).
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
