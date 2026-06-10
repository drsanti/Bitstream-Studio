# Bitstream Telemetry Provider — events (v1)

Envelope for every message:

```json
{
  "type": "bitstream:sample",
  "v": 1,
  "payload": { }
}
```

`v` is always `1` for this document. See [SCHEMA.v1.json](./SCHEMA.v1.json).

---

## R0 — Read events

### `bitstream:catalog`

**Direction:** provider → subscriber  
**When:** on connect; on `bitstream:request` with `what: "catalog"`

Static sensor specifications. Same content as [sensor-catalog.v1.json](./sensor-catalog.v1.json) wrapped in the envelope:

```json
{
  "type": "bitstream:catalog",
  "v": 1,
  "payload": {
    "catalogVersion": "2026-06-10",
    "providerApiVersion": 1,
    "providerWsUrl": "ws://127.0.0.1:9997",
    "sensors": [ ],
    "sharedConfigLimits": {
      "samplingIntervalMs": { "min": 10, "max": 60000 },
      "publishIntervalMs": { "min": 0, "max": 60000 },
      "deltaX100": { "min": 0, "max": 10000 },
      "minPublishIntervalMs": { "min": 0, "max": 60000 },
      "publishModes": ["periodic", "on_change", "hybrid"]
    }
  }
}
```

---

### `bitstream:config`

**Direction:** provider → subscriber  
**When:** on connect; after HELLO; after `SENSOR_CFG` change; sim state update; route change; on request

```json
{
  "type": "bitstream:config",
  "v": 1,
  "payload": {
    "hostMs": 1718034123456,
    "source": "firmware",
    "sensors": {
      "sht40": {
        "enabled": true,
        "publishMode": "hybrid",
        "mask": 3,
        "maskLabels": ["temperatureC", "humidityPct"],
        "samplingIntervalMs": 500,
        "publishIntervalMs": 0,
        "deltaX100": 50,
        "minPublishIntervalMs": 0,
        "expectedRateHz": 2.0
      }
    }
  }
}
```

| Field | Notes |
|-------|--------|
| `source` | `firmware` \| `simulator` \| `draft` (draft only if explicitly labeled) |
| `maskLabels` | Resolved from catalog `maskChannels` + active `mask` |
| `expectedRateHz` | Approximate from `publishIntervalMs` or `samplingIntervalMs` |

**Policy:** push-only on change — no polling interval.

---

### `bitstream:sample`

**Direction:** provider → subscriber  
**When:** each decoded `EVT_SENSOR`

```json
{
  "type": "bitstream:sample",
  "v": 1,
  "payload": {
    "sensor": "sht40",
    "sensorId": 2,
    "counter": 1842,
    "deviceMs": 120450,
    "hostMs": 1718034123456,
    "origin": "uart",
    "mask": 3,
    "fields": {
      "temperatureC": 24.56,
      "humidityPct": 48.2
    },
    "units": {
      "temperatureC": "°C",
      "humidityPct": "%RH"
    }
  }
}
```

| Field | Notes |
|-------|--------|
| `sensor` | Stable string id — prefer over `sensorId` in app code |
| `fields` | Human-scale numbers; keys from catalog |
| `units` | Parallel map for display |
| `mask` | Which channels appear in **this** frame (may be partial) |
| `origin` | `uart` (hardware) or `sim` (simulator) |

Only keys present in the frame appear in `fields`. Use `config.maskLabels` for the full enabled set.

---

### `bitstream:hello`

```json
{
  "type": "bitstream:hello",
  "v": 1,
  "payload": {
    "version": 2,
    "caps": 63,
    "mtuSensor": 256,
    "mtuCtrl": 512,
    "fwTag": "bs2-sim-psoc",
    "hostMs": 1718034000000
  }
}
```

---

### `bitstream:connection`

```json
{
  "type": "bitstream:connection",
  "v": 1,
  "payload": {
    "state": "connected",
    "route": "uart",
    "comOpen": true,
    "providerReady": true
  }
}
```

`route`: `uart` \| `simulator`

---

### `bitstream:stale` (optional)

Per-sensor `staleAfterMs` is defined in **`sensor-catalog.v1.json`** (`sensors[].staleAfterMs`, ~3× default publish interval). The runtime uses that value in the payload below.

```json
{
  "type": "bitstream:stale",
  "v": 1,
  "payload": {
    "sensor": "bmi270",
    "lastHostMs": 1718034123600,
    "staleAfterMs": 500
  }
}
```

---

## Handshake — iframe

### `bitstream:ready`

**Direction:** iframe → parent

```json
{
  "type": "bitstream:ready",
  "v": 1,
  "payload": {
    "clientId": "course-html-block-1"
  }
}
```

Parent responds with `catalog`, `config`, `connection`, then streams `sample`.

---

### `bitstream:request`

**Direction:** subscriber → provider (iframe via parent, or SDK)

```json
{
  "type": "bitstream:request",
  "v": 1,
  "payload": {
    "requestId": "refresh-1",
    "what": "config"
  }
}
```

`what`: `catalog` \| `config` \| `hello` \| `connection`

Provider answers with the matching event (not a generic ack). Use for recovery after hot reload — not for polling loops.

---

## R1 — Command events

### `bitstream:command`

```json
{
  "type": "bitstream:command",
  "v": 1,
  "payload": {
    "requestId": "lab-1",
    "command": "sensor.cfg.get",
    "args": { "sensorId": 2 }
  }
}
```

**v1 allowlist (planned):** `ping`, `caps.get`, `sensor.cfg.get`, `sensor.cfg.set` (restricted), `bmi270.mode.get`, `bmi270.mode.set`

---

### `bitstream:response`

```json
{
  "type": "bitstream:response",
  "v": 1,
  "payload": {
    "requestId": "lab-1",
    "ok": true,
    "command": "sensor.cfg.get",
    "data": {
      "sensor": "sht40",
      "enabled": true,
      "publishMode": "hybrid",
      "mask": 3,
      "samplingIntervalMs": 500,
      "publishIntervalMs": 0,
      "deltaX100": 50,
      "minPublishIntervalMs": 0
    },
    "error": null,
    "hostMs": 1718034123999
  }
}
```

---

## Sensor field keys (stable)

| `sensor` | `fields` keys (subset per mask) |
|----------|----------------------------------|
| `bmi270` | `accelX/Y/Z`, `gyroX/Y/Z`, `temperatureC`, `headingRad`, `pitchRad`, `rollRad`, `quatW/X/Y/Z` |
| `bmm350` | `magX/Y/Z`, `temperatureC` |
| `sht40` | `temperatureC`, `humidityPct` |
| `dps368` | `pressureHpa`, `temperatureC` |

Full min/max and wire scaling: [sensor-catalog.v1.json](./sensor-catalog.v1.json)
