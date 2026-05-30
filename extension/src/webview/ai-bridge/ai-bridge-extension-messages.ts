import { T3DVSCodeUtils } from "@ternion/t3d/vscode-webview";

export type AiBridgeHostReportedStatus = {
  running: boolean;
  port: number | null;
  managedByExtension: boolean;
  externalProcess: boolean;
};

function getVsCodeWebviewPostMessageApi(): { postMessage: (msg: unknown) => void } | null {
  const injected = (
    window as unknown as { __VSCODE_API__?: { postMessage?: (msg: unknown) => void } }
  ).__VSCODE_API__;
  if (injected?.postMessage) {
    return injected as { postMessage: (msg: unknown) => void };
  }
  return T3DVSCodeUtils.getVsCodeApi();
}

/** Ask the extension host to spawn or attach to the local AI bridge (same as Command Palette flow). */
export function postAiBridgeStartFromExtension(options?: Record<string, unknown>): void {
  const api = getVsCodeWebviewPostMessageApi();
  if (!api) {
    return;
  }
  if (options && Object.keys(options).length > 0) {
    api.postMessage({ type: "ai-bridge-start", options });
  } else {
    api.postMessage({ type: "ai-bridge-start" });
  }
}

/** Request a fresh `ai-bridge-status` push from the extension (port probe + managed process). */
export function postAiBridgeGetStatusFromExtension(): void {
  getVsCodeWebviewPostMessageApi()?.postMessage({ type: "ai-bridge-get-status" });
}

/** Same pattern as AI Bridge Settings: stop then start with Bitstream attach options (COM, baud, broker URL). */
export function postAiBridgeStopThenStartWithBitstreamLane(options: {
  t3dWsClientUrl: string;
  serialPath: string;
  baudRate: number;
  mode: "data" | "line" | "both";
  autoDetectPort: boolean;
}): void {
  const api = getVsCodeWebviewPostMessageApi();
  if (!api) {
    return;
  }
  api.postMessage({ type: "ai-bridge-stop" });
  api.postMessage({
    type: "ai-bridge-start",
    options: {
      t3dWsClientUrl: options.t3dWsClientUrl,
      bitstream: {
        serialPath: options.serialPath,
        baudRate: options.baudRate,
        mode: options.mode,
        autoDetectPort: options.autoDetectPort,
      },
    },
  });
}

export function parseAiBridgeStatusMessage(data: unknown): AiBridgeHostReportedStatus | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const d = data as Record<string, unknown>;
  if (d.type !== "ai-bridge-status") {
    return null;
  }
  const s = d.status;
  if (!s || typeof s !== "object") {
    return null;
  }
  const st = s as Record<string, unknown>;
  if (typeof st.running !== "boolean") {
    return null;
  }
  return {
    running: st.running,
    port: typeof st.port === "number" ? st.port : null,
    managedByExtension: st.managedByExtension === true,
    externalProcess: st.externalProcess === true,
  };
}
