import * as vscode from "vscode";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";

let mockProcess: child_process.ChildProcess | null = null;
let outputChannel: vscode.OutputChannel | undefined;

function clampPort(n: number): number {
  return Math.min(65535, Math.max(1, Math.trunc(n)));
}

export function getProject4MockMcuPort(): number {
  const cfg = vscode.workspace.getConfiguration("ternion.project4");
  return clampPort(cfg.get<number>("mockMcuPort", 8787));
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

function resolveNodeExecutable(log: (line: string) => void): string {
  const fromEnv = process.env.TERNION_PROJECT4_MOCK_NODE?.trim();
  if (fromEnv) {
    if (fs.existsSync(fromEnv)) {
      log(`[project4-mock-mcu] Using TERNION_PROJECT4_MOCK_NODE: ${fromEnv}`);
      return fromEnv;
    }
    log(
      `[project4-mock-mcu] TERNION_PROJECT4_MOCK_NODE not found on disk: ${fromEnv} — falling back.`,
    );
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
        log(`[project4-mock-mcu] Using standalone Node from PATH: ${first}`);
        return first;
      }
    }
  } catch {
    // ignore
  }
  log("[project4-mock-mcu] No standalone Node on PATH — using process.execPath (Electron).");
  return process.execPath;
}

export async function startProject4MockMcu(extensionPath: string): Promise<void> {
  if (mockProcess) {
    void vscode.window.showInformationMessage(
      `Project 4 Mock MCU is already running (port ${getProject4MockMcuPort()}).`,
    );
    return;
  }

  const port = getProject4MockMcuPort();
  const busy = await probePortOpen("127.0.0.1", port);
  if (busy) {
    void vscode.window.showErrorMessage(
      `Port ${port} is already in use — choose another with setting **ternion.project4.mockMcuPort** or stop the process using this port.`,
    );
    return;
  }

  const scriptPath = path.join(extensionPath, "out", "project4-mock-mcu.js");
  if (!fs.existsSync(scriptPath)) {
    void vscode.window.showErrorMessage(
      `Project 4 Mock MCU bundle missing: ${scriptPath}. Reinstall the extension or rebuild from source.`,
    );
    return;
  }

  const out = outputChannel ?? vscode.window.createOutputChannel("TERNION Project 4 Mock MCU");
  outputChannel = out;

  const nodeExe = resolveNodeExecutable((line) => out.appendLine(line));
  const useElectronAsNode = nodeExe === process.execPath;
  const env: NodeJS.ProcessEnv = { ...process.env };
  env.MOCK_MCU_PORT = String(port);
  env.MOCK_MCU_HOST = env.MOCK_MCU_HOST ?? "127.0.0.1";
  if (useElectronAsNode) {
    env.ELECTRON_RUN_AS_NODE = "1";
  } else {
    delete env.ELECTRON_RUN_AS_NODE;
  }

  out.appendLine(`[project4-mock-mcu] Starting on http://${env.MOCK_MCU_HOST}:${port}`);
  out.appendLine(`[project4-mock-mcu] Node: ${nodeExe}`);
  out.appendLine(`[project4-mock-mcu] Script: ${scriptPath}`);
  out.show(true);

  mockProcess = child_process.spawn(nodeExe, [scriptPath], {
    cwd: extensionPath,
    env,
    windowsHide: true,
  });
  mockProcess.stdout?.on("data", (data) => out.append(data.toString()));
  mockProcess.stderr?.on("data", (data) => out.append(`[stderr] ${data.toString()}`));
  mockProcess.on("error", (err) => {
    out.appendLine(`[project4-mock-mcu] spawn error: ${err.message}`);
    mockProcess = null;
    void vscode.window.showErrorMessage(`Project 4 Mock MCU failed to start: ${err.message}`);
  });
  mockProcess.on("close", (code) => {
    out.appendLine(`\n[project4-mock-mcu] Exited with code ${code}`);
    mockProcess = null;
  });

  void vscode.window.showInformationMessage(
    `Project 4 Mock MCU started at http://127.0.0.1:${port} (set MCU base URL in Project 4 settings).`,
  );
}

export async function stopProject4MockMcu(options?: {
  silent?: boolean;
}): Promise<void> {
  const silent = options?.silent === true;
  if (!mockProcess) {
    if (!silent) {
      void vscode.window.showInformationMessage("Project 4 Mock MCU is not running.");
    }
    return;
  }
  const proc = mockProcess;
  mockProcess = null;
  try {
    if (process.platform === "win32" && proc.pid !== undefined) {
      child_process.exec(`taskkill /pid ${proc.pid} /T /F`, () => {
        /* ignore */
      });
    } else {
      proc.kill();
    }
  } catch {
    proc.kill();
  }
  outputChannel?.appendLine("[project4-mock-mcu] Stop requested.");
  if (!silent) {
    void vscode.window.showInformationMessage("Project 4 Mock MCU stopped.");
  }
}
