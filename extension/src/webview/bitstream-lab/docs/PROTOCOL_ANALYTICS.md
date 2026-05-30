# Bitstream Lab — protocol analytics design

**Agent handoff:** See **`RUNBOOK.md`** (phase **6** implementation spec).

Analyze **BS-framed UART protocol** quality: wire envelopes, per-type frame rates, and link health. Complements **Topic Tap** (raw broker JSON) and **BS2 Smoke** (manual ping).

Spec: `t3d-extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md`  
Types: `src/bitstream2/protocol/types.ts` (`BS_TYPE.*`)  
Decoder: `src/bitstream2/framing/bs-framer.ts`, `src/bitstream2/runtime/uart-decode.ts`  
Bridge metrics today: `bitstream2/metrics` (`Bitstream2MetricsPayload` in `bridge/protocol.ts`) — **aggregate only** (no per-type counts yet).

---

## Goals

| Goal | User question |
|------|----------------|
| **Frame inspector** | What did the last frames look like on the wire (hex + parsed TYPE/LEN/payload)? |
| **Frame rate** | What is the **actual Hz** per `BS_TYPE` (and per `sensorId` for `EVT_SENSOR`)? |
| **Link quality** | Is the stream healthy (CRC, resync, gaps, stale HELLO, rate vs target)? |

---

## UI placement (recommended)

**One workbench pane** `protocol` → **`ProtocolAnalyticsPanel`** with internal **TRNTabs** (keeps registry at **8 panes**, not 11):

```text
┌─ Protocol Analytics ──────────────────── [▾] [⫿] [⫾] [×] ─┐
│ [ Frames ] [ Rates ] [ Quality ]                            │
├─────────────────────────────────────────────────────────────┤
│  (active sub-view — see wireframes below)                   │
└─────────────────────────────────────────────────────────────┘
```

Power users can **split** the workbench and open a second `protocol` pane on **Rates** only (workbench dropdown still switches whole panel — optional future: deep-link `?labTab=protocol:rates`).

### Sub-view: **Frames**

```text
│ Capture: (•) Decoded events  ( ) Wire (dev)   Window [ 30s ▾] │
│ Filter TYPE [ all ▾ ]   [ Pause ] [ Clear ] [ Export CSV ]    │
├──────────────────┬──────────────────────────────────────────┤
│ 12:01:02.441     │ BS 42 53 20  LEN=24  TYPE=0x04 EVT_SENSOR │
│ EVT_SENSOR 24B   │ 0000: 42 53 20 18 00 04 ...  CRC OK  CRLF │
│ 12:01:02.491     │ Parsed: sensorId=1 mask=0x07 counter=8842 │
│ RES 8B           │ values: [0.12, -0.04, ...]               │
│ … (ring 100)     │ [ Copy hex ] [ Copy JSON ]               │
└──────────────────┴──────────────────────────────────────────┘
```

### Sub-view: **Rates**

```text
│ Window: [ 3s ▾ ]  [ 10s ]  [ 30s ]     UART: 42.1 kB/s       │
├─────────────────────────────────────────────────────────────┤
│ BS frame types (wire or decoded — see data sources)         │
│ TYPE     Name          Δframes   Hz(win)  Hz(10s avg)  %bytes│
│ 0x01     HELLO               1      0.0        0.0         0% │
│ 0x02     REQ                 4      0.4        0.3         1% │
│ 0x03     RES                 4      0.4        0.3         1% │
│ 0x04     EVT_SENSOR        600     20.0       19.8        92% │
│ 0x05     EVT_STATUS          0      0.0        0.0         0% │
│ 0x06     EVT_DIAG            0      0.0        0.0         0% │
├─────────────────────────────────────────────────────────────┤
│ EVT_SENSOR by sensorId                                        │
│ id   name     Hz(10s)  counter Δ   gaps   target   pass     │
│  0   BMI270   20.1     +201        0      20 Hz    ✓        │
│  1   BMM350   19.7     +197        1      20 Hz    ⚠        │
└─────────────────────────────────────────────────────────────┘
```

### Sub-view: **Quality**

```text
│ Scorecard (window 10s)                    Overall: ● Good    │
├─────────────────────────────────────────────────────────────┤
│ Framing    CRC fail 0.00%   resync 12 B/s   lenReject 0     │
│ Link       HELLO age 1.2s   last frame 14ms ago             │
│ Control    PING p50 18ms p95 32ms   RES error 0%            │
│ Streams    4/4 sensors in band (±10%)   decode err 0        │
├─────────────────────────────────────────────────────────────┤
│ Sparklines (60s):  EVT_SENSOR Hz │ CRC/s │ uart kB/s         │
│ Alerts:                                                            │
│   ⚠ BMM350 counter gap +3 at 12:01:05                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data sources (phased)

### Phase A — Webview-only (no bridge change)

Use broker JSON the bridge **already** publishes:

| Signal | Topic / hook | Used for |
|--------|----------------|----------|
| Aggregate framer stats | `bitstream2/metrics` (1 Hz deltas) | CRC%, resync pressure, `uartBytesIn` rate |
| HELLO | `bitstream2/hello` | Link presence, version/caps |
| Sensor samples | `bitstream2/evt/sensor` | **EVT_SENSOR Hz** per `sensorId`, **counter gap** detection |
| Status / diag | `bitstream2/evt/status`, `bitstream2/evt/diag` | Type Hz (if firmware sends) |
| Host RES | `bitstream2/res` | **RES Hz**, REQ/RES latency if Lab issued REQ |
| REQ | Lab local only | Count when Publish / Ping sends REQ |

**Limits of Phase A:**

- No **REQ** frames counted from wire unless bridge echoes them (usually host→UART only).
- **Frame inspector** shows **decoded events** (reconstructed logical frame), not guaranteed full wire bytes unless payload includes full envelope.
- Per-type Hz for rare types (`EVT_STATUS`, `EVT_DIAG`) only when firmware publishes them.

Implementation: `hooks/useLabProtocolAnalytics.ts` + `lib/protocol-window.ts` (sliding window counters).

### Phase B — Bridge metrics extension (recommended for true wire rates)

Extend `BsFramerStats` / `Bitstream2MetricsPayload`:

```ts
// bridge/protocol.ts (additive)
framesOkByType?: Partial<Record<number, number>>;  // keys 0x01..0x06
lastFrameTypeAtMs?: Partial<Record<number, number>>;
```

Update `BsFramer` on each accepted frame: `framesOkByType[type]++`. Bridge publishes in existing 1 Hz `bitstream2/metrics` tick.

Lab **Rates** table prefers `framesOkByType` deltas when present; falls back to Phase A.

### Phase C — Wire capture (frame hex)

Pick one (dev-first):

| Option | Description |
|--------|-------------|
| **C1** | Bridge publishes `bitstream2/dev/frame` `{ wireB64, type, len, atMs }` for last N accepted frames (ring 100). |
| **C2** | Bridge enables `serialport/data-priority` per reconstructed frame (documented in `serialport-bridge/protocol.ts` but not wired in `SerialPortWebSocketBridge.ts` today). |
| **C3** | Lab subscribes `serialport/data` binary and runs **`BsUartDecoder` in webview** (duplicate decode — only for bring-up; avoid in production UI). |

**Recommendation:** **C1** for Lab; keeps single decode path on bridge.

---

## Analytics engine (lab-local)

```
bitstream-lab/lib/
  protocol-window.ts      # SlidingWindowCounter, hzFromDeltas
  protocol-frame-record.ts # LabFrameRecord type
  protocol-quality.ts     # thresholds, scorecard, alerts
  parse-frame-display.ts  # validateBsEnvelope + routeFrame → field summary
```

### `LabFrameRecord` (ring buffer ~100)

```ts
type LabFrameRecord = {
  id: string;
  atMs: number;
  source: "decoded" | "wire";
  bsType: number;
  typeName: string;       // HELLO | REQ | …
  len: number;
  wireHex?: string;       // Phase C
  parseSummary?: string;  // human one-liner
  payloadPreview?: unknown;
  crcOk: boolean;
};
```

### Rate math

- **Window Hz** = `count(type in window) / windowSec`
- **EMA Hz (10s)** = exponential moving average of per-second counts
- **UART throughput** = `ΔuartBytesIn / Δt` from metrics
- **Sensor target Hz** — user field in Quality tab (default 20) or read from last `SENSOR_CFG` if Lab adds cfg read later

### Quality checks (configurable thresholds)

| Check | Input | Warn / fail |
|-------|--------|-------------|
| CRC error rate | `ΔframesCrcFail / Δ(framesOk+framesCrcFail)` | >0.1% warn, >1% fail |
| Resync load | `ΔresyncByteSkips / ΔuartBytesIn` | >0.5% warn |
| HELLO stale | now − last hello `atMs` | >30s fail |
| Frame idle | now − `lastFrameAtMs` | >2s warn while streaming expected |
| Counter gap | `evt.sensor.counter` jump >1 | warn per sensor |
| Rate band | measured Hz vs target | ±10% pass (reuse monitor rate logic) |
| RES timeout | Lab REQ without RES in 2s | fail control plane |

Alerts append to **Activity Log** (`appendActivity`) with tone `warning` / `error`.

---

## Hook API sketch

```ts
// hooks/useLabProtocolAnalytics.ts
export type LabProtocolAnalytics = {
  frames: LabFrameRecord[];
  ratesByType: Record<number, TypeRateRow>;
  ratesBySensorId: Record<number, SensorRateRow>;
  quality: QualityScorecard;
  sparklineSeries: { sensorHz: number[]; crcPerSec: number[]; kbps: number[] };
  ingestMetrics: (p: Bitstream2MetricsPayload) => void;
  ingestSensor: (p: Bitstream2SensorSamplePayload) => void;
  ingestRes: (p: Bitstream2HostResPayload) => void;
  // … hello, status, diag
  reset: () => void;
};
```

Subscribe once in `useLabBroker` or dedicated listener `bitstream-lab-protocol`.

---

## Isolation rules

- **Allowed imports:** `bitstream2/protocol/*`, `bitstream2/framing/*`, `bitstream2/runtime/router.ts`, `bridge/protocol.ts` types — same as CLI/tests.
- **Do not** import `bitstream-app` or `HostSession`.
- Bridge changes (Phase B/C) live in `src/bitstream2` + `serialport-bridge` — document in PR; Lab only consumes new fields when present.

---

## Registry update

| `editorType` | Component |
|--------------|-----------|
| `protocol` | `ProtocolAnalyticsPanel` (Frames / Rates / Quality) |

Default layout: add **protocol** pane (e.g. right column above Loopback|Publishing) or replace **BS2 Smoke** bottom split — tune in `default-lab-workbench-layout.ts`.

**Pane count:** **8** workbench + 2 chrome = **10** regions.

---

## Implementation phases

| Phase | Work |
|-------|------|
| **P1** | `useLabProtocolAnalytics` + Rates + Quality from metrics + `evt/sensor` + `res` (Phase A) |
| **P2** | Frames sub-view (decoded event list + parse summary via `parse-frame-display.ts`) |
| **P3** | Bridge `framesOkByType` (Phase B) + Rates wire column |
| **P4** | `bitstream2/dev/frame` or `data-priority` (Phase C) + hex inspector |
| **P5** | CSV export, alert presets, optional soak script link to `bs2-sensor-control-monitor` |

---

## Testing

- [ ] Loopback: EVT_SENSOR Hz ~ configured sim rate; CRC fail stays 0.
- [ ] Inject corrupt byte via dev tools: `framesCrcFail` rises, Quality CRC chip warns.
- [ ] Counter gap: pause sim → gap detected on resume.
- [ ] With Phase B firmware build: per-type counts match manual frame tally from tap.

---

## Related tools

| Tool | Overlap |
|------|---------|
| `bs2-sensor-control-monitor` MonitorRateCheckTool | Soak + pass/fail one sensor — Lab shows **live** rates all types |
| `bitstream2/dev/run-uart-probe.ts` | CLI gate — Lab is interactive dashboard |
| Topic Tap | All topics — Protocol is **structured** BS analytics |
