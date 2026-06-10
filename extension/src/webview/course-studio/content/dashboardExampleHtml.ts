/** Compact decorative EV hero for Course html-page sandbox (no telemetry). */
export const EV_SPEED_HERO_COMPACT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EV speed hero — compact (decorative)</title>
  <style>
    :root {
      --bg: #070b12;
      --panel: rgba(18, 27, 43, 0.85);
      --line: rgba(66, 232, 255, 0.28);
      --text: #eaf7ff;
      --muted: #8ca4b8;
      --cyan: #42e8ff;
      --blue: #5477ff;
      --green: #54ff9d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background:
        radial-gradient(circle at 20% 0%, rgba(66, 232, 255, 0.14), transparent 40%),
        radial-gradient(circle at 80% 100%, rgba(84, 119, 255, 0.12), transparent 42%),
        var(--bg);
      color: var(--text);
      padding: 16px;
    }
    .wrap {
      max-width: 520px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--panel);
      padding: 18px 20px 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
    }
    .speed-ring {
      width: 132px;
      height: 132px;
      border-radius: 50%;
      position: relative;
      display: grid;
      place-items: center;
      background:
        conic-gradient(from 225deg, var(--cyan) 0deg, var(--blue) 140deg, rgba(255,255,255,0.08) 141deg 270deg, transparent 271deg);
      filter: drop-shadow(0 0 16px rgba(66, 232, 255, 0.3));
    }
    .speed-ring::before {
      content: "";
      position: absolute;
      inset: 10px;
      border-radius: 50%;
      background: #08111e;
    }
    .speed-value { position: relative; z-index: 1; text-align: center; line-height: 1; }
    .speed-value .num { font-size: 42px; font-weight: 800; letter-spacing: -0.06em; }
    .speed-value .unit { font-size: 11px; color: var(--muted); letter-spacing: 0.2em; margin-top: 4px; }
    .metrics { display: grid; gap: 10px; flex: 1; min-width: 0; }
    .metric {
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .metric .k { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .metric .v { margin-top: 4px; font-size: 18px; font-weight: 700; }
    .gauge { margin-top: 8px; height: 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
    .gauge span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--green), var(--cyan)); }
    .note { margin-top: 12px; font-size: 10px; color: var(--muted); line-height: 1.45; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="label">Decorative · no telemetry</div>
    <div class="hero">
      <div class="metrics">
        <div class="metric">
          <div class="k">Power</div>
          <div class="v" id="power">188 kW</div>
          <div class="gauge"><span id="power-bar" style="width:64%"></span></div>
        </div>
        <div class="metric">
          <div class="k">Battery</div>
          <div class="v">78%</div>
          <div class="gauge"><span style="width:78%"></span></div>
        </div>
      </div>
      <div class="speed-ring">
        <div class="speed-value">
          <div class="num" id="speed">86</div>
          <div class="unit">KM/H</div>
        </div>
      </div>
    </div>
    <p class="note">Compact EV hero for Course iframe blocks. Values animate locally — bind real fields via the Bitstream telemetry provider for production topics.</p>
  </div>
  <script>
    (function () {
      var speed = document.getElementById("speed");
      var power = document.getElementById("power");
      var powerBar = document.getElementById("power-bar");
      var t = 0;
      setInterval(function () {
        t += 0.08;
        var v = Math.round(84 + Math.sin(t) * 6);
        var p = Math.round(160 + v * 0.35);
        speed.textContent = v;
        power.textContent = p + " kW";
        powerBar.style.width = Math.min(100, 40 + v * 0.5) + "%";
      }, 240);
    })();
  </script>
</body>
</html>
`;
