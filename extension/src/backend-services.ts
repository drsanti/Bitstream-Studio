import * as vscode from "vscode";
import {
  initializeSerialBridge,
  stopSerialBridge,
} from "./bridge-handle";
import {
  ensureEmbeddedModelLoaderBroker,
  stopEmbeddedModelLoaderBroker,
} from "./embedded-model-loader-broker";
import {
  initializeMqttBroker,
  stopMqttBroker,
} from "./mqtt-handle";
import { TernionDigitalTwin } from "./panels/TernionDigitalTwin";

export type BackendServicesStopOptions = {
  /** When true (default), warn if Bitstream Studio panel is still open. */
  warnIfPanelOpen?: boolean;
};

/**
 * Start serial bridge, model-loader broker client, and local MQTT broker —
 * same stack as extension activation (excluding Vite browser dev server).
 */
export async function startAllBackendServices(extensionPath: string): Promise<void>
{
  await initializeSerialBridge(extensionPath);
  await ensureEmbeddedModelLoaderBroker();
  await initializeMqttBroker();
  void vscode.window.setStatusBarMessage(
    "Bitstream Studio backend services started",
    4000,
  );
}

/**
 * Stop extension-managed backends. Does not stop the Vite browser dev server.
 * Order: serial bridge process first, then embedded model broker, then MQTT.
 */
export async function stopAllBackendServices(
  options?: BackendServicesStopOptions,
): Promise<void>
{
  if (options?.warnIfPanelOpen !== false && TernionDigitalTwin.currentPanel != null)
  {
    void vscode.window.showWarningMessage(
      "Stopping backend services disconnects telemetry until you run "
      + "“Start All Backend Services” or reload the window. "
      + "External Bitstream Simulator also needs the serial broker (port 9998).",
    );
  }

  await stopSerialBridge();
  await stopEmbeddedModelLoaderBroker();
  stopMqttBroker();

  void vscode.window.setStatusBarMessage(
    "Bitstream Studio backend services stopped",
    4000,
  );
}
