import type { ConnectionStepView } from "../bitstream-app/connection/useConnectionSteps.js";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { StartupStepId } from "./startup-step-meta.js";

const R = ternionFreeAssetPackCopy.results;

function technicalTooltip(conn: ConnectionStepView): string | undefined {
  const parts: string[] = [];
  if (conn.summary.trim().length > 0) {
    parts.push(conn.summary);
  }
  if (conn.detail != null && conn.detail.trim().length > 0) {
    parts.push(conn.detail);
  }
  if (conn.error != null && conn.error.trim().length > 0) {
    parts.push(conn.error);
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join("\n\n");
}

function bridgeResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkBridgeRunning, resultTooltip: technicalTooltip(conn) };
  }
  return { result: R.linkBridgeNotReady, resultTooltip: technicalTooltip(conn) };
}

function websocketResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkAppConnected, resultTooltip: technicalTooltip(conn) };
  }
  return { result: R.linkAppNotConnected, resultTooltip: technicalTooltip(conn) };
}

function serialPortsResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkSerialOpen, resultTooltip: technicalTooltip(conn) };
  }
  if (conn.status === "fail") {
    return { result: R.linkSerialNotOpen, resultTooltip: technicalTooltip(conn) };
  }
  return { result: R.linkSerialNotOpen, resultTooltip: technicalTooltip(conn) };
}

function simulatorResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkSimulatorStreaming, resultTooltip: technicalTooltip(conn) };
  }
  return { result: R.linkSimulatorNotStreaming, resultTooltip: technicalTooltip(conn) };
}

function handshakeResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkHandshakeOk, resultTooltip: technicalTooltip(conn) };
  }
  if (conn.status === "fail") {
    return { result: R.linkHandshakeFailed, resultTooltip: technicalTooltip(conn) };
  }
  return { result: R.linkHandshakeWaiting, resultTooltip: technicalTooltip(conn) };
}

function linkReadyResult(conn: ConnectionStepView): { result: string; resultTooltip?: string } {
  if (conn.status === "ok") {
    return { result: R.linkReady };
  }
  return { result: R.linkNotReady, resultTooltip: technicalTooltip(conn) };
}

/**
 * Plain-language Setup checklist results for link steps.
 * Technical connection-panel copy stays in {@link technicalTooltip} (hover result or title).
 */
export function startupLinkStepResult(
  startupId: StartupStepId,
  conn: ConnectionStepView,
): { result: string; resultTooltip?: string } {
  switch (startupId) {
    case "bridge":
      return bridgeResult(conn);
    case "websocket":
      return websocketResult(conn);
    case "serial-ports":
      return serialPortsResult(conn);
    case "simulator":
      return simulatorResult(conn);
    case "handshake":
      return handshakeResult(conn);
    case "link-ready":
      return linkReadyResult(conn);
    default:
      return { result: conn.summary, resultTooltip: technicalTooltip(conn) };
  }
}
