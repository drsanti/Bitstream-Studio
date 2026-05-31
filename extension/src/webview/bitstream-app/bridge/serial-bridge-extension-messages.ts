import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi";

export type SerialBridgeHostReportedStatus = {
  running: boolean;
  port: number | null;
  managedByExtension: boolean;
  externalProcess: boolean;
  warning?: string;
};

function getVsCodeWebviewPostMessageApi(): { postMessage: (msg: unknown) => void } | null {
  return getVsCodeApi();
}

export function postSerialBridgeStartFromExtension(): void {
  getVsCodeWebviewPostMessageApi()?.postMessage({ type: "serial-bridge-start" });
}

export function postSerialBridgeStopFromExtension(): void {
  getVsCodeWebviewPostMessageApi()?.postMessage({ type: "serial-bridge-stop" });
}

export function postSerialBridgeGetStatusFromExtension(): void {
  getVsCodeWebviewPostMessageApi()?.postMessage({ type: "serial-bridge-get-status" });
}

export function parseSerialBridgeStatusMessage(data: unknown): SerialBridgeHostReportedStatus | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const d = data as Record<string, unknown>;
  const type = d.type;
  if (type !== "serial-bridge-status" && type !== "serial-bridge-status-changed") {
    return null;
  }
  const s = d.status;
  if (!s || typeof s !== "object") {
    return null;
  }
  const st = s as Record<string, unknown>;
  const running = st.running === true || st.bridgeRunning === true;
  return {
    running,
    port: typeof st.port === "number" ? st.port : null,
    managedByExtension: st.managedByExtension === true,
    externalProcess: st.externalProcess === true,
    warning: typeof st.warning === "string" ? st.warning : undefined,
  };
}
