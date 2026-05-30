/**
 * Single-entrypoint dev start (works on Windows without cross-env).
 *
 * `npm start` runs this script, which configures the dev supervisor env, then
 * imports `dev-supervisor.mjs`.
 *
 * Env:
 * - T3D_START_MODE: "full" (default) or "browser"
 *   - full: spawns `npm run start:inner` (bridge + watch + build --watch)
 *   - browser: spawns `npm run dev:webview` (fast Vite only)
 * - DEV_SUPERVISOR_*: forwarded/overrides dev-supervisor defaults
 */

import process from "node:process";
import { createServer } from "node:net";

const modeRaw = (process.env.T3D_START_MODE || "full").trim().toLowerCase();
const mode = modeRaw === "browser" ? "browser" : "full";

async function ensureSupervisorPortFree(port) {
  const canBind = await new Promise((resolve) => {
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

  if (canBind === true) {
    return;
  }
  if (canBind === false) {
    const { default: killPort } = await import("kill-port");
    await killPort(port);
    return;
  }
  // unknown error; try to continue and let supervisor surface it
}

if (!process.env.DEV_SUPERVISOR_CMD) {
  process.env.DEV_SUPERVISOR_CMD =
    mode === "browser" ? "npm run dev:webview" : "npm run start:inner";
}
if (!process.env.DEV_SUPERVISOR_PRE_CLEAN) {
  process.env.DEV_SUPERVISOR_PRE_CLEAN = "1";
}
if (!process.env.DEV_SUPERVISOR_PORT) {
  process.env.DEV_SUPERVISOR_PORT = "9910";
}

console.log(`[start] mode=${mode}`);
console.log(`[start] supervisor cmd=${process.env.DEV_SUPERVISOR_CMD}`);

await ensureSupervisorPortFree(Number.parseInt(process.env.DEV_SUPERVISOR_PORT, 10) || 9910);
await import("./dev-supervisor.mjs");

