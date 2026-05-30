import * as vscode from "vscode";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import type { WebviewMessage } from "./types";
import { getAiBridgePairingToken } from "./ai-bridge-pairing";

let aiBridgeProcess: child_process.ChildProcess | null = null;
let outputChannel: vscode.OutputChannel | undefined;
let externalAiBridgeDetected = false;
let getCurrentPanel: (() => vscode.WebviewPanel | undefined) | null = null;

const AI_BRIDGE_LISTEN_WAIT_TIMEOUT_MS = 30_000;
const AI_BRIDGE_LISTEN_POLL_INTERVAL_MS = 120;

function clampPort(n: number): number {
  return Math.min(65535, Math.max(1, Math.trunc(n)));
}

function getAiBridgePort(): number {
  const cfg = vscode.workspace.getConfiguration("ternion.ws");
  return clampPort(cfg.get<number>("aiBrokerPort", 9987));
}

function probePortOpen(host: string, port: number, timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForPortOpen(host: string, port: number): Promise<boolean> {
  const deadline = Date.now() + AI_BRIDGE_LISTEN_WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await probePortOpen(host, port)) return true;
    await new Promise((r) => setTimeout(r, AI_BRIDGE_LISTEN_POLL_INTERVAL_MS));
  }
  return false;
}

function resolveNodeExecutable(log: (line: string) => void): string {
  const fromEnv = process.env.TERNION_AI_BRIDGE_NODE?.trim();
  if (fromEnv) {
    if (fs.existsSync(fromEnv)) {
      log(`[ai-bridge-handle] Using TERNION_AI_BRIDGE_NODE: ${fromEnv}`);
      return fromEnv;
    }
    log(`[ai-bridge-handle] TERNION_AI_BRIDGE_NODE not found on disk: ${fromEnv} — falling back.`);
  }
  // Prefer standalone node on PATH; fall back to Electron.
  try {
    if (process.platform === "win32") {
      const out = child_process
        .execFileSync("where.exe", ["node"], {
          encoding: "utf8",
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
        })
        .trim();
      const first = out.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim();
      if (first && fs.existsSync(first)) {
        log(`[ai-bridge-handle] Using standalone Node from PATH: ${first}`);
        return first;
      }
    }
  } catch {
    // ignore
  }
  log("[ai-bridge-handle] No standalone Node on PATH — using process.execPath (Electron).");
  return process.execPath;
}

/** Probe port + extension-owned process and push `ai-bridge-status` to the webview (e.g. on panel open). */
export async function refreshAiBridgeStatusToPanel(): Promise<void> {
  const port = getAiBridgePort();
  if (aiBridgeProcess) {
    externalAiBridgeDetected = false;
    sendAiBridgeStatusToPanel(true);
    return;
  }
  const open = await probePortOpen("127.0.0.1", port);
  externalAiBridgeDetected = open;
  sendAiBridgeStatusToPanel(open);
}

function sendAiBridgeStatusToPanel(running: boolean) {
  const panel = getCurrentPanel?.();
  if (!panel) return;
  panel.webview.postMessage({
    type: "ai-bridge-status",
    status: {
      running,
      port: running ? getAiBridgePort() : null,
      managedByExtension: running && aiBridgeProcess !== null,
      externalProcess: running && aiBridgeProcess === null && externalAiBridgeDetected,
    },
  });
}

export function setGetCurrentPanelCallback(callback: () => vscode.WebviewPanel | undefined): void {
  getCurrentPanel = callback;
}

type AiBridgeStartOverrides = {
  /** Serial broker ws url for HostSession attach (e.g. ws://127.0.0.1:9998). */
  t3dWsClientUrl?: string;
  bitstream?: {
    serialPath?: string;
    baudRate?: number;
    mode?: "data" | "line" | "both";
    autoDetectPort?: boolean;
  };
};

function normalizeOverrides(
  raw: unknown,
): AiBridgeStartOverrides | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const out: AiBridgeStartOverrides = {};
  if (typeof o.t3dWsClientUrl === "string" && o.t3dWsClientUrl.trim().length > 0) {
    out.t3dWsClientUrl = o.t3dWsClientUrl.trim();
  }
  if (o.bitstream && typeof o.bitstream === "object" && !Array.isArray(o.bitstream)) {
    const b = o.bitstream as Record<string, unknown>;
    const bit: AiBridgeStartOverrides["bitstream"] = {};
    if (typeof b.serialPath === "string" && b.serialPath.trim().length > 0) {
      bit.serialPath = b.serialPath.trim();
    }
    if (typeof b.baudRate === "number" && Number.isFinite(b.baudRate) && b.baudRate > 0) {
      bit.baudRate = Math.trunc(b.baudRate);
    }
    if (b.mode === "data" || b.mode === "line" || b.mode === "both") {
      bit.mode = b.mode;
    }
    if (typeof b.autoDetectPort === "boolean") {
      bit.autoDetectPort = b.autoDetectPort;
    }
    if (Object.keys(bit).length > 0) {
      out.bitstream = bit;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function startAiBridge(extensionPath?: string, overridesRaw?: unknown): Promise<void> {
  const port = getAiBridgePort();
  if (aiBridgeProcess) {
    sendAiBridgeStatusToPanel(true);
    return;
  }

  const alreadyOpen = await probePortOpen("127.0.0.1", port);
  if (alreadyOpen) {
    externalAiBridgeDetected = true;
    sendAiBridgeStatusToPanel(true);
    return;
  }
  externalAiBridgeDetected = false;

  const out = outputChannel ?? vscode.window.createOutputChannel("TERNION AI Bridge");
  outputChannel = out;

  const nodeExe = resolveNodeExecutable((line) => out.appendLine(line));
  const useElectronAsNode = nodeExe === process.execPath;
  const cwd = extensionPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  const scriptPath = vscode.Uri.file(path.join(extensionPath || "", "out", "ai", "run.ai.bridge.js")).fsPath;
  if (!fs.existsSync(scriptPath)) {
    out.appendLine(`[ai-bridge-handle] ERROR: AI bridge entry not found: ${scriptPath}`);
    out.show(true);
    void vscode.window.showErrorMessage(
      `AI bridge entry missing (${scriptPath}). The VSIX may be missing build output; re-run “npm run compile” then re-package.`,
    );
    sendAiBridgeStatusToPanel(false);
    return;
  }

  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: "1" };
  env.AI_BRIDGE_PORT = String(port);
  // Bind all interfaces by default so both 127.0.0.1 and LAN work.
  env.AI_BRIDGE_BIND = env.AI_BRIDGE_BIND ?? "0.0.0.0";
  // Pairing token: required by the AI bridge to accept browser clients.
  env.AI_BRIDGE_PAIRING_TOKEN = env.AI_BRIDGE_PAIRING_TOKEN ?? getAiBridgePairingToken();
  // Ensure bridge uses the serial broker port for its HostSession attach.
  // (`parseBitstreamAttachCliOptions` uses T3D_WS_CLIENT_URL as fallback)
  const wsCfg = vscode.workspace.getConfiguration("ternion.ws");
  const serialBrokerPort = clampPort(wsCfg.get<number>("brokerPort", 9998));
  env.T3D_WS_CLIENT_URL = `ws://127.0.0.1:${serialBrokerPort}`;

  const overrides = normalizeOverrides(overridesRaw);
  if (overrides?.t3dWsClientUrl) {
    env.T3D_WS_CLIENT_URL = overrides.t3dWsClientUrl;
  }
  if (overrides?.bitstream?.serialPath) {
    env.BITSTREAM_SERIAL_PATH = overrides.bitstream.serialPath;
  }
  if (overrides?.bitstream?.baudRate) {
    env.BITSTREAM_BAUD_RATE = String(overrides.bitstream.baudRate);
  }
  if (overrides?.bitstream?.mode) {
    env.BITSTREAM_MODE = overrides.bitstream.mode;
  }
  if (typeof overrides?.bitstream?.autoDetectPort === "boolean") {
    env.BITSTREAM_AUTO_DETECT_PORT = overrides.bitstream.autoDetectPort ? "true" : "false";
  }

  if (useElectronAsNode) {
    env.ELECTRON_RUN_AS_NODE = "1";
  } else {
    delete env.ELECTRON_RUN_AS_NODE;
  }

  out.appendLine(`[ai-bridge-handle] Starting AI bridge on port ${port}`);
  out.appendLine(`[ai-bridge-handle] Node: ${nodeExe}`);
  out.appendLine(`[ai-bridge-handle] Script: ${scriptPath}`);
  out.appendLine(`[ai-bridge-handle] CWD: ${cwd}`);

  const stderrTail: string[] = [];
  const pushTail = (raw: string) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
    for (const line of lines) {
      if (!line) continue;
      stderrTail.push(line);
      if (stderrTail.length > 16) stderrTail.shift();
    }
  };

  aiBridgeProcess = child_process.spawn(nodeExe, [scriptPath], { cwd, env });
  aiBridgeProcess.stdout?.on("data", (data) => out.append(data.toString()));
  aiBridgeProcess.stderr?.on("data", (data) => {
    const s = data.toString();
    out.append(`[ERROR] ${s}`);
    pushTail(s);
  });

  const exitPromise = new Promise<{ code: number | null }>((resolve) => {
    aiBridgeProcess?.once("close", (code) => resolve({ code }));
  });

  aiBridgeProcess.on("close", (code) => {
    out.appendLine(`\n🛑 AI bridge exited with code ${code}`);
    aiBridgeProcess = null;
    externalAiBridgeDetected = false;
    sendAiBridgeStatusToPanel(false);
  });

  const ready = await Promise.race([
    waitForPortOpen("127.0.0.1", port).then((ok) => ({ ok, exited: false as const, code: null as number | null })),
    exitPromise.then((r) => ({ ok: false, exited: true as const, code: r.code })),
  ]);
  sendAiBridgeStatusToPanel(ready.ok);
  if (!ready.ok) {
    out.show(true);
    const tail = stderrTail.length > 0 ? `\nLast error lines:\n- ${stderrTail.join("\n- ")}` : "";
    void vscode.window.showWarningMessage(
      ready.exited
        ? `AI bridge exited before opening port ${port} (code ${ready.code ?? "unknown"}). See output channel “TERNION AI Bridge”.${tail}`
        : `AI bridge did not open port ${port} in time. See output channel “TERNION AI Bridge”.${tail}`,
    );
  }
}

export async function stopAiBridge(): Promise<void> {
  const port = getAiBridgePort();
  if (aiBridgeProcess) {
    outputChannel?.appendLine("Stopping AI bridge...");
    if (process.platform === "win32") {
      child_process.exec(`taskkill /pid ${aiBridgeProcess.pid} /T /F`);
    } else {
      aiBridgeProcess.kill();
    }
    aiBridgeProcess = null;
    externalAiBridgeDetected = false;
    sendAiBridgeStatusToPanel(false);
    return;
  }

  const externalRunning = await probePortOpen("127.0.0.1", port);
  externalAiBridgeDetected = externalRunning;
  sendAiBridgeStatusToPanel(externalRunning);
  if (externalRunning) {
    void vscode.window.showWarningMessage(
      `An AI bridge is running on port ${port} but is not managed by this extension. Stop it from its own terminal.`,
    );
    return;
  }
  void vscode.window.showInformationMessage("AI bridge is not running.");
}

export function handleAiBridgeWebviewMessage(message: WebviewMessage, extensionPath?: string): boolean {
  switch (message.type) {
    case "ai-bridge-start":
      void startAiBridge(extensionPath, message.options);
      return true;
    case "ai-bridge-stop":
      void stopAiBridge();
      return true;
    case "ai-bridge-get-status":
      void refreshAiBridgeStatusToPanel();
      return true;
    default:
      return false;
  }
}

