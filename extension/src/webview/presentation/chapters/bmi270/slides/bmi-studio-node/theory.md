## BMI270 in Sensor Studio

Sensor Studio evaluates a **flow graph** of nodes against the same live BS2 stream as Sensor Telemetry and Presentation.

## BMI270 node outputs

| Port | Type | Source field (conceptual) |
|------|------|---------------------------|
| Accel | vector3 | Tri-axis specific force |
| Gyro | vector3 | Tri-axis $\omega$ |
| Euler | vector3 | heading, pitch, roll |
| Quaternion | quaternion | fused attitude |
| Temperature | number | die temperature |
| Samples | number | frame counter / rate hint |

## Tap nodes

Lightweight **tap** nodes expose a single output (e.g. **Quaternion tap**, **Gyroscope tap**) when a flow only needs one stream — avoids wiring unused ports.

## Shared decode path

Presentation, Telemetry, and Studio all read **`useBitstreamLiveStore`** — one broker subscription, one host decode stack. Do not duplicate `decodeBmi270Values` in slide code.

## Typical flows

```text
BMI270 → Dashboard gauge (accel Z)
BMI270 → Math → Stage (orientation drive)
Quaternion tap → 3D rotation preview
```

## Hands-on

1. Open **Sensor Studio** workspace
2. Add **BMI270** source node (or tap)
3. Wire to **Dashboard** widget or **Stage** scene input
4. Run with **Bitstream** or **Simulator** telemetry mode

## Related docs

- Node catalog: `extension/src/webview/sensor-studio/config/node-catalog.config.ts`
- Flow domains: `extension/src/webview/sensor-studio/docs/FLOW_DOMAINS.md`
