# Workshop HTML agent — master instructions

**Attach this file on every generation run**, plus exactly one sensor annex (`SENSOR_*.md`) or `DASHBOARD_FOUR_SENSORS.md`.

**Operator context:** TESAIoT Bitstream Studio workshop. Hardware: **TESAIoT DevKit** (toolbar **Bitstream** + **Link**). Fallback label: **Simulator**. English only in UI strings.

**Your job:** Produce one **self-contained** `.html` file (no build step, no npm packages, no external CSS/JS URLs).

---

## Runtime (phase 1 — standalone WebSocket only)

| Rule | Detail |
|------|--------|
| Connect | `new WebSocket("ws://127.0.0.1:9997")` on load |
| Do **not** | Open port 9998, parse wire frames, or use `postMessage` / `bitstream:ready` in this phase |
| Parse | JSON envelopes: `type`, `v`, `payload` |
| Subscribe | Handle `bitstream:catalog`, `bitstream:sample`, `bitstream:connection` |
| Mock fallback | If WS fails, closes, or no sample within ~5 s — start believable mock motion; label status **Mock** |
| Live switch | When WS delivers samples, **stop mock** and label **Live** |

**Prerequisites copy** (status line or meta): Bitstream Studio running (`npm start` in extension), toolbar **Bitstream** or **Simulator**, **Link** on.

**HTML Editor note:** Course Studio stores HTML in the **HTML Editor** pane. WS-first files are authored there but **live preview inside the sandboxed iframe may block WebSocket**. Instructors validate by opening the same document in a **browser tab** with the provider running, or rely on **mock** inside the editor. Phase 2 will add iframe `postMessage` transport.

---

## Read-only dashboards (required)

- **Do not** send `bitstream:command`, `bitstream:request`, `sensor.cfg.set`, or `bmi270.mode.set`.
- If a field is missing from `bitstream:config` / samples, show a **hint** in the status line (e.g. “Enable BMI270 Raw profile in Sensor Telemetry”) — do not auto-fix mask.

---

## Catalog and field keys

Source of truth: `extension/docs/bitstream-telemetry-provider/sensor-catalog.v1.json` (or runtime `bitstream:catalog`).

| Sensor `id` | Workshop accent (CSS `--accent`) |
|-------------|----------------------------------|
| `sht40` | `#5ee89a` (green) |
| `dps368` | `#5eb8f5` (blue) — pressure example used gold `#f5b942`; workshop dashboard uses blue |
| `bmi270` | `#42e8ff` (teal) |
| `bmm350` | `#b88cff` (violet) |

Use **catalog keys** in code (`humidityPct`, `gyroX`, `pressureHpa`, `magX`). User-facing labels may be plain English (“Humidity”, “Gyro X”).

---

## Range → progress bar (0–100%)

```javascript
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
function valueToPercent(value, min, max) {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}
```

- Default range: `fields[].min` / `max` from catalog (apply on `bitstream:catalog`).
- **DPS368 pressure:** default display band **900–1100 hPa** (`gaugeHints.pressureSeaLevel`) unless annex says otherwise.
- **BMI270 gyro:** catalog ±5 rad/s — zero gyro → **50%** bar fill, not 0%.
- **SHT40 humidity:** 0–100 %RH — bar % can match field value.
- **Never** treat rad/s, m/s², or µT as if they were already 0–100.

Optional motion band for hand demos (BMI270 gyro): ±1 rad/s — state in UI meta when used.

---

## UI contract (workshop theme)

| Element | Style |
|---------|--------|
| Font | `Inter, ui-sans-serif, system-ui, sans-serif` |
| Background | `#0f1419` |
| Card | Rounded 12px, subtle accent border |
| Labels | 11px, muted `#8ca4b8` |
| Values | 13px, accent color |
| Scale hints | 10px muted |
| Status line | 10px — **Live** / **Mock** / **Stale** + route or hint |
| Layout | Centered card; multi-widget sensors use vertical stack in one card |
| Avoid | `font-mono`, `tabular-nums`, external fonts/scripts |

Each widget row: **label · live value with unit · bar · scale endpoints · optional %**.

**Stale:** if no sample for sensor-specific timeout (~3–5 s), keep last value but status **Stale**.

---

## Mock data guidelines

| Sensor | Mock behavior |
|--------|----------------|
| SHT40 | Slow sine temp 22–28 °C; humidity 45–70 %RH |
| DPS368 | Pressure ~1013 hPa ± 5 slow drift |
| BMI270 | Gyro sin on rotate axis; accel Z ≈ 9.8, X/Y small sine (shake) |
| BMM350 | magX/Y/Z in ±40 µT with slow phase offset |

Mock payloads must use correct `sensor` id and `fields` keys.

---

## Code structure (copy from kit examples)

Mirror patterns in:

- `extension/docs/bitstream-telemetry-provider/EXAMPLES/sht40-humidity-progress-bar.html`
- `extension/docs/bitstream-telemetry-provider/EXAMPLES/gyro-x-progress-bar.html`
- `extension/docs/bitstream-telemetry-provider/EXAMPLES/dps368-pressure-progress-bar.html`

Omit iframe `postMessage` branch and omit R1 command helpers from the gyro example.

---

## Output checklist (agent must self-verify)

1. Single `.html` file, valid HTML5, `lang="en"`.
2. WS to `ws://127.0.0.1:9997` + reconnect on close + mock fallback.
3. Catalog-driven ranges updated on `bitstream:catalog`.
4. Status line distinguishes Live / Mock / Stale.
5. No command/request traffic.
6. Operator copy mentions **TESAIoT DevKit** / **Simulator**, not UART/COM/baud.
7. Filename suggested in annex (under `extension/docs/workshop/examples/`).

---

## Related kit docs (reference only)

| Doc | Use |
|-----|-----|
| [SKILL.md](../../bitstream-telemetry-provider/SKILL.md) | Provider workflow |
| [RECIPES.md](../../bitstream-telemetry-provider/RECIPES.md) | Bar mapping |
| [SENSOR_CATALOG.md](../../bitstream-telemetry-provider/SENSOR_CATALOG.md) | Field aliases |
| [SENSOR_THEORY.md](../SENSOR_THEORY.md) | Trainee-facing physics copy |
