# GLB Animation Lab — operational digital twin

Booth-oriented **machine twin** UI for automation and maintenance storytelling on catalog GLBs (Tesa Drone first).

## What ships today (Phase A–D)

| Piece | Path |
|-------|------|
| Types | `components/animation-lab/digital-twin.types.ts` |
| Catalog parser | `parse-animation-lab-digital-twin.ts` (`digitalTwin` block in model `*_metadata.json`) |
| Clip heuristic fallback | `build-default-drone-digital-twin.ts` (gimbal / wing / camera clip names) |
| Simulated telemetry | `animation-lab-twin-simulator.ts` (1 Hz, demo fault after ~45 s) |
| Live merge (Phase C) | `animation-lab-twin-live.ts` — BS2 `latestByHint` + `liveSourceKey` |
| Maintenance log (Phase D) | `animation-lab-twin-alerts.ts` — threshold crossings with clear timestamps |
| Trends (Phase D) | `animation-lab-twin-trends.ts` + `GlbAnimationLabTwinSparkline.tsx` — 60-sample sparklines |
| Export (Phase D) | `animation-lab-twin-export.ts` — **Copy report** JSON (`bitstream.animation-lab.twin-report` v1) |
| React context | `glb-animation-lab-twin-context.tsx` |
| Sidebar panel | `GlbAnimationLabTwinMachinePanel.tsx` |
| CSS3D tags (Phase B) | `components/animation-lab/css3d/*` — camera sync, anchor positions, billboard tags |

**Data source** (Machine twin header): `simulated` | `mixed` | `live` — from mapped `liveSourceKey` signals when link is connected, handshake passed, and EVT_SENSOR received within 5 s.

### 3D tags (Phase B + polish)

- **Toolbar:** **Tags** toggles CSS3D labels; **Alerts only** filters to caution/warning/fault + selected subsystem.
- Preferences persist in `localStorage` (`animation-lab-persistence.ts`).
- **Alerts only** defaults on when the twin has **6+** subsystems (first visit only).
- **Click tag** → same as sidebar row (clip sync + signal detail).
- Anchors: GLB node match on `glbAnchor` (follows animated bones); semantic fallbacks use a **stable fuselage frame** (propeller/blade meshes excluded from bounds) so camera/gimbal tags do not bob with spinning AABB. Optional **`anchorOffset`** `[x,y,z]` m on the component.
- Pattern reused from `landing/css3d/` (`CSS3DRenderer` + R3F camera snapshot).

### Live telemetry (Phase C)

- Subscribes to **`useBitstreamLiveStore`** (`latestByHint`, `lastAtByHint`) and **`useBitstreamConnectionStore`** (`connected`).
- Per-signal **`liveSourceKey`** (studio allowlist, e.g. `bmi270.temperature`) overrides the simulator when live.
- Special key **`bmi270.accel.magnitude`** — √(ax²+ay²+az²) for vibration-style metrics.
- Stream age uses sensor health fallback thresholds → `caution` / `offline` on stale hints.
- Motor/gimbal keys without `liveSourceKey` stay simulated until MCU mapping exists.

### Maintenance alerts, trends, export (Phase D)

- **Maintenance log** — caution / warning / error threshold crossings per signal; cleared rows stay in the log with timestamps.
- **Trends** — ~60 s sparkline per signal on the selected subsystem (1 Hz twin tick).
- **Copy report** — clipboard JSON with summary, components, alerts, and trend buffers (for CMMS / ticket paste).

### Live sensor mapping (inspector)

Sidebar **Mapping** tab — all subsystems in one scrollable table:

| Column | Purpose |
|--------|---------|
| Card parameter | Twin signal label; tap to set **primary on 3D tag** (● row) |
| Sensor | BMI270, BMM350, SHT40, DPS368, or **Simulated** |
| Sub-parameter | Axis / temperature / pressure / humidity / accel magnitude, etc. |
| Preview | LIVE / SIM / WAIT / STALE + current value |

Operator overrides persist in `localStorage` (`bitstream:animation-lab:twin-mapping:*`). **Copy mapping JSON** exports overrides; metadata `liveSourceKey` remains the shipped default when no override exists.

### 3D tag card tuning (inspector)

Sidebar **Tags** tab (per model, saved in `localStorage`):

| Control | Scope |
|---------|--------|
| Width / min height / 3D scale / fonts | **All tags** (shared) |
| Title | Per subsystem |
| Offset X/Y/Z | Per subsystem (metres) |
| Show health pill | Hide/show OK / caution / fault row |
| Show top signal | Hide/show live value row |
| Visible | Hide card in viewport |
| Custom colors | Fixed border, background, text, muted text (overrides health theme) |

## Metadata

Bundled sidecar (dev / repo mirror):

`extension/src/webview/assets/free/models/tesa-drone/tesa-drone_metadata.json`

Copy beside your catalog GLB as `tesa-drone_metadata.json` (same folder as the `.glb`). Full example:

`extension/docs/examples/tesa-drone_animation-lab-metadata.example.json`

```json
{
  "animationLab": { },
  "digitalTwin": {
    "assetId": "tesa-drone",
    "components": [
      {
        "id": "imu",
        "label": "Flight IMU",
        "group": "Sensors",
        "signals": [
          {
            "key": "imu.temp_c",
            "label": "Die temperature",
            "unit": "°C",
            "warn": 70,
            "alarm": 85,
            "liveSourceKey": "bmi270.temperature"
          }
        ]
      }
    ]
  }
}
```

- **`glbAnchor`:** GLB animation clip name — selects that clip in step 3 when the operator picks the subsystem.
- **`liveSourceKey`:** BS2 studio source key when Bitstream or Simulator telemetry is streaming.
- **`anchorOffset`:** optional world-space tag nudge in metres.
- **`warn` / `alarm`:** drive health pills (`ok` → `caution` → `warning` → `error`).
- **`direction: "below"`:** lower is worse (e.g. RF link dBm).

Without metadata, models with multiple gimbal/wing/camera clips get an **inferred** twin map automatically.

## Operator flow

1. Open Telemetry workbench → GLB Animation Lab with Tesa Drone (or similar).
2. **Machine twin** panel shows overall status and grouped subsystems.
3. Connect **Bitstream** or **Simulator** → IMU signals with `liveSourceKey` show **Live** or **Mixed**.
4. Tap a subsystem → step 3 clip syncs (if `glbAnchor` set); enable **Tags** on the viewport for 3D callouts.
5. Press **Play** → simulated load rises on the active / stressed subsystem (unmapped signals).
6. After ~45 s demo runtime, a propulsion fault may appear on simulated motor channels.

## Phases (planned)

| Phase | Scope |
|-------|--------|
| **A** (done) | Sidebar twin + simulator + metadata + clip sync |
| **B** (done) | CSS3D tags on anchors |
| **C** (done) | BS2 live signals + stale/offline + dual-runtime ingest |
| **D** (done) | Maintenance log, signal trends, JSON export |

## Related

- `GLB_ANIMATION_LAB.md` — animation playback modes
- `ANIMATION_LAB_CATALOG_METADATA.md` — `animationLab` block
- `GLB_ANIMATION_LAB_SMOKE.md` — manual twin smoke
- `TELEMETRY_MODE_LIFECYCLE.md` — UART vs simulator
