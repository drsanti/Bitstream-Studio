import * as vscode from "vscode";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import type { WebviewMessage } from "./types";

// Module-level process state
let bridgeProcess: child_process.ChildProcess | null = null;
let outputChannel: vscode.OutputChannel | undefined;
let externalBridgeDetected = false;
let lastBridgeWarning: string | undefined;
/** Serializes concurrent `initializeSerialBridge` calls (activate vs Open in Browser). */
let serialBridgeInitPromise: Promise<void> | null = null;

const BRIDGE_LISTEN_WAIT_TIMEOUT_MS = 20_000;
const BRIDGE_LISTEN_POLL_INTERVAL_MS = 120;

// Callback to get current panel (set by extension.ts)
let getCurrentPanel: (() => vscode.WebviewPanel | undefined) | null = null;

function clampBrokerPort(n: number): number {
  return Math.min(65535, Math.max(1, Math.trunc(n)));
}

/** Serial/bitstream broker vs model-downloader broker (see `ternion.ws.*` settings). */
function getConfiguredBrokerPorts(): { serial: number; model: number } {
  const cfg = vscode.workspace.getConfiguration("ternion.ws");
  return {
    serial: clampBrokerPort(cfg.get<number>("brokerPort", 9998)),
    model: clampBrokerPort(cfg.get<number>("modelBrokerPort", 9999)),
  };
}

interface BridgeStatusMeta {
  warning?: string;
  managedByExtension?: boolean;
  externalProcess?: boolean;
}

function probeBridgePortOpen(port: number, timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (open: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, "127.0.0.1");
  });
}

/**
 * Prefer a standalone `node` on PATH (matches how `serialport` was installed/built via npm).
 * `process.execPath` is the IDE (Electron); native addons often fail there even with NODE_PATH.
 * Override with env `TERNION_SERIAL_BRIDGE_NODE` (full path to node.exe / node).
 */
function resolveSerialBridgeNodeExecutable(log: (line: string) => void): string {
  const fromEnv = process.env.TERNION_SERIAL_BRIDGE_NODE?.trim();
  if (fromEnv) {
    if (fs.existsSync(fromEnv)) {
      log(`[bridge-handle] Using TERNION_SERIAL_BRIDGE_NODE: ${fromEnv}`);
      return fromEnv;
    }
    log(`[bridge-handle] TERNION_SERIAL_BRIDGE_NODE not found on disk: ${fromEnv} — falling back.`);
  }
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
        log(`[bridge-handle] Using standalone Node from PATH: ${first}`);
        return first;
      }
    } else {
      const out = child_process
        .execFileSync("/bin/sh", ["-c", "command -v node"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        })
        .trim();
      if (out && fs.existsSync(out)) {
        log(`[bridge-handle] Using standalone Node from PATH: ${out}`);
        return out;
      }
    }
  } catch {
    // where / command -v failed
  }
  log(
    "[bridge-handle] No standalone Node on PATH — using process.execPath (Electron). If COM list stays empty, install Node.js (so `node` is on PATH) or set TERNION_SERIAL_BRIDGE_NODE.",
  );
  return process.execPath;
}

async function waitForBridgePortOpen(
  port: number,
  timeoutMs = BRIDGE_LISTEN_WAIT_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeBridgePortOpen(port)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, BRIDGE_LISTEN_POLL_INTERVAL_MS));
  }
  return false;
}

function buildBridgeStatusPayload(running: boolean, meta?: BridgeStatusMeta) {
  const serialPort = getConfiguredBrokerPorts().serial;
  return {
    running,
    bridgeRunning: running,
    port: running ? serialPort : null,
    managedByExtension: meta?.managedByExtension ?? (running && bridgeProcess !== null),
    externalProcess: meta?.externalProcess ?? (running && bridgeProcess === null && externalBridgeDetected),
    warning: meta?.warning,
  };
}

/**
 * Set callback to get current panel for sending messages
 */
export function setGetCurrentPanelCallback(callback: () => vscode.WebviewPanel | undefined): void {
  getCurrentPanel = callback;
}

async function runInitializeSerialBridge(extensionPath?: string): Promise<void> {
  const ports = getConfiguredBrokerPorts();

  if (bridgeProcess) {
    outputChannel?.appendLine(
      "[bridge-handle] Serial Bridge already running in this extension process; idempotent init.",
    );
    sendBridgeStatusToPanel(true, {
      managedByExtension: true,
      externalProcess: false,
    });
    return;
  }

  const portAlreadyOpen = await probeBridgePortOpen(ports.serial);
  if (portAlreadyOpen) {
    externalBridgeDetected = true;
    const warning = `Detected an existing backend process on serial broker port ${ports.serial}. Skipping new Serial Bridge process to avoid duplicates. If the serial port list stays empty, that process may not be the full TERNION combined bridge — stop it (or run dev:clean) and reload the window.`;
    lastBridgeWarning = warning;
    outputChannel?.appendLine(`[bridge-handle] ${warning}`);
    vscode.window.showWarningMessage(warning);
    sendBridgeStatusToPanel(true, {
      warning,
      managedByExtension: false,
      externalProcess: true,
    });
    return;
  }

  externalBridgeDetected = false;
  lastBridgeWarning = undefined;

  try {
    const bridgeOut =
      outputChannel ?? vscode.window.createOutputChannel("TERNION Serial Bridge");
    outputChannel = bridgeOut;

    bridgeOut.appendLine("🚀 Starting Serial Bridge process...");

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    /** Prefer extension install dir so `NODE_PATH` + native deps resolve like `npm start` from the repo. */
    const cwd = extensionPath || workspaceFolder || process.cwd();

    const bridgeScriptPath = vscode.Uri.file(path.join(extensionPath || "", "out", "combined-bridge-entry.js")).fsPath;
    const bridgeNode = resolveSerialBridgeNodeExecutable((line) => bridgeOut.appendLine(line));
    const useElectronAsNode = bridgeNode === process.execPath;

    bridgeOut.appendLine(`[bridge-handle] OS Detection: ${process.platform}`);
    bridgeOut.appendLine(`[bridge-handle] Bridge Node: ${bridgeNode}`);
    bridgeOut.appendLine(`[bridge-handle] Extension host execPath (Electron): ${process.execPath}`);
    bridgeOut.appendLine(`[bridge-handle] Script: ${bridgeScriptPath}`);
    bridgeOut.appendLine(`[bridge-handle] CWD: ${cwd}`);

    const stagedSerialModules =
      extensionPath && fs.existsSync(path.join(extensionPath, "out", "serialport-runtime", "node_modules"))
        ? path.join(extensionPath, "out", "serialport-runtime", "node_modules")
        : "";
    const nodePathMerged = stagedSerialModules
      ? [stagedSerialModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter)
      : process.env.NODE_PATH;
    if (stagedSerialModules) {
      bridgeOut.appendLine(`[bridge-handle] NODE_PATH (serialport runtime): ${stagedSerialModules}`);
    }

    bridgeOut.appendLine(
      `[bridge-handle] Broker ports: serial=${ports.serial} model=${ports.model}${ports.serial === ports.model ? " (single-server mode)" : ""}`,
    );

    const bridgeEnv: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: "1" };
    bridgeEnv.T3D_WS_PORT = String(ports.serial);
    bridgeEnv.T3D_MODEL_BROKER_WS_PORT = String(ports.model);
    delete bridgeEnv.BITSTREAM2_DEV_LOOPBACK;
    if (nodePathMerged) {
      bridgeEnv.NODE_PATH = nodePathMerged;
    }
    if (useElectronAsNode) {
      bridgeEnv.ELECTRON_RUN_AS_NODE = "1";
    } else {
      delete bridgeEnv.ELECTRON_RUN_AS_NODE;
    }

    bridgeProcess = child_process.spawn(bridgeNode, [bridgeScriptPath], {
      cwd: cwd,
      env: bridgeEnv,
    });

    bridgeProcess.on("error", (err) => {
      const msg = `[CRITICAL ERROR] Failed to spawn bridge process: ${err.message}`;
      outputChannel?.appendLine(msg);
      console.error(msg);
      vscode.window.showErrorMessage(`Serial Bridge error: ${err.message}`);
    });

    bridgeProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      outputChannel?.append(text);

      // If we see the "listening" message, notify the UI
      if (text.includes("[t3d-ws-serial] listening") || text.includes("[t3d-ws] listening on")) {
        sendBridgeStatusToPanel(true, {
          managedByExtension: true,
          externalProcess: false,
        });
      }
    });

    bridgeProcess.stderr?.on("data", (data) => {
      outputChannel?.append(`[ERROR] ${data.toString()}`);
    });

    bridgeProcess.on("close", (code) => {
      outputChannel?.appendLine(`\n🛑 Serial Bridge process exited with code ${code}`);
      bridgeProcess = null;
      externalBridgeDetected = false;
      sendBridgeStatusToPanel(false);
    });

    vscode.window.setStatusBarMessage("Starting Serial Bridge...", 3000);

    const serialReady = await waitForBridgePortOpen(ports.serial);
    let modelReady = true;
    if (ports.model !== ports.serial) {
      modelReady = await waitForBridgePortOpen(ports.model, 15_000);
    }
    if (!serialReady || !modelReady) {
      const msg = `[bridge-handle] Timed out waiting for broker(s) on 127.0.0.1 (serial=${ports.serial} ok=${serialReady}, model=${ports.model} ok=${modelReady}). Check TERNION Serial Bridge output.`;
      outputChannel?.appendLine(msg);
      vscode.window.showWarningMessage(
        `Serial Bridge did not open expected port(s) in time (serial ${ports.serial}${ports.model !== ports.serial ? `, model ${ports.model}` : ""}). See output channel “TERNION Serial Bridge”.`,
      );
    } else {
      sendBridgeStatusToPanel(true, {
        managedByExtension: true,
        externalProcess: false,
      });
    }
  } catch (error: unknown) {
    const errorMessage = `Failed to spawn Serial Bridge: ${error instanceof Error ? error.message : String(error)}`;
    console.error("❌", errorMessage);
    vscode.window.showErrorMessage(errorMessage);
  }
}

/**
 * Initialize Serial Bridge (Spawns the background process).
 * Waits until TCP accepts on the configured serial (and model) broker ports after spawn.
 */
export async function initializeSerialBridge(extensionPath?: string): Promise<void> {
  if (serialBridgeInitPromise) {
    return serialBridgeInitPromise;
  }
  serialBridgeInitPromise = runInitializeSerialBridge(extensionPath).finally(() => {
    serialBridgeInitPromise = null;
  });
  return serialBridgeInitPromise;
}

/**
 * Send bridge status to panel
 */
function sendBridgeStatusToPanel(running: boolean, meta?: BridgeStatusMeta) {
  if (meta?.warning !== undefined) {
    lastBridgeWarning = meta.warning;
  } else if (!running || meta?.managedByExtension === true) {
    lastBridgeWarning = undefined;
  }

  const panel = getCurrentPanel?.();
  if (panel) {
    panel.webview.postMessage({
      type: "serial-bridge-status-changed",
      status: buildBridgeStatusPayload(running, {
        managedByExtension: meta?.managedByExtension,
        externalProcess: meta?.externalProcess,
        warning: lastBridgeWarning,
      }),
    });
  }
}

/**
 * Start Serial Bridge (command handler)
 */
export async function startSerialBridge(): Promise<void> {
  await initializeSerialBridge();
}

/**
 * Stop Serial Bridge
 */
export async function stopSerialBridge(): Promise<void> {
  const ports = getConfiguredBrokerPorts();
  if (bridgeProcess) {
    outputChannel?.appendLine("Stopping Serial Bridge process...");

    // On Windows, taskkill might be cleaner to ensure child processes are gone
    if (process.platform === "win32") {
      child_process.exec(`taskkill /pid ${bridgeProcess.pid} /T /F`);
    } else {
      bridgeProcess.kill();
    }

    bridgeProcess = null;
    externalBridgeDetected = false;
    lastBridgeWarning = undefined;
    vscode.window.setStatusBarMessage("Serial Bridge stopped", 3000);
  } else {
    const externalRunning = await probeBridgePortOpen(ports.serial);
    externalBridgeDetected = externalRunning;
    if (externalRunning) {
      const warning = `A backend process is running on serial broker port ${ports.serial}, but it is not managed by this extension. Stop it from its own terminal.`;
      lastBridgeWarning = warning;
      vscode.window.showWarningMessage(warning);
      sendBridgeStatusToPanel(true, {
        warning,
        managedByExtension: false,
        externalProcess: true,
      });
      return;
    }

    lastBridgeWarning = undefined;
    vscode.window.showInformationMessage("Serial Bridge is not running.");
  }
}

/**
 * Handle Serial Bridge related webview messages
 */
export function handleSerialBridgeWebviewMessage(message: WebviewMessage, panel: vscode.WebviewPanel): boolean {
  switch (message.type) {
    case "serial-bridge-get-status":
      void sendBridgeStatus(panel);
      return true;

    case "serial-bridge-start":
      startSerialBridge();
      return true;

    case "serial-bridge-stop":
      stopSerialBridge();
      return true;

    default:
      return false;
  }
}

/**
 * Send bridge status to webview
 */
export async function sendBridgeStatus(panel: vscode.WebviewPanel): Promise<void> {
  const serialPort = getConfiguredBrokerPorts().serial;
  const managedRunning = bridgeProcess !== null;
  if (!managedRunning) {
    externalBridgeDetected = await probeBridgePortOpen(serialPort);
  }
  const isRunning = managedRunning || externalBridgeDetected;

  if (!isRunning) {
    lastBridgeWarning = undefined;
  }

  panel.webview.postMessage({
    type: "serial-bridge-status",
    status: buildBridgeStatusPayload(isRunning, {
      warning: lastBridgeWarning,
      managedByExtension: managedRunning,
      externalProcess: !managedRunning && isRunning,
    }),
  });
}
