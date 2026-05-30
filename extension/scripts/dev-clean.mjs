/**
 * Free TCP ports commonly left bound after interrupted `npm start` / bridge dev.
 * Cross-platform (uses kill-port). Does not kill arbitrary Node processes.
 *
 * Usage:
 *   npm run dev:clean
 *   npm run dev:clean -- --dry-run
 *
 * Env:
 *   DEV_CLEAN_PORTS — comma-separated ports (default: 9998,9999,9987 or T3D_WS_PORT if set alone)
 *   T3D_WS_PORT — when DEV_CLEAN_PORTS unset: if set, that port only; else 9998 + 9999 + AI bridge port
 *   T3D_MODEL_BROKER_WS_PORT — merged into default list when using implicit defaults
 *   AI_BRIDGE_PORT — merged into default list (defaults to 9987 when unset)
 */

import { createServer } from "node:net";
import process from "node:process";

const DEFAULT_SERIAL_BROKER_PORT = 9998;
const DEFAULT_MODEL_BROKER_PORT = 9999;
const DEFAULT_AI_BRIDGE_PORT = 9987;

function parsePorts() {
  const raw = process.env.DEV_CLEAN_PORTS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 65535);
  }
  const one = process.env.T3D_WS_PORT?.trim();
  if (one) {
    const n = Number.parseInt(one, 10);
    if (Number.isFinite(n) && n > 0 && n <= 65535) return [n];
  }
  const modelRaw = process.env.T3D_MODEL_BROKER_WS_PORT?.trim();
  const modelN = modelRaw ? Number.parseInt(modelRaw, 10) : DEFAULT_MODEL_BROKER_PORT;
  const modelOk = Number.isFinite(modelN) && modelN > 0 && modelN <= 65535 ? modelN : DEFAULT_MODEL_BROKER_PORT;
  const aiRaw = process.env.AI_BRIDGE_PORT?.trim();
  const aiN = aiRaw ? Number.parseInt(aiRaw, 10) : DEFAULT_AI_BRIDGE_PORT;
  const aiOk = Number.isFinite(aiN) && aiN > 0 && aiN <= 65535 ? aiN : DEFAULT_AI_BRIDGE_PORT;
  return [...new Set([DEFAULT_SERIAL_BROKER_PORT, modelOk, aiOk])];
}

function canBindLocalPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(null);
      }
    });
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || process.argv.includes("-n");
  const ports = parsePorts();
  const unique = [...new Set(ports)];

  console.log("[dev-clean] Ports:", unique.join(", "));
  if (dryRun) {
    for (const port of unique) {
      const ok = await canBindLocalPort(port);
      if (ok === true) {
        console.log(`  ${port}: free (127.0.0.1 bind test)`);
      } else if (ok === false) {
        console.log(`  ${port}: in use (EADDRINUSE)`);
      } else {
        console.log(`  ${port}: unknown (could not determine; try without --dry-run)`);
      }
    }
    return;
  }

  const { default: killPort } = await import("kill-port");

  for (const port of unique) {
    try {
      await killPort(port);
      console.log(`[dev-clean] Signaled processes on port ${port} to exit.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[dev-clean] Port ${port}: ${msg}`);
    }
  }

  console.log("[dev-clean] Done. If a port still sticks, stop the owning terminal or retry with elevated rights (rare).");
}

main().catch((e) => {
  console.error("[dev-clean] Failed:", e);
  process.exitCode = 1;
});
