# Bitstream2 Simulator UI

Self-contained webview module for the **host firmware simulator** (no MCU required).

## Layout

| Path | Role |
|------|------|
| `Bitstream2SimulatorApp.tsx` | Shell layout |
| `hooks/useBitstream2SimulatorFeed.ts` | WS subscribe + REQ helpers |
| `components/*` | Firmware params, live sensors, link bar |
| `lib/formatSensorSample.ts` | Decode display for all sensor types |

## Broker topics

- `bitstream2/hello`, `evt/sensor`, `metrics`, `req`/`res`
- `bitstream2/dev/status`, `bitstream2/dev/sim/state` (loopback)
- `bitstream2/dev/sim/control` — `{ mode: "idle" | "run" }` (webview ↔ bridge; pauses mock streams when UART mode is selected)
- `serialport/status`, `firmware/liveness`

Device logic lives in `src/bitstream2/device/` (`BsFirmwareSimulator`, `sensor-synth.ts`).

## Synthetic telemetry

All simulator `EVT_SENSOR` scalars are **sine waves** (`buildSyntheticSensorValues`, ~**0.2 Hz** fundamental, per-channel phase offsets). See `src/bitstream2/docs/SENSOR_CFG_V2.md` §9.1.

The main **Sensor Studio / Bitstream** shell (`?app=bitstream`) uses **`SensorSamplingFrequencyCard`** (sets `samplingIntervalMs` + `publishIntervalMs = 0`). This dashboard can still edit **separate** internal vs telemetry Hz for protocol testing.

## Run

```bash
cd extension
npm run start:bridge   # terminal 1
npm run dev:webview    # terminal 2
```

Open `http://localhost:5173/?app=bitstream`.
