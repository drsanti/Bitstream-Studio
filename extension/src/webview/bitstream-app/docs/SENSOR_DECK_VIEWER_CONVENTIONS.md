# Sensor deck & DataViewer conventions

**Scope:** `src/webview/bitstream-app` — right-panel `SensorTelemetryDeckView`, per-sensor `*DataViewer` components, and shared typing for the **deck card frame** (collapse, drag handle, sampling interval — not browser UI).

**Purpose:** Keep folder layout and props consistent across DPS368, SHT40, BMM350, and document how BMI270 differs (raw/fusion views).

**Language:** English only. Shared deck types are defined under **`types/`** (see §3.1).

### Implementation backlog (update as you go)

- [x] Shared `SensorDeckCardFrameProps` and `*DataViewerProps` in `types/sensorDeckCardFrame.ts`; wire DPS / SHT40 / BMM350 `*DataViewer` components.
- [x] Document **Telemetry deck viewers** in `README.md` (mention `SensorDeckCardFrameProps` and `types/sensorDeckCardFrame.ts`).
- [x] `SensorTelemetryDeckViewProps` in `types/sensorTelemetryDeckView.ts`; `SensorTelemetryDeckView` uses it and a single `deckDragHandle` instance.
- [ ] Optional (defer): `bmi270TelemetryDeckCardMap` — map `SensorTelemetryCardId` → component to shrink branch chains in `SensorTelemetryDeckView.tsx` (see §4).
- [ ] Optional (defer): Extract a shared “frame” subset type for BMI270 deck cards where props align with `SensorDeckCardFrameProps` (see §4).

---

## 1. Current layout (summary)

```
bitstream-app/
├── BitstreamAppMain.tsx
├── BitstreamAppWrapper.tsx
├── index.ts
├── README.md
├── bmi270/                         # non-JSX: cache, telemetry constants
│   ├── bmi270SampleCache.ts
│   └── bmi270TelemetryConstants.ts
├── telemetry/
│   └── telemetryFormat.ts
├── context/
│   └── bitstreamTransportActions.context.tsx
├── constants/
│   └── sensorSourceIds.ts
├── docs/
├── hooks/
├── sync-effects/
│   └── Bmi270StreamModeSyncEffect.tsx
├── state/
├── types/
│   ├── bitstreamWorkspaceTypes.ts
│   ├── sensorConfigAck.ts
│   ├── sensorDeckCardFrame.ts
│   └── sensorTelemetryDeckView.ts
├── workspace/
│   └── BitstreamSensorWorkspaceView.tsx
├── ui/
├── system-tools/
└── components/
    ├── telemetry/
    │   ├── SensorTelemetryDeckView.tsx
    │   └── SensorMetricRow.tsx
    ├── bmi270/                     # no single *DataViewer.tsx — right-panel deck uses exports from Bmi270RawDataViews + fusion (§6)
    │   ├── BMI270ControlPanel.tsx
    │   ├── types.ts
    │   ├── Bmi270AnimatedParameter.tsx
    │   ├── Bmi270RawDataViews.tsx
    │   ├── Bmi270RawSection.tsx
    │   ├── HealthDiagnosticsCard.tsx
    │   ├── bmi270AxisTelemetryStyles.ts
    │   ├── bmi270RawTypes.ts
    │   └── cards/
    │       ├── BMI270DeltaThresholdCard.tsx
    │       ├── BMI270MinPublishIntervalCard.tsx
    │       ├── BMI270OperationCard.tsx
    │       └── BMI270SamplingIntervalCard.tsx
    ├── dps368/
    │   ├── DPS368DataViewer.tsx
    │   ├── DPS368ControlPanel.tsx
    │   ├── types.ts
    │   └── cards/
    │       ├── DPS368DeltaThresholdCard.tsx
    │       ├── DPS368MinPublishIntervalCard.tsx
    │       ├── DPS368OperationCard.tsx
    │       └── DPS368SamplingIntervalCard.tsx
    ├── sht40/
    │   ├── SHT40DataViewer.tsx
    │   ├── SHT40ControlPanel.tsx
    │   ├── types.ts
    │   └── cards/
    │       ├── SHT40DeltaThresholdCard.tsx
    │       ├── SHT40MinPublishIntervalCard.tsx
    │       ├── SHT40OperationCard.tsx
    │       └── SHT40SamplingIntervalCard.tsx
    └── bmm350/
        ├── BMM350DataViewer.tsx
        ├── BMM350ControlPanel.tsx
        ├── types.ts
        └── cards/
            ├── BMM350DeltaThresholdCard.tsx
            ├── BMM350MinPublishIntervalCard.tsx
            ├── BMM350OperationCard.tsx
            └── BMM350SamplingIntervalCard.tsx
```

---

## 2. Convention: `*DataViewer` (DPS / SHT40 / BMM350)

These three sensors use the **same prop shape** for deck cards:

| Prop | Role |
|------|------|
| `sample` | Live sample type (`*LiveSample` from `types/bitstreamWorkspaceTypes.ts`) |
| `samplingIntervalMs` | Shown to `SensorMetricRow` for GSAP-style interpolation hints |
| `collapsed` / `onToggleCollapsed` | Collapsible card header / body |
| `dragHandleSlot` | `TRNDragHandle` passed from `SensorTelemetryDeckView` for sortable deck |

Implementation reference: `DPS368DataViewer.tsx` is the template.

---

## 3. Shared deck card frame types

### 3.1 Where shared types live

Cross-sensor TypeScript contracts for the telemetry deck **belong under `bitstream-app/types/`**, not under `components/` (unless a type is strictly internal to one component file).

`SensorDeckCardFrameProps` and `DPS368DataViewerProps` (etc.) are defined in **`types/sensorDeckCardFrame.ts`** so `DPS368DataViewer`, `SHT40DataViewer`, and `BMM350DataViewer` import from one canonical module alongside `bitstreamWorkspaceTypes.ts` and `sensorConfigAck.ts`.

### 3.2 Goal

Duplicated **deck card frame** props are expressed as a **single base type** so all three `*DataViewer` components document and enforce the same contract.

### 3.3 File

| File | Contents |
|------|----------|
| `types/sensorDeckCardFrame.ts` | `SensorDeckCardFrameProps` (`samplingIntervalMs`, `collapsed`, `onToggleCollapsed`, `dragHandleSlot`) and combined types such as `DPS368DataViewerProps = SensorDeckCardFrameProps & { sample: Dps368LiveSample }` (same pattern for SHT40, BMM350). “Frame” = card shell, not a browser. |

### 3.4 Layout

```
types/
├── bitstreamWorkspaceTypes.ts
├── sensorConfigAck.ts
├── sensorDeckCardFrame.ts
└── sensorTelemetryDeckView.ts    # SensorTelemetryDeckViewProps
```

Imports:

- `components/dps368/DPS368DataViewer.tsx`
- `components/sht40/SHT40DataViewer.tsx`
- `components/bmm350/BMM350DataViewer.tsx`
- `components/telemetry/SensorTelemetryDeckView.tsx`

### 3.5 Implementation checklist (deck card frame — done)

1. Add `types/sensorDeckCardFrame.ts`.
2. Wire the three `*DataViewer` components to use the shared types (no JSX behavior change).
3. Run `npm run compile` in `t3d-extension`.
4. Mention `SensorDeckCardFrameProps` / `types/sensorDeckCardFrame.ts` in `README.md` under **Telemetry deck viewers** — done.
5. Add `types/sensorTelemetryDeckView.ts` (`SensorTelemetryDeckViewProps`) and use it from `SensorTelemetryDeckView.tsx` — done.

---

## 4. BMI270 — why it does not mirror `*DataViewer`

BMI270 deck sections use **multiple** specialized cards (`Bmi270RawGyroDataView`, raw accel/temp, fusion quaternion/Euler, etc.) under `components/bmi270/Bmi270RawDataViews.tsx` and related files. That is **richer** than a single `FooDataViewer.tsx`.

**Recommended convention:**

- DPS / SHT40 / BMM350 → one `*DataViewer.tsx` per sensor under `components/<sensor>/`.
- BMI270 → keep `Bmi270RawDataViews` / fusion views; do **not** force-rename to `DataViewer` unless product naming demands it.

**Optional later refactor (heavy):** `components/bmi270/bmi270TelemetryDeckCardMap.tsx` mapping `SensorTelemetryCardId` → component, to shrink `if (cardId === "gyro")` chains in `SensorTelemetryDeckView.tsx`. Defer until the deck routing becomes hard to maintain.

---

## 5. Related files

| File | Role |
|------|------|
| `components/telemetry/SensorTelemetryDeckView.tsx` | Sortable deck; composes `*DataViewer` and BMI270 views |
| `components/telemetry/SensorMetricRow.tsx` | Wraps **`TRNParameter`** for DPS/SHT/BMM350 rows: value tween, gauge, **`iconPulseOnValueChange`**, fixed **`valueTextColumnClassName`** (e.g. `w-[7ch]`), **`unitColumnClassName`** (e.g. `w-8`). Optional **`iconColorOnIcon`** (BMM350) matches BMI270 tint-on-icon. See **`../../ui/TRN/docs/TRNParameter.md`**. |
| `types/bitstreamWorkspaceTypes.ts` | `*LiveSample` aliases, `SensorTelemetryCardId`, deck order |
| `types/sensorDeckCardFrame.ts` | `SensorDeckCardFrameProps` and `*DataViewer` prop intersections for DPS/SHT/BMM |
| `types/sensorTelemetryDeckView.ts` | `SensorTelemetryDeckViewProps` (samples + per-source `*SamplingIntervalMs`) |

---

## 6. BMI270 — detailed file inventory

BMI270-related code lives in **two** places: shared **non-JSX** helpers under `bitstream-app/bmi270/`, and **UI** under `components/bmi270/`.

### 6.1 `bitstream-app/bmi270/` (logic & constants, no React)

| File | Details |
|------|---------|
| `bmi270SampleCache.ts` | Merges incoming BMI270 live samples with a per-field TTL so UI keeps smooth values when individual fields pause updating. |
| `bmi270TelemetryConstants.ts` | BMI270 numeric field keys, cache TTL table, and related constants used by cache / formatting. |

### 6.2 `components/bmi270/` (React UI)

| File | Details |
|------|---------|
| `BMI270ControlPanel.tsx` | Left settings tab: sortable stack of control cards (operation, **Fusion Feed (BSX)** when output mode is fusion/hybrid — slider **10–100 ms**, sampling, delta, min publish). |
| `types.ts` | Types for the control panel: card IDs, ACK helpers, publish mode, etc. |
| `Bmi270StreamModeSyncEffect.tsx` | Headless effect: once transport is ready and firmware truth is loaded, reconciles BMI270 stream mode with `sensor.bmi270.mode.set` (raw / fusion / hybrid). Renders `null`. |
| `HealthDiagnosticsCard.tsx` | Card showing BMI270-oriented health/diagnostic info from the merged live sample and current publish settings. |
| `Bmi270RawDataViews.tsx` | **Deck exports:** `Bmi270RawGyroDataView`, `Bmi270RawAccelDataView`, `Bmi270RawTemperatureDataView`, `Bmi270FusionQuaternionDataView`, `Bmi270FusionEulerDataView` — each is a sortable `TRNInteractiveCard` used by `SensorTelemetryDeckView`. |
| `Bmi270RawSection.tsx` | Groups raw telemetry rows (uses `Bmi270AnimatedParameter`). |
| `Bmi270AnimatedParameter.tsx` | Single telemetry row: `TRNParameter` + GSAP tween for value + gauge styling (BMI270-specific scales/units). |
| `bmi270AxisTelemetryStyles.ts` | Maps axis-like labels (`gx`, `qx`, `roll`, … and **`mx` / `my` / `mz`** for BMM350, **`tp`** for temperature) to Tailwind text classes and gauge hex colors. |
| `bmi270RawTypes.ts` | Small types for raw section items (e.g. `Bmi270RawSectionItem`). |

#### `components/bmi270/cards/` (shared 4-card pattern with other sensors)

| File | Details |
|------|---------|
| `BMI270OperationCard.tsx` | Enable/disable sensor stream; ACK badge. |
| `BMI270FusionFeedIntervalCard.tsx` | BSX fusion **feed period** (protocol `0x0A`/`0x0B`); UI and store clamp **10–100 ms** to match CM55. |
| `BMI270SamplingIntervalCard.tsx` | Sampling interval slider + presets. |
| `BMI270DeltaThresholdCard.tsx` | Delta threshold (`deltaX100`) for publish gating. |
| `BMI270MinPublishIntervalCard.tsx` | Minimum interval between publishes. |

### 6.4 Sensor Config pane — draft-until-Apply vs immediate apply

The **Sensor Telemetry → Sensor Config** workbench pane (`TelemetryConfigPanel`) treats **all** editable fields as **local drafts** until **Apply**:

| Field group | Wire command | Sensor Config pane | Sensor Studio / other panels |
|-------------|--------------|--------------------|------------------------------|
| Enable, publish mode, sampling, delta, min publish | `SENSOR_CFG_SET` | Draft until Apply | Per-card immediate apply (legacy) |
| Output mode (raw / fusion / hybrid) | `BMI270_MODE_SET` | Draft until Apply (`deferFirmwareApply`) | Immediate via `Bmi270StreamModeSyncEffect` |
| Fusion Feed interval (10–100 ms) | `BMI270_FUSION_FEED_SET` | Draft until Apply | Immediate when handler calls BS2 transport |

Implementation notes:

- **`useBmi270FirmwareExtrasDraftStore`** holds firmware baselines for output mode and fusion feed; **`syncBmi270FirmwareExtrasFromDevice`** runs after SENSOR_CFG cold sync and manual Refresh.
- **`Bmi270StreamModeSyncEffect`** skips auto `BMI270_MODE_SET` while `deferFirmwareApply === true`; Apply runs **`applyBmi270FirmwareExtrasIfDirty`** after dirty SENSOR_CFG rows.
- Full backlog: **`sensor-telemetry/docs/CONFIGURATION_PANE_IMPROVEMENT_PLAN.md`**.

### 6.5 How this maps to the telemetry deck

| Deck card id (`SensorTelemetryCardId`) | Component |
|----------------------------------------|-----------|
| `gyro` | `Bmi270RawGyroDataView` from `Bmi270RawDataViews.tsx` |
| `accel` | `Bmi270RawAccelDataView` |
| `temp` | `Bmi270RawTemperatureDataView` |
| `quat` | `Bmi270FusionQuaternionDataView` |
| `euler` | `Bmi270FusionEulerDataView` |

Composition is wired in `components/telemetry/SensorTelemetryDeckView.tsx` (not via a single `BMI270DataViewer.tsx`).

---

## 7. `SensorMetricRow` → `TRNParameter` (right-panel telemetry)

All DPS368 / SHT40 / BMM350 `*DataViewer` files compose **`SensorMetricRow`**, which forwards to **`TRNParameter`** with a consistent “sensor deck” profile:

| Concern | Approach |
|---------|----------|
| **Value column** | `valueColumnLayout="auto"` + `valueTextColumnClassName` (e.g. **`w-[7ch]`**) so the **gauge** is the main `flex-1` region and numbers align. |
| **Unit column** | `unitColumnClassName` (e.g. **`w-8`**) so units like `rad/s` or `m/s²` do not overlap values. |
| **Icon pulse** | `iconPulseOnValueChange` + `iconPulseTriggerKey={value}` (pulse on sample change, not on every GSAP value frame). |
| **Icon tint (default)** | `iconSlotStyle={{ color: fillColor }}` and `iconSlotClassName="[&_svg]:text-current"` — bar and icon share hex from the DataViewer. |
| **Icon tint (BMM350, BMI270-style)** | `iconColorOnIcon` — **no** `iconSlotStyle`; pass Tailwind `text-*` on the Lucide icon via **`getBmi270AxisColorClass`**, which also includes **`mx` / `my` / `mz` / `tp`** for magnetometer rows. |
| **Short row labels** | e.g. DPS368 **`pr`** / **`tp`**, SHT40 **`hu`** / **`tp`** — saves horizontal space for the gauge (labels remain clarified in **hint** tooltips). |

Full **`TRNParameter`** behavior (GSAP pulse rules, `ch` units, HSL color tween): **`../../ui/TRN/docs/TRNParameter.md`**.

---

## 8. Diagnostics snapshot (left column)

The **Diagnostics Snapshot** card is documented separately — **`DIAGNOSTICS_SNAPSHOT_UI.md`** (store-backed snapshot, **no** manual refresh in the card header, `TRNParameter` grid).
