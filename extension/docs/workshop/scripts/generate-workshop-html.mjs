#!/usr/bin/env node
/**
 * Generate workshop telemetry HTML + Course Studio bundle.
 *
 *   node extension/docs/workshop/scripts/generate-workshop-html.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSHOP_ROOT = resolve(SCRIPT_DIR, "..");
const EXAMPLES_DIR = resolve(WORKSHOP_ROOT, "examples");
const COURSE_CONTENT = resolve(
  SCRIPT_DIR,
  "../../../src/webview/course-studio/content",
);

const TRANSPORT_BOOT = String.raw`
      function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
      function valueToPercent(value, min, max) {
        if (max <= min) return 0;
        return clamp(((value - min) / (max - min)) * 100, 0, 100);
      }
      function bindTransport(clientId, onEnvelope) {
        window.addEventListener("message", function (event) {
          var msg = event.data;
          if (!msg || msg.v !== 1 || typeof msg.type !== "string") return;
          if (msg.type.indexOf("bitstream:") !== 0) return;
          onEnvelope(msg);
        });
        var mockTimer = null;
        function startMock(tick) {
          if (mockTimer != null) return;
          var t0 = Date.now();
          mockTimer = window.setInterval(function () {
            tick((Date.now() - t0) / 1000);
          }, 500);
        }
        function stopMock() {
          if (mockTimer == null) return;
          window.clearInterval(mockTimer);
          mockTimer = null;
        }
        function connectWs() {
          var ws;
          try { ws = new WebSocket("ws://127.0.0.1:9997"); } catch (e) { startMock(function () {}); return; }
          ws.addEventListener("open", function () { stopMock(); });
          ws.addEventListener("message", function (ev) {
            var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
            if (!msg || msg.v !== 1) return;
            onEnvelope(msg);
          });
          ws.addEventListener("close", function () {
            window.setTimeout(connectWs, 2000);
          });
          ws.addEventListener("error", function () { ws.close(); });
        }
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            { type: "bitstream:ready", v: 1, payload: { clientId: clientId } },
            "*"
          );
        } else {
          connectWs();
        }
        return { startMock: startMock, stopMock: stopMock };
      }
`;

function shell(title, accent, panel, borderRgb, bodyHtml, scriptBody) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    :root {
      --bg: #0f1419;
      --panel: ${panel};
      --accent: ${accent};
      --text: #eaf7ff;
      --muted: #8ca4b8;
      --track: #243044;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      width: min(480px, 100%);
      background: var(--panel);
      border: 1px solid rgba(${borderRgb}, 0.28);
      border-radius: 12px;
      padding: 18px;
    }
    h1 { margin: 0 0 4px; font-size: 15px; font-weight: 600; }
    .meta { font-size: 11px; color: var(--muted); margin-bottom: 14px; line-height: 1.45; }
    .section { margin-bottom: 14px; }
    .section:last-of-type { margin-bottom: 0; }
    .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: 11px; }
    .value { font-size: 13px; color: var(--accent); }
    .track { height: 12px; background: var(--track); border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; width: 50%; background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, #000), var(--accent)); border-radius: 999px; transition: width 80ms linear; }
    .scale { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: var(--muted); }
    .status { margin-top: 12px; font-size: 10px; color: var(--muted); }
    .hint { font-size: 10px; color: var(--muted); margin-top: 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: min(720px, 100%); }
    .panel { background: var(--panel); border: 1px solid rgba(${borderRgb}, 0.22); border-radius: 12px; padding: 14px; }
    .panel h2 { margin: 0 0 6px; font-size: 13px; }
    .page-header { width: min(720px, 100%); margin-bottom: 10px; }
    .page-header h1 { font-size: 16px; }
  </style>
</head>
<body>
${bodyHtml}
  <script>
    (function () {
      "use strict";
${TRANSPORT_BOOT}
${scriptBody}
    })();
  </script>
</body>
</html>
`;
}

const FILES = {
  sht40Climate: shell(
    "SHT40 — temperature & humidity",
    "#5ee89a",
    "#1a2820",
    "94, 232, 154",
    `  <div class="card">
    <h1>Room climate (SHT40)</h1>
    <p class="meta">TESAIoT DevKit · environmental sensor · warm the board to see values move</p>
    <div class="section">
      <div class="row"><span>Temperature</span><span class="value" id="temp-val">—</span></div>
      <div class="track"><div class="fill" id="temp-fill"></div></div>
      <div class="scale"><span>0 °C</span><span id="temp-pct">—</span><span>50 °C</span></div>
    </div>
    <div class="section">
      <div class="row"><span>Humidity</span><span class="value" id="hum-val">—</span></div>
      <div class="track"><div class="fill" id="hum-fill"></div></div>
      <div class="scale"><span>0%</span><span id="hum-pct">—</span><span>100%</span></div>
    </div>
    <p class="status" id="status">Waiting for telemetry…</p>
  </div>`,
    `
      var tempMin = 0, tempMax = 50, humMin = 0, humMax = 100;
      var statusEl = document.getElementById("status");
      var live = false;
      function paintTemp(v) {
        var pct = valueToPercent(v, tempMin, tempMax);
        document.getElementById("temp-fill").style.width = pct.toFixed(1) + "%";
        document.getElementById("temp-pct").textContent = pct.toFixed(0) + "%";
        document.getElementById("temp-val").textContent = v.toFixed(1) + " °C";
      }
      function paintHum(v) {
        var pct = valueToPercent(v, humMin, humMax);
        document.getElementById("hum-fill").style.width = pct.toFixed(1) + "%";
        document.getElementById("hum-pct").textContent = pct.toFixed(0) + "%";
        document.getElementById("hum-val").textContent = v.toFixed(1) + " %RH";
      }
      function onSample(p) {
        if (!p || p.sensor !== "sht40") return;
        var t = p.fields && p.fields.temperatureC;
        var h = p.fields && p.fields.humidityPct;
        if (typeof t === "number") paintTemp(t);
        if (typeof h === "number") paintHum(h);
        live = true;
        statusEl.textContent = "Live · TESAIoT DevKit or Simulator";
      }
      var transport = bindTransport("workshop-sht40-climate", function (msg) {
        if (msg.type === "bitstream:sample") onSample(msg.payload);
        if (msg.type === "bitstream:connection" && msg.payload) {
          statusEl.textContent = "Connected · " + msg.payload.route;
        }
      });
      transport.startMock(function (t) {
        if (live) return;
        statusEl.textContent = "Mock · connect Bitstream + Link for live data";
        paintTemp(24 + Math.sin(t * 0.4) * 3);
        paintHum(55 + Math.sin(t * 0.35) * 12);
      });
`,
  ),

  dps368Pressure: shell(
    "DPS368 — barometric pressure",
    "#5eb8f5",
    "#152535",
    "94, 184, 245",
    `  <div class="card">
    <h1>Air pressure (DPS368)</h1>
    <p class="meta">Sea-level band 900–1100 hPa · typical room air ≈ 1013 hPa</p>
    <div class="section">
      <div class="row"><span>Pressure</span><span class="value" id="press-val">—</span></div>
      <div class="track"><div class="fill" id="press-fill"></div></div>
      <div class="scale"><span>900</span><span id="press-pct">—</span><span>1100 hPa</span></div>
    </div>
    <div class="section">
      <div class="row"><span>Chip temperature</span><span class="value" id="chip-temp">—</span></div>
    </div>
    <p class="status" id="status">Waiting for telemetry…</p>
  </div>`,
    `
      var pMin = 900, pMax = 1100;
      var statusEl = document.getElementById("status");
      var live = false;
      function paintPress(v) {
        var pct = valueToPercent(v, pMin, pMax);
        document.getElementById("press-fill").style.width = pct.toFixed(1) + "%";
        document.getElementById("press-pct").textContent = pct.toFixed(0) + "%";
        document.getElementById("press-val").textContent = v.toFixed(1) + " hPa";
      }
      function onSample(p) {
        if (!p || p.sensor !== "dps368") return;
        var pr = p.fields && p.fields.pressureHpa;
        var tc = p.fields && p.fields.temperatureC;
        if (typeof pr === "number") paintPress(pr);
        if (typeof tc === "number") document.getElementById("chip-temp").textContent = tc.toFixed(1) + " °C";
        live = true;
        statusEl.textContent = "Live · TESAIoT DevKit or Simulator";
      }
      var transport = bindTransport("workshop-dps368-pressure", function (msg) {
        if (msg.type === "bitstream:sample") onSample(msg.payload);
      });
      transport.startMock(function (t) {
        if (live) return;
        statusEl.textContent = "Mock · connect Bitstream + Link for live data";
        paintPress(1013 + Math.sin(t * 0.25) * 6);
        document.getElementById("chip-temp").textContent = (26 + Math.sin(t * 0.2)).toFixed(1) + " °C";
      });
`,
  ),

  bmi270Motion: shell(
    "BMI270 — gyro & acceleration",
    "#42e8ff",
    "#1a2332",
    "66, 232, 255",
    `  <div class="card">
    <h1>Motion (BMI270)</h1>
    <p class="meta">Rotate the DevKit for gyro · shake for acceleration strength</p>
    <div class="section">
      <div class="row"><span>Gyro X</span><span class="value" id="gyro-val">—</span></div>
      <div class="track"><div class="fill" id="gyro-fill"></div></div>
      <div class="scale"><span>−1</span><span id="gyro-pct">—</span><span>+1 rad/s</span></div>
    </div>
    <div class="section">
      <div class="row"><span>Accel strength</span><span class="value" id="accel-val">—</span></div>
      <div class="track"><div class="fill" id="accel-fill"></div></div>
      <div class="scale"><span>0</span><span id="accel-pct">—</span><span>20 m/s²</span></div>
    </div>
    <p class="status" id="status">Waiting for telemetry…</p>
    <p class="hint" id="profile-hint" hidden>BMI270 Raw profile required — enable in Sensor Telemetry, then Apply.</p>
  </div>`,
    `
      var gMin = -1, gMax = 1, aMin = 0, aMax = 20;
      var statusEl = document.getElementById("status");
      var hintEl = document.getElementById("profile-hint");
      var live = false;
      var sawGyro = false;
      function paintGyro(v) {
        sawGyro = true;
        hintEl.hidden = true;
        var pct = valueToPercent(v, gMin, gMax);
        document.getElementById("gyro-fill").style.width = pct.toFixed(1) + "%";
        document.getElementById("gyro-pct").textContent = pct.toFixed(0) + "%";
        document.getElementById("gyro-val").textContent = v.toFixed(2) + " rad/s";
      }
      function paintAccel(ax, ay, az) {
        var s = Math.sqrt(ax * ax + ay * ay + az * az);
        var pct = valueToPercent(s, aMin, aMax);
        document.getElementById("accel-fill").style.width = pct.toFixed(1) + "%";
        document.getElementById("accel-pct").textContent = pct.toFixed(0) + "%";
        document.getElementById("accel-val").textContent = s.toFixed(2) + " m/s²";
      }
      function onSample(p) {
        if (!p || p.sensor !== "bmi270") return;
        var gx = p.fields && p.fields.gyroX;
        var ax = p.fields && p.fields.accelX;
        var ay = p.fields && p.fields.accelY;
        var az = p.fields && p.fields.accelZ;
        if (typeof gx === "number") paintGyro(gx);
        if (typeof ax === "number" && typeof ay === "number" && typeof az === "number") paintAccel(ax, ay, az);
        live = true;
        statusEl.textContent = "Live · TESAIoT DevKit or Simulator";
      }
      var transport = bindTransport("workshop-bmi270-motion", function (msg) {
        if (msg.type === "bitstream:sample") onSample(msg.payload);
        if (msg.type === "bitstream:config" && !sawGyro) {
          var row = msg.payload && msg.payload.sensors && msg.payload.sensors.bmi270;
          if (row && row.maskLabels && row.maskLabels.indexOf("gyroX") < 0) hintEl.hidden = false;
        }
      });
      transport.startMock(function (t) {
        if (live) return;
        statusEl.textContent = "Mock · connect Bitstream + Link for live data";
        paintGyro(Math.sin(t * 1.2) * 0.6);
        paintAccel(0.1, 0.15, 9.8 + Math.sin(t * 3) * 0.5);
      });
`,
  ),

  bmm350Mag: shell(
    "BMM350 — magnetic field",
    "#b88cff",
    "#221a32",
    "184, 140, 255",
    `  <div class="card">
    <h1>Magnetic field (BMM350)</h1>
    <p class="meta">Earth field band ±100 µT · rotate board slowly · keep strong magnets away</p>
    <div class="section">
      <div class="row"><span>Mag X</span><span class="value" id="mx-val">—</span></div>
      <div class="track"><div class="fill" id="mx-fill"></div></div>
    </div>
    <div class="section">
      <div class="row"><span>Mag Y</span><span class="value" id="my-val">—</span></div>
      <div class="track"><div class="fill" id="my-fill"></div></div>
    </div>
    <div class="section">
      <div class="row"><span>Mag Z</span><span class="value" id="mz-val">—</span></div>
      <div class="track"><div class="fill" id="mz-fill"></div></div>
    </div>
    <div class="row"><span>Field strength</span><span class="value" id="mag-strength">—</span></div>
    <p class="status" id="status">Waiting for telemetry…</p>
  </div>`,
    `
      var mMin = -100, mMax = 100;
      var statusEl = document.getElementById("status");
      var live = false;
      function paintAxis(key, valEl, fillEl) {
        var pct = valueToPercent(valEl, mMin, mMax);
        document.getElementById(fillEl).style.width = pct.toFixed(1) + "%";
        document.getElementById(valEl).textContent = key.toFixed(1) + " µT";
      }
      function onSample(p) {
        if (!p || p.sensor !== "bmm350") return;
        var mx = p.fields && p.fields.magX;
        var my = p.fields && p.fields.magY;
        var mz = p.fields && p.fields.magZ;
        if (typeof mx === "number") paintAxis(mx, "mx-val", "mx-fill");
        if (typeof my === "number") paintAxis(my, "my-val", "my-fill");
        if (typeof mz === "number") paintAxis(mz, "mz-val", "mz-fill");
        if (typeof mx === "number" && typeof my === "number" && typeof mz === "number") {
          var s = Math.sqrt(mx * mx + my * my + mz * mz);
          document.getElementById("mag-strength").textContent = s.toFixed(1) + " µT";
        }
        live = true;
        statusEl.textContent = "Live · TESAIoT DevKit or Simulator";
      }
      var transport = bindTransport("workshop-bmm350-mag", function (msg) {
        if (msg.type === "bitstream:sample") onSample(msg.payload);
      });
      transport.startMock(function (t) {
        if (live) return;
        statusEl.textContent = "Mock · connect Bitstream + Link for live data";
        paintAxis(30 * Math.sin(t * 0.5), "mx-val", "mx-fill");
        paintAxis(30 * Math.cos(t * 0.5), "my-val", "my-fill");
        paintAxis(45 + Math.sin(t * 0.3) * 5, "mz-val", "mz-fill");
        document.getElementById("mag-strength").textContent = "55.0 µT";
      });
`,
  ),
};

// Four-sensor dashboard — custom body
FILES.fourSensorDashboard = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TESAIoT DevKit — four sensor dashboard</title>
  <style>
    :root { --bg: #0f1419; --text: #eaf7ff; --muted: #8ca4b8; --track: #243044; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 16px; }
    .page-header { margin-bottom: 12px; }
    .page-header h1 { margin: 0; font-size: 16px; }
    .page-header p { margin: 4px 0 0; font-size: 11px; color: var(--muted); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 760px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    .panel { border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.08); }
    .panel h2 { margin: 0 0 8px; font-size: 13px; }
    .panel .row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
    .panel .value { font-size: 13px; }
    .track { height: 10px; background: var(--track); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
    .fill { height: 100%; width: 50%; border-radius: 999px; transition: width 80ms linear; }
    .status { font-size: 10px; color: var(--muted); margin-top: 6px; }
    .bmi { background: #1a2332; --accent: #42e8ff; }
    .sht { background: #1a2820; --accent: #5ee89a; }
    .dps { background: #152535; --accent: #5eb8f5; }
    .bmm { background: #221a32; --accent: #b88cff; }
    .fill { background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 50%, #000), var(--accent)); }
    .value { color: var(--accent); }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>TESAIoT DevKit live dashboard</h1>
    <p id="global-status">Waiting for telemetry…</p>
  </div>
  <div class="grid">
    <div class="panel bmi">
      <h2>Motion · BMI270</h2>
      <div class="row"><span>Gyro X</span><span class="value" id="bmi-gyro">—</span></div>
      <div class="track"><div class="fill" id="bmi-gyro-fill"></div></div>
      <div class="row"><span>Accel |a|</span><span class="value" id="bmi-accel">—</span></div>
      <div class="track"><div class="fill" id="bmi-accel-fill"></div></div>
    </div>
    <div class="panel sht">
      <h2>Climate · SHT40</h2>
      <div class="row"><span>Temp</span><span class="value" id="sht-temp">—</span></div>
      <div class="track"><div class="fill" id="sht-temp-fill"></div></div>
      <div class="row"><span>Humidity</span><span class="value" id="sht-hum">—</span></div>
      <div class="track"><div class="fill" id="sht-hum-fill"></div></div>
    </div>
    <div class="panel dps">
      <h2>Pressure · DPS368</h2>
      <div class="row"><span>pressureHpa</span><span class="value" id="dps-p">—</span></div>
      <div class="track"><div class="fill" id="dps-fill"></div></div>
    </div>
    <div class="panel bmm">
      <h2>Magnetic · BMM350</h2>
      <div class="row"><span>|B|</span><span class="value" id="bmm-s">—</span></div>
      <div class="track"><div class="fill" id="bmm-fill"></div></div>
    </div>
  </div>
  <script>
    (function () {
      "use strict";
${TRANSPORT_BOOT}
      function pct(v, a, b) { return valueToPercent(v, a, b); }
      function setFill(id, p) { document.getElementById(id).style.width = p.toFixed(1) + "%"; }
      var live = false;
      function onSample(p) {
        if (!p || !p.sensor || !p.fields) return;
        live = true;
        document.getElementById("global-status").textContent = "Live · TESAIoT DevKit or Simulator";
        if (p.sensor === "bmi270") {
          var gx = p.fields.gyroX, ax = p.fields.accelX, ay = p.fields.accelY, az = p.fields.accelZ;
          if (typeof gx === "number") {
            document.getElementById("bmi-gyro").textContent = gx.toFixed(2) + " rad/s";
            setFill("bmi-gyro-fill", pct(gx, -1, 1));
          }
          if (typeof ax === "number" && typeof ay === "number" && typeof az === "number") {
            var s = Math.sqrt(ax*ax+ay*ay+az*az);
            document.getElementById("bmi-accel").textContent = s.toFixed(2) + " m/s²";
            setFill("bmi-accel-fill", pct(s, 0, 20));
          }
        }
        if (p.sensor === "sht40") {
          var t = p.fields.temperatureC, h = p.fields.humidityPct;
          if (typeof t === "number") {
            document.getElementById("sht-temp").textContent = t.toFixed(1) + " °C";
            setFill("sht-temp-fill", pct(t, 0, 50));
          }
          if (typeof h === "number") {
            document.getElementById("sht-hum").textContent = h.toFixed(1) + " %RH";
            setFill("sht-hum-fill", pct(h, 0, 100));
          }
        }
        if (p.sensor === "dps368" && typeof p.fields.pressureHpa === "number") {
          var pr = p.fields.pressureHpa;
          document.getElementById("dps-p").textContent = pr.toFixed(1) + " hPa";
          setFill("dps-fill", pct(pr, 900, 1100));
        }
        if (p.sensor === "bmm350") {
          var mx = p.fields.magX, my = p.fields.magY, mz = p.fields.magZ;
          if (typeof mx === "number" && typeof my === "number" && typeof mz === "number") {
            var b = Math.sqrt(mx*mx+my*my+mz*mz);
            document.getElementById("bmm-s").textContent = b.toFixed(1) + " µT";
            setFill("bmm-fill", pct(b, 0, 100));
          }
        }
      }
      var transport = bindTransport("workshop-four-sensor-dashboard", function (msg) {
        if (msg.type === "bitstream:sample") onSample(msg.payload);
      });
      transport.startMock(function (t) {
        if (live) return;
        document.getElementById("global-status").textContent = "Mock · connect Bitstream + Link for live data";
        onSample({ sensor: "bmi270", fields: { gyroX: Math.sin(t)*0.5, accelX: 0, accelY: 0, accelZ: 9.8 } });
        onSample({ sensor: "sht40", fields: { temperatureC: 24, humidityPct: 58 } });
        onSample({ sensor: "dps368", fields: { pressureHpa: 1013 } });
        onSample({ sensor: "bmm350", fields: { magX: 20, magY: 15, magZ: 40 } });
      });
    })();
  </script>
</body>
</html>
`;

mkdirSync(EXAMPLES_DIR, { recursive: true });

const outNames = {
  sht40Climate: "sht40-climate-dashboard.html",
  dps368Pressure: "dps368-pressure-dashboard.html",
  bmi270Motion: "bmi270-motion-dashboard.html",
  bmm350Mag: "bmm350-magnetometer-dashboard.html",
  fourSensorDashboard: "workshop-four-sensor-dashboard.html",
};

for (const [key, filename] of Object.entries(outNames)) {
  writeFileSync(resolve(EXAMPLES_DIR, filename), FILES[key], "utf8");
}

function escapeTsString(s) {
  return JSON.stringify(s);
}

const tsKeys = {
  sht40Climate: "sht40Climate",
  dps368Pressure: "dps368Pressure",
  bmi270Motion: "bmi270Motion",
  bmm350Mag: "bmm350Mag",
  fourSensorDashboard: "fourSensorDashboard",
};

let tsBody = "/** Auto-generated by generate-workshop-html.mjs — do not edit. */\nexport const WORKSHOP_EXAMPLE_HTML = {\n";
for (const [key, prop] of Object.entries(tsKeys)) {
  tsBody += `  ${prop}: ${escapeTsString(FILES[key])},\n`;
}
tsBody += "} as const;\n";

writeFileSync(resolve(COURSE_CONTENT, "workshopExampleHtml.generated.ts"), tsBody, "utf8");

console.log("Wrote workshop HTML to", EXAMPLES_DIR);
console.log("Wrote", resolve(COURSE_CONTENT, "workshopExampleHtml.generated.ts"));
