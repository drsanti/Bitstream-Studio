# Workshop HTML generation prompts

AI agent prompt pack for generating **standalone WebSocket** telemetry HTML used in the **Course Studio HTML Editor** (read-only dashboards).

## Your choices (locked)

| Decision | Selection |
|----------|-----------|
| Runtime | **Standalone WS** `ws://127.0.0.1:9997` first (no iframe/postMessage in phase 1) |
| Granularity | **One HTML per sensor** + **one four-sensor dashboard** |
| BMI270 | **Gyro bar** + **accel shake** (magnitude) |
| Config | **Read-only** — no `bitstream:command` |
| Deployment | Paste into **HTML Editor**; validate live in a **browser tab** with provider running |
| Language | **English** UI only |

## How to run an agent

1. Attach **[MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md)**.
2. Attach **one annex** (sensor or dashboard).
3. Paste the **Copy-paste prompt** block from that annex (or customize).
4. Save output under **`extension/docs/workshop/examples/`** (create folder on first generation).

## Prompt files

| File | Generates |
|------|-----------|
| [MASTER_HTML_AGENT.md](./MASTER_HTML_AGENT.md) | Shared rules (always) |
| [SENSOR_SHT40.md](./SENSOR_SHT40.md) | `sht40-climate-dashboard.html` |
| [SENSOR_DPS368.md](./SENSOR_DPS368.md) | `dps368-pressure-dashboard.html` |
| [SENSOR_BMI270.md](./SENSOR_BMI270.md) | `bmi270-motion-dashboard.html` |
| [SENSOR_BMM350.md](./SENSOR_BMM350.md) | `bmm350-magnetometer-dashboard.html` |
| [DASHBOARD_FOUR_SENSORS.md](./DASHBOARD_FOUR_SENSORS.md) | `workshop-four-sensor-dashboard.html` |

## Verify generated HTML

```bash
cd extension
npm start
```

Toolbar: **Bitstream** (TESAIoT DevKit) or **Simulator**, **Link** on.

Open the `.html` file in a browser (or via dev static server). Expect **Live** samples; stop bridge to see **Mock**.

## Generate HTML + Course Studio bundle

From repo root:

```bash
node extension/docs/workshop/scripts/generate-workshop-html.mjs
```

Writes `extension/docs/workshop/examples/*.html`, `workshopExampleHtml.generated.ts`, and registers page **`workshop-live-html`** in Course Studio (outline: **Tesring → Workshop HTML → Live sensor dashboards**).

## HTML Editor caveat

Course Studio embeds HTML in a **sandboxed iframe**. WebSocket to `:9997` may not work inside editor preview. Phase 1 files target **WS in a normal browser tab**; mock still works in-editor. Phase 2 (backlog): `RUNTIME_COURSE_IFRAME.md` for `postMessage` transport.

## Related

- [../WORKSHOP_OUTLINE.md](../WORKSHOP_OUTLINE.md) — Ch2 / Ch6 sessions
- [../SENSOR_THEORY.md](../SENSOR_THEORY.md) — trainee sensor copy
- [../../bitstream-telemetry-provider/EXAMPLES/](../../bitstream-telemetry-provider/EXAMPLES/) — canonical single-field templates
