# Bitstream Telemetry Provider — recipes

Copy-paste patterns for common UI tasks. **Field keys and ranges come from [sensor-catalog.v1.json](./sensor-catalog.v1.json)** — do not invent them.

For Course Studio HTML blocks, combine these with [IFRAME.md](./IFRAME.md).

| Example | Sensor / field |
|---------|----------------|
| [gyro-x-progress-bar.html](./EXAMPLES/gyro-x-progress-bar.html) | BMI270 `gyroX` |
| [sht40-humidity-progress-bar.html](./EXAMPLES/sht40-humidity-progress-bar.html) | SHT40 `humidityPct` |
| [dps368-pressure-progress-bar.html](./EXAMPLES/dps368-pressure-progress-bar.html) | DPS368 `pressureHpa` |

---

## Recipe 1 — Progress bar 0–100% from a catalog field

**User prompt example:** “Single-file HTML progress bar for gyroscope X axis, 0% at min, 100% at max.”

### Step 1 — Resolve catalog field (not user nicknames)

| User may say | Catalog `key` | Sensor `id` |
|--------------|---------------|-------------|
| gx, gyro x, gyroscope x | **`gyroX`** | `bmi270` |
| gy | `gyroY` | `bmi270` |
| gz | `gyroZ` | `bmi270` |

Full alias table: [SENSOR_CATALOG.md § Field aliases](./SENSOR_CATALOG.md#field-aliases-user-names--catalog-keys).

### Step 2 — Choose display range (three kinds)

See [SENSOR_CATALOG.md § Range types](./SENSOR_CATALOG.md#range-types-for-gauges-and-bars).

**Default for progress bars:** use `fields[].min` and `fields[].max` from catalog (or from runtime `bitstream:catalog`).

For **BMI270 `gyroX`** (from `sensor-catalog.v1.json`):

| Property | Value |
|----------|--------|
| Unit | rad/s |
| `displayMin` | **-5** |
| `displayMax` | **5** |

**Bitstream note:** On hardware, BMI270 may ship without gyro in the active mask. The [gyro example](./EXAMPLES/gyro-x-progress-bar.html) auto-sends R1 commands when `gyroX` is missing from `bitstream:config` → `bmi270.mode.set` **raw** + `sensor.cfg.set` **mask 2** (gyro). Simulator mode usually includes gyro already.

**Important:** 0% and 100% on the bar are **display endpoints**, not physical units. Gyro is **not** 0–100 rad/s. Map like this:

```javascript
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function valueToPercent(value, displayMin, displayMax) {
  if (displayMax <= displayMin) return 0;
  const t = (value - displayMin) / (displayMax - displayMin);
  return clamp(t * 100, 0, 100);
}

// gyroX = -5  → 0%
// gyroX =  0  → 50%
// gyroX = +5  → 100%
const pct = valueToPercent(sample.fields.gyroX, -5, 5);
```

Optional **typical motion** band: use `gaugeHints.gyro` (-1…1 rad/s) instead when the user asks for a “sensitive” or “motion” scale.

### Step 3 — Subscribe to samples

```javascript
function onSample(payload) {
  if (payload.sensor !== "bmi270") return;
  if (typeof payload.fields.gyroX !== "number") return; // mask may omit gyro

  const pct = valueToPercent(
    payload.fields.gyroX,
    displayMin,
    displayMax,
  );
  barEl.style.width = pct.toFixed(1) + "%";
  labelEl.textContent = payload.fields.gyroX.toFixed(2) + " rad/s";
}
```

### Step 4 — Prefer runtime catalog when available

```javascript
let displayMin = -5;
let displayMax = 5;

function applyCatalog(catalogPayload) {
  const bmi = catalogPayload.sensors.find((s) => s.id === "bmi270");
  const gyro = bmi?.fields.find((f) => f.key === "gyroX");
  if (gyro) {
    displayMin = gyro.min;
    displayMax = gyro.max;
  }
}

// In postMessage handler:
if (msg.type === "bitstream:catalog") applyCatalog(msg.payload);
```

### Step 5 — Course Studio iframe handshake

```javascript
parent.postMessage(
  { type: "bitstream:ready", v: 1, payload: { clientId: "gyro-x-bar" } },
  "*",
);
```

---

## Recipe 2 — Signed axis centered at 50%

When the user wants **0 rad/s at the middle** of the bar (±max at ends):

```javascript
function signedToPercent(value, absMax) {
  const t = value / absMax; // -1..1 if value within ±absMax
  return clamp((t + 1) * 50, 0, 100);
}
```

Use only when the user **explicitly** asks for zero-centered display — not the default “min → 0%, max → 100%” mapping.

---

## Recipe 3 — Check field is enabled before showing UI

```javascript
function gyroActive(configPayload) {
  const cfg = configPayload?.sensors?.bmi270;
  return cfg?.enabled === true && cfg.maskLabels?.includes("gyroX");
}
```

Wait for `bitstream:config` before assuming `gyroX` will appear in every sample.

---

## Recipe 4 — Humidity bar (0–100% matches physical %)

SHT40 `humidityPct` is already **0–100 %RH** — bar fill can equal the field value (after clamp):

```javascript
const pct = clamp(payload.fields.humidityPct, 0, 100);
```

Full example: [EXAMPLES/sht40-humidity-progress-bar.html](./EXAMPLES/sht40-humidity-progress-bar.html).

---

## Recipe 5 — Pressure bar (sea-level band)

DPS368 `pressureHpa` full sensor range is **300–1200 hPa** — too wide for a classroom bar. Prefer catalog **`gaugeHints.pressureSeaLevel`** (**900–1100 hPa**):

```javascript
function applyCatalog(catalogPayload) {
  const dps = catalogPayload.sensors.find((s) => s.id === "dps368");
  const hint = dps?.gaugeHints?.pressureSeaLevel;
  if (hint) {
    displayMin = hint.min;
    displayMax = hint.max;
  }
}
```

Full example: [EXAMPLES/dps368-pressure-progress-bar.html](./EXAMPLES/dps368-pressure-progress-bar.html).

---

## See also

| Doc | Topic |
|-----|--------|
| [EXAMPLES/](./EXAMPLES/) | Single-file HTML samples |
| [SENSOR_CATALOG.md](./SENSOR_CATALOG.md) | Aliases, range types |
| [SKILL.md](./SKILL.md) | Agent checklist |
