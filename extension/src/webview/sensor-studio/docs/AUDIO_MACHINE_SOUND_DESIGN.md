# Sensor Studio — Audio Machine (procedural mechanical sounds)

**Status:** v0.2c shipped — **Motor**, **Engine**, **Drone**, and **Industrial** families + **Speed** / **Trigger** pins; RPM + Map Range demo templates.  
**Related:** [`AUDIO_NODES_REQUIREMENTS_AND_PLAN.md`](./AUDIO_NODES_REQUIREMENTS_AND_PLAN.md), [`SENSOR_STUDIO_NODE_UI_RULES.md`](./SENSOR_STUDIO_NODE_UI_RULES.md).

## Goal

Add **continuous, modulated** mechanical audio for telemetry demos: engines, drones, electric motors, and industrial machines — without passing PCM buffers through flow pins.

| Node | Role |
|------|------|
| **Audio SFX** | Short **one-shot** events (beeps, risers, alarms) |
| **Audio Machine** | **Continuous** layered synthesis driven by **Speed** / **Load** scalars |

## Non-goals (v0.2)

- Full modular synth with audio-rate graph wiring
- Large WAV libraries in the VSIX
- DAW timeline / multitrack
- Stereo spatialization (backlog v0.5)

## Node: `audio-machine`

### Graph pins

| Pin | Type | Role |
|-----|------|------|
| **Speed** | number | Primary drive 0..1 (or RPM when `speedUnit` = `rpm`) |
| **Load** | number | Optional — brightness, roughness, harmonic stress |
| **Gain** | number | Level when unwired |
| **Audio** (out) | audioBus | Route to Output / Scope |
| **Level** (out) | number | Estimated output level |
| **Active** (out) | boolean | Sound engine running |

### UI

- **Card:** family, preset, speed scrub, enable
- **Inspector:** family-specific sections (dynamic, like gauge zones)
- Wired **Speed** / **Load** → override hint; no info-only Outputs cards

### Runtime

Layer stack in `studio-audio-runtime.ts`:

```
[Noise] ─┐
[Whine osc] ─┼─> [Filter/EQ] ─> [Gain] ─> [Analyser] ─> Audio bus
[Harmonic] ─┘
```

Scalars update oscillator frequency and noise mix each simulation tick (not per-sample React state).

## Sound families

### Motor (v0.2a — shipped first)

Electric whine + optional ripple + light bearing noise.

| Preset | Character |
|--------|-----------|
| **Servo** | Soft sweep, moderate ripple |
| **CNC spindle** | High band, strong harmonics |
| **EV motor** | Clean low whine |

**Params:** whine base/span Hz, harmonic mix, ripple mix, noise mix, gain.

### Drone (v0.2b — shipped)

Multi-osc motor whine + blade wash. Presets: Quad (small), Hex (cine), Racing quad.

**Params:** motor base/span Hz, detune cents, wash mix, gain.

### Engine (v0.2b — shipped)

Rumble + firing pulses + optional turbo. Presets: Inline-4, V6, Diesel.

**Params:** rumble base/span Hz, cylinders, roughness, turbo mix, gain.

### Industrial (v0.2c — shipped, family id `machine`)

Rhythmic cycle tone + friction noise + clanks on **Trigger** (rising edge).

| Preset | Character |
|--------|-----------|
| **Conveyor** | Low belt rhythm + roller friction |
| **Lathe** | Faster spindle cycle |
| **Press** | Slow strokes, strong clank |

**Params:** cycle base/span Hz, friction mix, clank mix, gain.

## Telemetry wiring (target demo)

```
Sensor / Sine / Map Range → Audio Machine.Speed
Audio Machine.Audio → Audio Output
Threshold → Audio SFX.Trigger  (fault beep)
```

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **0.2a** | `audio-machine` node, Motor presets, Speed pin, runtime layers, tests |
| **0.2b** | Drone + Engine families + RPM demo template |
| **0.2c** | Industrial family + Trigger clank + Map Range demo template |
| **0.3** | Preset hint copy, preset export/import JSON (inspector Preset I/O), fault-lab demo template |
| **0.4** | Optional hybrid sample layers |
| **0.5** | Filter-cutoff modulation, stereo width |

## Files

| Area | Path |
|------|------|
| Presets / families | `core/audio/audio-machine-config.ts` |
| Speed → Hz mapping | `core/audio/audio-machine-speed.ts` |
| Web Audio graph | `core/audio/studio-audio-runtime.ts` |
| Card + inspector | `nodes/audio/`, `AudioSettingsSections.tsx` |
| Simulation tick | `store/flow-editor.store.ts` |
