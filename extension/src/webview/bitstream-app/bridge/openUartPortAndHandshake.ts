/*******************************************************************************
 * File Name : openUartPortAndHandshake.ts
 *
 * Description : Open COM via serial-port store, sync status, BS2 PING handshake.
 *               On browser refresh the bridge keeps COM open; reconcile via STATUS.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import type { SerialPortStatusPayload } from "../../../serialport-bridge/protocol";
import { sendBitstream2ReqAwait } from "../../shared/sendBitstream2ReqAwait";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store";
import { useSerialPortStore } from "../../serialport/serial-port-store";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";
import { reconcileBs2HandshakePassedFromStores } from "../utils/bitstreamTelemetryTransport";
import { useBitstreamConfigStore } from "../state/bitstreamConfig.store";
import { pickPreferredSerialPortPath } from "../utils/pickPreferredSerialPortPath";

export type OpenUartPortAndHandshakeOptions = {
  /**
   * Run list → open → PING after Simulator→UART (COM was released on the bridge).
   * Does not close COM when the bridge already holds the port (browser refresh).
   */
  forceFullBringUp?: boolean;
};

/** Single-flight: parallel auto-connect + toolbar must not double-open COM. */
let uartBringUpInFlight: Promise<void> | null = null;

const BRIDGE_STATUS_WAIT_MS = 1500;
const BRIDGE_STATUS_POLL_MS = 50;
const POST_OPEN_SETTLE_MS = 500;
const HELLO_WAIT_MS = 6000;
const HELLO_POLL_MS = 100;
const PING_ATTEMPTS = 3;
const PING_TIMEOUT_MS = 4000;
const PING_RETRY_GAP_MS = 700;

/** Mirror serial-port-store status into connection store (toolbar USB icon). */
export function syncSerialBridgeStatusFromPortStore(): void {
  const status = useSerialPortStore.getState().status;
  if (status != null)
  {
    useBitstreamConnectionStore.getState().setSerialBridgeStatus(status);
  }
}

/** Apply bridge STATUS into the serial store (webview state reset on refresh). */
function applyBridgeStatusToSerialStore(status: SerialPortStatusPayload): void {
  if (status.path)
  {
    useSerialPortStore.getState().setSelectedPath(status.path);
  }
  if (typeof status.baudRate === "number" && status.baudRate > 0)
  {
    useSerialPortStore.getState().setBaudRate(status.baudRate);
  }
  useSerialPortStore.setState({
    sessionClosedByUser: false,
    status,
  });
  syncSerialBridgeStatusFromPortStore();
}

/**
 * Wait for `serialport/status` after WS reconnect (bridge keeps OS handle on refresh).
 */
async function waitForBridgeSerialStatus(timeoutMs: number): Promise<SerialPortStatusPayload | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline)
  {
    const serialSt = useSerialPortStore.getState().status;
    if (serialSt?.isOpen === true)
    {
      return serialSt;
    }
    const connSt = useBitstreamConnectionStore.getState().serialBridgeStatus;
    if (connSt?.isOpen === true)
    {
      applyBridgeStatusToSerialStore(connSt);
      return connSt;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, BRIDGE_STATUS_POLL_MS);
    });
  }
  return null;
}

function statusMatchesPick(
  status: SerialPortStatusPayload,
  pick: string,
  baud: number,
): boolean {
  if (!status.isOpen || !status.path)
  {
    return false;
  }
  if (status.path !== pick)
  {
    return false;
  }
  if (typeof status.baudRate === "number" && status.baudRate > 0 && status.baudRate !== baud)
  {
    return false;
  }
  return true;
}

/**
 * List/open UART (if needed), BS2 PING, promote handshake to passed.
 * Requires WebSocket broker link and `bitstream2/res` subscription.
 */
export async function openUartPortAndHandshake(
  options?: OpenUartPortAndHandshakeOptions,
): Promise<void> {
  if (uartBringUpInFlight != null)
  {
    return uartBringUpInFlight;
  }

  uartBringUpInFlight = openUartPortAndHandshakeImpl(options).finally(() => {
    uartBringUpInFlight = null;
  });
  return uartBringUpInFlight;
}

async function openUartPortAndHandshakeImpl(
  options?: OpenUartPortAndHandshakeOptions,
): Promise<void> {
  const forceFullBringUp = options?.forceFullBringUp === true;

  try
  {
    if (forceFullBringUp)
    {
      appendTelemetryActivity({
        text: "Bitstream: link sync (list → open if needed → PING)",
        tone: "info",
      });
      useBitstreamLiveStore.getState().setHandshakeState("unknown");
      useBitstreamLiveStore.getState().setHandshakeLastError(null);
    }

    await useSerialPortStore.getState().connect();

    const bridgeOpen = await waitForBridgeSerialStatus(BRIDGE_STATUS_WAIT_MS);

    const serial = useSerialPortStore.getState();
    const storeOpen = serial.status?.isOpen === true;

    const selectedPath = serial.selectedPath;
    const baud = serial.baudRate > 0 ? serial.baudRate : 921600;

    const pickFromBridge =
      bridgeOpen?.isOpen && bridgeOpen.path ? bridgeOpen.path : "";
    const pick =
      pickFromBridge ||
      (selectedPath && selectedPath.length > 0 ? selectedPath : "");

    /* Backend still has COM after browser refresh — do not close/re-open. */
    if (
      bridgeOpen?.isOpen &&
      pickFromBridge &&
      statusMatchesPick(bridgeOpen, pickFromBridge, baud)
    )
    {
      applyBridgeStatusToSerialStore(bridgeOpen);
      appendTelemetryActivity({
        text: `Bitstream: reusing backend COM ${pickFromBridge} @ ${bridgeOpen.baudRate ?? baud}`,
        tone: "info",
      });
    }
    else if (forceFullBringUp && storeOpen)
    {
      appendTelemetryActivity({ text: "Bitstream: closing stale webview COM state", tone: "info" });
      await serial.closePort();
      syncSerialBridgeStatusFromPortStore();
      await openComIfNeeded(serial, pick, baud);
    }
    else if (!storeOpen && !(bridgeOpen?.isOpen === true))
    {
      await openComIfNeeded(serial, pick, baud);
    }
    else if (!storeOpen && bridgeOpen?.isOpen)
    {
      applyBridgeStatusToSerialStore(bridgeOpen);
    }

    syncSerialBridgeStatusFromPortStore();

    await completeBs2LinkHandshake();

    const conn = useBitstreamConnectionStore.getState();
    if (conn.runtimeSyncState !== "ready")
    {
      conn.setRuntimeSyncState("ready");
    }

    appendTelemetryActivity({
      text: "Bitstream: link ready (COM open, handshake passed)",
      tone: "ok",
    });
  }
  catch (error: unknown)
  {
    const message = error instanceof Error ? error.message : String(error);
    appendTelemetryActivity({
      text: `Bitstream: link failed — ${message}`,
      tone: "error",
    });
    throw error;
  }
}

const LIST_PORTS_RETRY_ATTEMPTS = 10;
const LIST_PORTS_RETRY_DELAY_MS = 400;

/** True when BS2 HELLO or handshake already passed (e.g. bridge probe after open). */
function firmwareLinkAlreadyUp(): boolean {
  if (useBitstreamTelemetrySourceStore.getState().bs2Hello != null)
  {
    return true;
  }
  return useBitstreamLiveStore.getState().handshakeState === "passed";
}

/**
 * After COM open: allow USB stack + bridge HELLO probe, then HELLO wait or PING retries.
 * Hotplug often needs >2.5s before firmware answers PING.
 */
async function completeBs2LinkHandshake(): Promise<void> {
  await delayMs(POST_OPEN_SETTLE_MS);

  if (!firmwareLinkAlreadyUp())
  {
    appendTelemetryActivity({
      text: "Bitstream: waiting for BS2 HELLO…",
      tone: "info",
    });
    const helloDeadline = Date.now() + HELLO_WAIT_MS;
    while (Date.now() < helloDeadline)
    {
      if (firmwareLinkAlreadyUp())
      {
        break;
      }
      await delayMs(HELLO_POLL_MS);
    }
  }

  if (firmwareLinkAlreadyUp())
  {
    useBitstreamLiveStore.getState().setHandshakeState("passed");
    useBitstreamLiveStore.getState().touchFirmwareRxAt();
    reconcileBs2HandshakePassedFromStores();
    return;
  }

  appendTelemetryActivity({ text: "Bitstream: BS2 PING handshake", tone: "info" });
  let lastError = "BS2 PING failed";

  for (let attempt = 0; attempt < PING_ATTEMPTS; attempt++)
  {
    if (attempt > 0)
    {
      appendTelemetryActivity({
        text: `Bitstream: PING retry ${attempt + 1}/${PING_ATTEMPTS}…`,
        tone: "info",
      });
      await delayMs(PING_RETRY_GAP_MS);
    }

    const ping = await sendBitstream2ReqAwait(
      { reqId: 0, cmdId: BS2_CMD.PING, timeoutMs: PING_TIMEOUT_MS },
      PING_TIMEOUT_MS + 400,
    );
    if (ping.ok)
    {
      useBitstreamLiveStore.getState().setHandshakeState("passed");
      useBitstreamLiveStore.getState().touchFirmwareRxAt();
      reconcileBs2HandshakePassedFromStores();
      return;
    }
    lastError = ping.error ?? `BS2 PING failed (status=${ping.status})`;
  }

  throw new Error(lastError);
}

function delayMs(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** List ports with retries (Windows enumeration after hotplug). */
async function listPortsWithRetry(
  serial: ReturnType<typeof useSerialPortStore.getState>,
): Promise<Awaited<ReturnType<typeof serial.listPorts>>> {
  appendTelemetryActivity({ text: "Bitstream: listing serial ports", tone: "info" });
  let lastPorts: Awaited<ReturnType<typeof serial.listPorts>> = [];
  for (let attempt = 0; attempt < LIST_PORTS_RETRY_ATTEMPTS; attempt++)
  {
    lastPorts = await serial.listPorts();
    if (lastPorts.length > 0)
    {
      return lastPorts;
    }
    if (attempt < LIST_PORTS_RETRY_ATTEMPTS - 1)
    {
      appendTelemetryActivity({
        text: "Bitstream: no COM yet — waiting for enumeration…",
        tone: "info",
      });
      await delayMs(LIST_PORTS_RETRY_DELAY_MS);
    }
  }
  return lastPorts;
}

/** List ports, pick path, open COM when bridge does not already hold it. */
async function openComIfNeeded(
  serial: ReturnType<typeof useSerialPortStore.getState>,
  preferredPath: string,
  baud: number,
): Promise<void> {
  const ports = await listPortsWithRetry(serial);
  if (ports.length <= 0)
  {
    useBitstreamTelemetrySourceStore.getState().notifyUartSerialLinkLost();
    appendTelemetryActivity({
      text: "Bitstream: no COM — watching for device (plug in to auto-connect)",
      tone: "warning",
    });
    throw new Error("No serial ports detected (bridge returned empty list)");
  }

  const cfg = useBitstreamConfigStore.getState();
  const pick =
    pickPreferredSerialPortPath({
      availablePaths: ports.map((p) => p.path),
      preferredPath: preferredPath || cfg.serialPath,
      whitelistedPaths: cfg.whitelistedSerialPaths,
      displayOrder: cfg.serialPortDisplayOrder,
    }) ?? "";

  if (!pick)
  {
    throw new Error("No serial port path available");
  }

  serial.setSelectedPath(pick);
  serial.setBaudRate(baud);
  useBitstreamConfigStore.getState().setSerialPath(pick);

  appendTelemetryActivity({
    text: `Bitstream: opening ${pick} @ ${baud}`,
    tone: "info",
  });
  await serial.openPort({
    path: pick,
    baudRate: baud,
    mode: "data",
  });
}
