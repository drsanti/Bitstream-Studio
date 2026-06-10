# Bitstream Telemetry Provider — Course Studio HTML / iframe

Use this path for **HTML page blocks** and **remote HTML** embedded in the Course Studio shell.

**Do not** open `ws://127.0.0.1:9997` or `9998` from inside the iframe — VS Code webview CSP and sandbox make the **parent shell** the broker client.

---

## Handshake

```text
iframe  ──bitstream:ready──►  parent (Course Studio shell)
parent  ──catalog──────────►  iframe
parent  ──config───────────►  iframe
parent  ──connection───────►  iframe
parent  ──sample (stream)──►  iframe
```

Default: parent **pushes** catalog and config on load. Optional: iframe sends `bitstream:request` to refresh.

**AI agents:** In Course Studio, **always try `bitstream:ready` + parent `postMessage` first** — do not open `ws://127.0.0.1:9997` inside the iframe. For **standalone** HTML (file or localhost tab), connect to **9997** first; if that fails, use **mock data** so the layout still works (see [EXAMPLES/](./EXAMPLES/)).

---

## Minimal HTML block listener

```html
<script>
  const clientId = "my-dashboard";

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.v !== 1 || typeof msg.type !== "string") return;
    if (!msg.type.startsWith("bitstream:")) return;

    switch (msg.type) {
      case "bitstream:catalog":
        window.__catalog = msg.payload;
        break;
      case "bitstream:config":
        window.__config = msg.payload;
        break;
      case "bitstream:sample":
        onSample(msg.payload);
        break;
      case "bitstream:connection":
        onConnection(msg.payload);
        break;
      case "bitstream:response":
        onCommandResponse(msg.payload);
        break;
    }
  });

  function onSample(payload) {
    if (payload.sensor !== "sht40") return;
    const t = payload.fields.temperatureC;
    const h = payload.fields.humidityPct;
    if (typeof t === "number") {
      document.getElementById("temp").textContent = t.toFixed(1) + " °C";
    }
    if (typeof h === "number") {
      document.getElementById("rh").textContent = h.toFixed(1) + " %RH";
    }
  }

  function onConnection(payload) {
    document.getElementById("status").textContent = payload.state;
  }

  function onCommandResponse(payload) {
    console.log("command result", payload);
  }

  // Tell parent we are ready for catalog + stream
  parent.postMessage(
    { type: "bitstream:ready", v: 1, payload: { clientId } },
    "*"
  );
</script>
```

> **Security:** `CourseTelemetryPostMessageBridge` only accepts `bitstream:request` / `bitstream:command` from iframes that completed `bitstream:ready`. Outbound posts use the handshake `event.origin` (`"*"` for srcdoc / opaque origins).

---

## Gauges and charts

1. Load **`bitstream:catalog`** once — read `fields[].min` / `max` for gauge axes.
2. Read **`bitstream:config`** — use `maskLabels` to know which series are active.
3. Update from **`bitstream:sample`** — use `payload.fields` only (already scaled).

Do not invent min/max ranges; use the catalog. Map user names (`gx`) → catalog keys (`gyroX`) per [SENSOR_CATALOG.md](./SENSOR_CATALOG.md).

**Progress bar recipe:** [RECIPES.md](./RECIPES.md) · **Full example:** [EXAMPLES/gyro-x-progress-bar.html](./EXAMPLES/gyro-x-progress-bar.html)

---

## Optional refresh (no polling)

```javascript
parent.postMessage(
  {
    type: "bitstream:request",
    v: 1,
    payload: { requestId: "cfg-refresh", what: "config" },
  },
  "*"
);
```

---

## R1 — commands from iframe

Advanced labs may send:

```javascript
parent.postMessage(
  {
    type: "bitstream:command",
    v: 1,
    payload: {
      requestId: "get-sht40-cfg",
      command: "sensor.cfg.get",
      args: { sensorId: 2 },
    },
  },
  "*"
);
```

Parent forwards to BS2 and returns `bitstream:response`. Allowlist enforced by `CourseTelemetryPostMessageBridge`.

---

## Auto-height (existing Course Studio)

HTML blocks may already use `postMessage` for iframe height (`htmlPageAutoHeight.ts`). Telemetry messages use a separate `bitstream:*` namespace — no conflict.

---

## See also

- [RECIPES.md](./RECIPES.md)
- [EXAMPLES/gyro-x-progress-bar.html](./EXAMPLES/gyro-x-progress-bar.html)
- [EVENTS.md](./EVENTS.md)
- [sensor-catalog.v1.json](./sensor-catalog.v1.json)
