# Sensor Studio — audio nodes (microphone, waveform, generator, output)

**Status:** In progress (v0.1 prototype implemented; doc kept as a living plan).

**Goal:** Add an **audio mini-domain** to Sensor Studio that supports:

- **Microphone input** (permission-gated) with stable **scalar feature outputs**
- **Waveform + spectrum visualization**
- **Audio generators** (for testing and creative control)
- **Audio output** (safe, gated playback)

This plan is designed to fit today’s Sensor Studio graph model (typed pins + catalog-driven nodes) without forcing raw audio buffers through the flow store.

**Related:** [`FLOW_DOMAINS.md`](./FLOW_DOMAINS.md) (domain split + tick sources), [`SENSOR_STUDIO_NODE_UI_RULES.md`](./SENSOR_STUDIO_NODE_UI_RULES.md) (node + inspector conventions).

---

## Non-goals (v0.1)

- A full modular synthesizer with arbitrary audio-rate wiring over the flow graph
- Passing `Float32Array` / PCM buffers through flow pins or persistence JSON
- DAW-like timeline editing, multitrack, or clip arrangements
- Full “oscilloscope instrument” semantics (timebase, trigger, ms/div) in v0.1

---

## Constraints (webview reality)

1. **User gesture required**: Web Audio often requires a click/tap to start `AudioContext`.
2. **Permission UX**: `getUserMedia({ audio: true })` prompts; failure must be a first-class state.
3. **Performance**: Visualizations should render via `<canvas>` and refs; avoid per-frame React state churn.
4. **VS Code webview**: Chromium-based, but treat lifecycle (suspend/resume when hidden) as normal.
5. **Safety**: Output nodes must include a limiter / conservative defaults to prevent loud playback.

---

## Dependency plan

### Step 0 (baseline): no new dependencies

Use **Web Audio API** + `<canvas>` drawing.

- **Capture**: `navigator.mediaDevices.getUserMedia`, `MediaStreamAudioSourceNode`
- **Synthesis**: `OscillatorNode`, `AudioBufferSourceNode` (for file playback later)
- **DSP**: `GainNode`, `BiquadFilterNode`, `DynamicsCompressorNode` (limiter-ish)
- **Analysis**: `AnalyserNode` (`getByteTimeDomainData`, `getByteFrequencyData`)

This is the recommended default for v0.1 because it:

- keeps bundle size small
- works in Vite dev + VSIX
- supports mic, generator, scope, and output without additional libraries

### Step 1 (optional): `uPlot`

Add `uPlot` when we want **very smooth scrolling time-series charts** for scalar features
(RMS / peak / centroid / bands) beyond the existing Plotter.

### Step 2 (optional): `wavesurfer.js`

Add `wavesurfer.js` when requirements include **loading audio files** with:

- waveform rendering + zoom
- region selection, markers
- scrub/seek UI

### Step 3 (optional): `tone`

Add **Tone.js** when we want “musical” features quickly:

- envelopes (ADSR), LFOs
- scheduling / transport
- higher-level synth + FX building blocks

### Step 4 (future): `AudioWorklet` (no dependency)

Use `AudioWorklet` for custom DSP when we have a proven need:

- pitch detection, custom filters
- custom metering, resampling
- specialized feature extraction

---

## Architecture: scalar-first + shared audio runtime

### Why scalar-first

Sensor Studio’s current port types and live previews are excellent for:

- `number`, `boolean`, `string`
- small structured types (e.g. `vector3`, `quaternion`)

Audio-rate signals are not a good fit for flow persistence or tick semantics.
Instead, we:

- expose **scalar features** (numbers) through pins
- keep the true audio stream inside a **shared audio runtime** keyed by node ids

### Shared runtime concept (implementation detail)

Create a lightweight “audio runtime” module that owns:

- singleton `AudioContext` lifecycle
- mic stream acquisition + device selection
- analyser buffers for nodes that need them (scope / features)
- safe output chain (master gain + limiter)

Nodes connect to this runtime by **node id** and a small config object.

---

## Node catalog (proposed v0.1 set)

All node ids, ports, and default configs live in:
`extension/src/webview/sensor-studio/config/node-catalog.config.ts`.

### 1) `mic-input` (category: `audio`)

**Purpose:** Provide a live mic source and scalar audio features for graph wiring.

**Outputs (all `number`):**

- `rms` — 0..1 loudness (stable)
- `peak` — 0..1 peak hold
- `zcr` — 0..1 zero-crossing rate (noise-ish vs tonal-ish)
- `centroidHz` — spectral centroid in Hz (brightness)
- `low` / `mid` / `high` — energy bands (optional in v0.1; still numbers)

**Optional outputs (`boolean`):**

- `active` — mic stream running
- `clipped` — detected clipping (if we implement)

**Default config (v0.1):**

- `deviceId`: `"default"` (string)
- `fftSize`: `2048` (number)
- `smoothing`: `0.8` (number 0..1)
- `gateEnabled`: `false`
- `gateThreshold`: `0.02`
- `peakHoldMs`: `150`

**Inspector settings:**

- Device select (TRNSelect)
- Gate controls (compact toggles + scrub inputs)
- FFT size + smoothing

**UI notes:**

- The card should show a small status row (“Click to enable mic”, “Denied”, “Active”).
- Scalar outputs should follow Policy A socket previews (already supported).

### 2) `audio-oscillator` (category: `audio`)

**Purpose:** Provide a test signal source and basic synthesis without requiring mic permissions.

**Inputs:**

- `freqHz` (`number`) — default 440
- `gain` (`number`) — default 0 (safe)
- `gate` (`boolean`) — default false

**Outputs (v0.1):**

- `level` (`number`) — estimated output level (for graph-only wiring)

**Default config (v0.1):**

- `waveform`: `"sine"` (`"sine" | "square" | "sawtooth" | "triangle"`)
- `detuneCents`: `0`
- `freqHz`: `440`
- `gain`: `0` (safe)
- `gate`: `false`
- `sweepEnabled`: `false` (when true and `freqHz` pin is unwired, sweep between start/end)
- `sweepStartHz`: `220`
- `sweepEndHz`: `880`
- `sweepPeriodS`: `4` (seconds for a full up+down cycle)

**Inspector settings:**

- Waveform select
- Detune scrub
- Optional sweep controls (start/end/period)

**Card panel:** Waveform, freq, gain, gate, and sweep controls (all usable without wiring).

### 3) `audio-output` (category: `output`)

**Purpose:** Play audio to the device output with safe gating.

**Inputs (v0.1):**

- `gain` (`number`) — master volume (0..1)
- `gate` (`boolean`) — play enable

**Default config (v0.1):**

- `limiterEnabled`: `true`
- `maxGain`: `0.25` (safety cap)
- `requiresUserGesture`: `true`

**Notes:**

- v0.1 uses **config-based routing** (not pins): Audio Output picks a source node (Auto / Node / None)
  and mutes all other sources to avoid “stuck on” audio.
- Sources supported in v0.1: **Microphone**, **Oscillator**, **Audio file player**.
- **Panic mute:** Use **Mute all audio** button(s) or press **`M`** to immediately silence.

### 4) `audio-scope` (category: `output`)

**Purpose:** Visualize waveform + spectrum (time/frequency).

**Inputs (v0.1 minimal):**

- `enabled` (`boolean`) — draw when true

**Default config (v0.1):**

- `mode`: `"waveform"` (`"waveform" | "spectrum" | "both"`)
- `fps`: `30` (target draw rate)
- `fftSize`: `2048`
- `smoothing`: `0.8`

**UI notes:**

- Render using `<canvas>` inside the card body.
- Avoid storing per-frame arrays in the flow store; read directly from the analyser.
- Scope source selection respects **Auto / Node / None** and supports **mic / osc / file**.

---

## Implemented v0.1 notes (current behavior)

### Routing (Audio Output)

- Audio routing is **not** represented by wires yet.
- Audio Output selects exactly one source and applies:
  - master `gain` + `maxGain` safety cap
  - master limiter (optional)
  - per-source monitor gain (0/1) to ensure only the chosen source is audible

### Safety + shortcuts

- **Mute all audio** is available:
  - Canvas Inspector → Flow tab → Audio safety
  - Audio Output card + Inspector section
  - Keyboard shortcut: **`M`**

### Oscillator sweep

- Sweep only applies when the `freqHz` input pin is **unwired**.
- If a `freqHz` value is wired, it overrides sweep.
- Inspector **Sweep** section adds **curve** (`linear` / `log`), **direction** (`up` / `down` / `up-down`), and **mode** (`loop` / `once`).

### Audio SFX (`audio-sfx`)

- One-shot Web Audio presets: riser, downer, siren, beep, noise burst.
- **Trigger** pin (boolean edge) + card **Fire** preview.
- Exposes **`audioBus`** output for scope/output wiring.
- Scope monitor picker lists SFX nodes; idle message: “SFX idle — fire Trigger”.

### Audio Machine (`audio-machine`) — v0.2a

- Continuous procedural motor sounds driven by **Speed** (0..1) and **Load** (0..1).
- **Motor** family presets: Servo, CNC spindle, EV motor (Engine / Drone / Machine families planned).
- Layered runtime: whine + harmonics + torque ripple + noise (`studio-audio-runtime.ts`).
- Pins: `speed`, `load`, `gain` in; `active`, `level`, `audio` out.
- Design doc: [`AUDIO_MACHINE_SOUND_DESIGN.md`](./AUDIO_MACHINE_SOUND_DESIGN.md).

---

## Phased implementation plan

### Phase A — foundation (no new deps)

**Deliverable:** audio runtime + first nodes usable in dev + VSIX.

- Add `mic-input` with scalar outputs (`rms`, `peak` initially; expand to `centroidHz` later).
- Add `audio-oscillator` (simple oscillator + gain + gate).
- Add `audio-output` with safe master gain + limiter; explicit “click to enable audio” UX.
- Add `audio-scope` canvas visualization (waveform first; spectrum next).

**Testing (manual):**

- Dev (Vite): `mic-input` permission flow; oscillator → output; scope draws.
- VSIX: same behaviors (user gesture + permission + lifecycle).

### Phase B — scalar UX + charting

- Decide whether the existing `plotter` node is sufficient for feature charts.
- If we need higher-fidelity scrolling charts, add `uPlot` and create an `audio-feature-plot`
  node (or enhance `plotter` only if it stays domain-agnostic).

### Phase C — audio file workflows

- Add optional `wavesurfer.js` and an `audio-file-player` node:
  - file load (URL or asset reference)
  - play/pause/seek
  - loop regions
  - outputs scalar features (rms/peak) and transport state (playing, time)

### Phase D — richer synthesis

- Add optional `tone` and implement:
  - ADSR envelope node
  - LFO node
  - basic FX nodes (filter/delay/reverb-lite)

### Phase E — true audio wiring (future)

Introduce a dedicated port type (conceptually):

- `audioBus` (or `audioNodeRef`) — a lightweight id/reference into the audio runtime graph.

This enables filter/mix chains without pushing buffers through pins.

#### Design goal (graph correctness)

- If audio is audible, there should be a **graph-visible reason** (an explicit audio edge),
  not only a hidden runtime selection.

#### v0.2 model (in progress)

- **Sources** (`mic-input`, `audio-oscillator`, `audio-file-player`, `audio-sfx`, `audio-machine`) expose an **`audioBus` output**.
- **Sinks** (`audio-output`, `audio-scope`) accept an **`audioBus` input**.
- When an `audioBus` input is wired:
  - **Monitor mode** in the Inspector is **disabled / ignored**
  - wiring is the single source of truth for routing
- **Monitor mode** (Inspector only, off by default): explicit opt-in preview when no `audio` wire is present.
  - `monitorModeEnabled` + `sourceMode` (`auto` / `node` / `none`)
  - Legacy graphs without `monitorModeEnabled` still honor non-`none` `sourceMode` until edited.
- Demo templates pre-wire **`audio`** edges (mic/osc/file → scope + output).

---

## Open design decisions

1. **Audio routing model (v0.1 vs v0.2)**:
   - v0.1: fixed internal routing (oscillator/mic → output) controlled by node configs
   - v0.2: introduce `audioBus` to wire sources → effects → output
2. **Scope data source**:
   - dedicated analyser per scope node vs shared analyser per source (v0.1 uses per-source analysers)
3. **Feature extraction**:
   - compute in JS using analyser bins vs `AudioWorklet` for accuracy/perf

---

## Acceptance criteria (v0.1)

- `mic-input` can be enabled/disabled and surfaces clear states (idle, requesting, denied, active).
- Scalar pins update and can drive existing numeric nodes (math/compare/plotter/etc.).
- `audio-oscillator` provides a stable test signal and can be gated.
- `audio-output` is safe by default (cap + limiter) and obeys user gesture constraints.
- `audio-scope` renders waveform (and optionally spectrum) without degrading editor performance.

## Acceptance criteria (v0.2 — explicit audio wiring)

- `audioBus` port type exists in catalog/types/schema and can be connected in the editor.
- `audio-output` does not produce audible sound unless an audio source is explicitly connected (or Monitor mode is explicitly enabled).
- Scope can visualize the wired `audioBus` without relying on master-only routing.

