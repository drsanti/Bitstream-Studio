/**
 * Dev-only HTTP server that mimics the Project 4 MCU surface documented in PROJECT_INFO.md:
 *   GET /data          → JSON telemetry (same keys as firmware `/data`)
 *   GET /move?dir=…    → acknowledges motion intent (tokens W S A D WA WD SA SD STOP)
 *   GET /setSpeed?val= → sets internal speed preset 0–255 (scaled into simulated wheel caps)
 *
 * Run (repo root):
 *   npm run project4:mock-mcu
 *   npm run dev:with-mock-mcu   ← mock + same stack as npm run dev (single terminal)
 *
 * Point **MCU base URL** in Project 4 Settings to `http://127.0.0.1:8787` (default port).
 * CORS is permissive so Vite (`localhost:5173`) can call this server.
 */
import http from "node:http";
import process from "node:process";

import {
  PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MAX_DEG,
  PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG,
} from "../lib/project4-mcu-documented-ranges";

const PORT = Number(process.env.MOCK_MCU_PORT ?? "8787") || 8787;
const HOST = process.env.MOCK_MCU_HOST ?? "127.0.0.1";

/** Max linear wheel speed (m/s) at speed preset 255 — tweak for readable twin motion. */
const MAX_LINEAR_MS = 0.42;
/** Wheel velocity slew toward command targets (1/s). */
const VELOCITY_SLEW = 5.5;

type DriveToken =
  | "STOP"
  | "W"
  | "S"
  | "A"
  | "D"
  | "WA"
  | "WD"
  | "SA"
  | "SD";

const VALID_DIRS = new Set<DriveToken>([
  "STOP",
  "W",
  "S",
  "A",
  "D",
  "WA",
  "WD",
  "SA",
  "SD",
]);

type SimModel = {
  intent: DriveToken;
  /** 0–255 preset from /setSpeed */
  speed255: number;
  vFL: number;
  vFR: number;
  vRL: number;
  vRR: number;
  scannerPhaseRad: number;
  /** Fake reverse obstacle proximity for db when backing up (cm) — informational */
  reverseProximityCm: number;
};

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function linearGain(model: SimModel): number {
  return (model.speed255 / 255) * MAX_LINEAR_MS;
}

function setWheelTargets(model: SimModel): { fl: number; fr: number; rl: number; rr: number } {
  const g = linearGain(model);
  const arcInner = 0.55;
  const arcOuter = 1;
  switch (model.intent) {
    case "STOP":
      return { fl: 0, fr: 0, rl: 0, rr: 0 };
    case "W":
      return { fl: g, fr: g, rl: g, rr: g };
    case "S":
      return { fl: -g, fr: -g, rl: -g, rr: -g };
    case "A":
      return { fl: -g, fr: g, rl: -g, rr: g };
    case "D":
      return { fl: g, fr: -g, rl: g, rr: -g };
    case "WA":
      return { fl: g * arcInner, fr: g * arcOuter, rl: g * arcInner, rr: g * arcOuter };
    case "WD":
      return { fl: g * arcOuter, fr: g * arcInner, rl: g * arcOuter, rr: g * arcInner };
    case "SA":
      return { fl: -g * arcInner, fr: -g * arcOuter, rl: -g * arcInner, rr: -g * arcOuter };
    case "SD":
      return { fl: -g * arcOuter, fr: -g * arcInner, rl: -g * arcOuter, rr: -g * arcInner };
    default:
      return { fl: 0, fr: 0, rl: 0, rr: 0 };
  }
}

function slewToward(current: number, target: number, dt: number): number {
  const alpha = 1 - Math.exp(-VELOCITY_SLEW * dt);
  return current + (target - current) * alpha;
}

function tickModel(model: SimModel, dt: number): void {
  const t = setWheelTargets(model);
  model.vFL = slewToward(model.vFL, t.fl, dt);
  model.vFR = slewToward(model.vFR, t.fr, dt);
  model.vRL = slewToward(model.vRL, t.rl, dt);
  model.vRR = slewToward(model.vRR, t.rr, dt);

  model.scannerPhaseRad += dt * 0.85;
  model.reverseProximityCm = Math.max(
    8,
    Math.min(
      180,
      95 + 55 * Math.sin(model.scannerPhaseRad * 0.37) + 22 * Math.cos(model.scannerPhaseRad * 0.61),
    ),
  );
}

function telemetryJson(model: SimModel): string {
  const dt = 1 / 30;
  tickModel(model, dt);

  const sweepSpan =
    PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MAX_DEG - PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG;
  const s = Math.sin(model.scannerPhaseRad);
  const aDeg = Math.round(
    PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG + ((s + 1) / 2) * sweepSpan,
  );
  const sR = Math.sin(model.scannerPhaseRad + 0.55);
  const aRearDeg = Math.round(
    PROJECT4_DOCUMENTED_MCU_SCANNER_SWEEP_MIN_DEG + ((sR + 1) / 2) * sweepSpan,
  );
  const df = Math.round(
    Math.max(15, Math.min(200, 110 + 48 * Math.sin(model.scannerPhaseRad * 1.1))),
  );
  const db = Math.round(model.reverseProximityCm);

  const backing = model.intent === "S" || model.intent === "SA" || model.intent === "SD";
  const dbEffective = backing
    ? Math.round(Math.min(db, 14 + 14 * (0.5 + 0.5 * Math.sin(model.scannerPhaseRad * 2.4))))
    : db;

  const ax = 0.02 * Math.sin(model.scannerPhaseRad * 2.1);
  const ay = 0.01 * Math.cos(model.scannerPhaseRad * 1.7);
  const az = 9.81 + 0.03 * Math.sin(model.scannerPhaseRad * 0.9);

  const payload = {
    vFL: Number(model.vFL.toFixed(4)),
    vFR: Number(model.vFR.toFixed(4)),
    vRL: Number(model.vRL.toFixed(4)),
    vRR: Number(model.vRR.toFixed(4)),
    ax: Number(ax.toFixed(4)),
    ay: Number(ay.toFixed(4)),
    az: Number(az.toFixed(4)),
    a: aDeg,
    aF: aDeg,
    aR: aRearDeg,
    df,
    db: dbEffective,
  };

  return JSON.stringify(payload);
}

function cors(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const model: SimModel = {
  intent: "STOP",
  speed255: 180,
  vFL: 0,
  vFR: 0,
  vRL: 0,
  vRR: 0,
  scannerPhaseRad: 0,
  reverseProximityCm: 120,
};

const server = http.createServer((req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/data") {
    const body = telemetryJson(model);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
    return;
  }

  if (path === "/move") {
    const dirRaw = url.searchParams.get("dir")?.trim().toUpperCase() ?? "";
    const dir = dirRaw as DriveToken;
    if (!VALID_DIRS.has(dir)) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Unknown dir: ${dirRaw}`);
      return;
    }
    model.intent = dir;
    console.info(`[mock-mcu] /move dir=${dir}`);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK");
    return;
  }

  if (path === "/setSpeed") {
    const valRaw = url.searchParams.get("val");
    const val = valRaw != null ? Number(valRaw) : NaN;
    if (!Number.isFinite(val)) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Missing or invalid val");
      return;
    }
    model.speed255 = clamp255(val);
    console.info(`[mock-mcu] /setSpeed val=${model.speed255}`);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(PORT, HOST, () => {
  console.info(
    `[mock-mcu] Listening on http://${HOST}:${PORT} — /data /move /setSpeed (CORS enabled). Env: MOCK_MCU_PORT, MOCK_MCU_HOST.`,
  );
});
