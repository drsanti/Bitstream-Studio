# Bitstream vNext tests (`tests/bitstream2`)

Unit and integration tests for `src/bitstream2/` and the serial bridge protocol types.

Legacy `tests/bitstream/` (v1 magic `0xAA55`, `HostSession`, MCP command API) was removed — those modules are no longer the shipping path.

Run:

```bash
npm run test:bitstream2
```

`npm run test:bitstream` is an alias for `test:bitstream2`.

## Coverage (representative)

| Area | Tests |
|------|--------|
| Framing / router | `bs-framer.test.ts`, golden parity |
| `SENSOR_CFG` encode + coerce | `sensor-config.test.ts` |
| Publish gating / modes | `publish-gate.test.ts`, `firmware-simulator-publish-*.test.ts` |
| Simulator streams | `firmware-simulator-stream.test.ts`, `multi-sensor-stream.test.ts` |
| Sine synthetic payloads | `sensor-synth.test.ts` |
| Telemetry transport (webview) | `tests/bitstream-app/bitstream-telemetry-transport.test.ts` |
| Sensor Hz UI | `tests/bitstream-app/sensor-telemetry-publish-card.test.ts` |

See also `src/bitstream2/docs/SENSOR_CFG_V2.md` §9.1.
