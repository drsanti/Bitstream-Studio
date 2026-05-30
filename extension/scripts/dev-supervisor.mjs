/**
 * Dev Supervisor (local-only) for restarting the dev server from the browser.
 *
 * Why:
 * - Browser/webview cannot kill or restart local processes directly.
 * - Vite watch sometimes misses new files; restart is a common workflow.
 *
 * Security:
 * - Binds to 127.0.0.1 only.
 * - Optional token gate via DEV_SUPERVISOR_TOKEN (sent as X-Dev-Token header).
 *
 * Env:
 * - DEV_SUPERVISOR_PORT: HTTP port (default: 9910)
 * - DEV_SUPERVISOR_CMD: command to run (default: "npm start")
 * - DEV_SUPERVISOR_CWD: working directory (default: process.cwd())
 * - DEV_SUPERVISOR_TOKEN: optional token; when set, required for POST endpoints
 * - DEV_SUPERVISOR_PRE_CLEAN: "1" to run `node scripts/dev-clean.mjs` before start/restart (default: 1)
 */

import { spawn } from "node:child_process";
import http from "node:http";
import process from "node:process";

const DEFAULT_PORT = 9910;
const port = toPort(process.env.DEV_SUPERVISOR_PORT) ?? DEFAULT_PORT;
const cwd = (process.env.DEV_SUPERVISOR_CWD && process.env.DEV_SUPERVISOR_CWD.trim()) || process.cwd();
// Default to browser dev server (fast iteration). Use DEV_SUPERVISOR_CMD to override, e.g. "npm start".
const cmd = (process.env.DEV_SUPERVISOR_CMD && process.env.DEV_SUPERVISOR_CMD.trim()) || "npm run dev:webview";
const token = (process.env.DEV_SUPERVISOR_TOKEN && process.env.DEV_SUPERVISOR_TOKEN.trim()) || null;
const preClean = (process.env.DEV_SUPERVISOR_PRE_CLEAN ?? "1").trim() !== "0";

/** @type {import("node:child_process").ChildProcess | null} */
let child = null;
/** @type {"stopped" | "starting" | "running" | "restarting" | "error"} */
let status = "stopped";
/** @type {string | null} */
let lastError = null;
/** @type {number} */
let restartCounter = 0;

function toPort(value) {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 65535) return null;
  return n;
}

function json(res, code, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,x-dev-token",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function okCorsPreflight(res) {
  res.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,x-dev-token",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "no-store",
  });
  res.end();
}

function requireToken(req) {
  if (!token) return true;
  const got = req.headers["x-dev-token"];
  return typeof got === "string" && got === token;
}

async function runPreClean() {
  if (!preClean) return;
  await execOne("node scripts/dev-clean.mjs", cwd);
}

function startChild() {
  lastError = null;
  status = "starting";
  child = spawn(cmd, {
    cwd,
    shell: true,
    stdio: "inherit",
    env: process.env,
    windowsHide: false,
  });
  status = "running";
  child.on("exit", (code, signal) => {
    if (child == null) return;
    child = null;
    status = "stopped";
    if (code != null && code !== 0) {
      lastError = `child exited with code ${code}`;
      status = "error";
    } else if (signal) {
      lastError = `child exited with signal ${signal}`;
      status = "error";
    }
  });
  child.on("error", (err) => {
    lastError = err instanceof Error ? err.message : String(err);
    status = "error";
  });
}

async function stopChild() {
  const p = child;
  if (!p || !p.pid) {
    child = null;
    status = "stopped";
    return;
  }
  child = null;
  await killProcessTree(p.pid);
  status = "stopped";
}

async function restartChild() {
  restartCounter++;
  status = "restarting";
  await stopChild();
  await runPreClean();
  startChild();
}

function execOne(command, execCwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, { cwd: execCwd, shell: true, stdio: "inherit", env: process.env });
    p.on("error", reject);
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${command}`));
    });
  });
}

function killProcessTree(pid) {
  if (process.platform === "win32") {
    return execOne(`taskkill /PID ${pid} /T /F`, cwd).catch(() => {});
  }
  // POSIX: best-effort kill the process group (if possible) then the pid.
  try {
    process.kill(-pid, "SIGTERM");
  } catch {}
  try {
    process.kill(pid, "SIGTERM");
  } catch {}
  return Promise.resolve();
}

function getStatusJson() {
  return {
    ok: true,
    status,
    restartCounter,
    childPid: child?.pid ?? null,
    cmd,
    cwd,
    preClean,
    tokenRequired: token != null,
    lastError,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    if (req.method === "OPTIONS") {
      okCorsPreflight(res);
      return;
    }
    if (url.pathname === "/status" && req.method === "GET") {
      json(res, 200, getStatusJson());
      return;
    }
    if (url.pathname === "/restart" && req.method === "POST") {
      if (!requireToken(req)) {
        json(res, 401, { ok: false, error: "Unauthorized (missing/invalid X-Dev-Token)" });
        return;
      }
      await restartChild();
      json(res, 200, getStatusJson());
      return;
    }
    if (url.pathname === "/stop" && req.method === "POST") {
      if (!requireToken(req)) {
        json(res, 401, { ok: false, error: "Unauthorized (missing/invalid X-Dev-Token)" });
        return;
      }
      status = "stopped";
      await stopChild();
      json(res, 200, getStatusJson());
      return;
    }
    json(res, 404, { ok: false, error: "Not found" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    json(res, 500, { ok: false, error: msg });
  }
});

server.listen(port, "127.0.0.1", async () => {
  console.log(`[dev-supervisor] listening on http://127.0.0.1:${port}`);
  console.log(`[dev-supervisor] cwd=${cwd}`);
  console.log(`[dev-supervisor] cmd=${cmd}`);
  console.log(`[dev-supervisor] preClean=${preClean ? "on" : "off"}`);
  console.log(`[dev-supervisor] token=${token ? "required" : "off"}`);
  await runPreClean();
  startChild();
});

