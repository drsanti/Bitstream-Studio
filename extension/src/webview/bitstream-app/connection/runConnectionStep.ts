import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";
import { useSerialPortStore } from "../../serialport/serial-port-store.js";
import { useWsClientStore } from "../../ws-client-store.js";
import { postSerialBridgeStartFromExtension } from "../bridge/serial-bridge-extension-messages.js";
import { openUartPortAndHandshake } from "../bridge/openUartPortAndHandshake.js";
import { ensureBitstreamSimulatorReady } from "../bridge/requestBitstreamSimulatorHost.js";
import { publishTelemetryRoute } from "../bridge/publishTelemetryRoute.js";
import { useBitstreamConfigStore } from "../state/bitstreamConfig.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";
import { pickPreferredSerialPortPath } from "../utils/pickPreferredSerialPortPath.js";
import type { ConnectionStepId } from "./connectionPanel.store.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Primary action label for Guided **Continue** on the active step. */
export function getConnectionStepContinueLabel(
  stepId: ConnectionStepId,
  backend: "uart" | "simulator",
): string {
  switch (stepId) {
    case "bridge":
      return "Start bridge";
    case "websocket":
      return "Connect WebSocket";
    case "source":
      return "Publish telemetry route";
    case "transport":
      return backend === "simulator" ? "Start simulator" : "Open allowed port";
    case "handshake":
      return "Retry handshake";
    case "link":
      return "Verify Link";
    default:
      return "Continue";
  }
}

async function runUartTransportStep(): Promise<void> {
  const ws = useWsClientStore.getState();
  if (!ws.isConnected) {
    await ws.connect();
  }

  const serial = useSerialPortStore.getState();
  const ports = await serial.listPorts();
  const paths = ports.map((port) => port.path);
  const cfg = useBitstreamConfigStore.getState();
  const pick = pickPreferredSerialPortPath({
    availablePaths: paths,
    preferredPath: cfg.serialPath || serial.selectedPath,
    whitelistedPaths: cfg.whitelistedSerialPaths,
    displayOrder: cfg.serialPortDisplayOrder,
  });

  if (pick == null) {
    throw new Error(
      "No allowed COM port. Open Port Admin, turn Allow ON for at least one port, or set ★ active target.",
    );
  }

  serial.setSelectedPath(pick);
  cfg.setSerialPath(pick);
  await openUartPortAndHandshake({ forceFullBringUp: true });
}

/**
 * Run a single Connection ladder step (Guided **Continue**).
 * Uses existing bridge / store actions — no duplicate handshake logic.
 */
export async function runConnectionStep(stepId: ConnectionStepId): Promise<void> {
  const ext = isVsCodeExtensionWebview();
  const backend = useBitstreamTelemetrySourceStore.getState().backend;

  switch (stepId) {
    case "bridge":
      if (ext) {
        postSerialBridgeStartFromExtension();
        await sleep(900);
        return;
      }
      throw new Error("Start the bridge in a terminal: cd extension && npm run start:bridge");

    case "websocket":
      await useWsClientStore.getState().connect();
      return;

    case "source":
      if (!useWsClientStore.getState().isConnected) {
        throw new Error("Connect WebSocket first.");
      }
      publishTelemetryRoute(backend);
      return;

    case "transport":
      if (backend === "simulator") {
        await ensureBitstreamSimulatorReady();
        return;
      }
      await runUartTransportStep();
      return;

    case "handshake":
      await openUartPortAndHandshake({ forceFullBringUp: true });
      return;

    case "link":
      if (backend === "simulator") {
        await ensureBitstreamSimulatorReady();
        return;
      }
      await openUartPortAndHandshake({ forceFullBringUp: true });
      return;

    default:
      return;
  }
}
