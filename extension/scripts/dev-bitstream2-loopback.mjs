/**
 * Bridge + Vite for Simulator telemetry (external bitstream-simulator extension).
 * Used by: npm run dev:bitstream2-loopback
 */
import { spawn } from "node:child_process";
import process from "node:process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const bridgeEnv = { ...process.env };
delete bridgeEnv.BITSTREAM2_DEV_LOOPBACK;

function spawnNpm(args, env)
{
  if (isWin)
  {
    /* Git Bash / MSYS often fails to spawn .cmd with shell:false (EINVAL). */
    const comspec = process.env.ComSpec ?? "cmd.exe";
    return spawn(comspec, ["/d", "/s", "/c", npmCmd, ...args], {
      env,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
  }

  return spawn(npmCmd, args, {
    env,
    stdio: "inherit",
    shell: false,
  });
}

const bridge = spawnNpm(["run", "start:bridge"], bridgeEnv);

const webviewEnv = {
  ...process.env,
  /** Vite `server.open` — land on Sensor Telemetry workspace (Bitstream shell). */
  VITE_DEV_OPEN: "/?app=bitstream",
};
const webview = spawnNpm(["run", "dev:webview"], webviewEnv);

function shutdown(code = 0) {
  bridge.kill("SIGTERM");
  webview.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

bridge.on("exit", (code, signal) => {
  if (signal) {
    shutdown(130);
    return;
  }
  if (code && code !== 0) {
    shutdown(code);
  }
});

webview.on("exit", (code, signal) => {
  if (signal) {
    shutdown(130);
    return;
  }
  shutdown(code ?? 0);
});
